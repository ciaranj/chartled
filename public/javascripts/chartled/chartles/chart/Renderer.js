Chartled.ChartChartle = function(definition, el, baseUrl) {
  this.id = definition.id;
  this.metrics= definition.metrics;
  this.el= el;
  this.baseUrl= baseUrl;

  this.initialise(definition);
};

Chartled.ChartChartle.prototype = {
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
    this.el = null;
    this.chart = null;
    this.configureDelegate = null;
  },
  resize: function(width, height) {
    this.chart.resize( width, height );
  },
  serialize: function() {
    return { "id": this.id,
             "type": "Chartled.ChartChartle",
             "metrics": this.metrics};
  },
  fetch: function(clock, cb) {
    var dataUrl=  this.baseUrl + "/series?from=" + clock.from+ "&until=" + clock.until + "&jsonp=?";
    for( var k in this.metrics ) {
      dataUrl += "&target=" + this.metrics[k].value;
    }
    $.getJSON(dataUrl, function(data){
      cb(null, data);
    })
    .fail(function() {
      cb(new Error());
    });
  },
  update: function(err, data) {
    if(!err) {
      this.chart.refreshData( data );
    }
  }
}