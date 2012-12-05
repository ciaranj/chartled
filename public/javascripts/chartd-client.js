var charts= [];

beginDisplayRollingChart= function(metric, w, h, chartId) {
  
  for(var key in metric) {
    metric[key].axis= 0;
    var val= Math.random();
    if( val < 0.3 ) {
      metric[key].layer= 0;
    }
    else if( val >= 0.3 && val <0.6 ) {
      metric[key].layer= 1;
    }
    else {
      metric[key].layer= 2;
    }
  }
  charts[chartId]= {
    metrics: metric,
    w: w,
    h: h,
    maxAgeInSeconds: previousValue,
    chart: new Chart( "chart" + chartId, w, h, {
      metrics: metric,
      layers: [{renderer : "area"},{renderer : "bar"}, {renderer : "line", dropShadow: true}],
      axes: {
        x:{display: true}, 
        y:[{
            display: "left"
           }]}
    })
  };
  displayRollingChart( chartId );
  queueChartRefresh( chartId );
}


displayRollingChart= function( chartId ) {
    var chart= charts[chartId];
    var metric= chart.metrics;
    var w= chart.w;
    var h= chart.h;
    var maxAgeInSeconds= chart.maxAgeInSeconds - 20;
    
    var now= Math.round( new Date().getTime() / 1000 ) - 20;
    var dataUrl=  "/series?from=" + ( now - maxAgeInSeconds ) + "&to=" + now;
    for( var k in metric ) {
        dataUrl += "&target=" + metric[k].value;
    }
    chart.loading= true;
    d3.json(dataUrl, function( data ) {
      if( data ) {
        // Happy path
        chart.chart.refreshData( data );
      } else {
        // Error path.
        console.log( "Problem calling: " + dataUrl );
      }
      chart.loading= false;
    });
/*    $.ajax( {
        url:dataUrl,
        dataType: 'json',
        success: function( data ) {
            var palette = new Rickshaw.Color.Palette( { scheme: 'munin'} );
            var chartEl= $("#chart"+chartId);
            chartEl.empty();
            var legendEl= $("#legend"+chartId);
            legendEl.empty();
            var actualMetric= null;
            for( var key in data ) {
              for( var mK in metric ) {
                if( metric[mK].value == data[key].targetSource ) {
                  actualMetric= metric[mK];
                  break;
                }
              }
                var rawLength= data[key].datapoints.length;
                var skipFactor = 0;
                if( rawLength > w ) {
                    skipFactor= Math.round( rawLength / w );
                }
                var series= [];
                data[key].data= series;
                var skipFactorCounter= 0;
                var cumulative= 0;
                //TODO: make this aware of how aggregation should be applied.
                var cumulativeX= data[key].datapoints[0][1];
                for( var i in data[key].datapoints ) {
                    cumulative += ( data[key].datapoints[i][0] == null ? 0: data[key].datapoints[i][0] );
                    if( skipFactorCounter++ >= skipFactor ) {
                        series[series.length]= { x: cumulativeX, y: cumulative }
                        skipFactorCounter= 0;
                        cumulative= 0;
                        if( i <=  data[key].datapoints.length ) {
                            cumulativeX= data[key].datapoints[i][1];
                        }
                        else {
                            cumulativeX= -1;
                        }
                    }
                }
                if( cumulativeX != -1 && skipFactorCounter != 0 ) {
                    series[series.length]= { x: cumulativeX, y: cumulative }
                }
                data[key].datapoints= [];
                data[key].color= palette.color();
                data[key].name= data[key].target;
                
                data[key].renderer= actualMetric.renderer;
                delete data[key].target;
                
            }

            var graph = new Rickshaw.Graph( {
                element: chartEl[0], 
                width: w, 
                height: h,
                stroke: true,
                series: data,
                renderer: "multi"
            });
            graph.render();
            var yAxis = new Rickshaw.Graph.Axis.Y({
                graph: graph,
                tickFormat: Rickshaw.Fixtures.Number.formatKMBT
            });
            yAxis.render();
            var xAxis = new Rickshaw.Graph.Axis.Time({
                graph: graph
            });
            xAxis.render();
 
            var legend = new Rickshaw.Graph.Legend({
                graph: graph,
                element: document.getElementById('legend'+chartId)
            });
            

            var order = new Rickshaw.Graph.Behavior.Series.Order({
                graph: graph,
                legend: legend
            });
            var shelving = new Rickshaw.Graph.Behavior.Series.Toggle({
                graph: graph,
                legend: legend
            });

            var hoverDetail = new Rickshaw.Graph.HoverDetail.Multi( {
                graph: graph
            } );
            var highlighter = new Rickshaw.Graph.Behavior.Series.Highlight({
                graph: graph,
                legend: legend
            });
            queueChartRefresh( chartId );
        },
        error: function( err ) {
            console.log(  err );
        }
    } );*/
} 
function queueChartRefresh( chartId ) {
    setInterval( function() {
        if( !charts[chartId].loading ) {
          displayRollingChart( chartId );
        }
    }, 10000 );
}

