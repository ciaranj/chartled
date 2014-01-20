Chartled.registerChartleEditor( Chartled.NumberChartle, {
  initialize: function( definition ) {
    this.configuringChartle = false;
    this.configureDelegate= $.proxy( this.configureChartle, this );
    this.jEl.on( 'click', this.configureDelegate);
  },
  dispose: function() {
    this.editableMetrics = null;
    this.jEl.off( 'click', this.configureDelegate);
    if( this._metricEditor ) {
      this._metricEditor.dispose();
      this._metricEditor = null;
    }
    this.configureDelegate = null;
  },
  addRefreshListener: function( refresher ) {
    this.refresh= refresher;
  },
  configureChartle : function() {
    var that= this;
    if( that.configuringChartle || page_mode != "content" ) return;
    else that.configuringChartle= true;

    // Take a copy of the current metrics, prior to edit.
    that.editableMetrics= [];
    for(var i=0;i< that.metrics.length; i++ ) {
        that.editableMetrics[i]= {
          value: that.metrics[i].value
        };
    }
    var html= "<h2>Configure Chartle #" + that.id +"</h2>";
    html += "<div class='metricEditorContainer'/>";

    that.chartEditorDialog= bootbox.dialog( html, [
                {
                    "label" : "OK",
                    "class" : "btn-primary",
                    "callback": function() {
                        that.configuringChartle= false;
                        // Bleurghhh this is nasty, avoiding shared mutable states??
                        that.metrics= that.editableMetrics;
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
    this._metricEditor= new Chartled.MetricEditor( that.chartEditorDialog, that.chartEditorDialog.find(".metricEditorContainer"), that.editableMetrics, {allowAdd: false, allowRemove: false} );
  }
});

