var assert= require("assert"),
    TargetParseContext= require("../../lib/TargetParseContext"),
    MetricInfo= require("../../lib/MetricInfo"),
    TargetParser= require("../../lib/TargetParser"),
    Utils= require("./TestUtils");

describe('TargetParseContext', function(){
  describe('sum', function(){
    it('should sum nulls as we expect', function(done) {
        // We treat all nulls as resulting in a null, any other sum results in the addition occuring as if there was no null.
        var metric=  "sum(foo.{bar,tar})";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,,null,4], "foo.tar":[null,,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.length );
                            assert.deepEqual( [1,,30,54], result[0].data.values );
                            done();
                    })
    })    
    it('should sum the metric values in the given series list (multiple)', function(done) {
        var metric=  "sum(foo.{bar,tar})";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.length );
                            assert.deepEqual( [11,22,33,54], result[0].data.values );
                            done();
                    });
    })
    it('should sum the metric values in the given series list (multiple) (using the sumSeries synonym)', function(done) {
        var metric=  "sumSeries(foo.{bar,tar})";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.length );
                            assert.deepEqual( [11,22,33,54], result[0].data.values );
                            done();
                    });
    })
    it('should sum the metric values in the given series list (single)', function(done) {
        var metric=  "sum(foo.bar)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.length );
                            assert.deepEqual( [1,2,3,4], result[0].data.values );
                            done();
                    })
    })
    it('should sum the metric values in the given series list (none)', function(done) {
        var metric=  "sum(foo.{xar})";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 0, result.length );
                            done();
                    });
    })
    it('should update the metric name correctly for alternatives', function(done) {
        var metric=  "sum(foo.{bar,tar})";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.length );
                            assert.equal( "sum(foo.{bar,tar})", result[0].name );
                            done();
                    });
    })
    it('should update the metric name correctly for wildcards', function(done) {
        var metric=  "sum(foo.*)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.length );
                            assert.equal( "sum(foo.*)", result[0].name );
                            done();
                    });
    })
    it('should update the metric name correctly for ranges', function(done) {
        var metric=  "sum(foo.[2])";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.1"), new MetricInfo("foo.2")], {"foo.1":[1,2,3,4], "foo.2":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.length );
                            assert.equal( "sum(foo.[2])", result[0].name );
                            done();
                    });
    })
  });
})
