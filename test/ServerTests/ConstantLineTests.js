var assert= require("assert"),
    TargetParseContext= require("../../lib/TargetParseContext"),
    MetricInfo= require("../../lib/MetricInfo"),
    TargetParser= require("../../lib/TargetParser"),
    Utils= require("./TestUtils");

describe('TargetParseContext', function(){
  describe('constantLine', function(){
    it('should produce a constantLine for the requested timeseries (2)', function(done) {
        var metric=  'constantLine(2.0)';
        var ctx= Utils.buildTargetParseContext( metric,  [], {}, [10,250,60], 10, 250 );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.length );
                            assert.equal( "constantLine(2)", result[0].name );
                            assert.deepEqual( [2,2,2,2,2], result[0].data.values );
                            done();
                    });
    })
    it('should produce a constantLine for the requested timeseries (0)', function(done) {
        var metric=  'constantLine(0)';
        var ctx= Utils.buildTargetParseContext( metric,  [], {}, [10,250,60], 10, 250 );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.length );
                            assert.equal( "constantLine(0)", result[0].name );
                            assert.deepEqual( [0,0,0,0,0], result[0].data.values );
                            done();
                    });
    })
    it('should produce a constantLine for the requested timeseries (-5)', function(done) {
        var metric=  'constantLine(-5)';
        var ctx= Utils.buildTargetParseContext( metric,  [], {}, [10,250,60], 10, 250 );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.length );
                            assert.equal( "constantLine(-5)", result[0].name );
                            assert.deepEqual( [-5,-5,-5,-5,-5], result[0].data.values );
                            done();
                    });
    })
  });
})
