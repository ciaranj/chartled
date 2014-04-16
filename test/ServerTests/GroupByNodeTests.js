var assert= require("assert"),
    TargetParseContext= require("../../lib/TargetParseContext"),
    MetricInfo= require("../../lib/MetricInfo"),
    TargetParser= require("../../lib/TargetParser"),
    Utils= require("./TestUtils");

describe('TargetParseContext', function(){
  describe('groupByNode', function(){
    it('should return multiple series that are the result of applying the "sumSeries" function to metrics grouped on the second node ( 0 indexed )', function(done) {
        var metric=  "groupByNode(*.*.*, 1, \"sumSeries\")";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("m1.bar.meep"), 
                                                          new MetricInfo("m2.bar.beep"), 
                                                          new MetricInfo("m1.car.deep"), 
                                                          new MetricInfo("m3.car.jeep")], 
                                                        {"m1.bar.meep":[1,2,3,4,5,6,7,8,9,10,11,12], 
                                                         "m2.bar.beep":[5,5,5,5,5,5,5,5,5,5,5,5],
                                                         "m1.car.deep":[5,10,15,20,25,30,35,40,45,50],
                                                         "m3.car.jeep":[6,34,31,9,50,63,83,94,34,69]});
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 2, result.length );
                            assert.equal( 12, result[0].data.values.length );
                            assert.equal( 10, result[1].data.values.length );
                            assert.deepEqual( [6,7,8,9,10,11,12,13,14,15,16,17], result[0].data.values );
                            assert.deepEqual( [11,44,46,29,75,93,118,134,79,119], result[1].data.values );
                            assert.deepEqual( "sum(*.bar.*)", result[0].name );
                            assert.deepEqual( "sum(*.car.*)", result[1].name );
                            done();
                    })
                    .fail( function(err) {
                        done(err);
                    });
    });
    it('should return a single series that are the result of applying the "sumSeries" function to a single metric grouped on the first node ( 0 indexed )', function(done) {
        var metric=  "groupByNode(m1.bar.meep, 0, \"sumSeries\")";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("m1.bar.meep"), 
                                                          new MetricInfo("m2.bar.beep"), 
                                                          new MetricInfo("m1.car.deep"), 
                                                          new MetricInfo("m3.car.jeep")], 
                                                        {"m1.bar.meep":[1,2,3,4,5,6,7,8,9,10,11,12], 
                                                         "m2.bar.beep":[5,5,5,5,5,5,5,5,5,5,5,5],
                                                         "m1.car.deep":[5,10,15,20,25,30,35,40,45,50],
                                                         "m3.car.jeep":[6,34,31,9,50,63,83,94,34,69]});
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.length );
                            assert.equal( 12, result[0].data.values.length );
                            assert.deepEqual( [1,2,3,4,5,6,7,8,9,10,11,12], result[0].data.values );
                            assert.deepEqual( "sum(m1.bar.meep)", result[0].name );
                            done();
                    })
                    .fail( function(err) {
                        done(err);
                    });
    });
    it('should return a single series that are the result of applying the "sumSeries" function to groups joined on the first node ( 0 indexed )', function(done) {
        var metric=  "groupByNode(foo.{bar,car,dar,ear}, 0, \"sumSeries\")";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), 
                                                          new MetricInfo("foo.car"), 
                                                          new MetricInfo("foo.dar"), 
                                                          new MetricInfo("foo.ear")], 
                                                        {"foo.bar":[1,2,3], 
                                                         "foo.car":[5,5,5],
                                                         "foo.dar":[5,10,15],
                                                         "foo.ear":[6,34,31]});
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.length );
                            assert.equal( 3, result[0].data.values.length );
                            assert.deepEqual( [17,51,54], result[0].data.values );
                            assert.deepEqual( "sum(foo.{bar,car,dar,ear})", result[0].name );
                            done();
                    })
                    .fail( function(err) {
                        done(err);
                    });
    });
    it('should return nothing when no metrics are matched', function(done) {
        var metric=  "groupByNode(grapes, 0, \"sumSeries\")";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), 
                                                          new MetricInfo("foo.car"), 
                                                          new MetricInfo("foo.dar"), 
                                                          new MetricInfo("foo.ear")], 
                                                        {"foo.bar":[1,2,3], 
                                                         "foo.car":[5,5,5],
                                                         "foo.dar":[5,10,15],
                                                         "foo.ear":[6,34,31]});
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 0, result.length );
                            done();
                    })
                    .fail( function(err) {
                        done(err);
                    });
    });
    it('should return a single series that are the result of applying the "averageSeries" function to groups joined on the first node ( 0 indexed )', function(done) {
        var metric=  "groupByNode(foo.{bar,car,dar,ear}, 0, \"averageSeries\")";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar"), 
                                                          new MetricInfo("foo.car"), 
                                                          new MetricInfo("foo.dar"), 
                                                          new MetricInfo("foo.ear")], 
                                                        {"foo.bar":[1,5,9], 
                                                         "foo.car":[2,6,10],
                                                         "foo.dar":[3,17,11],
                                                         "foo.ear":[4,8,12]});
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.length );
                            assert.equal( 3, result[0].data.values.length );
                            assert.deepEqual( [2.5,9,10.5], result[0].data.values );
                            assert.deepEqual( "averageSeries(foo.{bar,car,dar,ear})", result[0].name );
                            done();
                    })
                    .fail( function(err) {
                        done(err);
                    });
    });
  });
});
