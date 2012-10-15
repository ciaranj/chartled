var assert= require("assert"),
    TargetParseContext= require("../lib/TargetParseContext"),
    MetricInfo= require("../lib/MetricInfo"),
    TargetParser= require("../lib/TargetParser"),
    Utils= require("./TestUtils");

describe('TargetParseContext', function(){
  describe('alias', function(){
    it('should alias a single metric (complex) ', function(done) {
        var metric=  "alias(scale(foo.bar, 2), \"All The Foos\")";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.deepEqual( [2,4,6,8], result.seriesList[0].data.values );
                            assert.equal( "All The Foos", result.seriesList[0].name );
                            done();
                    })
                    .end();
    })
    it('should alias a single metric (simple) ', function(done) {
        var metric=  "alias(*.bar, \"All The Foos\")";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.deepEqual( [1,2,3,4], result.seriesList[0].data.values );
                            assert.equal( "All The Foos", result.seriesList[0].name );
                            done();
                    })
                    .end();
    })
    it('should alias a list of metrics to the same name', function(done) {
        var metric=  "alias(scale(foo.{bar,tar}, 2), \"All The Foos\")";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.deepEqual( [2,4,6,8], result.seriesList[0].data.values );
                            assert.deepEqual( [20,40,60,100], result.seriesList[1].data.values );
                            assert.equal( "All The Foos", result.seriesList[0].name );
                            assert.equal( "All The Foos", result.seriesList[1].name );
                            done();
                    })
                    .end();
    })
    it('should safely handle missing series', function(done) {
        var metric=  "alias(scale(foo.{xar}, 2), \"All The Foos\")";
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
