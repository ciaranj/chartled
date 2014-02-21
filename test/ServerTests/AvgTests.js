var assert= require("assert"),
    TargetParseContext= require("../../lib/TargetParseContext"),
    MetricInfo= require("../../lib/MetricInfo"),
    TargetParser= require("../../lib/TargetParser"),
    Utils= require("./TestUtils");

describe('TargetParseContext', function(){
  describe('avg', function(){
    it('should avg the metric values in the given series list (multiple)', function(done) {
        var metric=  "avg(foo.{bar,tar})";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.seriesList.length );
                            assert.deepEqual( [5.5,11,16.5,27], result.seriesList[0].data.values );
                            done();
                    })
                    .end();
    })
    it('should avg the metric values in the given series list (multiple, accounting for nulls.)', function(done) {
        var metric=  "avg(foo.*)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar"), new MetricInfo("foo.xar")], 
                                                          {"foo.bar":[1,null,,4], "foo.tar":[10,null,30,50], "foo.xar":[7,,8,9]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.seriesList.length );
                            assert.deepEqual( [6,,19,21], result.seriesList[0].data.values );
                            done();
                    })
                    .end();
    })    
    it('should avg the metric values in the given series list (multiple) (using the averageSeries synonym)', function(done) {
        var metric=  "averageSeries(foo.{bar,tar})";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.seriesList.length );
                            assert.deepEqual( [5.5,11,16.5,27], result.seriesList[0].data.values );
                            done();
                    })
                    .end();
    })
    it('should avg the metric values in the given series list (single)', function(done) {
        var metric=  "avg(foo.bar)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,,3,null,5,6], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.seriesList.length );
                            assert.deepEqual( [1,,3,null,5,6], result.seriesList[0].data.values );
                            done();
                    })
                    .end();
    })
    it('should avg the metric values in the given series list (none)', function(done) {
        var metric=  "avg(foo.{xar})";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 0, result.seriesList.length );
                            done();
                    })
                    .end();
    })
    it('should update the metric name correctly for alternatives', function(done) {
        var metric=  "avg(foo.{bar,tar})";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.seriesList.length );
                            assert.equal( "avg(foo.{bar,tar})", result.seriesList[0].name );
                            done();
                    })
                    .end();
    })
    it('should update the metric name correctly for wildcards', function(done) {
        var metric=  "avg(foo.*)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.seriesList.length );
                            assert.equal( "avg(foo.*)", result.seriesList[0].name );
                            done();
                    })
                    .end();
    })
    it('should update the metric name correctly for ranges', function(done) {
        var metric=  "avg(foo.[2])";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.1"), new MetricInfo("foo.2")], {"foo.1":[1,2,3,4], "foo.2":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.seriesList.length );
                            assert.equal( "avg(foo.[2])", result.seriesList[0].name );
                            done();
                    })
                    .end();
    })    
  });
})
