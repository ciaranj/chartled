if( typeof(Chartled) == 'undefined' ) Chartled = {};

Chartled.TimeKeeper = function( definition , chartles ) {
  this._deserialize( definition , chartles );
};

Chartled.TimeKeeper.prototype = {
  _deserialize: function( definition, chartles ) {
    // We do not really want TimeKeeper intances to be re-configured, so they deserialize function is 'private'
    this.clocks= [];
    this.nextClockId= 1;
    this._clockBuckets= {};
    this._knownChartleIds= {};
    if( definition ) {
      definition.sort( function(a,b) {
        if(!a.id || !b.id ) throw new Error("Clock provided with no Id!");
        return a.id - b.id;
      });
      for(var k in definition) {
        var clock= definition[k];
        this.addClock( clock );
        if( clock.chartleIds ) {
          for(var c in clock.chartleIds) {
            var chartleId= clock.chartleIds[c];
            var foundChartle= false;
            for( var x in chartles ) {
              if( chartles[x].id == chartleId ) {
                this.registerChartle(clock.id, chartles[x]);
                foundChartle= true;
                break;
              }
            }
            if(!foundChartle) throw new Error("Invalid Chartle Id referenced: '"+ chartleId +"'");
          }
        }
      }
    }
  },
  /* 
  Takes in the definition of a clock and returns an id that can be used to reference that clock
  from a chartle definition
  */
  addClock: function(clockDefinition) {
    if(!clockDefinition) clockDefinition= {};
    if(!clockDefinition.id) clockDefinition.id= this.nextClockId;
    else if( clockDefinition.id < this.nextClockId ) throw new Error( "Invalid (ordering) Clock Id specified: " + clockDefinition.id );

    var clock= new Chartled.Clock( clockDefinition );
    
    // If successfully parsed.
    var clockAndChartles= {
      "clock": clock,
      "chartles": []
    };
    this.clocks.push( clockAndChartles );
    if( clock.id >= this.nextClockId ) this.nextClockId= clock.id + 1;

    this._addClockToBucket( clockAndChartles );

    return clock.id;
  },

  _getClockAndChartle: function(idOrDescription) {
    var property = "id";
    var discriminator= Number(idOrDescription);
    if( isNaN(discriminator) ) {
      property= "description";
      discriminator= idOrDescription;
    }
    var result= null;
    for( var k in this.clocks ) {
      if( this.clocks[k].clock[property] == discriminator )  { 
        return this.clocks[k]
      }
    }
    throw new Error( "Unrecognised clock identifier: " + idOrDescription );
  },

  /*
  Retrieves a clock by id or description (throws an error if one is not found)
  */
  getClock: function(idOrDescription) {
    var foundClock= this._getClockAndChartle( idOrDescription ) ;
    return new Chartled.Clock( foundClock.clock.serialize() ) 
  },

  /*
  Returns a copy of the internal clock objects this TimeKeeper knows about.  Changes to 
  the returned list will have no affect on the running system.
  */
  getClocks: function() {
    var results= [];
    for(var k in this.clocks) {
      results.push( new Chartled.Clock( this.clocks[k].clock.serialize() ) );
    }
    return results;
  },
  
  /*
  Register a chartle against a given clock identifier.  If one is not present, an error will be thrown
  */
  registerChartle: function( clockId, chartle ) {
    // Chartle already registered
    if( this._knownChartleIds[chartle.id] ) {
          throw new Error("Chartle already registered, a chartle can only be registered against a single clock at a time.");
    }

    for( var k in this.clocks ) {
      if( this.clocks[k].clock.id == clockId ) {
        this.clocks[k].chartles.push( chartle );
        this._knownChartleIds[chartle.id] = true;
        if( chartle.addRefreshListener ) {
          chartle.addRefreshListener( this._buildRefresher( this.clocks[k].clock, chartle ) );
        }
        this._tick( this._clockBuckets[this.clocks[k].clock.refreshRate].clockAndChartles );
        return;
      }
    }
    throw new Error("Unrecognised clock identifier: " + clockId);
  },
  /*
  Un-registers a given chartleId.  If one is not found an error will not be thrown, and it will cheerfully ignore it.
  */
  unRegisterChartle: function( chartleId ) {
    var foundIt= false;
    for( var k in this.clocks ) {
      for( var j in this.clocks[k].chartles ) {
        if( this.clocks[k].chartles[j].id ==  chartleId ) {
          delete this.clocks[k].chartles[j]
          delete this._knownChartleIds[chartleId];
          foundIt= true;
          break;
        }
      }
      if( foundIt ) break;
    }
  },
  _buildRefresher: function(clock , chartle) {
    var that= this;
    return function() {
      that._processFetchQueue([{
        "chartle": chartle,
        "clock": clock
      }]);
    }
  },
  
  updateClock: function(clockId, clockDefinition) {
    var clockAndChartle= this._getClockAndChartle( clockId );
    var currentDefinition= clockAndChartle.clock.serialize();
    var oldRefresh= currentDefinition.refreshRate;
    // Because the refresh rate may change, we need to reflect this in the underlying data structures
    // We first remove it, then re-add it.  Downside is we'll leak timers for given refresh rate over time (if they remain unused)
    // Also we may remove and then re-add far more often than neccessary :(
    this._removeClockFromBucket( clockAndChartle );
    for( var k in clockDefinition ) {
      if( k != "id" ) {
        currentDefinition[k]= clockDefinition[k];
      }
    }

    // Update the clock definition.
    clockAndChartle.clock.deserialize( currentDefinition );
    this._addClockToBucket( clockAndChartle );

    var newRefresh= currentDefinition.refreshRate;
    if( oldRefresh == newRefresh ) {
      // Just update the chartles associated with this clock.
      this._tick( [clockAndChartle] );
    }
    else {
      // Update all chartles associated with this refresh rate.
      this._tick( this._clockBuckets[newRefresh].clockAndChartles );
    }
  },

  serialize: function() {
    var clocks= [];
    for( var k in this.clocks ) {
      var chartles= this.clocks[k].chartles;
      var newClock= this.clocks[k].clock.serialize();
      newClock.chartleIds= [];
      for( var j in chartles ) {
        newClock.chartleIds.push( chartles[j].id );
      }
      clocks.push( newClock );
    }
    return clocks;
  },

  _removeClockFromBucket: function( clockAndChartles ) {
    var refreshRate= clockAndChartles.clock.refreshRate;
    if(this._clockBuckets[refreshRate]) {
        var currentClockAndChartles = this._clockBuckets[refreshRate].clockAndChartles;
        var newClockAndChartles = [];
        for(var k in currentClockAndChartles) {
          if( currentClockAndChartles[k].clock.id != clockAndChartles.clock.id ) newClockAndChartles.push(currentClockAndChartles[k]);
        }
        this._clockBuckets[refreshRate].clockAndChartles= newClockAndChartles;
    }
  },

  _addClockToBucket: function( clockAndChartles ) {
    var that= this;
    // We 'link' clocks by their refresh rate so all clocks that refresh at rate X will
    // fetchdata at the same time (and will all update their displays when all the data for that
    // bucket has been retrieved)
    var refreshRate= clockAndChartles.clock.refreshRate;
    if(!that._clockBuckets[refreshRate]) {

      var timer= setInterval( function() {
        if(!that._disposed) {
          that._tick( that._clockBuckets[refreshRate].clockAndChartles );
        }
      }, refreshRate * 1000);
      that._clockBuckets[refreshRate]= {
        "clockAndChartles" : [],
        "timer"  : timer
      };
    }

    that._clockBuckets[refreshRate].clockAndChartles.push( clockAndChartles );
  },
  _tick: function( clockAndChartles ) {
    // A Queue of outstanding fetches:
    // { chartle: ..., clock: ...., fetched: true/undefined, updated: true/undefined, data: ..., err: }
    var fetchQueue=[];
    for(var k in clockAndChartles) {
      var clockAndChartle= clockAndChartles[k];
      for(var c in clockAndChartle.chartles) {
        if( clockAndChartle.chartles[c].update ) {
          fetchQueue.push({
            chartle: clockAndChartle.chartles[c],
            clock: clockAndChartle.clock
          });
        }
      }
    }
    this._processFetchQueue( fetchQueue );
  },

  _processFetchQueue: function( fetchQueue ) {
    var that= this;
  // Create a reaper
    setTimeout( function() {
      for(var k in fetchQueue) {
        if( !fetchQueue[k].fetched ) {
          fetchQueue[k].fetched= true;
          fetchQueue[k].err= new Error("Spent more than 10seconds fetching data");
        }
      }
      updateFetchedItems();
    }, 10000);

    function updateFetchedItems() {
      var allItemsProcessed= true;
      for(var k in fetchQueue) {
        if( !fetchQueue[k].fetched ) {
          allItemsProcessed= false;
          break;
        }
      }
      if( allItemsProcessed ) {
        for(var k in fetchQueue) {
          var fetchQueueItem= fetchQueue[k];
          if( !fetchQueueItem.updated && that._knownChartleIds[fetchQueueItem.chartle.id] === true) {
            fetchQueueItem.updated= true;
            try {
            
              fetchQueueItem.chartle.update( fetchQueueItem.err, fetchQueueItem.data );
            }
            catch(e) {
              // There was an error updating a chartle, this shouldn't stop the other chartles from
              // displaying. So we swallow it :/
            }
          }
        }
      }
    }

    for( var k in fetchQueue ) {
      this._processFetchQueueItem( fetchQueue[k], updateFetchedItems );
    }
  },

  _processFetchQueueItem: function( fetchQueueItem, updateFetchedItems ) {
      var chartle= fetchQueueItem.chartle;
      var clock= fetchQueueItem.clock;
      if( chartle.fetch ) {
        fetchQueueItem.fetched= false;
        chartle.fetch( clock, function(err, data) {
          fetchQueueItem.err= err;
          fetchQueueItem.data= data;
          fetchQueueItem.fetched= true;
          updateFetchedItems();
        });
      }
      else {
        fetchQueueItem.fetched= true;
        updateFetchedItems();
      }
  },

  dispose: function() {
    if(this._disposed) return;
    this._disposed= true;
    for(var k in this.clocks) {
      this.clocks[k].clock.dispose();
    }
    this.clocks= null;
    for(var k in this._clockBuckets) {
      clearInterval( this._clockBuckets[k].timer );
    }
    this._clockBuckets= null;
    this._knownChartleIds= null;
  }
};
