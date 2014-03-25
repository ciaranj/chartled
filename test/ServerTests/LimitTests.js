var assert= require("assert"),
    TargetParseContext= require("../../lib/TargetParseContext"),
    MetricInfo= require("../../lib/MetricInfo"),
    TargetParser= require("../../lib/TargetParser"),
    Utils= require("./TestUtils");

describe('TargetParseContext', function(){
  describe('limit', function(){
    var metricInfs = [new MetricInfo("foo.bar")
                     ,new MetricInfo("foo.car")
                     ,new MetricInfo("foo.far")
                     ,new MetricInfo("foo.gar")
                     ,new MetricInfo("foo.rar")
                     ,new MetricInfo("foo.tar")
                     ,new MetricInfo("foo.zar")]
    var metricVals = function(){ return {"foo.bar":[1,11,2,null,null,,,14,5,null,6,16] // 12
                     ,"foo.car":[2,null,,null] // 4
                     ,"foo.far":[2,4,,,null,null] // 6
                     ,"foo.gar":[1,4,,null,5,7] // 6
                     ,"foo.rar":[,2,5,null,2,3,undefined] // 7
                     ,"foo.tar":[null,1,5,null,8,9,null] // 7
                     ,"foo.zar":[,null,,null,,,null]} } // 7

    it('should limit the number of metrics returned from a metrics list (multiple) to 2.', function(done) {
        var metric=  "limit(foo.{bar,car,far,gar,rar,tar,zar}, 2)";
        var ctx= Utils.buildTargetParseContext( metric, metricInfs, metricVals());
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 2, result.length );
                            assert.equal( 12, result[0].data.values.length );
                            assert.equal( 7, result[1].data.values.length );
                            assert.deepEqual( "foo.bar", result[0].name );
                            assert.deepEqual( "foo.zar", result[1].name );
                            assert.deepEqual( metricVals()["foo.bar"] , result[0].data.values );
                            assert.deepEqual( metricVals()["foo.zar"], result[1].data.values );
                            done();
                    })
                    .end();
    });
    it('should limit the number of metrics returned from a metrics list (single) to the specified number.', function(done) {
        var metric=  "limit(foo.bar, 1)";
        var ctx= Utils.buildTargetParseContext( metric, metricInfs, metricVals());
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.length );
                            assert.equal( 12, result[0].data.values.length );
                            assert.deepEqual( "foo.bar", result[0].name );

                            assert.deepEqual( metricVals()["foo.bar"] , result[0].data.values );
                            done();
                    })
                    .end();
    });
    it('should limit the number of metrics returned from a metrics list (single) to the specified number.', function(done) {
        var metric=  "limit(foo.bar, 0)";
        var ctx= Utils.buildTargetParseContext( metric, metricInfs, metricVals());
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 0, result.length );
                            done();
                    })
                    .end();
    });
    it('should limit the number of metrics returned from a wildcard metrics list to the specified number.', function(done) {
        var metric=  "limit(foo.*, 4)";
        var ctx= Utils.buildTargetParseContext( metric, metricInfs, metricVals());
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 4, result.length );
                            assert.equal( 12, result[0].data.values.length );
                            assert.equal( 4, result[1].data.values.length );
                            assert.equal( 6, result[2].data.values.length );
                            assert.equal( 7, result[3].data.values.length );
                            assert.deepEqual( "foo.bar", result[0].name );
                            assert.deepEqual( "foo.car", result[1].name );
                            assert.deepEqual( "foo.far", result[2].name );
                            assert.deepEqual( "foo.zar", result[3].name );
                            assert.deepEqual( metricVals()["foo.bar"], result[0].data.values );
                            assert.deepEqual( metricVals()["foo.car"], result[1].data.values );
                            assert.deepEqual( metricVals()["foo.far"], result[2].data.values );
                            assert.deepEqual( metricVals()["foo.zar"], result[3].data.values );
                            done();
                    })
                    .end();
    });
    it('should return all the metrics in a metrics list if the limit is greater than the number of metrics available.', function(done) {
        var metric=  "limit(foo.{bar,car}, 57)";
        var ctx= Utils.buildTargetParseContext( metric, metricInfs, metricVals());
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 2, result.length );
                            assert.equal( 12, result[0].data.values.length );
                            assert.equal( 4, result[1].data.values.length );
                            assert.deepEqual( "foo.bar", result[0].name );
                            assert.deepEqual( "foo.car", result[1].name );
                            assert.deepEqual( metricVals()["foo.bar"], result[0].data.values );
                            assert.deepEqual( metricVals()["foo.car"], result[1].data.values );
                            done();
                    })
                    .end();
    });
  });
});
