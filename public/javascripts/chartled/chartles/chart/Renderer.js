Chartled.ChartChartle = function(definition, el, baseUrl) {
  Chartled.BaseChartle.call( this, definition, el, baseUrl );
};

Chartled.inheritPrototype(Chartled.ChartChartle, Chartled.BaseChartle, {
  initialize: function( definition ) {
    Chartled.BaseChartle.prototype.initialize.call(this, definition);

    if( definition.metrics ) {
      // Deal with legacy version of definition
      var metricValues= [];
      for(var k in definition.metrics) {
        metricValues.push( definition.metrics[k].value );
      }
      this.groups= [{
        metrics: metricValues
      }];
    }
    else {
      this.groups= definition.groups;
    }
    if( typeof(this.groups[1]) == 'undefined' ) {
      this.groups[1]= {metrics:[]}
    }
    if( definition.title ) this.set_title(definition.title);
    else this.set_title("");
    if( definition.horizontalAxisVisible ) this.set_horizontalAxisVisible(definition.horizontalAxisVisible);
    else this.set_horizontalAxisVisible(true);
    if( definition.autoSampleData ) this.set_autoSampleData(definition.autoSampleData);
    else this.set_autoSampleData(true);

//    for(var key in this.metrics) {
//      this.metrics[key].axis= 0;
//      this.metrics[key].layer =2;
//    }
    this._previousWidth= this.jEl.width();
    this._previousHeight= this.jEl.width();
    this.chart = new Chart( this.id, this.jEl.width(), this.jEl.height(), {
      groups: this.groups,
      title: this._title,
      horizontalAxisVisible : this._horizontalAxisVisible,
      autoSampleData : this._autoSampleData,
      layers: [{renderer : "area"},{renderer : "bar"}, {renderer : "line", dropShadow: true}],
      axes: {
        x:{display: true}, 
        y:[{
            display: "left"
           }]}
    });
  },
  dispose: function() {
    this.chart.dispose();
    this.chart = null;
    this.metrics = null;
    Chartled.BaseChartle.prototype.dispose.call(this);
  },
  resize: function(width, height) {
    if( width != this._previousWidth || height != this._previousHeight ) {
      this._previousWidth= width;
      this._previousHeight= height;
      this.chart.resize( width, height );
    }
  },
  serialize: function() {
    var o= Chartled.BaseChartle.prototype.serialize.call(this);

    // Only bother exporting groups that have configured metrics.
    var outGroups= [];
    for(var g in this.groups) {
      if( this.groups[g].metrics && this.groups[g].metrics.length > 0) outGroups.push(this.groups[g]);
    }
    o.groups= outGroups;
    o.title= this._title;

    // Only bother writing it out if it is false (the default of true is fine).
    if( this._autoSampleData === false ) o.autoSampleData= false;
    return o;
  },
  fetch: function(clock, cb) {
    var metricsToFetch= {};
    // Only fetch the same metric once, the same metric *might* be in the each group.
    for(var group in this.groups) {
      for(var metric in this.groups[group].metrics) {
        var m= this.groups[group].metrics[metric];
        metricsToFetch[m]= m;
      }
    }
    Chartled.FetchMetric( this.baseUrl, metricsToFetch, clock, cb );
  },
  update: function(err, data) {
    if(!err) {
      this.chart.refreshData( data );
    }
  },
  set_autoSampleData: function(sample) {
    this._autoSampleData= sample;
    if( this.chart ) {
      this.chart.set_autoSampleData( sample );
    }
  },
  set_title: function(title) {
    this._title= title;
    if( this.chart )this.chart.set_title( title );
  },
  set_horizontalAxisVisible: function(visible) {
    this._horizontalAxisVisible= visible;
    if( this.chart )this.chart.set_horizontalAxisVisible( visible );
  }
});
