Chartled.ClockChartleEditor = function() {
  Chartled.DashingChartleEditor.call( this );
};

Chartled.inheritPrototype(Chartled.ClockChartleEditor, Chartled.DashingChartleEditor, {
  initialize: function( definition ) {
    Chartled.DashingChartleEditor.prototype.initialize.call( this, definition, {
      title: "Configure Clockface",
      editable: {
        metrics: false,
        details_title: false,
        details_moreInfo: true,
        details_timeStamp: false
      }
    });
  }
});
Chartled.registerChartleEditor( Chartled.ClockChartle, Chartled.ClockChartleEditor.prototype);