var assert= require("assert"),
    TargetParseContext= require("../../lib/TargetParseContext"),
    MetricInfo= require("../../lib/MetricInfo"),
    TargetParser= require("../../lib/TargetParser"),
    Utils= require("./TestUtils");

    describe('TargetParser', function() {
    it('should update the metric name and calculate correctly when nesting functions', function(done) {
        var metric=  "avg(scale(f*.[2],5))";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.1"), new MetricInfo("foo.2")], {"foo.1":[1,2,3,4], "foo.2":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( result[0].name, "averageSeries(scale(f*.[2],5))" );
                            assert.deepEqual(result[0].data.values, [27.5,55,82.5,135] );
                            done();
                    }).fail( function(err) {
                      done(err);
                    });
    })
});
