Chartled.ClockChartle = function( definition, el, baseUrl ) {
  Chartled.DashingChartle.call( this, definition, el, baseUrl );
};

Chartled.inheritPrototype(Chartled.ClockChartle, Chartled.DashingChartle, {
  initialize: function( definition )  {
    if( typeof(definition.backgroundColorClass) == 'undefined' ) definition.backgroundColorClass= 'chartled-color-1';
    if( typeof(definition.backgroundIcon) == 'undefined' ) definition.backgroundIcon= 'time';
    Chartled.DashingChartle.prototype.initialize.call(this, definition);
  },
  fetch: null,
  update: function() {
    var now = new Date();
    d3.select(this.valueEl)
      .select("span")
      .text(now.toLocaleTimeString());
    d3.select(this.titleEl)
      .select("span")
      .text(now.toDateString());
    this._resizeValue();
  }
});
