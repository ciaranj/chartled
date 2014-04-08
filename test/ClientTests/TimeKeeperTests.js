var   assert= require("assert")
    , sinon = require( "sinon" );


// Bring in the clientside JS globals.
require("../../public/javascripts/chartled/Clock");
require("../../public/javascripts/chartled/TimeKeeper");

describe('TimeKeeper', function(){
  var keeper;
  beforeEach(function() {
    keeper= new Chartled.TimeKeeper();
  });
  afterEach(function() {
    if( keeper ) keeper.dispose();
  });
  describe("addClock", function() {
    it("should add new clock definitions", function() {
      assert.equal( 1, keeper.addClock( {}) );
      assert.equal( 2, keeper.addClock( {}) );
      assert.equal( 3, keeper.addClock( {}) );
      var knownClocks= keeper.getClocks();
      assert.equal(3, knownClocks.length );
      assert.equal(1, knownClocks[0].id);
      assert.equal(2, knownClocks[1].id);
      assert.equal(3, knownClocks[2].id);
    });

    it("should use the provided clock id if higher than the current highest clock id", function() {
      assert.equal( 1, keeper.addClock( {}) );
      assert.equal( 10, keeper.addClock( {id:10}) );
      assert.equal( 11, keeper.addClock( {}) );
    });
    it("should throw an error if the provided clock id is lower than or equal to the ", function() {
      assert.equal( 1, keeper.addClock( {}) );
      assert.throws( function() { 
        keeper.addClock( {id:1}) 
      }, /Invalid \(ordering\) Clock Id specified/ );
    });

    it("Should group clock instances by their refreshrate (test accesses private data :/)", function() {
      keeper.addClock( {refreshRate: 30} );
      keeper.addClock( {refreshRate: 30} );
      keeper.addClock( {refreshRate: 40} );
      keeper.addClock( {refreshRate: 45} );
      keeper.addClock( {refreshRate: 45} );
      keeper.addClock( {refreshRate: 50} );
      assert.equal( keeper._clockBuckets[30].clockAndChartles.length, 2);
      assert.equal( keeper._clockBuckets[40].clockAndChartles.length, 1);
      assert.equal( keeper._clockBuckets[45].clockAndChartles.length, 2);
      assert.equal( keeper._clockBuckets[50].clockAndChartles.length, 1);
      keeper.dispose();
      assert.equal( null, keeper._clockBuckets );
    });

    it("Should cause periodic calls to the _tick method based on the refresh rate.", function() {
      var clock = sinon.useFakeTimers();
      var mock= sinon.mock(keeper).expects("_tick").exactly(6);
      keeper.addClock( {refreshRate: 5} );
      clock.tick(15000);
      clock.tick(15000);
      mock.verify();
      clock.restore();
    });
  });
  describe("getClock", function() {
    it("should retrieve a clock by an id", function() {
      var clock1= {id:1, refreshRate:30, from:'a', until:'b', description:'d'};
      var clock2= {id:2, refreshRate:30, from:'c', until:'z', description:'e', timeZone:'Europe/London'};
      var clock3= {id:3, refreshRate:30, from:'c', until:'z', description:'2'};
      keeper.addClock(clock1 );
      keeper.addClock(clock2);
      keeper.addClock(clock3);
      assert.deepEqual( keeper.getClock(2), clock2 );
      assert.deepEqual( keeper.getClock("2"), clock2 ); // Treat strings that parse as numbers as ids, not descriptions (could be cleverer and check both!)
    });
    it("should retrieve a clock by a description", function() {
      var clock1= {id:1, refreshRate:30, from:'a', until:'b', description:'d'};
      var clock2= {id:2, refreshRate:30, from:'c', until:'z', description:'e', timeZone:'Europe/London'};
      keeper.addClock(clock1 );
      keeper.addClock(clock2);
      assert.deepEqual( keeper.getClock("e"), clock2 );
    });
    it("should throw an error if an invalid clock was requested", function() {
      keeper.addClock( {id:1, from:'a', until:'b', description:'d'});
      keeper.addClock( {id:2, from:'c', until:'z', description:'e'});
      assert.throws( function() { keeper.getClock(99); } , /Unrecognised clock/);
      assert.throws( function() { keeper.getClock("x"); } , /Unrecognised clock/);
    });
  });
  describe("getClocks", function() {
    it("should return the list of clocks that were added", function() {
      keeper.addClock( {} );
      keeper.addClock( {} );
      keeper.addClock( {} );
      var knownClocks= keeper.getClocks();
      assert.equal(3, knownClocks.length );
      assert.equal(1, knownClocks[0].id);
      assert.equal(2, knownClocks[1].id);
      assert.equal(3, knownClocks[2].id);      
    });
    it("should return lists of clocks who's changes do not affect the running timekeeper", function() {
      assert.equal( 1, keeper.addClock( {}) );
      var clocks= keeper.getClocks();
      // Different collections returned.
      assert.notEqual( keeper.getClocks(), keeper.getClocks() );
      // But same property values
      assert.deepEqual( clocks, keeper.getClocks() );
      // If a property is changed on an item, they will no longer be the same.
      clocks[0].refreshRate= -1;
      assert.notDeepEqual( clocks, keeper.getClocks() );
    });
  });
  describe("dispose", function() {
    it("Should also dispose any internal clock instances", function() {
      var keeper= new Chartled.TimeKeeper();
      sinon.spy(Chartled.Clock.prototype, 'dispose');
      try{
        assert.equal( 1, keeper.addClock( {}) );
        assert.equal( 2, keeper.addClock( {}) );
        keeper.dispose();
        assert.equal( keeper.getClocks().length, 0 );
        assert( Chartled.Clock.prototype.dispose.calledTwice );
        assert.equal( keeper._clockBuckets, null );
      }
      finally{ 
        Chartled.Clock.prototype.dispose.restore();
      }
    });
    it("Should stop calls to the _tick method after a disposal.", function() {
      var clock = sinon.useFakeTimers();
      var mock= sinon.mock(keeper).expects("_tick").thrice();
      keeper.addClock( {refreshRate: 5} );
      clock.tick(15000);
      keeper.dispose();
      clock.tick(15000);
      mock.verify();
      assert.deepEqual( clock.timeouts, {} );
      clock.restore();
    });
  });
  describe("updateClock", function() {
    it("should throw an error if an invalid clock id was specified ", function() {
      keeper.addClock({});
      assert.throws( function() {keeper.updateClock({id:2}); }, /Unrecognised clock/);
    });
  });
  describe("updateClock", function() {
    it("should update a clock to the new details", function() {
      keeper.addClock({id:5, refreshRate:5, from:"a", until:"b", description:""});
      keeper.updateClock(5, {refreshRate:6});
      assert.deepEqual( keeper.getClock(5), {id:5, refreshRate:6, from:"a", until:"b", description:"", timeZone:'Europe/London'} );
      keeper.updateClock(5, {refreshRate:10, until:"c"});
      assert.deepEqual( keeper.getClock(5), {id:5, refreshRate:10, from:"a", until:"c", description:"", timeZone:'Europe/London'} );
      keeper.updateClock(5, {from:"b"});
      assert.deepEqual( keeper.getClock(5), {id:5, refreshRate:10, from:"b", until:"c", description:"", timeZone:'Europe/London'} );
    });
    it("should adjust to a change in refreshRate", function() {
      var clock = sinon.useFakeTimers();
      var clockId= keeper.addClock({id:5, refreshRate:5, from:"a", until:"b", description:""});
      var myChartle1= { cnt: 0, fetch: function(clk) { this.cnt++; }, update: function() {}};
      keeper.registerChartle( clockId, myChartle1 );
      assert.equal( myChartle1.cnt, 1);
      clock.tick(10000);
      assert.equal( myChartle1.cnt, 3); // Gone up by 2 as the refresh was 5s.
      keeper.updateClock(5, {refreshRate:20, until:"c"});
      assert.equal( myChartle1.cnt, 4); // Gone up by one due to a refreshRate change.
      clock.tick(10000);
      assert.equal( myChartle1.cnt, 4); // Not gone up as the new refresh of 20s hasn't passed yet.
      clock.tick(10000);
      assert.equal( myChartle1.cnt, 5); // Now gone up by 1 as it is 20s since we changed the refresh rate.
      clock.restore();
    });
    it("should only (immediately) update the chartles associated with the updated clock If the refresh rate hasn't changed.", function() {
      var clock = sinon.useFakeTimers();
      // 2 Clocks, same refresh rate.
      var clockId1= keeper.addClock({refreshRate:5, from:"a", until:"b-1", description:"1"});
      var clockId2= keeper.addClock({refreshRate:5, from:"a", until:"b+3", description:"2"});
      // 1 clock with a different refresh rate.
      var clockId3= keeper.addClock({refreshRate:10, from:"a", until:"b+3", description:"2"});
      
      // 
      var myChartle1= { id:1, cnt: 0, fetch: function(clk) { this.cnt++; }, update: function() {}};
      var myChartle1b= { id:2, cnt: 0, fetch: function(clk) { this.cnt++; }, update: function() {}};
      keeper.registerChartle( clockId1, myChartle1 );
      keeper.registerChartle( clockId1, myChartle1b );

      var myChartle2= { id:3, cnt: 0, fetch: function(clk) { this.cnt++; }, update: function() {}};
      keeper.registerChartle( clockId2, myChartle2 );

      var myChartle3= { id:4, cnt: 0, fetch: function(clk) { this.cnt++; }, update: function() {}};
      keeper.registerChartle( clockId3, myChartle3 );

      assert.equal( myChartle1.cnt, 3 );
      assert.equal( myChartle1b.cnt, 2 );
      assert.equal( myChartle2.cnt, 1 );
      assert.equal( myChartle3.cnt, 1 );
      clock.tick(10000);
      assert.equal( myChartle1.cnt, 5 );
      assert.equal( myChartle1b.cnt, 4 );
      assert.equal( myChartle2.cnt, 3 );
      assert.equal( myChartle3.cnt, 2 );

      // Update clock1's range.
      keeper.updateClock(clockId1, {until:"c"});

      // As the refreshrate hasn't changed, only chartle 1 + 1b should experience an immediate update
      assert.equal( myChartle1.cnt, 6 );
      assert.equal( myChartle1b.cnt, 5 );
      assert.equal( myChartle2.cnt, 3 );
      assert.equal( myChartle3.cnt, 2 );

      clock.tick(10000);
      assert.equal( myChartle1.cnt, 8 );
      assert.equal( myChartle1b.cnt, 7 );
      assert.equal( myChartle2.cnt, 5 );
      assert.equal( myChartle3.cnt, 3 );
      clock.restore();
    });
    it("should immediately update the chartles associated with the updated clock and any other clocks in the new refresh rate, if the refresh rate has changed.", function() {
      // The plan is to make sure all chartles that share the same refresh are linked, and if a new chartle enters a refrsh period
      // we have 2 choicse; 1) Wait until the next firing of that period  or 2) Force an immediate refresh that may or not be too soon before, or after a previous refresh
      // (there is a 3rd choice of immediately refresh the new chartle and leave the other alone , but that would leave them un-linked)
      // I've gone with choice 2) which potentially will cause un-neccessary refreshes but will lead to a better feeling of immediacy
      var clock = sinon.useFakeTimers();
      // 2 Clocks, same initial refresh rate.
      var clockId1= keeper.addClock({refreshRate:5, from:"a", until:"b-1", description:"1"});
      var clockId2= keeper.addClock({refreshRate:5, from:"a", until:"b+3", description:"2"});
      // 1 clock with a different refresh rate.
      var clockId3= keeper.addClock({refreshRate:10, from:"a", until:"b+3", description:"2"});
      
      // 
      var myChartle1= { id:1, cnt: 0, fetch: function(clk) { this.cnt++; }, update: function() {}};
      var myChartle1b= { id:2, cnt: 0, fetch: function(clk) { this.cnt++; }, update: function() {}};
      keeper.registerChartle( clockId1, myChartle1 );
      keeper.registerChartle( clockId1, myChartle1b );

      var myChartle2= { id:3, cnt: 0, fetch: function(clk) { this.cnt++; }, update: function() {}};
      keeper.registerChartle( clockId2, myChartle2 );

      var myChartle3= { id:4, cnt: 0, fetch: function(clk) { this.cnt++; }, update: function() {}};
      keeper.registerChartle( clockId3, myChartle3 );

      assert.equal( myChartle1.cnt, 3 );
      assert.equal( myChartle1b.cnt, 2 );
      assert.equal( myChartle2.cnt, 1 );
      assert.equal( myChartle3.cnt, 1 );
      clock.tick(10000);
      assert.equal( myChartle1.cnt, 5 );
      assert.equal( myChartle1b.cnt, 4 );
      assert.equal( myChartle2.cnt, 3 );
      assert.equal( myChartle3.cnt, 2 );

      // Update clock1's refresh rate to be the same as clock3.
      keeper.updateClock(clockId1, {refreshRate:10});

      // As the refreshrate has changed, only those clocks with the old refresh rate will be unchanged(clock2)
      assert.equal( myChartle1.cnt, 6 );
      assert.equal( myChartle1b.cnt, 5 );
      assert.equal( myChartle2.cnt, 3 );
      assert.equal( myChartle3.cnt, 3 );

      clock.tick(10000);
      assert.equal( myChartle1.cnt, 7 );
      assert.equal( myChartle1b.cnt, 6 );
      assert.equal( myChartle2.cnt, 5 );
      assert.equal( myChartle3.cnt, 4 );
      clock.tick(10000);
      assert.equal( myChartle1.cnt, 8 );
      assert.equal( myChartle1b.cnt, 7 );
      assert.equal( myChartle2.cnt, 7 );
      assert.equal( myChartle3.cnt, 5 );
      clock.restore();
    });
  });
  describe("unRegisterChartle", function() {
    it("should remove the specified chartle", function() {
      keeper.addClock({description:'a'});
      keeper.registerChartle(1, {id:5});
      assert.deepEqual( keeper.serialize(), [{"id":1, "refreshRate":30, "from":"-24hours", "until":"now", "chartleIds":[5], "description":"a", timeZone:'Europe/London'}] );
      keeper.unRegisterChartle(5);
      assert.deepEqual( keeper.serialize(), [{"id":1, "refreshRate":30, "from":"-24hours", "until":"now", "chartleIds":[], "description":"a", timeZone:'Europe/London'}] );
    });
    it("should stop fetches for the specified chartle if it is unregistered prior to a fetch+update cycle", function() {
      var clock = sinon.useFakeTimers();
      try {
        keeper.addClock({id:1, description:'a', refreshRate:2});
        var fetchCnt= 0;
        var updateCnt= 0;
        var myChartle= { id:5, cnt: 0, 
          fetch: function(clk, cb) { 
              fetchCnt++;
              cb();
          }, 
          update: function() {
              updateCnt++;
          }};
        keeper.registerChartle(1, myChartle);

        // Registering 
        assert.equal( fetchCnt, 1 );
        assert.equal( updateCnt, 1 );
      
        clock.tick(4000);
        assert.equal( fetchCnt, 3 );
        assert.equal( updateCnt, 3 );
        keeper.unRegisterChartle(myChartle.id);
        clock.tick(4000);
        // Unregistered chartle shouldn't fire.
        assert.equal( fetchCnt, 3 );
        assert.equal( updateCnt, 3 );
      }
      finally {
        clock.restore();
      }
    });
    it("should stop fetches for the specified chartle if it is unregistered after a fetch but before an update", function() {
      var clock = sinon.useFakeTimers();
      try {
        keeper.addClock({id:1, description:'a', refreshRate:2});
        var fetchCnt= 0;
        var updateCnt= 0;
        var myChartle= { id:5, cnt: 0, 
          fetch: function(clk, cb) { 
              fetchCnt++;
              // split the fetch+update into 'async' blocks to allow an unregister midway between fetch + update.
              setTimeout(cb, 1000);
          }, 
          update: function() {
              updateCnt++;
          }};
        keeper.registerChartle(1, myChartle);

        // Registering 
        assert.equal( fetchCnt, 1 );
        assert.equal( updateCnt, 0 );
        clock.tick(1000);
        assert.equal( fetchCnt, 1 );
        assert.equal( updateCnt, 1 );

        // First cycle.
        clock.tick(1000);
        assert.equal( fetchCnt, 2 );
        assert.equal( updateCnt, 1 );
        clock.tick(1000);
        assert.equal( fetchCnt, 2 );
        assert.equal( updateCnt, 2 );

        // Let the fetch happen, but then unregister the chartle.
        clock.tick(1000);
        assert.equal( fetchCnt, 3 );
        keeper.unRegisterChartle(myChartle.id);
        clock.tick(1000);
        // Unregistered chartle shouldn't ever fire the update
        assert.equal( fetchCnt, 3 );
        assert.equal( updateCnt, 2 );
      }
      finally {
        clock.restore();
      }
    });
  });
 
  describe("registerChartle", function() {
    it("should throw an error if an invalid clock id was specified (missing id)", function() {
      keeper.addClock({});
      assert.throws( function() {keeper.registerChartle(12, {}); }, /Unrecognised clock/);
    });
    it("should throw an error if an invalid clock id was specified (no clocks)", function() {
      assert.throws( function() {keeper.registerChartle(1, {}); }, /Unrecognised clock/);
    });
    it("should throw an error if the same chartle is already  registered (against the same clock)", function() {
      keeper.addClock({});
      keeper.addClock({});
      var chartle= {};
      keeper.registerChartle( 1, chartle );
      assert.throws( function() {keeper.registerChartle( 1, chartle ); }, /Chartle already registered/);
    });
    it("should throw an error if the same chartle is already registered (against any clock)", function() {
      keeper.addClock({});
      keeper.addClock({});
      var chartle= {};
      keeper.registerChartle( 1, chartle );
      assert.throws( function() {keeper.registerChartle( 2, chartle ); }, /Chartle already registered/);
    });
    it("should call fetchData for the registered chartles at the right time", function() {
      var myChartle1= { id:1, cnt: 0, fetch: function(clk) { assert.equal(clk.refreshRate, 2); assert.equal(clock.now%2, 0); this.cnt++; }, update: function() {}};
      var myChartle2= { id:2, cnt: 0, fetch: function(clk) { assert.equal(clk.refreshRate, 5); assert.equal(clock.now%5, 0); this.cnt++; }, update: function() {} };
      var myChartle3= { id:3, cnt: 0, fetch: function(clk) { assert.equal(clk.refreshRate, 5); assert.equal(clock.now%5, 0); this.cnt++; }, update: function() {} };
      var clock = sinon.useFakeTimers();
      var clockId= keeper.addClock({refreshRate:2});
      var clockId2= keeper.addClock({refreshRate:5});
      keeper.registerChartle( clockId, myChartle1 );
      keeper.registerChartle( clockId2, myChartle2 );
      keeper.registerChartle( clockId2, myChartle3 );
      assert.equal( myChartle1.cnt, 1);
      assert.equal( myChartle2.cnt, 2);
      assert.equal( myChartle3.cnt, 1);
      clock.tick(10000);
      clock.restore();
      assert.equal( myChartle1.cnt, 6);
      assert.equal( myChartle2.cnt, 4);
      assert.equal( myChartle3.cnt, 3);
    });
    it("should call fetchData for the registered chartles at the right time, ignoring errors caused by the update function", function() {
      var myChartle1= { id:1, cnt: 0, fetch: function(clk) { assert.equal(clk.refreshRate, 2); assert.equal(clock.now%2, 0); this.cnt++; }, update: function() {}};
      var myChartle2= { id:2, cnt: 0, fetch: function(clk) { assert.equal(clk.refreshRate, 5); assert.equal(clock.now%5, 0); this.cnt++; }, update: function() { throw new Error("SHOULD NOT BREAK THINGS"); } };
      var myChartle3= { id:3, cnt: 0, fetch: function(clk) { assert.equal(clk.refreshRate, 5); assert.equal(clock.now%5, 0); this.cnt++; }, update: function() {} };
      var clock = sinon.useFakeTimers();
      var clockId= keeper.addClock({refreshRate:2});
      var clockId2= keeper.addClock({refreshRate:5});
      keeper.registerChartle( clockId, myChartle1 );
      keeper.registerChartle( clockId2, myChartle2 );
      keeper.registerChartle( clockId2, myChartle3 );
      assert.equal( myChartle1.cnt, 1);
      assert.equal( myChartle2.cnt, 2);
      assert.equal( myChartle3.cnt, 1);
      clock.tick(10000);
      clock.restore();
      assert.equal( myChartle1.cnt, 6);
      assert.equal( myChartle2.cnt, 4);
      assert.equal( myChartle3.cnt, 3);
    });	
    it("should immediately update the chartles associated with the updated clock and any other clocks in the current refresh rate", function() {
      var clock = sinon.useFakeTimers();
      // 2 Clocks, same initial refresh rate.
      var clockId1= keeper.addClock({refreshRate:5, from:"a", until:"b-1", description:"1"});
      var clockId2= keeper.addClock({refreshRate:5, from:"a", until:"b+3", description:"2"});
      // 1 clock with a different refresh rate.
      var clockId3= keeper.addClock({refreshRate:10, from:"a", until:"b+3", description:"2"});
      

      var myChartle2= { id:3, cnt: 0, fetch: function(clk) { this.cnt++; }, update: function() {}};
      var myChartle1= { id:1, cnt: 0, fetch: function(clk) { this.cnt++; }, update: function() {}};
      var myChartle1b= { id:2, cnt: 0, fetch: function(clk) { this.cnt++; }, update: function() {}};
      var myChartle3= { id:4, cnt: 0, fetch: function(clk) { this.cnt++; }, update: function() {}};

      keeper.registerChartle( clockId3, myChartle3 );
      assert.equal(0, myChartle1.cnt ); 
      assert.equal(0, myChartle1b.cnt ); 
      assert.equal(0, myChartle2.cnt );
      assert.equal(1, myChartle3.cnt ); // goes straight to 1 on initial registration.

      keeper.registerChartle( clockId2, myChartle2 );
      assert.equal(0, myChartle1.cnt ); 
      assert.equal(0, myChartle1b.cnt ); 
      assert.equal(1, myChartle2.cnt ); // goes straight to 1 on initial registration.
      assert.equal(1, myChartle3.cnt );

      keeper.registerChartle( clockId1, myChartle1 );
      assert.equal(1, myChartle1.cnt ); // goes straight to 1 on initial registration.
      assert.equal(0, myChartle1b.cnt ); 
      assert.equal(2, myChartle2.cnt );  // Incremented as the same refresh rate
      assert.equal(1, myChartle3.cnt );
      
      keeper.registerChartle( clockId1, myChartle1b );
      assert.equal(2, myChartle1.cnt ); // Gets increment as belonging to the same clock
      assert.equal(1, myChartle1b.cnt ); // goes straight to 1 on initial registration.
      assert.equal(3, myChartle2.cnt ); // Gets increment as belonging to the same clock
      assert.equal(1, myChartle3.cnt ); 

      clock.tick(10000);
      assert.equal(4, myChartle1.cnt );
      assert.equal(3, myChartle1b.cnt );
      assert.equal(5, myChartle2.cnt ); 
      assert.equal(2, myChartle3.cnt );
      clock.restore();
    });
    it("should provide the chartle with a refresh callback that when called triggers an immediate (non-latched) fetch-update cycle", function() {
      var clock = sinon.useFakeTimers();
      // 2 Clocks, same initial refresh rate.
      var clockId1= keeper.addClock({refreshRate:5, from:"a", until:"b-1", description:"1"});

      var refreshFunction = null;
      var myChartle1= { id:1, cnt: 0, addRefreshListener: function(refresher) { refreshFunction= refresher;}, fetch: function(clk, cb) { assert.notEqual(clk, null); this.cnt++; cb();}, update: function() {this.cnt++;}};
      keeper.registerChartle( clockId1, myChartle1 );
      assert.notEqual( refreshFunction , null);
      assert.equal( myChartle1.cnt, 2); // 1 fetch-update cycle occurs on initial registration.
      refreshFunction();
      assert.equal( myChartle1.cnt, 4); // refresh forces a fetch-update cycle.
      assert.equal( clock.now, 0);
      clock.tick(5000);
      assert.equal( myChartle1.cnt, 6); // Tick causes a fetch-update cycle.
      clock.restore();
    });
  });
  describe("deserialize (actually an internal method called from the 'constructor')", function() {
    it("Should create an empty time keeper if no definition is passed", function() {
        keeper._deserialize( null, [{id:10}, {id:11}] );
        assert.deepEqual( keeper.serialize(), []);
    });
    it("Should throw an error if presented with a clock that has no id.", function() {
        assert.throws( function(){ keeper._deserialize([{},{}]) }, /Clock provided with no Id/);
    });
    it("Should throw an error if presented with a chartle id, but no matching chartle.", function() {
        assert.throws( function(){
          keeper._deserialize( [{"id":1, "refreshRate":30, "from":"a", "until":"b", "description":"a", "chartleIds":[1,2]}], [] );
        }, /Invalid Chartle Id/);
        assert.throws( function(){
          keeper._deserialize( [{"id":1, "refreshRate":30, "from":"a", "until":"b", "description":"a", "chartleIds":[1,2]}], [{id:9}] );
        }, /Invalid Chartle Id/);
    });
    it("Should create a time keeper with chartles and register them correctly.", function() {
        var clock1= {"id":1, "refreshRate":30, "from":"a", "until":"b", "description":"a", "chartleIds":[1,2]};
        var chartle1 = { cnt:0, "id": 1, update: function() {this.cnt++;}  };
        var chartle2 = { cnt:0, "id": 2, update: function() {this.cnt++;}  };
        keeper._deserialize( [clock1], [chartle1, chartle2] );
        //TODO: This is two because the registration of each chartle caused the first chartle to refresh twice.. bulk registration/deserialiseation
        // should not do this, will fix asap.
        assert.equal(chartle1.cnt, 2); 

        assert.equal(chartle2.cnt, 1);
        assert.deepEqual( keeper.serialize(), [{"id":1, "refreshRate":30, "from":"a", "until":"b", "chartleIds":[1,2], "description":"a", timeZone:'Europe/London'}] );
    });

    it("Should create a time keeper with no chartles if no chartles are passed", function() {
        keeper._deserialize( [{"id":1, "refreshRate":30, "from":"a", "until":"b", "description":"a"},
                                               {"id":2, "refreshRate":30, "from":"a", "until":"b", "description":"b"}] );

        assert.deepEqual( keeper.serialize(), [{"id":1, "refreshRate":30, "from":"a", "until":"b", chartleIds:[], "description":"a", timeZone:'Europe/London'}, 
                                                {"id":2, "refreshRate":30, "from":"a", "until":"b", chartleIds:[], "description":"b", timeZone:'Europe/London'}]);
    });
    it("Should create a time keeper re-ordering clocks by id if necessary", function() {
        keeper._deserialize( [{"id":2, "refreshRate":30, "from":"a", "until":"b", "description":"b"},
                              {"id":1, "refreshRate":30, "from":"a", "until":"b", "description":"a"}] );

        assert.deepEqual( keeper.serialize(), [{"id":1, "refreshRate":30, "from":"a", "until":"b", chartleIds:[], "description":"a", timeZone:'Europe/London'}, 
                                                {"id":2, "refreshRate":30, "from":"a", "until":"b", chartleIds:[], "description":"b", timeZone:'Europe/London'}]);
    });
    it("Should create a time keeper and register any relevant associated chartles", function() {
        var chartle= {id:9};
        var mock= sinon.mock( keeper );
        mock.expects("registerChartle").once().withArgs( 2, chartle );
        keeper._deserialize( [{"id":2, "refreshRate":30, "from":"a", "until":"b", chartleIds:[9]}], [chartle] );
        mock.verify();
    });
  });
  describe("serialize", function() {
    it("should produce an array of clocks and their associated chartle ids", function() {
      var clockId= keeper.addClock({from: "now-1d", until: "now", refreshRate:30, description:"a"});
      keeper.registerChartle(clockId, {id: 4});
      keeper.registerChartle(clockId, {id: 5});
      assert.deepEqual( keeper.serialize(), [{
        "id": 1,
        "from": "now-1d",
        "until": "now",
        "refreshRate": 30,
        "chartleIds": [4,5],
        "description": "a",
        "timeZone":"Europe/London"
      }] );
    });
    it("should produce an array of clocks and their associated chartle ids (no chartles)", function() {
      var clockId= keeper.addClock({from: "now-1d", until: "now", refreshRate:30, description:"a"});
      assert.deepEqual( keeper.serialize(), [{
        "id": 1,
        "from": "now-1d",
        "until": "now",
        "refreshRate": 30,
        "chartleIds": [],
        "description": "a",
        "timeZone":"Europe/London"
      }] );
    });
    it("should produce an empty array if no clocks defined", function() {
      assert.deepEqual( keeper.serialize(), [] );
    });
  });
  describe("Ticks", function() {
    it("should call the chartle's update method with the value returned from fetchData", function() {
      var callBackCnt= 0;
      var myChartle1= { id:1, fetch: function(clk, cb) {  assert.equal(clk.refreshRate, 1); cb(null, 1); }, update: function(err, data) {  callBackCnt++; assert.equal(data, 1); } };
      var myChartle2= { id:2, fetch: function(clk, cb) {  assert.equal(clk.refreshRate, 1); cb(null, 2); }, update: function(err, data) {  callBackCnt++; assert.equal(data, 2); }  };
      var clock = sinon.useFakeTimers();
      var clockId= keeper.addClock({refreshRate:1});
      keeper.registerChartle( clockId, myChartle1 );
      assert.equal( callBackCnt,  1 );
      keeper.registerChartle( clockId, myChartle2 );
      assert.equal( callBackCnt,  3); // both chartles got refreshed so the callback goes up twice here.
      clock.tick(1000);
      assert.equal( callBackCnt,  5);
      clock.restore();
    });
    it("should still call the chartle's update method with no value even if fetchData is not defined.", function() {
      var callBackCnt= 0;
      var myChartle1= { update: function(err, data) {  callBackCnt++; assert.equal(typeof(data), 'undefined'); assert.equal(typeof(err), 'undefined');} };
      var clock = sinon.useFakeTimers();
      var clockId= keeper.addClock({refreshRate:1});
      keeper.registerChartle( clockId, myChartle1 );
      assert.equal( callBackCnt , 1 );
      clock.tick(1000);
      assert.equal( callBackCnt , 2 );
      clock.restore();
    });
    it("should ignore chartles that lack update methods.", function() {
      var callBackCnt= 0;
      var myChartle1= { fetch: function(clk, cb) {  callBackCnt++; } };
      var clock = sinon.useFakeTimers();
      var clockId= keeper.addClock({refreshRate:1});
      keeper.registerChartle( clockId, myChartle1 );
      clock.tick(1000);
      assert.equal( callBackCnt , 0 );
      clock.restore();
    });
    it("should wait for all fetches to complete before calling any of the updates (aligning refreshes) [single clock against the same refresh rate]", function() {
      var clock = sinon.useFakeTimers();
      var order= 0;
      var testing= false;
      var myChartle1= { 
        id: 1,
        fetch: function(clk, cb) {
          if( testing ) {
            // Expect this chartle to be fetched first, but will return data last.
            assert.equal(clock.now, 1000 );
            assert.equal(++order, 1 );
            setTimeout( function() {
              assert.equal(clock.now, 1500 );
              assert.equal(++order, 4 );
              cb( null, 1 );
            }, 500 );
          } else  { cb(null,1); } // Registration.
        },
        update: function(err, data) {
          if( testing ) {
            // Expect update to occur at the same time as the other chartle.
            assert.equal(clock.now, 1500);
            assert( order > 4 );
          }
        } 
      };
      var myChartle2= { 
        id: 2,
        fetch: function(clk, cb) {
          if( testing ) {
            // Expect this chartle to be fetched second, but will return data first.
            assert.equal(clock.now, 1000 );
            assert.equal(++order, 2 );
            setTimeout( function() {
                assert.equal(clock.now, 1010 );
                assert.equal(++order, 3);
                cb( null, 2 );
            }, 10 );
          }
          else { cb( null ,2 ); } // registration
        },
        update: function(err, data) {
          if( testing ) {
            // Expect update to occur at the same time as the other chartle.
            assert.equal(clock.now, 1500);
            assert( order > 4 );
          }
        } 
      };
      var clockId= keeper.addClock({refreshRate:1});
      keeper.registerChartle( clockId, myChartle1 );
      keeper.registerChartle( clockId, myChartle2 );
      testing= true; // Flip the chartles into 'test' mode
      clock.tick(1000); // Should have done instatiated both fetches (but neither have returned yet );
      assert.equal( order, 2);
      clock.tick(10); // Should have had chartle 2 return 
      assert.equal( order, 3);
      clock.restore();
    });
    it("should abandon fetches that take more than 10 seconds, and ignore those fetches when (if) they eventually complete.", function() {
      var clock = sinon.useFakeTimers();
      var clockId= keeper.addClock({refreshRate:30});
      var fetchCalled= false;
      var updateCalled= false;
      var testing= false;
      var delayedFetchHappened= false;
      var myChartle1= { 
        id: 1,
        fetch: function(clk, cb) {
          if( testing ) {
            fetchCalled = true;
            // Calls back *AFTER* 10 seconds, bad chartle.
            setTimeout( function() {
              cb(null, 2);
              delayedFetchHappened= true;
            }, 20000);
          } else  { cb(null,1); } // Registration.
        },
        update: function(err, data) {
          if( testing ) {
            // Expect update to occur at the same time as the other chartle.
            updateCalled= true;
            assert(err != null && err != undefined);
            assert(data == null || data == undefined);
          }
        } 
      };      
      keeper.registerChartle( clockId, myChartle1 );
      assert.equal( fetchCalled, false );
      assert.equal( updateCalled, false );
      testing= true;
      clock.tick(30000);
      assert.equal( fetchCalled, true );
      assert.equal( updateCalled, false ); // Fetch hasn't called back yet (it will never.
      clock.tick(9999);
      assert.equal( fetchCalled, true );
      assert.equal( updateCalled, false ); // Fetch hasn't called back yet (it will never.
      clock.tick(1);
      assert.equal( fetchCalled, true );
      assert.equal( updateCalled, true );
      clock.tick(10000); // The original fetch should call back now, but because it has been cancelled the update will never fire..
      assert.equal( delayedFetchHappened, true ); // Just to prove the delayed fetch returned, late.  The assertions in update will fall over if that data actually hits it.
      clock.restore();
    });
  });
});