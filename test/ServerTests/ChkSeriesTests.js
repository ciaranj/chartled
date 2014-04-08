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
  describe('$chkSeries', function(){
    it("should expand and populate a single metric", function(done) {
        var ctx= new TargetParseContext();
        var myStore = { getAvailableMetrics: function (cb) {}, fetchMetricData: function() {} };
        sandbox.stub(myStore, "getAvailableMetrics")
               .callsArgWithAsync(0, null, buildAvailableMetrics(["foo.bar","foo.car","foo.dar"]));
        sandbox.stub(myStore, "fetchMetricData")
               .callsArgWithAsync(3, null, {values: [1,2,3,4], tInfo: [0, 5, 1] });

        ctx.metricsStore= myStore;
        ctx.$chkSeries( ctx.$m("foo.bar"), true )
           .then( function(metrics) {
                assert.notEqual( metrics, null );
                assert.equal( metrics.length, 1);
                assert.equal( metrics[0].name, "foo.bar");
                assert.notEqual( metrics[0].data, null );
                assert.deepEqual( metrics[0].data.values, [1,2,3,4] );
                assert.equal( metrics[0].populated, true);
                done();
           })
           .fail(function(err){
                done(err);
           });
    });
    it("should expand and populate a wild card list of metrics", function(done) {
        var vals = [1,2,3,4];
        var ctx= new TargetParseContext();
        var myStore = { getAvailableMetrics: function (cb) {}, fetchMetricData: function() {} };
        sandbox.stub(myStore, "getAvailableMetrics")
               .callsArgWithAsync(0, null, buildAvailableMetrics(["foo.bar","foo.car","foo.dar"]));
        sandbox.stub(myStore, "fetchMetricData")
               .callsArgWithAsync(3, null, {values: vals, tInfo: [0, 5, 1] });

        ctx.metricsStore= myStore;
        ctx.$chkSeries( ctx.$m("foo.*"), true )
           .then( function(metrics) {
                assert.notEqual( metrics, null );
                assert.equal( metrics.length, 3);
                assert.equal( metrics[0].name, "foo.bar");
                assert.equal( metrics[1].name, "foo.car");
                assert.equal( metrics[2].name, "foo.dar");
                assert.notEqual( metrics[0].data, null );
                assert.notEqual( metrics[1].data, null );
                assert.notEqual( metrics[2].data, null );
                assert.deepEqual( metrics[0].data.values, vals );
                assert.deepEqual( metrics[1].data.values, vals );
                assert.deepEqual( metrics[2].data.values, vals );
                assert.equal( metrics[0].populated, true);
                assert.equal( metrics[1].populated, true);
                assert.equal( metrics[2].populated, true);
                done();
           })
           .fail(function(err){
                done(err);
           });
    });
    it("should expand and populate a list of metrics", function(done) {
        var vals = [1,2,3,4];
        var ctx= new TargetParseContext();
        var myStore = { getAvailableMetrics: function (cb) {}, fetchMetricData: function() {} };
        sandbox.stub(myStore, "getAvailableMetrics")
               .callsArgWithAsync(0, null, buildAvailableMetrics(["foo.bar","foo.car","foo.dar","bar.bar","bar.far"]));
        sandbox.stub(myStore, "fetchMetricData")
               .callsArgWithAsync(3, null, {values: vals, tInfo: [0, 5, 1] });

        ctx.metricsStore= myStore;
        ctx.$chkSeries( [ctx.$m("foo.{bar,dar}"), ctx.$m("bar.*")], true)
           .then( function(metrics) {
                assert.notEqual( metrics, null );
                assert.equal( metrics.length, 4);
                assert.equal( metrics[0].name, "foo.bar");
                assert.equal( metrics[1].name, "foo.dar");
                assert.equal( metrics[2].name, "bar.bar");
                assert.equal( metrics[3].name, "bar.far");
                assert.notEqual( metrics[0].data, null );
                assert.notEqual( metrics[1].data, null );
                assert.notEqual( metrics[2].data, null );
                assert.notEqual( metrics[3].data, null );
                assert.deepEqual( metrics[0].data.values, vals );
                assert.deepEqual( metrics[1].data.values, vals );
                assert.deepEqual( metrics[2].data.values, vals );
                assert.deepEqual( metrics[3].data.values, vals );
                assert.equal( metrics[0].populated, true);
                assert.equal( metrics[1].populated, true);
                assert.equal( metrics[2].populated, true);
                assert.equal( metrics[3].populated, true);
                done();
           })
           .fail(function(err){
                done(err);
           });
    });
    it("should handle an already expanded and populated list of metrics", function(done) {
        var vals = [1,2,3,4];
        var ctx= new TargetParseContext();
        var myStore = { getAvailableMetrics: function (cb) {}, fetchMetricData: function() {} };
        sandbox.stub(myStore, "getAvailableMetrics")
               .callsArgWithAsync(0, null, buildAvailableMetrics(["foo.bar","foo.car","foo.dar","bar.bar","bar.far"]));
        sandbox.stub(myStore, "fetchMetricData")
               .callsArgWithAsync(3, null, {values: vals, tInfo: [0, 5, 1] });

        ctx.metricsStore= myStore;
        ctx.$chkSeries( [ctx.$m("foo.{bar,dar}"), ctx.$m("bar.*")], true)
            .then( function(metrics) {
                assert.equal( metrics[0].populated, true);
                assert.equal( metrics[1].populated, true);
                assert.equal( metrics[2].populated, true);
                assert.equal( metrics[3].populated, true);
                assert.notEqual( metrics[0].data, null );
                assert.notEqual( metrics[1].data, null );
                assert.notEqual( metrics[2].data, null );
                assert.notEqual( metrics[3].data, null );
                // Delete metric store to ensure not re-calling 'getAvailableMetrics' & 'fetchMetricData'
                delete ctx.metricsStore;
                return ctx.$chkSeries( metrics, true)
                    .then( function(metricsTwo) {
                        assert.notEqual( metricsTwo, null );
                        assert.equal( metricsTwo.length, 4);
                        assert.equal( metricsTwo[0].name, "foo.bar");
                        assert.equal( metricsTwo[1].name, "foo.dar");
                        assert.equal( metricsTwo[2].name, "bar.bar");
                        assert.equal( metricsTwo[3].name, "bar.far");
                        assert.notEqual( metricsTwo[0].data, null );
                        assert.notEqual( metricsTwo[1].data, null );
                        assert.notEqual( metricsTwo[2].data, null );
                        assert.notEqual( metricsTwo[3].data, null );
                        assert.deepEqual( metricsTwo[0].data.values, vals );
                        assert.deepEqual( metricsTwo[1].data.values, vals );
                        assert.deepEqual( metricsTwo[2].data.values, vals );
                        assert.deepEqual( metricsTwo[3].data.values, vals );
                        assert.equal( metricsTwo[0].populated, true);
                        assert.equal( metricsTwo[1].populated, true);
                        assert.equal( metricsTwo[2].populated, true);
                        assert.equal( metricsTwo[3].populated, true);
                        done();
                    });
            })
           .fail(function(err){
                done(err);
           });
    });
    it("should handle a list of both populated and unpopulated metrics", function(done) {
        var vals = [1,2,3,4];
        var ctx= new TargetParseContext();
        var myStore = { getAvailableMetrics: function (cb) {}, fetchMetricData: function() {} };
        sandbox.stub(myStore, "getAvailableMetrics")
               .callsArgWithAsync(0, null, buildAvailableMetrics(["foo.bar","foo.car","foo.dar","bar.bar","bar.far"]));
        sandbox.stub(myStore, "fetchMetricData")
               .callsArgWithAsync(3, null, {values: vals, tInfo: [0, 5, 1] });

        ctx.metricsStore= myStore;
        ctx.$chkSeries( ctx.$m("foo.{bar,dar}"), true)
            .then( function(metrics) {
                assert.equal( metrics[0].populated, true);
                assert.equal( metrics[1].populated, true);
                assert.notEqual( metrics[0].data, null );
                assert.notEqual( metrics[1].data, null );
                metrics.push( ctx.$m("bar.*"));
                return ctx.$chkSeries( metrics, true)
                    .then( function(metricsTwo) {
                        assert.notEqual( metricsTwo, null );
                        assert.equal( metricsTwo.length, 4);
                        assert.equal( metricsTwo[0].name, "foo.bar");
                        assert.equal( metricsTwo[1].name, "foo.dar");
                        assert.equal( metricsTwo[2].name, "bar.bar");
                        assert.equal( metricsTwo[3].name, "bar.far");
                        assert.notEqual( metricsTwo[0].data, null );
                        assert.notEqual( metricsTwo[1].data, null );
                        assert.notEqual( metricsTwo[2].data, null );
                        assert.notEqual( metricsTwo[3].data, null );
                        assert.deepEqual( metricsTwo[0].data.values, vals );
                        assert.deepEqual( metricsTwo[1].data.values, vals );
                        assert.deepEqual( metricsTwo[2].data.values, vals );
                        assert.deepEqual( metricsTwo[3].data.values, vals );
                        assert.equal( metricsTwo[0].populated, true);
                        assert.equal( metricsTwo[1].populated, true);
                        assert.equal( metricsTwo[2].populated, true);
                        assert.equal( metricsTwo[3].populated, true);
                        done();
                    });
            })
           .fail(function(err){
                done(err);
           });
    });
    it("should return an empty list when we specify none", function(done) {
        var ctx= new TargetParseContext();
        var myStore = { getAvailableMetrics: function (cb) {}, fetchMetricData: function() {} };
        sandbox.stub(myStore, "getAvailableMetrics")
               .callsArgWithAsync(0, null, buildAvailableMetrics(["foo.bar","foo.car","foo.dar"]));
        sandbox.stub(myStore, "fetchMetricData")
               .callsArgWithAsync(3, null, {values: [1,2,3,4], tInfo: [0, 5, 1] });

        ctx.metricsStore= myStore;
        ctx.$chkSeries( ctx.$m("foo.grapes"), true )
           .then( function(metrics) {
                assert.equal( metrics.length, 0);
                done();
           })
           .fail(function(err){
                done(err);
           });
    });
  });
});