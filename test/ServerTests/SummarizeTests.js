var assert= require("assert"),
    TargetParseContext= require("../../lib/TargetParseContext"),
    MetricInfo= require("../../lib/MetricInfo"),
    TargetParser= require("../../lib/TargetParser"),
    Utils= require("./TestUtils");

describe('TargetParseContext', function(){
  describe('summarize', function(){
    it('should summarize using the sum function when given nice linear data', function(done) {
      var metric=  "summarize(foo.*,\"120s\", \"sum\")";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar")], {"foo.bar":[1,2,3,4] }, [10,190,60], 10, 190 );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.deepEqual( [3,7], result[0].data.values );
                            assert.equal( result[0].name, "summarize(foo.bar,\"120s\",\"sum\")" );
                            assert.equal( result[0].info.aggregationMethod, "sum" );
                            done();
                    })
                    .end();
    });
    it('should summarize using the sum function when given sparse data', function(done) {
      var metric=  "summarize(foo.*,\"120s\", \"sum\")";
        // Need to make sure we're checking for sparse arrays in this situation!
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar")], {"foo.bar":[1,,4] }, [10,190,60], 10, 190 );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.deepEqual( [1,4], result[0].data.values );
                            assert.equal( result[0].name, "summarize(foo.bar,\"120s\",\"sum\")" );
                            assert.equal( result[0].info.aggregationMethod, "sum" );
                            done();
                    })
                    .end();
    });
    it('should summarize using the avg function', function(done) {
        var metric=  "summarize(foo.*,\"120s\", \"avg\")";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar")], {"foo.bar":[1,2,3,4] }, [10,190,60], 10, 190 );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.deepEqual( [1.5,3.5], result[0].data.values );
                            assert.equal( result[0].name, "summarize(foo.bar,\"120s\",\"avg\")" );
                            assert.equal( result[0].info.aggregationMethod, "avg" );
                            done();
                    })
                    .end();
    })
    it('should summarize using the average function', function(done) {
      var metric=  "summarize(foo.*,\"120s\", \"average\")";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar")], {"foo.bar":[1,2,3,4] }, [10,190,60], 10, 190 );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.deepEqual( [1.5,3.5], result[0].data.values );
                            assert.equal( result[0].name, "summarize(foo.bar,\"120s\",\"average\")" );
                            assert.equal( result[0].info.aggregationMethod, "average" );
                            done();
                    })
                    .end();
    })
  });
})
