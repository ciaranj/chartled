Chartled.registerChartleEditor( Chartled.ChartChartle, {
  initialize: function( definition ) {
      this.configuringChartle = false;
      this._chartEditorDialog= new Chartled.ChartleEditDialog({
        title: "Configure Chart"
      });
    }
  , dispose: function() {
      if( this._metricEditor ) {
        this._metricEditor.dispose();
        this._metricEditor = null;
      }
      this._chartEditorDialog.dispose();
      this._chartEditorDialog = null;
    }
  , addRefreshListener: function( refresher ) {
      this.refresh= refresher;
  }
  , configureChartle : function() {
    var that= this;
    if( that.configuringChartle ) return;
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
    var html =   "<form class='form-horizontal'>";
    html +=   "<fieldset><legend>Details</legend>";
    html +=   "<div class='form-group'><label class='col-sm-3 control-label'>Title</label><div class='controls col-sm-9'><input class='title form-control' type='text'/></div></div>";
    html +=   "<div class='form-group'><div class='controls col-sm-offset-3 col-sm-9'><div class='checkbox'><label><input type='checkbox' class='horizontalAxis'/>Horizontal Axis</label></div></div></div>";
    html +=   "</fieldset>";
    html +=   "<fieldset><legend>Metrics</legend>";
    html +=   "<div class='metricEditorContainer'/>";
    html +=   "</fieldset>";
    html +=   "</form>";
    var $dialog= this._chartEditorDialog.show(
      html,
      function($dialog) {
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
            that.set_title($dialog.find(".title").val())
            that.set_horizontalAxisVisible($dialog.find(".horizontalAxis").prop('checked'));
            that.refresh();
      },
      function() {
        that.configuringChartle= false;
      }
    );

    if( this._metricEditor ) this._metricEditor.dispose();
    this._metricEditor= new Chartled.MetricEditor( $dialog, $dialog.find(".metricEditorContainer"), that.editableMetrics, {allowAdd: true, allowRemove: true} );
    $dialog.find(".title").val(that._title);
    $dialog.find(".horizontalAxis").prop('checked', that._horizontalAxisVisible);
  }
  , metricChartTypes : [
      {name:"Area", type: "area"},
      {name:"Bar", type: "bar"},
      {name:"Line", type: "line"},
      {name:"Scatter Plot", type: "scatterplot"}
    ]
});
