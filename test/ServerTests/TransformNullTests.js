var assert= require("assert"),
    TargetParseContext= require("../../lib/TargetParseContext"),
    MetricInfo= require("../../lib/MetricInfo"),
    TargetParser= require("../../lib/TargetParser"),
    Utils= require("./TestUtils");

describe('TargetParseContext', function(){
  describe('transformNull', function(){
    it('should return the same array if no nulls present.', function(done) {
        var metric=  "transformNull(foo.bar,0)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.deepEqual( result[0].data.values, [1,2,3,4] );
                            assert.equal( result[0].name, "transformNull(foo.bar,0)" );
                            done();
                    }).fail( function(err) {
                      done(err);
                    });
    })
    it('should add the default value to the metric name if none provided.', function(done) {
        var metric=  "transformNull(foo.bar)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,2,3,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( result[0].name, "transformNull(foo.bar,0)" );
                            done();
                    }).fail( function(err) {
                      done(err);
                    });
    });
    it('should replace any null/undefined properties with the specified default.', function(done) {
        var metric=  "transformNull(foo.bar,-6)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,null,,4], "foo.tar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.deepEqual( result[0].data.values, [1,-6,-6,4] );
                            assert.equal( result[0].name, "transformNull(foo.bar,-6)" );
                            done();
                    }).fail( function(err) {
                      done(err);
                    });
    });
    it('should replace any null/undefined properties with the specified default when presented with a wildcard metric.', function(done) {
        var metric=  "transformNull(foo.*,130.5)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), new MetricInfo("foo.tar")], {"foo.bar":[1,null,,4], "foo.tar":[,20,30,null]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.deepEqual( result.length, 2 );
                            assert.equal( result[0].name, "transformNull(foo.bar,130.5)" );
                            assert.deepEqual( result[0].data.values, [1,130.5,130.5,4] );
                            assert.equal( result[1].name, "transformNull(foo.tar,130.5)" );
                            assert.deepEqual( result[1].data.values, [130.5,20,30,130.5] );
                            done();
                    }).fail( function(err) {
                      done(err);
                    });
    });
  });
})
