var assert= require("assert"),
    TargetParseContext= require("../../lib/TargetParseContext"),
    MetricInfo= require("../../lib/MetricInfo"),
    TargetParser= require("../../lib/TargetParser"),
    Utils= require("./TestUtils");

describe('TargetParseContext', function(){
  describe('scale', function(){
    it('should scale the metric values in the given series list (multiple)', function(done) {
        var metric=  "scale(foo.{bar,tar}, 2)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.deepEqual( [2,4,6,8], result.seriesList[0].data.values );
                            assert.deepEqual( [20,40,60,100], result.seriesList[1].data.values );
                            done();
                    })
                    .end();
    })
    it('should scale the metric values in the given series list (single)', function(done) {
        var metric=  "scale(foo.bar, 2)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.deepEqual( [2,4,6,8], result.seriesList[0].data.values );
                            done();
                    })
                    .end();
    })
    it('should scale the metric values in the given series list (single), ignoring nulls ', function(done) {
        var metric=  "scale(foo.bar, 2)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,,3,null], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.deepEqual( [2,,6,null], result.seriesList[0].data.values );
                            done();
                    })
                    .end();
    })	
    it('should scale the metric values in the given series list (none)', function(done) {
        var metric=  "scale(foo.{xar}, 2)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 0, result.seriesList.length );
                            done();
                    })
                    .end();
    })
    it('should update the metric name correctly for alternatives', function(done) {
        var metric=  "scale(foo.{bar,tar}, 2)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( "scale(foo.bar,2)", result.seriesList[0].name );
                            assert.equal( "scale(foo.tar,2)", result.seriesList[1].name );
                            done();
                    })
                    .end();
    })
    it('should update the metric name correctly for wildcards', function(done) {
        var metric=  "scale(foo.*, 2)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( "scale(foo.bar,2)", result.seriesList[0].name );
                            assert.equal( "scale(foo.tar,2)", result.seriesList[1].name );
                            done();
                    })
                    .end();
    })
    it('should update the metric name correctly for ranges', function(done) {
        var metric=  "scale(foo.[2], 2)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.1"), new MetricInfo("foo.2")], {"foo.1":[1,2,3,4], "foo.2":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( "scale(foo.1,2)", result.seriesList[0].name );
                            assert.equal( "scale(foo.2,2)", result.seriesList[1].name );
                            done();
                    })
                    .end();
    })
  });
})
