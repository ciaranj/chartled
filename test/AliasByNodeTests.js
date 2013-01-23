var assert= require("assert"),
    TargetParseContext= require("../lib/TargetParseContext"),
    MetricInfo= require("../lib/MetricInfo"),
    TargetParser= require("../lib/TargetParser"),
    Utils= require("./TestUtils");

describe('TargetParseContext', function(){
  describe('aliasByNode', function(){
    it('should alias a single metric (complex) by 0 node', function(done) {
        var metric=  "aliasByNode(scale(foo.bar, 2),0)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                  .then(function (result) {
                          assert.deepEqual( [2,4,6,8], result.seriesList[0].data.values );
                          assert.equal( "foo", result.seriesList[0].name );
                          done();
                  })
                  .end();
    })
    it('should alias a single metric (complex) by 1 node', function(done) {
        var metric=  "aliasByNode(scale(foo.bar,2),1)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.deepEqual( [2,4,6,8], result.seriesList[0].data.values );
                            assert.equal( "bar", result.seriesList[0].name );
                            done();
                    })
                    .end();
    })
    it('should return the original metric name if invalid node given', function(done) {
        var metric=  "aliasByNode(scale(foo.bar,2),8)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.deepEqual( [2,4,6,8], result.seriesList[0].data.values );
                            assert.equal( "scale(foo.bar,2)", result.seriesList[0].name );
                            done();
                    })
                    .end();
    })
    it('should alias a list of metrics', function(done) {
        var metric=  "aliasByNode(scale(foo.{bar,tar},2),1)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.deepEqual( [2,4,6,8], result.seriesList[0].data.values );
                            assert.deepEqual( [20,40,60,100], result.seriesList[1].data.values );
                            assert.equal( "bar", result.seriesList[0].name );
                            assert.equal( "tar", result.seriesList[1].name );
                            done();
                    })
                    .end();
    })
    it('should safely handle missing series', function(done) {
        var metric=  "aliasByNode(scale(foo.{xar},2),1)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 0, result.seriesList.length );
                            done();
                    })
                    .end();
    })
  });
})
