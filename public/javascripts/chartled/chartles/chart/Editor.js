Chartled.registerChartleEditor( Chartled.ChartChartle, {
  initialize: function( definition ) {
      this.configuringChartle = false;
      this.configureDelegate= $.proxy( this.configureChartle, this );
      this.jEl.on( 'click', this.configureDelegate);
    }
  , dispose: function() {
      this.jEl.off( 'click', this.configureDelegate);
      this.configureDelegate = null;
      if( this._metricEditor ) {
        this._metricEditor.dispose();
        this._metricEditor = null;
      }
    }
  , addRefreshListener: function( refresher ) {
      this.refresh= refresher;
  }
  , configureChartle : function() {
    var that= this;
    if( that.configuringChartle || page_mode != "content" ) return;
    else that.configuringChartle= true;

    // Take a copy of the current metrics, prior to edit.
    that.editableMetrics= [];
    for(var i=0;i< that.metrics.length; i++ ) {
        that.editableMetrics[i]= {
          value: that.metrics[i].value,
          layer: that.metrics[i].layer,
          axis: that.metrics[i].axis
        };
    }
    var html= "<h2>Configure Chart #" + that.id +"</h2>";
    html +=   "<form class='form-horizontal'>";
    html +=   "<fieldset><legend>Metrics</legend>";
    html +=   "<div class='metricEditorContainer'/>";
    html +=   "</fieldset>";
    html +=   "</form>";
    that.chartEditorDialog= bootbox.dialog( html, [
                {
                    "label" : "OK",
                    "class" : "btn-primary",
                    "callback": function() {
                        that.configuringChartle= false;
                        // Bleurghhh this is nasty, avoiding shared mutable states??
                        for( var k in that.editableMetrics ) {
                          if( !that.editableMetrics[k].layer ) {
                            that.editableMetrics[k].layer = 2;
                            that.editableMetrics[k].axis = 0;
                          }
                        }
                        that.metrics= that.editableMetrics;
                        that.chart.config.metrics= that.metrics;
                        that.editableMetrics= null;
                        that.refresh();
                    }
                },  
                {
                    "label" : "Cancel", 
                    "class" :"btn-default",
                    "callback": function() {
                        that.configuringChartle= false;
                    }
                }
    ], {"backdrop": false, "animate":false, "classes":"graphEditor"});
    if( this._metricEditor ) this._metricEditor.dispose();
    this._metricEditor= new Chartled.MetricEditor( that.chartEditorDialog, that.chartEditorDialog.find(".metricEditorContainer"), that.editableMetrics, {allowAdd: true, allowRemove: true} );
  }
  , metricChartTypes : [
      {name:"Area", type: "area"},
      {name:"Bar", type: "bar"},
      {name:"Line", type: "line"},
      {name:"Scatter Plot", type: "scatterplot"}
    ]
});
