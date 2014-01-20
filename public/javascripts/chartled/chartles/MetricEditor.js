Chartled.MetricEditor = function(chartleEditorDialog, parentEl, editableMetrics, config) {
  this.initialize( chartleEditorDialog, parentEl, editableMetrics, config );
};

Chartled.MetricEditor.prototype= {
  _functionsDropDownString : null,
  _metricsDropDownString : null,
  initialize: function( chartleEditorDialog, parentEl, editableMetrics, config ) {
    var that= this;
    
    this.config = config || {
      allowAdd: true,
      allowRemove: true
    };
    this.parentEl= parentEl;
    this.editableMetrics= editableMetrics;
    this.chartleEditorDialog= chartleEditorDialog;
    var html= "";
    html += "<table class='table table-striped table-bordered metrics table-hover table-condensed'>";
    html +="<tbody class='metricsTable'>";
    html += "</tbody>"
    if( this.config.allowAdd ) {
      html +="<tfoot>";
      html +="<tr>";
      html +="<td colspan='2'><button  style='float:right;margin:5px 0;' class='btn btn-success btn-mini add-metric' type='button'>Add Metric</button></td>";
      html +="</tr>";
      html +="</tfoot>";
    }
    html +="</table>";
    parentEl[0].innerHTML = html; 
    this._buildMetrics();
    if( this.config.allowAdd ) {
      $('.add-metric').on("click", function() {
        that.configureMetric(-1);
      });
    }
  },
  dispose: function() {
    this.parentEl[0].innerHTML= "";
    this.parentEl= null;
  },
  _buildMetrics : function() {
    var that = this;
    var metricsTable= this.parentEl.find(".metricsTable");
    var html= "";
    for( var k=0; k< that.editableMetrics.length; k++ ) {
        html += "<tr>";
        if( this.config.allowRemove ) {
          html += "<td style='width:20px' class='metric-deletion'> <button class='btn btn-danger btn-mini' type='button' data-metric-id='" + k+ "'><i class='icon-remove'></i></button></td>";
        }
        html += "<td class='metric' data-metric-id='" + k+ "' data-original-title='Metric Details' data-content=\"" + that._encodeHtml(that.editableMetrics[k].value) + "\">" + (that.editableMetrics[k].value.length> 60 ? that._encodeHtml(that.editableMetrics[k].value.substring(0, 60)) +"..." : that._encodeHtml(that.editableMetrics[k].value)) + "</td>";
        html += "</tr>";
    }
    metricsTable[0].innerHTML = html;
    if( this.config.allowRemove ) {
      $(metricsTable).find(".metric-deletion button").on("click", function() { 
        var metricIndex= this.getAttribute('data-metric-id' );
        that.removeMetric( metricIndex );
      } );
    }
    metricsTable.find('.metric').popover({trigger:'hover', placement:'right'});
    metricsTable.find('.metric').on("click", function() {
      var metricIndex= this.getAttribute('data-metric-id' );
      that.configureMetric(metricIndex);
    });
  },
  getFunctionsDropDown : function() {
      if( this._functionsDropDownString == null ) {
          this._functionsDropDownString= "";
          var functions= chartd.functions
          for( var f in functions ) {
              this._functionsDropDownString += "<li><a href='#' onclick='Chartled.MetricEditor.prototype.appendMetricText(\"" + this._encodeHtml(functions[f].example) + "\")'>"+ this._encodeHtml(functions[f].name)+"</a></li>"
          }
      }
      return this._functionsDropDownString;
  },
  getMetricsDropDown : function() {
    if( this._metricsDropDownString == null ) {
        this._metricsDropDownString= "";
        var metrics= chartd.metrics

        var sortedMetrics= [];
        for( var k in metrics ) {
            sortedMetrics.push( metrics[k] );
        }
        sortedMetrics.sort(function(a,b){
            var va = (a.name === null) ? "" : "" + a.name;
            var vb = (b.name === null) ? "" : "" + b.name;
            return va > vb ? 1 : ( va === vb ? 0 : -1 );
        });
        for( var f in sortedMetrics ) {
            this._metricsDropDownString += "<li><a href='#' onclick='Chartled.MetricEditor.prototype.appendMetricText(\"" + this._encodeHtml(sortedMetrics[f].name) + "\")'>"+ this._encodeHtml(sortedMetrics[f].name)+"</a></li>"
        }
    }
    return this._metricsDropDownString;
  },
  removeMetric : function( metricIndex ) {
    if( this.editableMetrics.length == 1)  {
      // Simple case, just blast away the last element. (which happens at the end of this function)
    }
    else {
      metricIndex= +metricIndex; // Make sure we're dealing with a number
      for( var i= metricIndex;i< this.editableMetrics.length-1; i++ ){
        this.editableMetrics[i]= this.editableMetrics[i+1];
      }
    }
    this.editableMetrics.pop();
    this._buildMetrics();
  },
  appendMetricText : function( txt ) {
    var metricEditor= $('#editingMetric');
    metricEditor.val( metricEditor.val() + txt );
  },
  configureMetric : function( metricId ) {
    var that= this;
    that.hideChartleEditor();

    var html= "";
    if( metricId == -1 ) {
        html += "<h2>Create new metric</h2>";
    }
    else {
        html += "<h2>Configure Metric #" + (metricId + 1) + "</h2>";
    }
    var metric= {value:"", layer:2, axis:0};
    if( metricId != -1) {
        metric= that.editableMetrics[ metricId ];
    }
    html += "<div class='btn-toolbar'>";
    html += "<div class='btn-group'>";
    html += "<button class='btn dropdown-toggle btn-info' data-toggle='dropdown' href='#'>Functions <span class='caret'></span></button><ul class='dropdown-menu'>"
    html += that.getFunctionsDropDown();
    html += "</ul>";
    html += "</div>";
    html += "<div class='btn-group'>";
    html += "<a class='btn dropdown-toggle btn-info' data-toggle='dropdown' href='#'>Metrics <span class='caret'></span></a><ul class='dropdown-menu'>"
    html += that.getMetricsDropDown();
    html += "</ul>";
    html += "</div>";
    html += "</div>";
    html += "<textarea id='editingMetric' rows='8' style='width:99%;'>" + this._encodeHtml(metric.value) + "</textarea>";
/*    html += "<div class='btn-group' data-toggle='buttons-radio'>";
    for(var bK=0; bK< Chartled.ChartChartle.prototype.metricChartTypes.length; bK++ ){
      var claz= "btn";
      if( Chartled.ChartChartle.prototype.metricChartTypes[bK].type == metric.renderer ) {
        claz+= " active";
      }
      html+= "<button type='button' class='"+claz+"' data-toggle='button'>";
      html+= Chartled.ChartChartle.prototype.metricChartTypes[bK].name;
      html+= "<input type='radio' name='is_private' value='" + bK + "' />"
      html+= "</button>";
    }
    html += "</div>"*/

    bootbox.dialog(html, [
                {
                    "label" : "OK",
                    "class" : "btn-primary",
                    "callback": function() {
                        var newMetricValue= $('#editingMetric').val().replace(/^\s\s*/, '').replace(/\s\s*$/, '');
                        if( newMetricValue != "" ) {
                            //TODO: assert valid  here..
                            if( metricId == -1 ) metricId= that.editableMetrics.length;
                            that.editableMetrics[metricId]= { value: newMetricValue };
                        }
                        that._buildMetrics();
                        that.showChartleEditor();
                    }
                },  
                {
                    "label" : "Cancel", 
                    "class" :"btn-default",
                    "callback": function() {
                        that.showChartleEditor();
                    }
                }
    ], {"backdrop": false, "classes" :"metricEditor"});
    $(document).off('focusin.modal');
  },  
  hideChartleEditor : function() {
    if ( this.chartleEditorDialog ) this.chartleEditorDialog.hide();
  },
  showChartleEditor : function() {
    if ( this.chartleEditorDialog ) this.chartleEditorDialog.show();
    $(document).off('focusin.modal');
  },
  _encodeHtml : function(str) {
    return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
  }
};