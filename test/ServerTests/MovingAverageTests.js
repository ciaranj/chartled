var assert= require("assert"),
    TargetParseContext= require("../../lib/TargetParseContext"),
    MetricInfo= require("../../lib/MetricInfo"),
    TargetParser= require("../../lib/TargetParser"),
    Utils= require("./TestUtils");

describe('TargetParseContext', function(){
  describe('movingAverage', function(){
    var metricInfs = [new MetricInfo("foo.bar")
                     ,new MetricInfo("foo.car")
                     ,new MetricInfo("foo.far")
                     ,new MetricInfo("foo.gar")
                     ,new MetricInfo("foo.rar")
                     ,new MetricInfo("foo.tar")
                     ,new MetricInfo("foo.zar")]
    var metricVals = function(){ return {"foo.bar":[1,2,3,1,2,3,1,2,3,1,2,3] // 12
                     ,"foo.car":[2,null,,null] // 4
                     ,"foo.far":[2,4,,,null,null] // 6
                     ,"foo.gar":[1,4,,null,5,7] // 6
                     ,"foo.rar":[,2,5,null,2,3,undefined] // 7
                     ,"foo.tar":[null,1,5,null,8,9,null] // 7
                     ,"foo.zar":[,null,,null,,,null]} } // 7

    it('should graph the moving average of a metric (singular), utilising the current value and 2 previous data points for the average calculation.', function(done) {
        var metric=  "movingAverage(foo.{bar}, 2)";
        var ctx= Utils.buildTargetParseContext( metric, metricInfs, metricVals());
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.length );
                            assert.equal( 12, result[0].data.values.length );
                            assert.equal( "movingAverage(foo.bar,2)", result[0].name );
                            assert.deepEqual( [1,1.5,2,2,2,2,2,2,2,2,2,2], result[0].data.values );
                            done();
                    })
                    .end();
    });
    it('should graph the moving average of a metric (singular), utilising the current value and 1 previous data point for the average calculation.', function(done) {
        var metric=  "movingAverage(foo.{bar}, 1)";
        var ctx= Utils.buildTargetParseContext( metric, metricInfs, metricVals());
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.length );
                            assert.equal( 12, result[0].data.values.length );
                            assert.equal( "movingAverage(foo.bar,1)", result[0].name );
                            assert.deepEqual( [1,1.5,2.5,2,1.5,2.5,2,1.5,2.5,2,1.5,2.5], result[0].data.values );
                            done();
                    })
                    .end();
    });
    it('should graph the moving average of a metric (singular), utilising the current value and 0 previous data points for the average calculation.', function(done) {
        var metric=  "movingAverage(foo.{bar}, 0)";
        var ctx= Utils.buildTargetParseContext( metric, metricInfs, metricVals());
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.length );
                            assert.equal( 12, result[0].data.values.length );
                            assert.equal( "movingAverage(foo.bar,0)", result[0].name );
                            assert.deepEqual( metricVals()['foo.bar'], result[0].data.values );
                            done();
                    })
                    .end();
    });
    it('should graph the moving average of a metric (multiple), utilising the current value and 2 previous data points for the average calculation.', function(done) {
        var metric=  "movingAverage(foo.{bar,car,far,gar,rar,tar,zar}, 2)";
        var ctx= Utils.buildTargetParseContext( metric, metricInfs, metricVals());
        TargetParser.parse( metric )(ctx)
            .then(function (result) {
                    assert.equal( 7, result.length );
                    assert.equal( 12, result[0].data.values.length );
                    assert.equal( 4, result[1].data.values.length );
                    assert.equal( 6, result[2].data.values.length );
                    assert.equal( 6, result[3].data.values.length );
                    assert.equal( 7, result[4].data.values.length );
                    assert.equal( 7, result[5].data.values.length );
                    assert.equal( 7, result[6].data.values.length );
                    assert.equal( "movingAverage(foo.bar,2)", result[0].name );
                    assert.equal( "movingAverage(foo.car,2)", result[1].name );
                    assert.equal( "movingAverage(foo.far,2)", result[2].name );
                    assert.equal( "movingAverage(foo.gar,2)", result[3].name );
                    assert.equal( "movingAverage(foo.rar,2)", result[4].name );
                    assert.equal( "movingAverage(foo.tar,2)", result[5].name );
                    assert.equal( "movingAverage(foo.zar,2)", result[6].name );
                    assert.deepEqual( [1,1.5,2,2,2,2,2,2,2,2,2,2], result[0].data.values );
                    assert.deepEqual( [2,2,2,null], result[1].data.values );
                    assert.deepEqual( [2,3,3,4,,null], result[2].data.values );
                    assert.deepEqual( [1,2.5,2.5,4,5,6], result[3].data.values );
                    assert.deepEqual( [,2,3.5,3.5,3.5,2.5,2.5], result[4].data.values );
                    assert.deepEqual( [,1,3,3,6.5,8.5,8.5], result[5].data.values );
                    assert.deepEqual( [,,,,,,null], result[6].data.values );
                    done();
            })
            .end();
    });
    it('should graph the moving average of a metric (multiple - wildcard), utilising the current value and 1 previous data point for the average calculation.', function(done) {
        var metric=  "movingAverage(*.{bar,car,far,gar,rar,tar,zar}, 1)";
        var ctx= Utils.buildTargetParseContext( metric, metricInfs, metricVals());
        TargetParser.parse( metric )(ctx)
            .then(function (result) {
                    assert.equal( 7, result.length );
                    assert.equal( 12, result[0].data.values.length );
                    assert.equal( 4, result[1].data.values.length );
                    assert.equal( 6, result[2].data.values.length );
                    assert.equal( 6, result[3].data.values.length );
                    assert.equal( 7, result[4].data.values.length );
                    assert.equal( 7, result[5].data.values.length );
                    assert.equal( 7, result[6].data.values.length );
                    assert.equal( "movingAverage(foo.bar,1)", result[0].name );
                    assert.equal( "movingAverage(foo.car,1)", result[1].name );
                    assert.equal( "movingAverage(foo.far,1)", result[2].name );
                    assert.equal( "movingAverage(foo.gar,1)", result[3].name );
                    assert.equal( "movingAverage(foo.rar,1)", result[4].name );
                    assert.equal( "movingAverage(foo.tar,1)", result[5].name );
                    assert.equal( "movingAverage(foo.zar,1)", result[6].name );
                    assert.deepEqual( [1,1.5,2.5,2,1.5,2.5,2,1.5,2.5,2,1.5,2.5], result[0].data.values );
                    assert.deepEqual( [2,2,,null], result[1].data.values );
                    assert.deepEqual( [2,3,4,,,null], result[2].data.values );
                    assert.deepEqual( [1,2.5,4,,5,6], result[3].data.values );
                    assert.deepEqual( [,2,3.5,5,2,2.5,3], result[4].data.values );
                    assert.deepEqual( [,1,3,5,8,8.5,9], result[5].data.values );
                    assert.deepEqual( [,,,,,,null], result[6].data.values );
                    done();
            })
            .end();
    });
    it('should graph the moving average of a metric (multiple), utilising the current value and 0 previous data points for the average calculation.', function(done) {
        var metric=  "movingAverage(foo.{bar,car,far,gar,rar,tar,zar}, 0)";
        var ctx= Utils.buildTargetParseContext( metric, metricInfs, metricVals());
        TargetParser.parse( metric )(ctx)
            .then(function (result) {
                    assert.equal( 7, result.length );
                    assert.equal( 12, result[0].data.values.length );
                    assert.equal( 4, result[1].data.values.length );
                    assert.equal( 6, result[2].data.values.length );
                    assert.equal( 6, result[3].data.values.length );
                    assert.equal( 7, result[4].data.values.length );
                    assert.equal( 7, result[5].data.values.length );
                    assert.equal( 7, result[6].data.values.length );
                    assert.equal( "movingAverage(foo.bar,0)", result[0].name );
                    assert.equal( "movingAverage(foo.car,0)", result[1].name );
                    assert.equal( "movingAverage(foo.far,0)", result[2].name );
                    assert.equal( "movingAverage(foo.gar,0)", result[3].name );
                    assert.equal( "movingAverage(foo.rar,0)", result[4].name );
                    assert.equal( "movingAverage(foo.tar,0)", result[5].name );
                    assert.equal( "movingAverage(foo.zar,0)", result[6].name );
                    assert.deepEqual( [1,2,3,1,2,3,1,2,3,1,2,3], result[0].data.values );
                    assert.deepEqual( [2,,,null], result[1].data.values );
                    assert.deepEqual( [2,4,,,,null], result[2].data.values );
                    assert.deepEqual( [1,4,,,5,7], result[3].data.values );
                    assert.deepEqual( [,2,5,,2,3,undefined], result[4].data.values );
                    assert.deepEqual( [,1,5,,8,9,null], result[5].data.values );
                    assert.deepEqual( [,,,,,,null], result[6].data.values );
                    done();
            })
            .end();
    });
    it('should graph the moving average of a metric (singular), utilising the current value and 20 seconds of previous data points for the average calculation.', function(done) {
        var metric=  "movingAverage(foo.{bar},\"20seconds\")";
        var ctx= Utils.buildTargetParseContext( metric, metricInfs, metricVals());
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.length );
                            assert.equal( 12, result[0].data.values.length );
                            assert.equal( "movingAverage(foo.bar,\"20seconds\")", result[0].name );
                            assert.deepEqual( [1,1.5,2,2,2,2,2,2,2,2,2,2], result[0].data.values );
                            done();
                    })
                    .end();
    });
    it('should graph the moving average of a metric (singular), utilising the current value and 10 seconds of previous data points for the average calculation.', function(done) {
        var metric=  "movingAverage(foo.{bar},\"10seconds\")";
        var ctx= Utils.buildTargetParseContext( metric, metricInfs, metricVals());
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.length );
                            assert.equal( 12, result[0].data.values.length );
                            assert.equal( "movingAverage(foo.bar,\"10seconds\")", result[0].name );
                            assert.deepEqual( [1,1.5,2.5,2,1.5,2.5,2,1.5,2.5,2,1.5,2.5], result[0].data.values );
                            done();
                    })
                    .end();
    });
    it('should graph the moving average of a metric (singular), utilising the current value 0 years of previous data points for the average calculation.', function(done) {
        var metric=  "movingAverage(foo.{bar},\"0years\")";
        var ctx= Utils.buildTargetParseContext( metric, metricInfs, metricVals());
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.length );
                            assert.equal( 12, result[0].data.values.length );
                            assert.equal( "movingAverage(foo.bar,\"0years\")", result[0].name );
                            assert.deepEqual( metricVals()['foo.bar'], result[0].data.values );
                            done();
                    })
                    .end();
    });
    it('should graph the moving average of a metric (multiple), utilising the current value and 20 seconds of previous data points for the average calculation.', function(done) {
        var metric = "movingAverage(foo.{bar,car,far,gar,rar,tar,zar},\"20seconds\")";
        var ctx= Utils.buildTargetParseContext( metric, metricInfs, metricVals());
        TargetParser.parse( metric )(ctx)
            .then(function (result) {
                    assert.equal( 7, result.length );
                    assert.equal( 12, result[0].data.values.length );
                    assert.equal( 4, result[1].data.values.length );
                    assert.equal( 6, result[2].data.values.length );
                    assert.equal( 6, result[3].data.values.length );
                    assert.equal( 7, result[4].data.values.length );
                    assert.equal( 7, result[5].data.values.length );
                    assert.equal( 7, result[6].data.values.length );
                    assert.equal( "movingAverage(foo.bar,\"20seconds\")", result[0].name );
                    assert.equal( "movingAverage(foo.car,\"20seconds\")", result[1].name );
                    assert.equal( "movingAverage(foo.far,\"20seconds\")", result[2].name );
                    assert.equal( "movingAverage(foo.gar,\"20seconds\")", result[3].name );
                    assert.equal( "movingAverage(foo.rar,\"20seconds\")", result[4].name );
                    assert.equal( "movingAverage(foo.tar,\"20seconds\")", result[5].name );
                    assert.equal( "movingAverage(foo.zar,\"20seconds\")", result[6].name );
                    assert.deepEqual( [1,1.5,2,2,2,2,2,2,2,2,2,2], result[0].data.values );
                    assert.deepEqual( [2,2,2,null], result[1].data.values );
                    assert.deepEqual( [2,3,3,4,,null], result[2].data.values );
                    assert.deepEqual( [1,2.5,2.5,4,5,6], result[3].data.values );
                    assert.deepEqual( [,2,3.5,3.5,3.5,2.5,2.5], result[4].data.values );
                    assert.deepEqual( [,1,3,3,6.5,8.5,8.5], result[5].data.values );
                    assert.deepEqual( [,,,,,,null], result[6].data.values );
                    done();
            })
            .end();
    });
    it('should graph the moving average of a metric (multiple - wildcard), utilising the current value and 10 seconds of previous data points for the average calculation.', function(done) {
        var metric=  "movingAverage(foo.*,\"10seconds\")";
        var ctx= Utils.buildTargetParseContext( metric, metricInfs, metricVals());
        TargetParser.parse( metric )(ctx)
            .then(function (result) {
                    assert.equal( 7, result.length );
                    assert.equal( 12, result[0].data.values.length );
                    assert.equal( 4, result[1].data.values.length );
                    assert.equal( 6, result[2].data.values.length );
                    assert.equal( 6, result[3].data.values.length );
                    assert.equal( 7, result[4].data.values.length );
                    assert.equal( 7, result[5].data.values.length );
                    assert.equal( 7, result[6].data.values.length );
                    assert.equal( "movingAverage(foo.bar,\"10seconds\")", result[0].name );
                    assert.equal( "movingAverage(foo.car,\"10seconds\")", result[1].name );
                    assert.equal( "movingAverage(foo.far,\"10seconds\")", result[2].name );
                    assert.equal( "movingAverage(foo.gar,\"10seconds\")", result[3].name );
                    assert.equal( "movingAverage(foo.rar,\"10seconds\")", result[4].name );
                    assert.equal( "movingAverage(foo.tar,\"10seconds\")", result[5].name );
                    assert.equal( "movingAverage(foo.zar,\"10seconds\")", result[6].name );
                    assert.deepEqual( [1,1.5,2.5,2,1.5,2.5,2,1.5,2.5,2,1.5,2.5], result[0].data.values );
                    assert.deepEqual( [2,2,,null], result[1].data.values );
                    assert.deepEqual( [2,3,4,,,null], result[2].data.values );
                    assert.deepEqual( [1,2.5,4,,5,6], result[3].data.values );
                    assert.deepEqual( [,2,3.5,5,2,2.5,3], result[4].data.values );
                    assert.deepEqual( [,1,3,5,8,8.5,9], result[5].data.values );
                    assert.deepEqual( [,,,,,,null], result[6].data.values );
                    done();
            })
            .end();
    });
    it('should graph the moving average of a metric (multiple), utilising the current value and 0 months previous data points for the average calculation.', function(done) {
        var metric=  "movingAverage(foo.{bar,car,far,gar,rar,tar,zar},\"0months\")";
        var ctx= Utils.buildTargetParseContext( metric, metricInfs, metricVals());
        TargetParser.parse( metric )(ctx)
            .then(function (result) {
                    assert.equal( 7, result.length );
                    assert.equal( 12, result[0].data.values.length );
                    assert.equal( 4, result[1].data.values.length );
                    assert.equal( 6, result[2].data.values.length );
                    assert.equal( 6, result[3].data.values.length );
                    assert.equal( 7, result[4].data.values.length );
                    assert.equal( 7, result[5].data.values.length );
                    assert.equal( 7, result[6].data.values.length );
                    assert.equal( "movingAverage(foo.bar,\"0months\")", result[0].name );
                    assert.equal( "movingAverage(foo.car,\"0months\")", result[1].name );
                    assert.equal( "movingAverage(foo.far,\"0months\")", result[2].name );
                    assert.equal( "movingAverage(foo.gar,\"0months\")", result[3].name );
                    assert.equal( "movingAverage(foo.rar,\"0months\")", result[4].name );
                    assert.equal( "movingAverage(foo.tar,\"0months\")", result[5].name );
                    assert.equal( "movingAverage(foo.zar,\"0months\")", result[6].name );
                    assert.deepEqual( [1,2,3,1,2,3,1,2,3,1,2,3], result[0].data.values );
                    assert.deepEqual( [2,,,null], result[1].data.values );
                    assert.deepEqual( [2,4,,,,null], result[2].data.values );
                    assert.deepEqual( [1,4,,,5,7], result[3].data.values );
                    assert.deepEqual( [,2,5,,2,3,undefined], result[4].data.values );
                    assert.deepEqual( [,1,5,,8,9,null], result[5].data.values );
                    assert.deepEqual( [,,,,,,null], result[6].data.values );
                    done();
            })
            .end();
    });
  });
});
