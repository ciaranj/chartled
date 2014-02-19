var assert= require("assert"),
    TargetParseContext= require("../../lib/TargetParseContext"),
    MetricInfo= require("../../lib/MetricInfo"),
    TargetParser= require("../../lib/TargetParser"),
    Utils= require("./TestUtils");

describe('TargetParseContext', function(){
  describe('summarize', function(){
    it('should summarize something...testing', function(done) {
//      var metric=  "summarize(foo.*,\"4h\",\"avg\",true)";
      var metric=  "summarize(foo.*,\"4h\")";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]}, [10,190,60], 10, 190 );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                      console.log( result.seriesList[0] )
                            assert.deepEqual( [2,4,6,8], result.seriesList[0].data.values );
                            assert.equal( "All The Foos", result.seriesList[0].name );
                            assert.equal( "avg", result.seriesList[0].info.aggregationMethod );
                            done();
                    })
                    .end();
    })
  });
})
