var assert= require("assert"),
    rimraf= require("rimraf"),
    TargetParseContext= require("../../lib/TargetParseContext"),
    TargetParser= require("../../lib/TargetParser"),
    Utils= require("./TestUtils");


describe('TargetParseContext', function(){
    describe("timeShift", function() {
      var metricsStore= null;
      beforeEach(function(done) {
        var data= [];
        // Push 100 data points, starting at 0 seconds since epoch.
        for(var i= 0;i<100;i++) {
          data.push( [i*60, i+1] );
        }
        Utils.populateRealMetricsStore( {"foo.bar": {"data":data}, "foo.tar": {"data":data}}, function(err, store) {
          metricsStore= store;
          done(err);
        });
      });
      afterEach(function(done) {
        if( metricsStore ) rimraf( metricsStore.tree.root, done );
        else done();
      });
      it("should handle a basic (precision unaware) time slip into the past", function(done) {
        var metric=  "timeShift(foo.bar,\"-10min\")";
        // Look for 10 minutes +12s to 20minutes + 12s, timeshifted back by 10minutes
        var ctx= new TargetParseContext( metricsStore, metric, 612, 1212 );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                      assert.equal( result.length, 1 );
                      assert.deepEqual( result[0].data.values.length, 10 );
                      assert.equal( result[0].name, "timeShift(foo.bar,\"-10min\")" );

                      // The start + end times seem too far ahead for my liking, but it matches graphite's behaviour :/
                      assert.deepEqual( result[0].data.tInfo, [660, 1260, 60] );
                      assert.deepEqual( result[0].data.values, [2,3,4,5,6,7,8,9,10,11] );
                      done();
                    }).fail( function(err) {
                      done(err);
                    });
      });
      it("should handle a basic (precision unaware) time slip into the past [default to history when no sign present]", function(done) {
        var metric=  "timeShift(foo.bar,\"10min\")";
        var ctx= new TargetParseContext( metricsStore, metric, 612, 1212 );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                      assert.equal( result[0].name, "timeShift(foo.bar,\"10min\")" );
                      assert.deepEqual( result[0].data.tInfo, [660, 1260, 60] );
                      assert.deepEqual( result[0].data.values, [2,3,4,5,6,7,8,9,10,11] );
                      done();
                    }).fail( function(err) {
                      done(err);
                    });
      });
      it("should handle a basic (precision unaware) time slip into the future", function(done) {
        var metric=  "timeShift(foo.bar,\"+10min\")";
        var ctx= new TargetParseContext( metricsStore, metric, 612, 1212 );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                      assert.equal( result[0].name, "timeShift(foo.bar,\"+10min\")" );
                      assert.deepEqual( result[0].data.tInfo, [660, 1260, 60] );
                      assert.deepEqual( result[0].data.values, [22,23,24,25,26,27,28,29,30,31] );
                      done();
                    }).fail( function(err) {
                      done(err);
                    });
      });
      it("should handle a basic (precision unaware) time slip into the future for where we've not recorded any data yet.", function(done) {
        var metric=  "timeShift(foo.bar,\"+10min\")";
        var ctx= new TargetParseContext( metricsStore, metric, 30005, 30605 );
        TargetParser.parse( metric )(ctx)
                    .then(function (result) {
                      assert.equal( result[0].name, "timeShift(foo.bar,\"+10min\")" );
                      assert.deepEqual( result[0].data.tInfo, [30060, 30660, 60] );
                      assert.equal ( result[0].data.values.length, 10 );
                      for(var i=0;i<10;i++) {
                        assert.ok( typeof(result[0].data.values[i]) == 'undefined' || result[0].data.values[i] == null);
                      }
                      done();
                    }).fail( function(err) {
                      done(err);
                    });
      });
      //TODO: handle historic transitions over archive precision boundaries :/
    });
});