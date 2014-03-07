var assert= require("assert"),
    TargetParseContext= require("../../lib/TargetParseContext"),
    MetricInfo= require("../../lib/MetricInfo"),
    TargetParser= require("../../lib/TargetParser"),
    Utils= require("./TestUtils");

describe('TargetParseContext', function(){
  describe('removeBelowValue', function(){
    it('should null the metric values in the given series list (multiple) that are above the specified constant', function(done) {
        var metric=  "removeBelowValue(foo.{bar,tar}, 5)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,11,2,12,3,13,4,14,5,15,6,16], "foo.tar":[2,4,6,8,5,4]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 2, result.seriesList.length );
                            assert.equal( 12, result.seriesList[0].data.values.length );
                            assert.equal( 6, result.seriesList[1].data.values.length );
                            assert.deepEqual( [null,11,null,12,null,13,null,14,5,15,6,16], result.seriesList[0].data.values );
                            assert.deepEqual( [null,null,6,8,5,null], result.seriesList[1].data.values );
                            done();
                    })
                    .end();
    });
    it('should null the metric values in the given series list (multiple, accounting for nulls) that are above the specified constant', function(done) {
        var metric=  "removeBelowValue(foo.*, 2)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar"), new MetricInfo("foo.xar")], 
                                                          {"foo.bar":[1,null,,4], "foo.tar":[1,null,3,5], "foo.xar":[2,,3,7,,8,1]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 3, result.seriesList.length );
                            assert.deepEqual( [null,null,,4], result.seriesList[0].data.values );
                            assert.deepEqual( [null,null,3,5], result.seriesList[1].data.values );
                            assert.deepEqual( [2,,3,7,,8,null], result.seriesList[2].data.values );
                            done();
                    })
                    .end();
    });
    it('should null the metric values in the given series list (single) that are above the specified constant', function(done) {
        var metric=  "removeBelowValue(foo.{bar}, 5)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[4,5,6,4,5,6,2,5,6,1,7,8], "foo.xar":[2,4,6,8,5,4]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.seriesList.length );
                            assert.equal( 12, result.seriesList[0].data.values.length );
                            assert.deepEqual( [null,5,6,null,5,6,null,5,6,null,7,8], result.seriesList[0].data.values );
                            done();
                    })
                    .end();
    });
    it('should null the metric values in the given series list (none) that are above the specified constant', function(done) {
        var metric=  "removeBelowValue(foo.{rar}, 5)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar"), new MetricInfo("foo.xar")], {"foo.bar":[1,11,2,12,3,13,4,14,5,15,6,16], "foo.xar":[2,4,6,8,5,4]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 0, result.seriesList.length );
                            done();
                    })
                    .end();
    });
    it('should update the metric name correctly for multiple series', function(done) {
        var metric=  "removeBelowValue(foo.{bar,tar}, 2)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 2, result.seriesList.length );
                            assert.equal( "removeBelowValue(foo.bar,2)", result.seriesList[0].name );
                            assert.equal( "removeBelowValue(foo.tar,2)", result.seriesList[1].name );
                            done();
                    })
                    .end();
    });
    it('should update the metric name correctly for wildcards', function(done) {
        var metric=  "removeBelowValue(*oo.*ar, 2)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("poo.bar"), new MetricInfo("foo.tar")], {"poo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 2, result.seriesList.length );
                            assert.equal( "removeBelowValue(poo.bar,2)", result.seriesList[0].name );
                            assert.equal( "removeBelowValue(foo.tar,2)", result.seriesList[1].name );
                            done();
                    })
                    .end();
    });
    it('should update the metric name correctly for ranges', function(done) {
        var metric=  "removeBelowValue(foo.[12]ar, 2)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.1ar"), new MetricInfo("foo.2ar"), new MetricInfo("foo.12ar"), new MetricInfo("foo.21ar")], {"foo.1ar":[1,2,3,4], "foo.2ar":[10,20,30,50], "foo.12ar":[10,20,30,50], "foo.21ar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 3, result.seriesList.length );
                            assert.equal( "removeBelowValue(foo.1ar,2)", result.seriesList[0].name );
                            assert.equal( "removeBelowValue(foo.2ar,2)", result.seriesList[1].name );
                            assert.equal( "removeBelowValue(foo.12ar,2)", result.seriesList[2].name );
                            done();
                    })
                    .end();
    });
  });
});
