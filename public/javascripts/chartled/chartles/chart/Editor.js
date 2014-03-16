Chartled.registerChartleEditor( Chartled.ChartChartle, {
  initialize: function( definition ) {
      this.configuringChartle = false;
      this._chartEditorDialog= new Chartled.ChartleEditDialog({
        title: "Edit Chart"
      });
      this._metricEditors=[];
    }
  , dispose: function() {
      this._disposeMetricEditors();
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
    var metricGroups=2;
    that.editableGroups= [];
    for(var i=0;i<metricGroups;i++) {
      that.editableGroups.push({
        metrics: [],
        interpolation: "linear"
      });
    }

    for(var i=0;i<that.editableGroups.length;i++ ) {
      for(var m in that.groups[i].metrics) {
        that.editableGroups[i].metrics.push( that.groups[i].metrics[m] );
      }
      if(typeof(that.groups[i].interpolation) != 'undefined') that.editableGroups[i].interpolation = that.groups[i].interpolation;
    }
    var html = "";
    html += "  <ul class='nav nav-tabs'>";
    html += "   <li class='active'><a href='#details' data-toggle='tab'>Details</a></li>";
    html += "   <li><a href='#metrics' data-toggle='tab'>Metrics</a></li>";
    html += "   <li><a href='#axes' data-toggle='tab'>Axes</a></li>";
    html += "   <li><a href='#clock' data-toggle='tab'>Clock</a></li>";
    html += "  </ul>";
    html += "  <div class='tab-content'>";
    html += "    <div class='tab-pane active' id='details'>";
    html += "      <form class='form-horizontal'>";
    html += "        <div class='form-group'><label class='col-sm-3 control-label'>Title</label><div class='col-sm-9'><input class='form-control title' type='text'/></div></div>";
    html += "      </form>";
    html += "    </div>";
    html += "    <div class='tab-pane' id='metrics'>";

    var selected= "";
    function buildSelectOptions(options, selectedValue){
      var result= "";
      for(var i=0;i<options.length;i++) {
        result += "<option value='"+ options[i][0] + "'" + (options[i][0]==selectedValue?" selected ": "") +">"+  options[i][1] +"</option>";
      }
      return result;
    }
    for(var i=0;i<that.editableGroups.length;i++) {
      html += "      <fieldset class='metricEditor"+ i +"'><legend>Metric group " + (i+1) + "</legend>";
      html += "        <form class='form-horizontal'>";
      html += "          <div class='metricValueEditorContainer'/>";
      html += "          <div class='form-group col-sm-12'>";
      html += "            <label class='col-sm-2 control-label'>Style</label><div class='col-sm-3'>"
      html += "              <select disabled class='form-control selectpicker'>";
      html +=                  buildSelectOptions([["line","Line"],["area", "Area"],["bar", "Bar"]], "line");
      html += "              </select>";
      html += "            </div>";
      html += "            <label class='col-sm-2 control-label'>Interpolation</label><div class='col-sm-3'>"
      html += "              <select class='form-control selectpicker interpolation'>";
      html +=                  buildSelectOptions([["basis","B-Spline"],["cardinal", "Cardinal"],["linear", "Linear"], ["step-after", "Step After"], ["step-before", "Step Before"],["monotone", "Cubic"] ], that.editableGroups[i].interpolation);
      html += "              </select>";
      html += "            </div>";
      html += "          </div>";
      html += "          <div class='form-group col-sm-12'>";
      html += "            <label class='col-sm-2 control-label'>Axis</label><div class='col-sm-3'>"
      html += "              <select disabled class='form-control selectpicker'>";
      html +=                  buildSelectOptions([["0","Left"],["1", "Right"]], "0");
      html += "              </select>";
      html += "            </div>";
      html += "          </div>";
      html += "        </form>";
      html += "      </fieldset>";
    }
    html += "    </div>"
    html += "    <div class='tab-pane' id='axes'>"
    html += "      <form class='form-horizontal'>";
    html += "        <fieldset><legend>Horizontal</legend>"
    html += "          <div class='form-group'><div class='controls col-sm-offset-3 col-sm-9'><div class='checkbox'><label><input type='checkbox' class='horizontalAxis'/>Visible</label></div></div></div>";
    html += "          <div class='form-group'><div class='controls col-sm-offset-3 col-sm-9'><div class='checkbox'><label><input type='checkbox' class='autoSampleData'/>Auto-Sample Data</label></div></div></div>";
    html += "        </fieldset>"
    html += "        <fieldset><legend>Vertical</legend>"
    html += "          <fieldset><legend>Left</legend>"
    html += "          </fieldset>"
    html += "          <fieldset><legend>Right</legend>"
    html += "          </fieldset>"
    html += "        </fieldset>"
    html += "      </form>";
    html += "    </div>"
    html += "    <div class='tab-pane' id='clock'/>"
    html += "  </div>";
    var $dialog= this._chartEditorDialog.show(
      html,
      function($dialog) {
            that.configuringChartle= false;
            // The metric editors will have (potentially) directly updated the 'editableGroups' references with the new metric values, but
            // this code still needs to manually update them with the selected drop-down values.
            for(var i=0;i<that.editableGroups.length;i++) {
              var metricEditor= $dialog.find(".metricEditor"+ i);
              that.editableGroups[i].interpolation= metricEditor.find(".interpolation").val();
            }

            // Bleurghhh this is nasty, avoiding shared mutable states??
            that.groups= that.editableGroups;
            that.chart.config.groups= that.groups;
            that.editableGroups= null;
            that.set_title($dialog.find(".title").val())
            that.set_horizontalAxisVisible($dialog.find(".horizontalAxis").prop('checked'));
            that.set_autoSampleData($dialog.find(".autoSampleData").prop('checked'));
            that.refresh();
      },
      function() {
        that.configuringChartle= false;
      }
    );
    this._disposeMetricEditors();
    this._metricEditors= [];
    for(var i=0;i<that.editableGroups.length;i++) {
      this._metricEditors.push(
        new Chartled.MetricEditor( $dialog, $dialog.find(".metricEditor" + i +" .metricValueEditorContainer" ), that.editableGroups[i].metrics, {allowAdd: true, allowRemove: true} ));
    }
    $dialog.find(".title").val(that._title);
    $dialog.find(".horizontalAxis").prop('checked', that._horizontalAxisVisible);
    $dialog.find(".autoSampleData").prop('checked', that._autoSampleData);
  }
  , metricChartTypes : [
      {name:"Area", type: "area"},
      {name:"Bar", type: "bar"},
      {name:"Line", type: "line"},
      {name:"Scatter Plot", type: "scatterplot"}
    ]
  , _disposeMetricEditors: function() {
      for(var k in this._metricEditors) {
        this._metricEditors[k].dispose();
      }
      this._metricEditors= null;
  }
});
