Chartled.ChartChartle = function(definition, el, baseUrl) {
  Chartled.BaseChartle.call( this, definition, el, baseUrl );
};

Chartled.inheritPrototype(Chartled.ChartChartle, Chartled.BaseChartle, {
  initialize: function( definition ) {
    Chartled.BaseChartle.prototype.initialize.call(this, definition);

    this.metrics= definition.metrics;
    if( definition.title ) this.set_title(definition.title);
    else this.set_title("");

    for(var key in this.metrics) {
      this.metrics[key].axis= 0;
      this.metrics[key].layer =2;
    }
    this.chart = new Chart( this.id, this.jEl.width(), this.jEl.height(), {
      "metrics": this.metrics,
      title: this._title,
      layers: [{renderer : "area"},{renderer : "bar"}, {renderer : "line", dropShadow: true}],
      axes: {
        x:{display: true}, 
        y:[{
            display: "left"
           }]}
    });
  },
  dispose: function() {
    this.chart = null;
    this.metrics = null;
    Chartled.BaseChartle.prototype.dispose.call(this);
  },
  resize: function(width, height) {
    this.chart.resize( width, height );
  },
  serialize: function() {
    var o= Chartled.BaseChartle.prototype.serialize.call(this);
    o.metrics= this.metrics;
    o.title= this._title;
    return o;
  },
  fetch: function(clock, cb) {
    Chartled.FetchMetric( this.baseUrl, this.metrics, clock, cb );
  },
  update: function(err, data) {
    if(!err) {
      this.chart.refreshData( data );
    }
  },
  set_title: function(title) {
    this._title= title;
    if( this.chart )this.chart.set_title( title );
  }
});
