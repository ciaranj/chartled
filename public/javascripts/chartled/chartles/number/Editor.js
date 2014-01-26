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
    var html= "<form class='form-horizontal'>";
    html +=   "<fieldset><legend>Details</legend>";
    html +=   "<div class='form-group'><label class='col-sm-3 control-label'>Title</label><div class='controls col-sm-9'><input class='title form-control' type='text'/></div></div>";
    html +=   "<div class='form-group'><label class='col-sm-3 control-label'>More Info</label><div class='controls col-sm-9'><input class='moreInfo form-control' type='text'/></div></div>";
    html +=   "<div class='form-group'><div class='controls col-sm-offset-3 col-sm-9'><div class='checkbox'><label><input type='checkbox' class='timestamp'/>Show Timestamp</label></div></div></div>";
    html +=   "</fieldset>"
    html +=   "<fieldset><legend>Metrics</legend>";
    html +=   "<div class='metricEditorContainer'/>";
    html +=   "</fieldset>"
    html +=   "<fieldset><legend>Background</legend>";
    html +=   "<div class='form-group'><label class='col-sm-3 control-label'>Icon (Awesome Font)</label><div class='controls col-sm-9'><input class='backgroundImage form-control' type='text'/></div></div>";
    html +=   "<div class='form-group'><label class='col-sm-3 control-label'>Colour (Class)</label><div class='controls col-sm-9'><input class='backgroundClass form-control' type='text'/></div></div>";
    html +=   "</fieldset>"
    html +=  "</form>";

    that.chartEditorDialog= bootbox.dialog({"backdrop": true,
                                            "animate":false,
                                            message:html,
                                            "className":"graphEditor",
                                            title: "Configure Number Chartle",
                                            closeButton: false,
                                            buttons: {
                                              "Ok": {
                                                className : "btn-primary",
                                                callback: function() {
                                                  that.configuringChartle= false;
                                                  // Bleurghhh this is nasty, avoiding shared mutable states??
                                                  that.metrics= that.editableMetrics;
                                                  that.editableMetrics= null;
                                                  that.set_backgroundIcon( that.chartEditorDialog.find(".backgroundImage").val() );
                                                  that.set_backgroundColorClass(that.chartEditorDialog.find(".backgroundClass").val());
                                                  that.set_moreInfo(that.chartEditorDialog.find(".moreInfo").val())
                                                  that.set_title(that.chartEditorDialog.find(".title").val())
                                                  that.set_displayUpdatedAt(that.chartEditorDialog.find(".timestamp").prop('checked'));
                                                  that.resize();
                                                  that.refresh();
                                                }
                                              },  
                                              "Cancel": {
                                                className :"btn-default",
                                                callback: function() {
                                                  that.configuringChartle= false;
                                                }
                                              }
                                            }});

    if( this._metricEditor ) this._metricEditor.dispose();
    this._metricEditor= new Chartled.MetricEditor( that.chartEditorDialog, that.chartEditorDialog.find(".metricEditorContainer"), that.editableMetrics, {allowAdd: false, allowRemove: false} );
    that.chartEditorDialog.find(".backgroundImage").val(this._backgroundIcon);
    that.chartEditorDialog.find(".backgroundClass").val(this._backgroundColorClass);
    that.chartEditorDialog.find(".moreInfo").val(this._moreInfo);
    that.chartEditorDialog.find(".title").val(this._title);
    that.chartEditorDialog.find(".timestamp").prop('checked', this._displayUpdatedAt);
  }
});

