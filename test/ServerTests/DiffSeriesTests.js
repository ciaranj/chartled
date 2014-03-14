var assert= require("assert"),
    TargetParseContext= require("../../lib/TargetParseContext"),
    MetricInfo= require("../../lib/MetricInfo"),
    TargetParser= require("../../lib/TargetParser"),
    Utils= require("./TestUtils");

describe('TargetParseContext', function(){
  describe('diffSeries', function(){
    it('should subtract constant values and a series list from a series', function(done) {
        var metric=  "diffSeries(foo.bar,10,foo.{car,tar})";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.car"), new MetricInfo("foo.tar")],
                          {"foo.bar":[100,90,80,70,60,50,40,30,20,10,null], "foo.car":[1,1,1,1,1,1,1,1,1,1,1], "foo.tar":[5,4,3,2,1,1,2,3,4,5,1]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.seriesList.length );
                            assert.equal( 11, result.seriesList[0].data.values.length );
                            assert.equal( "diffSeries(foo.bar,10,foo.{car,tar})", result.seriesList[0].name );
                            assert.deepEqual( [84,75,66,57,48,38,27,16,5,-6,-12], result.seriesList[0].data.values );
                            done();
                    })
                    .end();
    });
    it('should subtract a series from a constant value (handling nulls and undefined)', function(done) {
        var metric=  "diffSeries(1000, foo.bar)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar")], {"foo.bar":[null,100,null,200,undefined,300,400,500,null,undefined]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.seriesList.length );
                            assert.equal( 10, result.seriesList[0].data.values.length );
                            assert.equal( "diffSeries(1000,foo.bar)", result.seriesList[0].name );
                            assert.deepEqual( [1000,900,1000,800,1000,700,600,500,1000,1000], result.seriesList[0].data.values );
                            done();
                    })
                    .end();
    });
    it('should subtract series 2 through \'n\' in a multiple series list from series 1 (handling nulls and undefined)', function(done) {
        var metric=  "diffSeries(foo.{bar,car,tar})";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.car"), new MetricInfo("foo.tar")],
                          {"foo.bar":[100,null,80,70,60,undefined,40,30,20,10,null], "foo.car":[1,1,1,1,5,1,1,null,3,1,1], "foo.tar":[5,4,3,2,undefined,1,2,3,null,5,1]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.seriesList.length );
                            assert.equal( 11, result.seriesList[0].data.values.length );
                            assert.equal( "diffSeries(foo.{bar,car,tar})", result.seriesList[0].name );
                            assert.deepEqual( [94,-5,76,67,55,-2,37,27,17,4,-2], result.seriesList[0].data.values );
                            done();
                    })
                    .end();
    });
    it('should subtract series 2 through \'n\' in a wild card series list from series 1 (handling nulls and undefined)', function(done) {
        var metric=  "diffSeries(*.*, 0)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.car"), new MetricInfo("foo.tar")],
                          {"foo.bar":[100,null,80,70,60,undefined,40,30,20,10,null], "foo.car":[1,1,1,1,5,1,1,null,3,1,1], "foo.tar":[5,4,3,2,undefined,1,2,3,null,5,1]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.seriesList.length );
                            assert.equal( 11, result.seriesList[0].data.values.length );
                            assert.equal( "diffSeries(*.*,0)", result.seriesList[0].name );
                            assert.deepEqual( [94,-5,76,67,55,-2,37,27,17,4,-2], result.seriesList[0].data.values );
                            done();
                    })
                    .end();
    });
     it('should subtract series 2 through \'n\' in a range series list from series 1 (handling nulls and undefined)', function(done) {
        var metric=  "diffSeries(foo.[12]ar)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.1ar"), new MetricInfo("foo.2ar"), new MetricInfo("foo.12ar"), new MetricInfo("foo.21ar")], {"foo.1ar":[1,2,null,4], "foo.2ar":[10,20,30,undefined], "foo.12ar":[undefined,20,30,50], "foo.21ar":[10,20,null,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.seriesList.length );
                            assert.equal( 4, result.seriesList[0].data.values.length );
                            assert.equal( "diffSeries(foo.[12]ar)", result.seriesList[0].name );
                            assert.deepEqual( [-9,-38,-60,-46], result.seriesList[0].data.values );
                            done();
                    })
                    .end();
    });
  });
});