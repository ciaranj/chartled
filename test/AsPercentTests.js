var assert= require("assert"),
    TargetParseContext= require("../lib/TargetParseContext"),
    MetricInfo= require("../lib/MetricInfo"),
    TargetParser= require("../lib/TargetParser"),
    Utils= require("./TestUtils");

describe('TargetParseContext', function(){
  describe('asPercent', function(){
    describe('should correctly calculate percentages of constant', function() {
      it('for a single series', function(done) {
        var metric=  "asPercent(foo.bar, 4)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( "asPercent(foo.bar,4)", result.seriesList[0].name );
                            assert.deepEqual( [25,50,75,100], result.seriesList[0].data.values );
                            done();
                    })
                    .end();
      });
      it('for an empty series', function(done) {
        var metric=  "asPercent(foo.x, 4)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 0, result.seriesList.length );
                            done();
                    })
                    .end();
      });
      it('for multiple series', function(done) {
        var metric=  "asPercent(foo.*, 4)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( "asPercent(foo.bar,4)", result.seriesList[0].name );
                            assert.equal( "asPercent(foo.tar,4)", result.seriesList[1].name );
                            assert.deepEqual( [25,50,75,100], result.seriesList[0].data.values );
                            assert.deepEqual( [250,500,750,1250], result.seriesList[1].data.values );
                            done();
                    })
                    .end();
      });
    });
    it('should throw an error if the second argument is not null and a collection of series', function(done) {
      var metric=  "asPercent(foo.bar, foo.*)";
       var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
       TargetParser.parse( metric )(ctx)
                   .fail( function(err) {
                      done();
                   })
                   .end();
    });
    it('should throw an error if the second argument is an unmatched series', function(done) {
      var metric=  "asPercent(foo.bar, foo.xxx)";
       var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
       TargetParser.parse( metric )(ctx)
                   .fail( function(err) {
                      done();
                   })
                   .end();
    });
    describe('should correctly calculate percentages of a different (calculated) series', function(done) {
      it('for a single series', function(done) {
        var metric=  "asPercent(foo.bar,sum(foo.{tar,bar}))";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( "asPercent(foo.bar,sum(foo.{tar,bar}))", result.seriesList[0].name );
                            assert.deepEqual( [9.090909090909092,9.090909090909092,9.090909090909092,7.4074074074074066], result.seriesList[0].data.values );
                            done();
                    })
                    .end();
      });
    });

    describe('should correctly calculate percentages of a different series', function(done) {
      it('for a single series', function(done) {
        var metric=  "asPercent(foo.bar, foo.tar)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( "asPercent(foo.bar,foo.tar)", result.seriesList[0].name );
                            assert.deepEqual( [10,10,10,8], result.seriesList[0].data.values );
                            done();
                    })
                    .end();
      });
      
      it('for an empty series', function(done) {
        var metric=  "asPercent(foo.x, foo.tar)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 0, result.seriesList.length );
                            done();
                    })
                    .end();
      });
      it('for multiple series', function(done) {
        var metric=  "asPercent(*.bar, foo.tar)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("poo.bar"), new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"poo.bar":[2,4,6,8],"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                      assert.equal( "asPercent(foo.bar,foo.tar)", result.seriesList[1].name );
                      assert.deepEqual( [10,10,10,8], result.seriesList[1].data.values );
                      assert.equal( "asPercent(poo.bar,foo.tar)", result.seriesList[0].name );
                      assert.deepEqual( [20,20,20,16], result.seriesList[0].data.values );
                      done();
                    })
                    .end();
      });      
    })
    describe('should correctly calculate percentages within the same series', function(done) {
      it('for a single series', function(done) {
        var metric=  "asPercent(foo.bar)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( "asPercent(foo.bar)", result.seriesList[0].name );
                            assert.deepEqual( [100,100,100,100], result.seriesList[0].data.values );
                            done();
                    })
                    .end();
      });
      it('for an empty series', function(done) {
        var metric=  "asPercent(foo.x)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 0, result.seriesList.length );
                            done();
                    })
                    .end();
      });
      it('for multiple series', function(done) {
        var metric=  "asPercent(*.bar)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("poo.bar"), new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"poo.bar":[2,4,6,8],"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                      assert.equal( "asPercent(foo.bar)", result.seriesList[1].name );
                      assert.deepEqual( [33.33333333333333,33.33333333333333,33.33333333333333,33.33333333333333], result.seriesList[1].data.values );
                      assert.equal( "asPercent(poo.bar)", result.seriesList[0].name );
                      assert.deepEqual( [66.66666666666666,66.66666666666666,66.66666666666666,66.66666666666666], result.seriesList[0].data.values );
                      done();
                    })
                    .end();
      });
    })
  });
})
