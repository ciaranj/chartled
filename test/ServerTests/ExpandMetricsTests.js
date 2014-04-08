var assert = require("assert"),
    TargetParseContext= require("../../lib/TargetParseContext"),
    MetricInfo= require("../../lib/MetricInfo"),
    TargetParser= require("../../lib/TargetParser"),
    Utils= require("./TestUtils"),
    sinon = require( "sinon" );

function buildAvailableMetrics(metrics) {
    var result= [];
    for(var k in metrics) {
        result[metrics[k]]= new MetricInfo(metrics[k], metrics[k], [],{});
    }
    return result;
}
    
describe('TargetParseContext', function(){
  var sandbox;
  beforeEach(function () {
    sandbox = sinon.sandbox.create();
  });
  afterEach(function () {
    sandbox.restore();
  });
  describe('metric expansion', function(){
    it("should expand a single metric", function(done) {
        var ctx= new TargetParseContext();
        var myStore = { getAvailableMetrics: function (cb) {}};
        var stub= sandbox.stub(myStore, "getAvailableMetrics");
        stub.callsArgWith(0, null, buildAvailableMetrics(["foo.bar","foo.car","foo.dar"]));
        ctx.metricsStore= myStore;
        ctx._expandMatchers( ctx.$m("foo.bar") )
           .then( function(expandedMetrics) {
                assert.notEqual( expandedMetrics, null );
                assert.equal( expandedMetrics.length, 1);
                assert.equal( expandedMetrics[0].name, "foo.bar");
                assert.equal( expandedMetrics[0].pathExpression, "foo.bar");
                done();
           })
           .fail(function(err){
                done(err);
           });
    });
    it("should expand a wild card list of metrics", function(done) {
        var ctx= new TargetParseContext();
        var myStore = { getAvailableMetrics: function (cb) {}};
        var stub= sandbox.stub(myStore, "getAvailableMetrics");
        stub.callsArgWith(0, null, buildAvailableMetrics(["foo.bar","foo.car","foo.dar"]));
        ctx.metricsStore= myStore;
        ctx._expandMatchers( ctx.$m("foo.*") )
           .then( function(expandedMetrics) {
                assert.notEqual( expandedMetrics, null );
                assert.equal( expandedMetrics.length, 3);
                assert.equal( expandedMetrics[0].name, "foo.bar");
                assert.equal( expandedMetrics[1].name, "foo.car");
                assert.equal( expandedMetrics[2].name, "foo.dar");
                assert.equal( expandedMetrics[0].pathExpression, "foo.*");
                assert.equal( expandedMetrics[1].pathExpression, "foo.*");
                assert.equal( expandedMetrics[2].pathExpression, "foo.*");
                done();
           })
           .fail(function(err){
                done(err);
           });
    });
    it("should expand a list of metrics", function(done) {
        var ctx= new TargetParseContext();
        var myStore = { getAvailableMetrics: function (cb) {}};
        var stub= sandbox.stub(myStore, "getAvailableMetrics");
        stub.callsArgWith(0, null, buildAvailableMetrics(["foo.bar","foo.car","foo.dar","bar.bar","bar.far"]));
        ctx.metricsStore= myStore;
        ctx._expandMatchers( [ctx.$m("foo.{bar,dar}"), ctx.$m("bar.*")] )
           .then( function(expandedMetrics) {
                assert.notEqual( expandedMetrics, null );
                assert.equal( expandedMetrics.length, 4);
                assert.equal( expandedMetrics[0].name, "foo.bar");
                assert.equal( expandedMetrics[1].name, "foo.dar");
                assert.equal( expandedMetrics[2].name, "bar.bar");
                assert.equal( expandedMetrics[3].name, "bar.far");
                assert.equal( expandedMetrics[0].pathExpression, "foo.{bar,dar}");
                assert.equal( expandedMetrics[1].pathExpression, "foo.{bar,dar}");
                assert.equal( expandedMetrics[2].pathExpression, "bar.*");
                assert.equal( expandedMetrics[3].pathExpression, "bar.*");
                done();
           })
           .fail(function(err){
                done(err);
           });
    });
    it("should return an empty list when we ask it to expand nothing", function(done) {
        var ctx= new TargetParseContext();
        var myStore = { getAvailableMetrics: function (cb) {}};
        var stub= sandbox.stub(myStore, "getAvailableMetrics");
        stub.callsArgWith(0, null, buildAvailableMetrics(["foo.bar","foo.car","foo.dar","bar.bar","bar.far"]));
        ctx.metricsStore= myStore;
        ctx._expandMatchers( ctx.$m("foo.zebra") )
           .then( function(expandedMetrics) {
                assert.equal( expandedMetrics.length, 0);
                done();
           })
           .fail(function(err){
                done(err);
           });
    });
  });
});