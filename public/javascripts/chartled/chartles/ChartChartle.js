if( typeof(Chartled) == 'undefined' ) Chartled = {};

Chartled.ChartChartle = function(definition, el) {
  var that= this;
  that.id = definition.id;
  that.metrics= definition.metrics;
  that.el= el;
  var jEl= $(that.el);
  if( !jEl.hasClass('chart') ) jEl.addClass('chart');
  this.configureDelegate= $.proxy( this.configureChart, this );
  jEl.on( 'click', this.configureDelegate);
  for(var key in that.metrics) {
    that.metrics[key].axis= 0;
    that.metrics[key].layer =2;
  }

  that.maxAgeInSeconds = previousValue;
  that.chart = new Chart( that.id, jEl.width(), jEl.height(), {
    "metrics": that.metrics,
    layers: [{renderer : "area"},{renderer : "bar"}, {renderer : "line", dropShadow: true}],
    axes: {
      x:{display: true}, 
      y:[{
          display: "left"
         }]}
  });
  that.displayRollingChart();
  that.qRefreshInterval= that.queueChartRefresh();
};

Chartled.ChartChartle.prototype = {
  _functionsDropDownString: null,
  _metricsDropDownString: null,

  buildMetrics: function() {
      var that = this;
      var metricsTable= document.getElementById("metrics");
      var html= "";
      for( var k=0; k< that.editableMetrics.length; k++ ) {
          html += "<tr>";
          html += "<td style='width:20px' class='metric-deletion'> <button class='btn btn-danger btn-mini' type='button' data-metric-id='" + k+ "'><i class='icon-remove'></i></button></td>";
          html += "<td class='metric' data-metric-id='" + k+ "' data-original-title='Metric Details' data-content=\"" + encodeHtml(that.editableMetrics[k].value) + "\">" + (that.editableMetrics[k].value.length> 60 ? encodeHtml(that.editableMetrics[k].value.substring(0, 60)) +"..." : encodeHtml(that.editableMetrics[k].value)) + "</td>";
          html += "</tr>";
      }
      metricsTable.innerHTML = html;
      $(metricsTable).find(".metric-deletion button").on("click", function() { 
        var metricIndex= this.getAttribute('data-metric-id' );
        that.removeMetric( metricIndex );
      } );
      $('.metric').popover({trigger:'hover', placement:'right'});
      $('.metric').on("click", function() {
        var metricIndex= this.getAttribute('data-metric-id' );
        that.configureMetric(metricIndex);
      });
  },
  configureChart: function() {
    var that= this;
    if( that.configuringChart || page_mode != "content" ) return;
    else that.configuringChart= true;

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
    html += "<h3>Chart Options</h3>";
    html += "<h3>Metrics</h3>";
    html += "<table class='table table-striped table-bordered metrics table-hover table-condensed'>";
    html +="<thead>";
    html +="<tr>";
    html +="<td colspan='2' style='text-align:right'><button class='btn btn-success btn-mini add-metric' type='button'>Add Metric</button></td>"
    html +="</tr>";
    html +="</thead><tbody id='metrics'>";
    html += "</tbody></table>"

    chartEditorDialog= bootbox.dialog( html, [
                {
                    "label" : "OK",
                    "class" : "btn-primary",
                    "callback": function() {
                        that.configuringChart= false;
                        // Bleurghhh this is nasty, avoiding shared mutable states??
                        that.metrics= that.editableMetrics;
                        that.chart.config.metrics= that.metrics;
                        that.editableMetrics= null;
                        that.displayRollingChart();
                    }
                },  
                {
                    "label" : "Cancel", 
                    "class" :"btn-default",
                    "callback": function() {
                        that.configuringChart= false;
                    }
                }
    ], {"backdrop": false, "animate":false, "classes":"graphEditor"});
    that.buildMetrics();
    $('.add-metric').on("click", function() {
      that.configureMetric(-1);
    });
  },
  configureMetric: function( metricId ) {
    var that= this;
    hideChartEditor();

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
    html += "<textarea id='editingMetric' rows='8' style='width:99%;'>" + encodeHtml(metric.value) + "</textarea>";
    html += "<div class='btn-group' data-toggle='buttons-radio'>";
    for(var bK=0; bK< metricChartTypes.length; bK++ ){
      var claz= "btn";
      if( metricChartTypes[bK].type == metric.renderer ) {
        claz+= " active";
      }
      html+= "<button type='button' class='"+claz+"' data-toggle='button'>";
      html+= metricChartTypes[bK].name;
      html+= "<input type='radio' name='is_private' value='" + bK + "' />"
      html+= "</button>";
    }
    html += "</div>"

    bootbox.dialog(html, [
                {
                    "label" : "OK",
                    "class" : "btn-primary",
                    "callback": function() {
                        var newMetricValue= $('#editingMetric').val().replace(/^\s\s*/, '').replace(/\s\s*$/, '');
                        if( newMetricValue != "" ) {
                            //TODO: assert valid  here..
                            if( metricId == -1 ) metricId= that.editableMetrics.length;
                            that.editableMetrics[metricId]= { value: newMetricValue, layer:2, axis:0 };
                        }
                        that.buildMetrics();
                        showChartEditor();
                    }
                },  
                {
                    "label" : "Cancel", 
                    "class" :"btn-default",
                    "callback": function() {
                        showChartEditor();
                    }
                }
    ], {"backdrop": false, "classes" :"metricEditor"});
    $(document).off('focusin.modal');
  },  
  displayRollingChart: function() {
    var metric= this.metrics;
    var that= this;
    var maxAgeInSeconds= that.maxAgeInSeconds - 60;
    var now= Math.round( new Date().getTime() / 1000 ) - 60;
    var dataUrl=  "/series?from=" + ( now - maxAgeInSeconds ) + "&to=" + now;
    for( var k in metric ) {
      dataUrl += "&target=" + metric[k].value;
    }
    that.loading= true;
    d3.json(dataUrl, function( data ) {
      if( data ) {
      // Happy path
      that.chart.refreshData( data );
      } else {
      // Error path.
      console.log( "Problem calling: " + dataUrl );
      }
      that.loading= false;
    });
  },
  getFunctionsDropDown: function() {
      if( this._functionsDropDownString == null ) {
          this._functionsDropDownString= "";
          var functions= chartd.functions
          for( var f in functions ) {
              this._functionsDropDownString += "<li><a href='#' onclick='appendMetricText(\"" + encodeHtml(functions[f].example) + "\")'>"+ encodeHtml(functions[f].name)+"</a></li>"
          }
      }
      return this._functionsDropDownString;
  },
  getMetricsDropDown: function() {
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
            this._metricsDropDownString += "<li><a href='#' onclick='appendMetricText(\"" + encodeHtml(sortedMetrics[f].name) + "\")'>"+ encodeHtml(sortedMetrics[f].name)+"</a></li>"
        }
    }
    return this._metricsDropDownString;
  },
  removeMetric: function( metricIndex ) {

    var newMetrics= [];
    for( var i=0;i< this.editableMetrics.length; i++ ){
      if( i != metricIndex) newMetrics[newMetrics.length]= this.editableMetrics[i];
    }
    this.editableMetrics= newMetrics;
    this.buildMetrics();
  },
  queueChartRefresh: function() {
    var that= this;
    return setInterval( function() {
        if( !that.loading ) {
          that.displayRollingChart( );
        }
    }, 10000 );
  },
  resize: function(width, height) {
    this.chart.resize( width, height );
  },
  serialize: function() {
    return { "id": this.id,
             "type": "Chartled.ChartChartle",
             "metrics": this.metrics};
  },
  setMaxAgeInSeconds: function( previousValue ) {
		this.maxAgeInSeconds= previousValue;
		this.displayRollingChart();
  },
  dispose: function() {
	if( this.qRefreshInterval ) {
		clearInterval( this.qRefreshInterval );
		this.qRefreshInterval = null;
	}
	this.el = null;
	this.chart = null;
	this.maxAgeInSeconds = null;
	this.configureDelegate = null;
  }
}



var chartEditorDialog;

function hideChartEditor() {
    chartEditorDialog.hide();
}
function showChartEditor() {
    chartEditorDialog.show();
    $(document).off('focusin.modal');
}

function encodeHtml(str) {
    return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
}
function appendMetricText( txt ) {
    var metricEditor= $('#editingMetric');
    metricEditor.val( metricEditor.val() + txt );
}

var metricChartTypes= [
  {name:"Area", type: "area"},
  {name:"Bar", type: "bar"},
  {name:"Line", type: "line"},
  {name:"Scatter Plot", type: "scatterplot"}
];

