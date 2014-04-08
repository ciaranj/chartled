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
                assert.equal(ctx._formatPathExpressions( expandedMetrics ), "foo.bar");
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
                assert.equal(ctx._formatPathExpressions( expandedMetrics ), "foo.*");
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
                assert.equal(ctx._formatPathExpressions( expandedMetrics ), "foo.{bar,dar},bar.*");
                done();
           })
           .fail(function(err){
                done(err);
           });
    });
  });
});