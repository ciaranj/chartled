var assert= require("assert"),
    TargetParseContext= require("../../lib/TargetParseContext"),
    MetricInfo= require("../../lib/MetricInfo"),
    TargetParser= require("../../lib/TargetParser"),
    Utils= require("./TestUtils");

describe('TargetParseContext', function(){
  describe('integral', function(){
    var metricInfs = [new MetricInfo("foo.bar")
                     ,new MetricInfo("foo.car")
                     ,new MetricInfo("foo.far")
                     ,new MetricInfo("foo.gar")
                     ,new MetricInfo("foo.rar")
                     ,new MetricInfo("foo.tar")
                     ,new MetricInfo("foo.zar")
                     ,new MetricInfo("foo.war")]
    var metricVals = function(){ return {"foo.bar":[1,11,2,null,null,,,14,5,null,6,16] // 12
                     ,"foo.car":[2,null,,null] // 4
                     ,"foo.far":[2,4,,,null,null] // 6
                     ,"foo.gar":[1,4,,null,5,7] // 6
                     ,"foo.rar":[,2,5,null,2,3,undefined] // 7
                     ,"foo.tar":[null,1,5,null,8,9,null] // 7
                     ,"foo.zar":[,null,,null,,,null] // 7
                     ,"foo.war":[1,2,3,4,5]} } // 5
                     
    it('should sum over time the metric values in the given series list (multiple)', function(done) {
        var metric=  "integral(foo.{bar,car,far,gar,rar,tar,zar,war})";
        var ctx= Utils.buildTargetParseContext( metric, metricInfs, metricVals());
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 8, result.seriesList.length );
                            assert.equal( 12, result.seriesList[0].data.values.length );
                            assert.equal( 4, result.seriesList[1].data.values.length );
                            assert.equal( 6, result.seriesList[2].data.values.length );
                            assert.equal( 6, result.seriesList[3].data.values.length );
                            assert.equal( 7, result.seriesList[4].data.values.length );
                            assert.equal( 7, result.seriesList[5].data.values.length );
                            assert.equal( 7, result.seriesList[6].data.values.length );
                            assert.equal( 5, result.seriesList[7].data.values.length );
                            assert.deepEqual( [1,12,14,null,null,,,28,33,null,39,55], result.seriesList[0].data.values );
                            assert.deepEqual( [2,null,,null], result.seriesList[1].data.values );
                            assert.deepEqual( [2,6,,,null,null], result.seriesList[2].data.values );
                            assert.deepEqual( [1,5,,null,10,17], result.seriesList[3].data.values );
                            assert.deepEqual( [,2,7,null,9,12,undefined], result.seriesList[4].data.values );
                            assert.deepEqual( [null,1,6,null,14,23,null], result.seriesList[5].data.values );
                            assert.deepEqual( [,null,,null,,,null], result.seriesList[6].data.values );
                            assert.deepEqual( [1,3,6,10,15], result.seriesList[7].data.values );
                            done();
                    })
                    .end();
    });
    it('should sum over time the metric values in the given series list (multiple)', function(done) {
        var metric=  "integral(foo.{bar})";
        var ctx= Utils.buildTargetParseContext( metric, [new MetricInfo("foo.bar")], {"foo.bar":[5,123,245,12,3,199,4,14,5,15,6,3000]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.seriesList.length );
                            assert.equal( 12, result.seriesList[0].data.values.length );
                            assert.deepEqual( [5,128,373,385,388,587,591,605,610,625,631,3631], result.seriesList[0].data.values );
                            done();
                    })
                    .end();
    });
    it('should update the metric name correctly for multiple series', function(done) {
        var metric=  "integral(foo.{bar,car,far,gar,rar,tar,zar,war})";
        var ctx= Utils.buildTargetParseContext( metric, metricInfs, metricVals());
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 8, result.seriesList.length );
                            assert.equal( "integral(foo.bar)", result.seriesList[0].name );
                            assert.equal( "integral(foo.car)", result.seriesList[1].name );
                            assert.equal( "integral(foo.far)", result.seriesList[2].name );
                            assert.equal( "integral(foo.gar)", result.seriesList[3].name );
                            assert.equal( "integral(foo.rar)", result.seriesList[4].name );
                            assert.equal( "integral(foo.tar)", result.seriesList[5].name );
                            assert.equal( "integral(foo.zar)", result.seriesList[6].name );
                            assert.equal( "integral(foo.war)", result.seriesList[7].name );
                            done();
                    })
                    .end();
    });
    
    it('should update the metric name correctly for a single series', function(done) {
        var metric=  "integral(foo.{bar})";
        var ctx= Utils.buildTargetParseContext( metric, metricInfs, metricVals());
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.seriesList.length );
                            assert.equal( "integral(foo.bar)", result.seriesList[0].name );
                            done();
                    })
                    .end();
    });
    it('should update the metric name correctly for wildcards', function(done) {
        var metric=  "integral(*oo.*ar, 2)";
        var ctx= Utils.buildTargetParseContext( metric, metricInfs, metricVals());
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 8, result.seriesList.length );
                            assert.equal( "integral(foo.bar)", result.seriesList[0].name );
                            assert.equal( "integral(foo.car)", result.seriesList[1].name );
                            assert.equal( "integral(foo.far)", result.seriesList[2].name );
                            assert.equal( "integral(foo.gar)", result.seriesList[3].name );
                            assert.equal( "integral(foo.rar)", result.seriesList[4].name );
                            assert.equal( "integral(foo.tar)", result.seriesList[5].name );
                            assert.equal( "integral(foo.zar)", result.seriesList[6].name );
                            assert.equal( "integral(foo.war)", result.seriesList[7].name );
                            done();
                    })
                    .end();
    });
    it('should update the metric name correctly for ranges', function(done) {
        var metric=  "integral(foo.[12]ar, 2)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.1ar"), new MetricInfo("foo.2ar"), new MetricInfo("foo.12ar"), new MetricInfo("foo.21ar")], {"foo.1ar":[1,2,3,4], "foo.2ar":[10,20,30,50], "foo.12ar":[10,20,30,50], "foo.21ar":[10,20,30,50]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 3, result.seriesList.length );
                            assert.equal( "integral(foo.1ar)", result.seriesList[0].name );
                            assert.equal( "integral(foo.2ar)", result.seriesList[1].name );
                            assert.equal( "integral(foo.12ar)", result.seriesList[2].name );
                            done();
                    })
                    .end();
    });
  });
});