var chartCounter= 0;
function removeMetric ( metricIndex ) {
  
  var currentMetrics= activeEditedChart.metrics;
  var newMetrics= [];
  for( var i=0;i< currentMetrics.length; i++ ){
    if( i != metricIndex) newMetrics[newMetrics.length]= currentMetrics[i];
  }
  activeEditedChart.metrics= newMetrics;
  buildMetrics();
}

var activeEditedChart;
var originalChart;

function cloneChart( chart ) {
    var clonedChart= {
        w: chart.w,
        h: chart.h,
        maxAgeInSeconds: chart.maxAgeInSeconds,
        metrics: [],
        chart: chart.chart        
    };
    for(var i=0;i< chart.metrics.length; i++ ) {
        clonedChart.metrics[i]= {
          value:chart.metrics[i].value,
          renderer: chart.metrics[i].renderer
        };
    }
    return clonedChart;
}
function buildMetrics() {
    var metrics= activeEditedChart.metrics;
    var metricsTable= document.getElementById("metrics");
    var html= "";
    for( var k=0; k< metrics.length; k++ ) {
        html += "<tr>";
        html += "<td style='width:20px'> <button class='btn btn-danger btn-mini' type='button' onclick='removeMetric(" + k + ")'><i class='icon-remove'></i></button></td>";
        html += "<td class='metric' onclick='configureMetric("+k+")' data-original-title='Metric Details' data-content=\"" + encodeHtml(metrics[k].value) + "\">" + (metrics[k].value.length> 60 ? encodeHtml(metrics[k].value.substring(0, 60)) +"..." : encodeHtml(metrics[k].value)) + "</td>";
        html += "</tr>";
    }
    metricsTable.innerHTML = html;
    $('.metric').popover({trigger:'hover', placement:'right'});
}

function updateUnderlyingChart( chartId, chart ){
    charts[chartId]= chart;
    displayRollingChart( chartId );
}
var configuringChart= false;

function previewChart ( chartId ) {
    updateUnderlyingChart( chartId, activeEditedChart );
}
var chartEditorDialog;

function hideChartEditor() {
    chartEditorDialog.hide();
}
function showChartEditor() {
    chartEditorDialog.show();
    $(document).off('focusin.modal');
}

function addMetricClick() {
    configureMetric(-1);
}
 
