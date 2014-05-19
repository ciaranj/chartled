Chartled.ClockChartle = function( definition, el, baseUrl ) {
  Chartled.DashingChartle.call( this, definition, el, baseUrl );
};

Chartled.inheritPrototype(Chartled.ClockChartle, Chartled.DashingChartle, {
  initialize: function( definition )  {
    if( typeof(definition.backgroundColorClass) == 'undefined' ) definition.backgroundColorClass= 'chartled-color-1';
    if( typeof(definition.backgroundIcon) == 'undefined' ) definition.backgroundIcon= 'clock-o';
    if( typeof(definition.displayUpdatedAt) == 'undefined' ) definition.displayUpdatedAt= false;
    definition.title= "";
    this._timeZone= definition.timeZone;
    this._resized= false;
    Chartled.DashingChartle.prototype.initialize.call(this, definition);
    this.set_title("");
  },
  _tzEnabled: function() {
    return (typeof(moment) != 'undefined' && typeof(moment.tz) != 'undefined');
  },
  fetch: null,
  update: function() {
    var now = new Date();
    // If the moment timezone library is loaded *AND* timezone has been explicitly set
    if( this._tzEnabled() && this._timeZone != "" && typeof(this._timeZone) != 'undefined' ) {
      var m= moment(now).tz(this._timeZone);
      var timeString= m.format("hh:mm:ss A");
      var dateString= m.format("ddd MMM DD YYYY");
    }
    else {
      var timeString= now.toLocaleTimeString();
      var dateString= now.toDateString();
    }

    d3.select(this._titleEl)
      .select("span")
      .text(dateString);    
    d3.select(this.valueEl)
      .select("span")
      .text(timeString);

    if(!this._resized) {
     this._resizeValue();
     this._resized= true;
    }
  },
  serialize: function() {
    var o= Chartled.DashingChartle.prototype.serialize.call(this);

    if( typeof(this._timeZone) != 'undefined' ) o.timeZone= this._timeZone;
    return o;
  },
});
