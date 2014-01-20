if( typeof(Chartled) == 'undefined' ) Chartled = {};

Chartled.NumberChartle = function(definition, el, baseUrl) {
  Chartled.DashingChartle.call( this, definition, el, baseUrl );
};

Chartled.inheritPrototype(Chartled.NumberChartle, Chartled.DashingChartle, {
  initialize: function( definition ) {
    definition.backgroundColorClass= 'chartled-color-2';
    definition.backgroundIcon= 'heart';
    Chartled.DashingChartle.prototype.initialize.call(this, definition);
  },
  serialize: function() {
    var o= Chartled.DashingChartle.prototype.serialize.call(this);
    o.type= "Chartled.NumberChartle";
    return o;
  }  
});
