var assert= require("assert"),
    TargetParseContext= require("../../lib/TargetParseContext"),
    MetricInfo= require("../../lib/MetricInfo"),
    TargetParser= require("../../lib/TargetParser"),
    Utils= require("./TestUtils");

describe('TargetParseContext', function(){
  describe('removeAboveValue', function(){
    it('should null the metric values in the given series list (multiple) that are above the specified constant', function(done) {
        var metric=  "removeAboveValue(foo.{bar,tar}, 5)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,11,2,12,3,13,4,14,5,15,6,16], "foo.tar":[2,4,6,8,5,4]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 2, result.seriesList.length );
                            assert.equal( 12, result.seriesList[0].data.values.length );
                            assert.equal( 6, result.seriesList[1].data.values.length );
                            assert.deepEqual( [1,null,2,null,3,null,4,null,5,null,null,null], result.seriesList[0].data.values );
                            assert.deepEqual( [2,4,null,null,5,4], result.seriesList[1].data.values );
                            done();
                    })
                    .end();
    });
    it('should null the metric values in the given series list (multiple, accounting for nulls) that are above the specified constant', function(done) {
        var metric=  "removeAboveValue(foo.*, 2)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar"), new MetricInfo("foo.xar")], 
                                                          {"foo.bar":[1,null,,4], "foo.tar":[1,null,3,5], "foo.xar":[2,,3,7,,8,9]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 3, result.seriesList.length );
                            assert.deepEqual( [1,null,,null], result.seriesList[0].data.values );
                            assert.deepEqual( [1,null,null,null], result.seriesList[1].data.values );
                            assert.deepEqual( [2,,null,null,,null,null], result.seriesList[2].data.values );
                            done();
                    })
                    .end();
    });
    it('should null the metric values in the given series list (single) that are above the specified constant', function(done) {
        var metric=  "removeAboveValue(foo.{bar}, 5)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,11,2,12,3,13,4,14,5,15,6,16], "foo.xar":[2,4,6,8,5,4]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.seriesList.length );
                            assert.equal( 12, result.seriesList[0].data.values.length );
                            assert.deepEqual( [1,null,2,null,3,null,4,null,5,null,null,null], result.seriesList[0].data.values );
                            done();
                    })
                    .end();
    });
    it('should null the metric values in the given series list (none) that are above the specified constant', function(done) {
        var metric=  "removeAboveValue(foo.{rar}, 5)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar"), new MetricInfo("foo.xar")], {"foo.bar":[1,11,2,12,3,13,4,14,5,15,6,16], "foo.xar":[2,4,6,8,5,4]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 0, result.seriesList.length );
                            done();
                    })
                    .end();
    });
  });
});
