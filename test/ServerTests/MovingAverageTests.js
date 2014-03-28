var assert= require("assert"),
    rimraf= require("rimraf"),
    TargetParseContext= require("../../lib/TargetParseContext"),
    MetricInfo= require("../../lib/MetricInfo"),
    TargetParser= require("../../lib/TargetParser"),
    Utils= require("./TestUtils");

describe('TargetParseContext', function(){
  describe('movingAverage', function(){
    function isOdd(num) { return num % 2;}
    var metricsStore= null;
    beforeEach(function(done) {
      var data= [];
      var dataB = [];
      var dataC = [];
      var dataD = [];
      for(var i= 0;i<300;i++) {
        var t = i*60;
        data.push( [t, i+1] );
        dataB.push( [t, i+50] );
        dataC.push( [t, i+1000] );
      }
      Utils.populateRealMetricsStore( {"foo.bar": {"data":data}, "foo.car": {"data":dataB}, "foo.dar": {"data":dataC}, "foo.ear": {"data":dataD}}, function(err, store) {
        metricsStore= store;
        done(err);
      });
    });
    afterEach(function(done) {
      if( metricsStore ) rimraf( metricsStore.tree.root, done );
      else done();
    });    
    it('should graph the moving average of a metric (singular), utilising the current value and 180 seconds of previous data points for the average calculation.', function(done) {
        var metric=  "movingAverage(foo.bar,\"180seconds\")";
        var ctx= new TargetParseContext( metricsStore, metric, 660, 1260 );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.length );
                            assert.equal( 10, result[0].data.values.length );
                            assert.equal( "movingAverage(foo.bar,\"180seconds\")", result[0].name );
                            assert.deepEqual( [12,13,14,15,16,17,18,19,20,21], result[0].data.values );
                            done();
                    })
                    .end();
    });
    it('should graph the moving average of a metric (singular), utilising the current value and 2 minutes of previous data points for the average calculation.', function(done) {
        var metric=  "movingAverage(foo.bar,\"2minutes\")";
        var ctx= new TargetParseContext( metricsStore, metric, 660, 1260 );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.length );
                            assert.equal( 10, result[0].data.values.length );
                            assert.equal( "movingAverage(foo.bar,\"2minutes\")", result[0].name );
                            assert.deepEqual( [12.5,13.5,14.5,15.5,16.5,17.5,18.5,19.5,20.5,21.5], result[0].data.values );
                            done();
                    })
                    .end();
    });
    it('should graph the moving average of a metric (singular), utilising the current value and 60 seconds of previous data points for the average calculation.', function(done) {
        var metric=  "movingAverage(foo.bar,\"60seconds\")";
        var ctx= new TargetParseContext( metricsStore, metric, 660, 1260 );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.length );
                            assert.equal( 10, result[0].data.values.length );
                            assert.equal( "movingAverage(foo.bar,\"60seconds\")", result[0].name );
                            assert.deepEqual( [13,14,15,16,17,18,19,20,21,22], result[0].data.values );
                            done();
                    })
                    .end();
    });
    it('should graph the moving average of a metric (singular), utilising the current value 0 years of previous data points for the average calculation.', function(done) {
        var metric=  "movingAverage(foo.bar,\"0years\")";
        var ctx= new TargetParseContext( metricsStore, metric, 660, 1260 );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.length );
                            assert.equal( 10, result[0].data.values.length );
                            assert.equal( "movingAverage(foo.bar,\"0years\")", result[0].name );
                            assert.deepEqual( [13,14,15,16,17,18,19,20,21,22], result[0].data.values );
                            done();
                    })
                    .end();
    });
    it('should graph the moving average of a metric (multiple), utilising the current value and 180 seconds of previous data points for the average calculation.', function(done) {
        var metric=  "movingAverage(foo.{bar,car,dar},\"180seconds\")";
        var ctx= new TargetParseContext( metricsStore, metric, 660, 1260 );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 3, result.length );
                            assert.equal( 10, result[0].data.values.length );
                            assert.equal( 10, result[1].data.values.length );
                            assert.equal( 10, result[2].data.values.length );
                            assert.equal( "movingAverage(foo.bar,\"180seconds\")", result[0].name );
                            assert.deepEqual( [12,13,14,15,16,17,18,19,20,21], result[0].data.values );
                            assert.equal( "movingAverage(foo.car,\"180seconds\")", result[1].name );
                            assert.deepEqual( [61,62,63,64,65,66,67,68,69,70], result[1].data.values );
                            assert.equal( "movingAverage(foo.dar,\"180seconds\")", result[2].name );
                            assert.deepEqual( [1011,1012,1013,1014,1015,1016,1017,1018,1019,1020], result[2].data.values );
                            done();
                    })
                    .end();
    });
    it('should graph the moving average of a metric (multiple), utilising the current value and 2 minutes of previous data points for the average calculation.', function(done) {
        var metric=  "movingAverage(foo.{bar,car,dar},\"2minutes\")";
        var ctx= new TargetParseContext( metricsStore, metric, 660, 1260 );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 3, result.length );
                            assert.equal( 10, result[0].data.values.length );
                            assert.equal( 10, result[1].data.values.length );
                            assert.equal( 10, result[2].data.values.length );
                            assert.equal( "movingAverage(foo.bar,\"2minutes\")", result[0].name );
                            assert.deepEqual( [12.5,13.5,14.5,15.5,16.5,17.5,18.5,19.5,20.5,21.5], result[0].data.values );
                            assert.equal( "movingAverage(foo.car,\"2minutes\")", result[1].name );
                            assert.deepEqual( [61.5,62.5,63.5,64.5,65.5,66.5,67.5,68.5,69.5,70.5], result[1].data.values );
                            assert.equal( "movingAverage(foo.dar,\"2minutes\")", result[2].name );
                            assert.deepEqual( [1011.5,1012.5,1013.5,1014.5,1015.5,1016.5,1017.5,1018.5,1019.5,1020.5], result[2].data.values );
                            done();
                    })
                    .end();
    });
    it('should graph the moving average of a metric (multiple), utilising the current value and 60 seconds of previous data points for the average calculation.', function(done) {
        var metric=  "movingAverage(foo.{bar,car,dar},\"60seconds\")";
        var ctx= new TargetParseContext( metricsStore, metric, 660, 1260 );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 3, result.length );
                            assert.equal( 10, result[0].data.values.length );
                            assert.equal( 10, result[1].data.values.length );
                            assert.equal( 10, result[2].data.values.length );
                            assert.equal( "movingAverage(foo.bar,\"60seconds\")", result[0].name );
                            assert.deepEqual( [13,14,15,16,17,18,19,20,21,22], result[0].data.values );
                            assert.equal( "movingAverage(foo.car,\"60seconds\")", result[1].name );
                            assert.deepEqual( [62,63,64,65,66,67,68,69,70,71], result[1].data.values );
                            assert.equal( "movingAverage(foo.dar,\"60seconds\")", result[2].name );
                            assert.deepEqual( [1012,1013,1014,1015,1016,1017,1018,1019,1020,1021], result[2].data.values );
                            done();
                    })
                    .end();
    });
    it('should graph the moving average of a metric (multiple), utilising the current value 0 years of previous data points for the average calculation.', function(done) {
        var metric=  "movingAverage(foo.{bar,car,dar},\"0years\")";
        var ctx= new TargetParseContext( metricsStore, metric, 660, 1260 );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 3, result.length );
                            assert.equal( 10, result[0].data.values.length );
                            assert.equal( 10, result[1].data.values.length );
                            assert.equal( 10, result[2].data.values.length );
                            assert.equal( "movingAverage(foo.bar,\"0years\")", result[0].name );
                            assert.deepEqual( [13,14,15,16,17,18,19,20,21,22], result[0].data.values );
                            assert.equal( "movingAverage(foo.car,\"0years\")", result[1].name );
                            assert.deepEqual( [62,63,64,65,66,67,68,69,70,71], result[1].data.values );
                            assert.equal( "movingAverage(foo.dar,\"0years\")", result[2].name );
                            assert.deepEqual( [1012,1013,1014,1015,1016,1017,1018,1019,1020,1021], result[2].data.values );
                            done();
                    })
                    .end();
    });
    it('should graph the moving average of a metric (multiple - wildcard), utilising the current value and 180 seconds of previous data points for the average calculation.', function(done) {
        var metric=  "movingAverage(*.*,\"180seconds\")";
        var ctx= new TargetParseContext( metricsStore, metric, 660, 1260 );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 4, result.length );
                            assert.equal( 10, result[0].data.values.length );
                            assert.equal( 10, result[1].data.values.length );
                            assert.equal( 10, result[2].data.values.length );
                            assert.equal( 10, result[3].data.values.length );
                            assert.equal( "movingAverage(foo.bar,\"180seconds\")", result[0].name );
                            assert.deepEqual( [12,13,14,15,16,17,18,19,20,21], result[0].data.values );
                            assert.equal( "movingAverage(foo.car,\"180seconds\")", result[1].name );
                            assert.deepEqual( [61,62,63,64,65,66,67,68,69,70], result[1].data.values );
                            assert.equal( "movingAverage(foo.dar,\"180seconds\")", result[2].name );
                            assert.deepEqual( [1011,1012,1013,1014,1015,1016,1017,1018,1019,1020], result[2].data.values );
                            assert.equal( "movingAverage(foo.ear,\"180seconds\")", result[3].name );
                            assert.deepEqual( [,,,,,,,,,null], result[3].data.values );
                            done();
                    })
                    .end();
    });
  });
});
