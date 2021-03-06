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
      html +="<td colspan='2'><button  style='float:right;margin:5px 0;' class='btn btn-success btn-xs add-metric' type='button'>Add Metric</button></td>";
      html +="</tr>";
      html +="</tfoot>";
    }
    html +="</table>";

    var jel= $(html);
    parentEl[0].appendChild(jel[0]);
    
    this._buildMetrics();
    if( this.config.allowAdd ) {
      jel.find('.add-metric').on("click", function() {
        that.configureMetric(-1);
      });
    }
    this._chartEditorDialog= new Chartled.ChartleEditDialog({
      title: "Configure Metric",
      background: false
    });    
  },
  dispose: function() {
    this.parentEl[0].innerHTML= "";
    this.parentEl= null;
    this._chartEditorDialog.dispose();
    this._chartEditorDialog = null;
  },
  _buildMetrics : function() {
    var that = this;
    var metricsTable= this.parentEl.find(".metricsTable");
    var html= "";
    for( var k=0; k< that.editableMetrics.length; k++ ) {
        html += "<tr>";
        if( this.config.allowRemove ) {
          html += "<td style='width:20px' class='metric-deletion'> <button class='btn btn-danger btn-xs' type='button' data-metric-id='" + k+ "'><i class='fa fa-times'></i></button></td>";
        }
        html += "<td class='metric' data-metric-id='" + k+ "' data-original-title='Metric Details' data-content=\"" + that._encodeHtml(that.editableMetrics[k]) + "\">" + (that.editableMetrics[k].length> 60 ? that._encodeHtml(that.editableMetrics[k].substring(0, 60)) +"..." : that._encodeHtml(that.editableMetrics[k])) + "</td>";
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
          for( var k=0;k<functions.length;k++ ) {
              this._functionsDropDownString += "<li class='item'><a href='#' onclick='Chartled.MetricEditor.prototype.appendFunction("+k+")'>"+ this._encodeHtml(functions[k].name)+"</a></li>"
          }
      }
      return this._functionsDropDownString;
  },
  appendFunction: function(functionKey) {
    var functions= chartd.functions;
    this.appendMetricText( chartd.functions[functionKey].example );
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
            this._metricsDropDownString += "<li class='item'><a href='#' onclick='Chartled.MetricEditor.prototype.appendMetricText(\"" + this._encodeHtml(sortedMetrics[f].name) + "\")'>"+ this._encodeHtml(sortedMetrics[f].name)+"</a></li>"
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
    var metricEditor= $('.editingMetric');
    metricEditor.val( metricEditor.val() + txt );
  },
  configureMetric : function( metricId ) {
    var that= this;
    that.hideChartleEditor();


    var metric= "";
    if( metricId != -1) {
        metric= that.editableMetrics[ metricId ];
    }
    var html = "<div class='btn-toolbar'>";
    html += "<div class='btn-group'>";
    html += "<button class='btn dropdown-toggle btn-primary' data-toggle='dropdown' href='#'>Functions <span class='caret'></span></button><ul class='dropdown-menu'>"
    html += that.getFunctionsDropDown();
    html += "</ul>";
    html += "</div>";
    html += "<div class='btn-group'>";
    html += "<a class='btn dropdown-toggle btn-primary' data-toggle='dropdown' href='#' id='metricsDropDown'>Metrics <span class='caret'></span></a><ul class='dropdown-menu metrics'>"
    html += "<li><input class='filter' type='text' style='width:100%' placeholder='Search...'/></li>";
    html += that.getMetricsDropDown();
    html += "</ul>";
    html += "</div>";
    html += "</div>";
    html += "<br/>"
    html += "<textarea class='editingMetric' rows='8' style='width:99%;'>" + this._encodeHtml(metric) + "</textarea>";

    this._chartEditorDialog.show( html, 
      function ($dialog) {
        clearInterval( that._filterMetricsTimer );
        var newMetricValue= $('.editingMetric').val().replace(/^\s\s*/, '').replace(/\s\s*$/, '');
        if( newMetricValue != "" ) {
            //TODO: assert valid  here..
            if( metricId == -1 ) metricId= that.editableMetrics.length;
            that.editableMetrics[metricId]= newMetricValue;
        }
        that._buildMetrics();
        that.showChartleEditor();
      },
      function ($dialog) {
        clearInterval( that._filterMetricsTimer );
        that.showChartleEditor();
      }
    );
     $('#metricsDropDown').click(function (e) {
      $('.dropdown-menu.metrics .filter').val("");
      that._lastMetricFilterString= null;
     });
    // Stop clicking in the input box from hiding the dropdown
    $('.dropdown-menu.metrics .filter').click(function (e) {
      e.stopPropagation();
      var filter= $('.dropdown-menu.metrics .filter');
      if( filter.val().toLowerCase() == "" ) {
        filter.val("stats.");
        filter.focus();
      }
    });
    that._lastMetricFilterString= "";
    that._filterMetricsTimer= setInterval(function() {
      var filterString= $('.dropdown-menu.metrics .filter').val().toLowerCase();
      if( filterString != that._lastMetricFilterString ) {
        that._lastMetricFilterString= filterString;
        $('.dropdown-menu.metrics li.item').each(function(index, value) {
          var link = $($(value).children("a")[0]).text().toLowerCase();
          // For now only do 'starts with' style matching
          if( link.indexOf(filterString) != 0 ) {
            value.style.display= 'none';
          } else {
            value.style.display= '';
          }
        });
      }
    }, 100);
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