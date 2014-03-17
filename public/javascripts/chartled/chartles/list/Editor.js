Chartled.ListChartleEditor = function() {
  Chartled.DashingChartleEditor.call( this );
};

Chartled.inheritPrototype(Chartled.ListChartleEditor, Chartled.DashingChartleEditor, {
  initialize: function( definition ) {
    Chartled.DashingChartleEditor.prototype.initialize.call( this, definition, {
      title: "Configure List"
    });
  }
});

Chartled.registerChartleEditor( Chartled.ListChartle, Chartled.ListChartleEditor.prototype);
