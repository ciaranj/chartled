var assert= require("assert"),
    TargetParseContext= require("../../lib/TargetParseContext"),
    MetricInfo= require("../../lib/MetricInfo"),
    TargetParser= require("../../lib/TargetParser"),
    Utils= require("./TestUtils");

describe('TargetParseContext', function(){
  describe('keepLastValue', function(){
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

    it('should replace any consecutive null/undefined metric values in the given series list (multiple) with the last non null/undefined value obtained.', function(done) {
        var metric=  "keepLastValue(foo.{bar,car,far,gar,rar,tar,zar})";
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
                            
                            assert.deepEqual( [1,11,2,2,2,2,2,14,5,5,6,16], result[0].data.values );
                            assert.deepEqual( [2,4,4,4,4,4], result[2].data.values );
                            assert.deepEqual( [1,4,4,4,5,7], result[3].data.values );
                            assert.deepEqual( [,2,5,5,2,3,3], result[4].data.values );
                            assert.deepEqual( [null,1,5,5,8,9,9], result[5].data.values );
                            assert.deepEqual( [,null,,null,,,null], result[6].data.values );
                            done();
                    }).fail( function(err) {
                      done(err);
                    });
    });
    it('should replace any consecutive null/undefined metric values in the given series list (multiple) with the last non null/undefined value obtained (limited).', function(done) {
        var metric=  "keepLastValue(foo.{bar,car,far,gar,rar,tar,zar}, 2)";
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
                            assert.deepEqual( [1,11,2,null,null,,,14,5,5,6,16], result[0].data.values );
                            assert.deepEqual( [2,4,,,null,null], result[2].data.values );
                            assert.deepEqual( [1,4,4,4,5,7], result[3].data.values );
                            assert.deepEqual( [,2,5,5,2,3,3], result[4].data.values );
                            assert.deepEqual( [null,1,5,5,8,9,9], result[5].data.values );
                            assert.deepEqual( [,null,,null,,,null], result[6].data.values );
                            done();
                    }).fail( function(err) {
                      done(err);
                    });
    });
    it('should replace any consecutive null/undefined metric values in the given series list (single) with the last non null/undefined value obtained.', function(done) {
        var metric=  "keepLastValue(foo.{bar})";
        var ctx= Utils.buildTargetParseContext( metric, metricInfs, metricVals());
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.length );
                            assert.equal( 12, result[0].data.values.length );
                            
                            assert.deepEqual( [1,11,2,2,2,2,2,14,5,5,6,16], result[0].data.values );
                            done();
                    }).fail( function(err) {
                      done(err);
                    });
    });
    it('should replace any consecutive null/undefined metric values in the given series list (multiple) with the last non null/undefined value obtained (limited).', function(done) {
        var metric=  "keepLastValue(foo.{bar}, 2)";
        var ctx= Utils.buildTargetParseContext( metric, metricInfs, metricVals());
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.length );
                            assert.equal( 12, result[0].data.values.length );
                            assert.deepEqual( [1,11,2,null,null,,,14,5,5,6,16], result[0].data.values );
                            done();
                    }).fail( function(err) {
                      done(err);
                    });
    });
    it('should update the metric name correctly for multiple series (not limited)', function(done) {
        var metric=  "keepLastValue(foo.{bar,car,far,gar,rar,tar,zar})";
        var ctx= Utils.buildTargetParseContext( metric, metricInfs, metricVals());
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 7, result.length );
                            assert.equal( "keepLastValue(foo.bar)", result[0].name );
                            assert.equal( "keepLastValue(foo.car)", result[1].name );
                            assert.equal( "keepLastValue(foo.far)", result[2].name );
                            assert.equal( "keepLastValue(foo.gar)", result[3].name );
                            assert.equal( "keepLastValue(foo.rar)", result[4].name );
                            assert.equal( "keepLastValue(foo.tar)", result[5].name );
                            assert.equal( "keepLastValue(foo.zar)", result[6].name );
                            done();
                    }).fail( function(err) {
                      done(err);
                    });
    });
    it('should update the metric name correctly for multiple series (limited)', function(done) {
        var metric=  "keepLastValue(foo.{bar,car,far,gar,rar,tar,zar}, 2)";
        var ctx= Utils.buildTargetParseContext( metric, metricInfs, metricVals());
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 7, result.length );
                            assert.equal( "keepLastValue(foo.bar)", result[0].name );
                            assert.equal( "keepLastValue(foo.car)", result[1].name );
                            assert.equal( "keepLastValue(foo.far)", result[2].name );
                            assert.equal( "keepLastValue(foo.gar)", result[3].name );
                            assert.equal( "keepLastValue(foo.rar)", result[4].name );
                            assert.equal( "keepLastValue(foo.tar)", result[5].name );
                            assert.equal( "keepLastValue(foo.zar)", result[6].name );
                            done();
                    }).fail( function(err) {
                      done(err);
                    });
    });
    
    it('should update the metric name correctly for a single series (not limited)', function(done) {
        var metric=  "keepLastValue(foo.{bar})";
        var ctx= Utils.buildTargetParseContext( metric, metricInfs, metricVals());
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.length );
                            assert.equal( "keepLastValue(foo.bar)", result[0].name );
                            done();
                    }).fail( function(err) {
                      done(err);
                    });
    });
    it('should update the metric name correctly for a single series (limited)', function(done) {
        var metric=  "keepLastValue(foo.{bar}, 2)";
        var ctx= Utils.buildTargetParseContext( metric, metricInfs, metricVals());
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.length );
                            assert.equal( "keepLastValue(foo.bar)", result[0].name );
                            done();
                    }).fail( function(err) {
                      done(err);
                    });
    });
    it('should update the metric name correctly for wildcards', function(done) {
        var metric=  "keepLastValue(*oo.*ar, 2)";
        var ctx= Utils.buildTargetParseContext( metric, metricInfs, metricVals());
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 7, result.length );
                            assert.equal( "keepLastValue(foo.bar)", result[0].name );
                            assert.equal( "keepLastValue(foo.car)", result[1].name );
                            assert.equal( "keepLastValue(foo.far)", result[2].name );
                            assert.equal( "keepLastValue(foo.gar)", result[3].name );
                            assert.equal( "keepLastValue(foo.rar)", result[4].name );
                            assert.equal( "keepLastValue(foo.tar)", result[5].name );
                            assert.equal( "keepLastValue(foo.zar)", result[6].name );
                            done();
                    }).fail( function(err) {
                      done(err);
                    });
    });
    it('should update the metric name correctly for ranges', function(done) {
        var metric=  "keepLastValue(foo.[12]ar, 2)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.1ar"), new MetricInfo("foo.2ar"), new MetricInfo("foo.12ar"), new MetricInfo("foo.21ar")], {"foo.1ar":[1,2,3,4], "foo.2ar":[10,20,30,50], "foo.12ar":[10,20,30,50], "foo.21ar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 3, result.length );
                            assert.equal( "keepLastValue(foo.1ar)", result[0].name );
                            assert.equal( "keepLastValue(foo.2ar)", result[1].name );
                            assert.equal( "keepLastValue(foo.12ar)", result[2].name );
                            done();
                    }).fail( function(err) {
                      done(err);
                    });
    });
  });
});
