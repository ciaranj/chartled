Chartled.NumberChartle = function(definition, el, baseUrl) {
  Chartled.DashingChartle.call( this, definition, el, baseUrl );
};

Chartled.inheritPrototype(Chartled.NumberChartle, Chartled.DashingChartle, {
  initialize: function( definition ) {
    if( typeof(definition.backgroundColorClass) == 'undefined' ) definition.backgroundColorClass= 'chartled-color-2';
    if( typeof(definition.backgroundIcon) == 'undefined' ) definition.backgroundIcon= 'heart';
    if( typeof(definition.displayUpdatedAt) == 'undefined' ) definition.displayUpdatedAt= true;
    if( typeof(definition.metric) == 'undefined' ) definition.metric= "";

    Chartled.DashingChartle.prototype.initialize.call(this, definition);
  }
});
