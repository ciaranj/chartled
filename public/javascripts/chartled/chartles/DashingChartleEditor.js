Chartled.DashingChartleEditor = function() {}
Chartled.DashingChartleEditor.prototype= {
  initialize: function( definition, editorOptions ) {
    var that= this;
    this.configuringChartle = false;
    this._editor_options= editorOptions;
    if( typeof(this._editor_options.editable) == 'undefined') this._editor_options.editable = {};

    this._chartEditorDialog= new Chartled.ChartleEditDialog({
      title: that._editor_options.title
    });
  },
  dispose: function() {
    this.editableMetrics = null;
    if( this._metricEditor ) {
      this._metricEditor.dispose();
      this._metricEditor = null;
    }
    this._chartEditorDialog.dispose();
    this._chartEditorDialog = null;
  },
  addRefreshListener: function( refresher ) {
    this.refresh= refresher;
  },
  configureChartle : function() {
    var that= this;
    if( that.configuringChartle ) return;
    else that.configuringChartle= true;

    // Take a copy of the current metrics, prior to edit.
    that.editableMetrics= [];
    if( that.metrics ) {
      that.editableMetrics= that.metrics.slice();
    }
    var html= "<form class='form-horizontal'>";
    if( that._editor_options.editable.details_title !== false ||
        that._editor_options.editable.details_moreInfo !== false ||
        that._editor_options.editable.details_timeStamp !== false ) {
      html +=   "<fieldset><legend>Details</legend>";
    }
    if( that._editor_options.editable.details_title !== false) {
      html +=   "<div class='form-group'><label class='col-sm-3 control-label'>Title</label><div class='controls col-sm-9'><input class='title form-control' type='text'/></div></div>";
    }
    if( that._editor_options.editable.details_moreInfo !== false) {
      html +=   "<div class='form-group'><label class='col-sm-3 control-label'>More Info</label><div class='controls col-sm-9'><input class='moreInfo form-control' type='text'/></div></div>";
    }
    if( that._editor_options.editable.details_timeStamp !== false) {
      html +=   "<div class='form-group'><div class='controls col-sm-offset-3 col-sm-9'><div class='checkbox'><label><input type='checkbox' class='timestamp'/>Show Timestamp</label></div></div></div>";
    }
    html +=   "</fieldset>"
    if( that._editor_options.editable.metrics !== false ) {
      html +=   "<fieldset><legend>Metrics</legend>";
      html +=   "<div class='metricEditorContainer'/>";
      html +=   "</fieldset>"
    }
    if( that._editor_options.editable.style !== false ) {
      html +=   "<fieldset><legend>Background</legend>";
      html +=   "<div class='form-group'><label class='col-sm-3 control-label'>Icon (Awesome Font)</label><div class='controls col-sm-9'><input class='backgroundImage form-control' type='text'/></div></div>";
      html +=   "<div class='form-group'><label class='col-sm-3 control-label'>Colour (Class)</label><div class='controls col-sm-9'><input class='backgroundClass form-control' type='text'/></div></div>";
      html +=   "</fieldset>"
    }
    html +=  "</form>";

    var $dialog= that._chartEditorDialog.show( html, 
      function ($dialog) {
        that.configuringChartle= false;
        // Bleurghhh this is nasty, avoiding shared mutable states??
        if( that._editor_options.editable.metrics !== false ) {
          that.metrics= that.editableMetrics;
          that.editableMetrics= null;
        }
        if( that._editor_options.editable.style !== false ) {
          that.set_backgroundIcon( $dialog.find(".backgroundImage").val() );
          that.set_backgroundColorClass($dialog.find(".backgroundClass").val());
        }
        if( that._editor_options.editable.details_moreInfo !== false) {
          that.set_moreInfo($dialog.find(".moreInfo").val())
        }
        if( that._editor_options.editable.details_title !== false) {
          that.set_title($dialog.find(".title").val())
        }
        if( that._editor_options.editable.details_timeStamp !== false) {
          that.set_displayUpdatedAt($dialog.find(".timestamp").prop('checked'));
        }
        that.resize();
        that.refresh();
      },
      function ($dialog) {
        that.configuringChartle= false;
      }
    );

    if( that._editor_options.editable.metrics !== false ) {
      if( that._metricEditor ) that._metricEditor.dispose();
      that._metricEditor= new Chartled.MetricEditor( $dialog, $dialog.find(".metricEditorContainer"), that.editableMetrics, {allowAdd: false, allowRemove: false} );
    }
    if( that._editor_options.editable.style !== false ) {
      $dialog.find(".backgroundImage").val(that._backgroundIcon);
      $dialog.find(".backgroundClass").val(that._backgroundColorClass);
    }
    $dialog.find(".moreInfo").val(that._moreInfo);
    $dialog.find(".title").val(that._title);
    $dialog.find(".timestamp").prop('checked', that._displayUpdatedAt);
  }
}
