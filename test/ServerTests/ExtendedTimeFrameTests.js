var assert= require("assert"),
    TargetParseContext= require("../../lib/TargetParseContext"),
    MetricInfo= require("../../lib/MetricInfo"),
    TargetParser= require("../../lib/TargetParser"),
    Utils= require("./TestUtils");

describe('TargetParseContext', function(){
    it("should allow requests for 'future' data", function(done) {
        var metric=  "sum(foo.{bar,tar})";

        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4,null,null], "foo.tar":[10,20,30,50,null,null]}, [0,30,10], 0, 50 );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.length );
                            assert.deepEqual( 6, result[0].data.values.length );
                            assert.deepEqual( [11,22,33,54,,null], result[0].data.values );

                            done();
                    })
                    .end();
    });
});