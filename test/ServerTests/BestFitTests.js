var assert= require("assert"),
    TargetParseContext= require("../../lib/TargetParseContext"),
    MetricInfo= require("../../lib/MetricInfo"),
    TargetParser= require("../../lib/TargetParser"),
    Utils= require("./TestUtils");

describe('TargetParseContext', function(){
  describe('bestFit', function(){
    it('should return a bestfit of nulls when given no data to work on', function(done) {
        var metric=  "bestFit(foo.bar)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar")], {"foo.bar":[,,null,undefined]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.seriesList.length );
                            assert.deepEqual( [null,null,null,null], result.seriesList[0].data.values );
                            assert.equal( "bestFit(foo.bar)", result.seriesList[0].name );
                            done();
                    })
                    .end();
    })
    it('should return a horizontally intersecting bestfit of a single value if present', function(done) {
        var metric=  "bestFit(foo.bar)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar")], {"foo.bar":[,,2,undefined]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.seriesList.length );
                            assert.deepEqual( [2,2,2,2], result.seriesList[0].data.values );
                            assert.equal( "bestFit(foo.bar)", result.seriesList[0].name );
                            done();
                    })
                    .end();
    })    
    it('should return an exact match for a linear set of data points (growth)', function(done) {
        var metric=  "bestFit(foo.bar)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar")], {"foo.bar":[1,2,3,4]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.seriesList.length );
                            assert.deepEqual( [1,2,3,4], result.seriesList[0].data.values );
                            assert.equal( "bestFit(foo.bar)", result.seriesList[0].name );
                            done();
                    })
                    .end();
    })
    it('should return an exact match for a linear set of data points (stable)', function(done) {
        var metric=  "bestFit(foo.bar)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar")], {"foo.bar":[2,2,2,2]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.seriesList.length );
                            assert.deepEqual( [2,2,2,2], result.seriesList[0].data.values );
                            assert.equal( "bestFit(foo.bar)", result.seriesList[0].name );
                            done();
                    })
                    .end();
    })
    it('should ignore nulls (at start)', function(done) {
        var metric=  "bestFit(foo.bar)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar")], {"foo.bar":[,2,2,2]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.seriesList.length );
                            assert.deepEqual( [2,2,2,2], result.seriesList[0].data.values );
                            assert.equal( "bestFit(foo.bar)", result.seriesList[0].name );
                            done();
                    })
                    .end();
    })
    it('should ignore nulls (at end)', function(done) {
        var metric=  "bestFit(foo.bar)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar")], {"foo.bar":[2,2,2,null]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.seriesList.length );
                            assert.deepEqual( [2,2,2,2], result.seriesList[0].data.values );
                            assert.equal( "bestFit(foo.bar)", result.seriesList[0].name );
                            done();
                    })
                    .end();
    })
    it('should ignore nulls (middle)', function(done) {
        var metric=  "bestFit(foo.bar)";
        var ctx= Utils.buildTargetParseContext( metric,  [new MetricInfo("foo.bar")], {"foo.bar":[2,null,,2]} );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                            assert.equal( 1, result.seriesList.length );
                            assert.deepEqual( [2,2,2,2], result.seriesList[0].data.values );
                            assert.equal( "bestFit(foo.bar)", result.seriesList[0].name );
                            done();
                    })
                    .end();
    })    
  });
})
