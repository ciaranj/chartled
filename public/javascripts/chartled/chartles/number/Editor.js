Chartled.NumberChartleEditor = function() {
  Chartled.DashingChartleEditor.call( this );
};

Chartled.inheritPrototype(Chartled.NumberChartleEditor, Chartled.DashingChartleEditor, {
  initialize: function( definition ) {
    Chartled.DashingChartleEditor.prototype.initialize.call( this, definition, {
      title: "Configure Number"
    });
  }
});

Chartled.registerChartleEditor( Chartled.NumberChartle, Chartled.NumberChartleEditor.prototype);
