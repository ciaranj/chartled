var assert= require("assert"),
    TargetParseContext= require("../lib/TargetParseContext"),
    MetricInfo= require("../lib/MetricInfo"),
    TargetParser= require("../lib/TargetParser"),
    Utils= require("./TestUtils");

describe('TargetParseContext', function(){
    it("should allow requests for 'future' data", function(done) {
        var metric=  "sum(foo.{bar,tar})";

        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]}, [0,30,10], 0, 50 );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                          console.log( result.seriesList[0].data.tInfo );
                            assert.equal( 1, result.seriesList.length );
                            assert.deepEqual( [11,22,33,54,null,null], result.seriesList[0].data.values );
                            
                            assert.deepEqual( 6, result.seriesList[0].data.values.length );
                            done();
                    })
                    .end();
    });
});