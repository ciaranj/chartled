Chartled.ChartChartle = function(definition, el, baseUrl) {
  this.id = definition.id;
  this.metrics= definition.metrics;
  this.el= el;
  this.baseUrl= baseUrl;

  this.initialise(definition);
  this.from= null;
  this.to= null;

  this.qRefreshInterval= this.queueChartRefresh();
};

Chartled.ChartChartle.prototype = {
  setTimeRange: function( from,to ) {
    this.from= from;
    this.to= to;
    this.displayRollingChart();
  },
  initialise: function( definition ) {
    var that = this;
    var jEl = $(that.el);
    if( !jEl.hasClass('chart') ) jEl.addClass('chart');
    this.configureDelegate= $.proxy( this.configureChart, this );
    jEl.on( 'click', this.configureDelegate);
    for(var key in that.metrics) {
      that.metrics[key].axis= 0;
      that.metrics[key].layer =2;
    }
    // TODO: This needs to be clock-based.
    that.maxAgeInSeconds = 1800;
    that.chart = new Chart( that.id, jEl.width(), jEl.height(), {
      "metrics": that.metrics,
      layers: [{renderer : "area"},{renderer : "bar"}, {renderer : "line", dropShadow: true}],
      axes: {
        x:{display: true}, 
        y:[{
            display: "left"
           }]}
    });
  },
  dispose: function() {
    if( this.qRefreshInterval ) {
      clearInterval( this.qRefreshInterval );
      this.qRefreshInterval = null;
    }
    this.el = null;
    this.chart = null;
    this.maxAgeInSeconds = null;
    this.configureDelegate = null;
    this.from = null;
    this.to = null;
  },
  resize: function(width, height) {
    this.chart.resize( width, height );
  },
  serialize: function() {
    return { "id": this.id,
             "type": "Chartled.ChartChartle",
             "metrics": this.metrics};
  },
  displayRollingChart: function() {
    var metric= this.metrics;
    var that= this;
    var dataUrl=  this.baseUrl + "/series?from=" + this.from+ "&until=" + this.to + "&jsonp=?";
    for( var k in metric ) {
      dataUrl += "&target=" + metric[k].value;
    }
    that.loading= true;
    $.getJSON(dataUrl, function(data){
      that.chart.refreshData( data );
    })
    .always(function() {
      that.loading= false;
    })
    .fail(function() {
      // Error path.
    });
  },
  queueChartRefresh: function() {
    var that= this;
    return setInterval( function() {
        if( !that.loading && that.from != null && that.to != null) {
          that.displayRollingChart( );
        }
    }, 10000 );
  }
}