function configureChart( chartId ) {
    if( configuringChart ) return;
    else configuringChart= true;
    activeEditedChart= cloneChart( charts[chartId] );
    originalChart= cloneChart( charts[chartId] );
    var chart= originalChart;
    var metrics= chart.metrics;
    
    var html= "<h2>Configure Chart #" + chartId +"</h2>";
    html += "<h3>Chart Options</h3>";
    html += "<h3>Metrics</h3>";
    html += "<table class='table table-striped table-bordered metrics table-hover table-condensed'>";
    html +="<thead>";
    html +="<tr>";
    html +="<td colspan='2' style='text-align:right'><button class='btn btn-success btn-mini' type='button' onclick='addMetricClick()'>Add Metric</button></td>"
    html +="</tr>";
    html +="</thead><tbody id='metrics'>";
    html += "</tbody></table>"
    
    html +="<div class='span5'><button class='btn btn-info' type='button' onclick='previewChart("+chartId+")'>Preview</button></div>"
    

    chartEditorDialog= bootbox.dialog( html, [
                {
                    "label" : "OK",
                    "class" : "btn-primary",
                    "callback": function() {
                        updateUnderlyingChart( chartId, activeEditedChart );
                        configuringChart= false;
                    }
                },  
                {
                    "label" : "Cancel", 
                    "class" :"btn-default",
                    "callback": function() {
                        updateUnderlyingChart( chartId, originalChart );
                        configuringChart= false;
                    }
                }
    ], {"backdrop": false, "animate":false, "classes":"graphEditor"});
    buildMetrics();
}

function addNewChart( metrics ) {
    chartCounter ++;
    var charts= $("#charts");
    charts.append( "<div class='draggable span2'><div id='chart"+ chartCounter + "' onclick=\"configureChart("+chartCounter +")\"/>");
    beginDisplayRollingChart( metrics, 140, 140, chartCounter )    
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

var functionsDropDownString= null;
function getFunctionsDropDown() {
    if( functionsDropDownString == null ) {
        functionsDropDownString= "";
        var functions= chartd.functions
        for( var f in functions ) {
            functionsDropDownString += "<li><a href='#' onclick='appendMetricText(\"" + encodeHtml(functions[f].example) + "\")'>"+ encodeHtml(functions[f].name)+"</a></li>"
        }
    }
    return functionsDropDownString;
}

var metricsDropDownString= null;
function getMetricsDropDown() {
    if( metricsDropDownString == null ) {
        metricsDropDownString= "";
        var metrics= chartd.metrics
        for( var f in metrics ) {
            metricsDropDownString += "<li><a href='#' onclick='appendMetricText(\"" + encodeHtml(f) + "\")'>"+ encodeHtml(f)+"</a></li>"
        }
    }
    return metricsDropDownString;
}

var metricChartTypes= [
  {name:"Area", type: "area"},
  {name:"Bar", type: "bar"},
  {name:"Line", type: "line"},
  {name:"Scatter Plot", type: "scatterplot"}
];

/** Metric editing related stuff **/
function configureMetric( metricId ) {

    hideChartEditor();

    var html= "";
    if( metricId == -1 ) {
        html += "<h2>Create new metric</h2>";
    }
    else {
        html += "<h2>Configure Metric #" + (metricId + 1) + "</h2>";
    }
    
    var metric= {value:"", renderer:'line'};
    if( metricId != -1) {
        metric= activeEditedChart.metrics[ metricId ];
    }
    html += "<div class='btn-toolbar'>";
    html += "<div class='btn-group'>";
    html += "<button class='btn dropdown-toggle btn-info' data-toggle='dropdown' href='#'>Functions <span class='caret'></span></button><ul class='dropdown-menu'>"
    html += getFunctionsDropDown();
    html += "</ul>";
    html += "</div>";
    html += "<div class='btn-group'>";
    html += "<a class='btn dropdown-toggle btn-info' data-toggle='dropdown' href='#'>Metrics <span class='caret'></span></a><ul class='dropdown-menu'>"
    html += getMetricsDropDown();
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
                        var newMetricRenderer= metricChartTypes[$('.metricEditor div.btn-group .btn.active input').val()].type;
                        if( newMetricValue != "" ) {
                            //TODO: assert valid  here..
                            if( metricId == -1 ) metricId= activeEditedChart.metrics.length;
                            activeEditedChart.metrics[metricId]= { value: newMetricValue, renderer:newMetricRenderer };
                        }
                        buildMetrics();
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
}

var lookback= $("#lookback");
var previousValue= 1800;
if( lookback ) {
    setInterval(function(){
        if( previousValue != $("#lookback").val() ) {
            for(var c in charts ) {
                previousValue= $("#lookback").val();
                charts[c].maxAgeInSeconds= previousValue;
                displayRollingChart(c);
            }
        }
    }, 250);
}

