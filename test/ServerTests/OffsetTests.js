var assert= require("assert"),
    TargetParseContext= require("../../lib/TargetParseContext"),
    MetricInfo= require("../../lib/MetricInfo"),
    TargetParser= require("../../lib/TargetParser"),
    Utils= require("./TestUtils");

describe('TargetParseContext', function(){
  describe('offset', function(){
    it('should offset the metric values in the given series list (multiple)', function(done) {
        var metric=  "offset(foo.{bar,tar}, 2)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.deepEqual( [3,4,5,6], result[0].data.values );
                            assert.deepEqual( [12,22,32,52], result[1].data.values );
                            done();
                    });
    })
    it('should offset the metric values in the given series list (single)', function(done) {
        var metric=  "offset(foo.bar, 2)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.deepEqual( [3,4,5,6], result[0].data.values );
                            done();
                    });
    })
    it('should offset the metric values in the given series list (single), ignoring nulls ', function(done) {
        var metric=  "offset(foo.bar, 2)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,,3,null], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.deepEqual( [3,,5,null], result[0].data.values );
                            done();
                    });
    })	
    
	it('should offset the metric values in the given series list (single), negative', function(done) {
        var metric=  "offset(foo.bar, -2)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.deepEqual( [-1,0,1,2], result[0].data.values );
                            done();
                    });
    })
    it('should offset the metric values in the given series list (single), zero', function(done) {
        var metric=  "offset(foo.bar, 0)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.deepEqual( [1,2,3,4], result[0].data.values );
                            done();
                    });
    })
    it('should offset the metric values in the given series list (none)', function(done) {
        var metric=  "offset(foo.{xar}, 2)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 0, result.length );
                            done();
                    });
    })
    it('should update the metric name correctly for alternatives', function(done) {
        var metric=  "offset(foo.{bar,tar}, 2)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( "offset(foo.bar,2)", result[0].name );
                            assert.equal( "offset(foo.tar,2)", result[1].name );
                            done();
                    });
    })
    it('should update the metric name correctly for wildcards', function(done) {
        var metric=  "offset(foo.*, 2)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( "offset(foo.bar,2)", result[0].name );
                            assert.equal( "offset(foo.tar,2)", result[1].name );
                            done();
                    });
    })
    it('should update the metric name correctly for ranges', function(done) {
        var metric=  "offset(foo.[2], 2)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.1"), new MetricInfo("foo.2")], {"foo.1":[1,2,3,4], "foo.2":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( "offset(foo.1,2)", result[0].name );
                            assert.equal( "offset(foo.2,2)", result[1].name );
                            done();
                    });
    })
  });
})
