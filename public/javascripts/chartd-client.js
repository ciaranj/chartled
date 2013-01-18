var charts= [];

beginDisplayRollingChart= function(metric, w, h, chartId) {
  
  for(var key in metric) {
    metric[key].axis= 0;
/*    
    var val= Math.random();
    if( val < 0.3 ) {
      metric[key].layer= 0;
    }
    else if( val >= 0.3 && val <0.6 ) {
      metric[key].layer= 1;
    }
    else {
      metric[key].layer= 2;
    }  */
    
    metric[key].layer =2;
  }   
  charts[chartId]= {
    metrics: metric,
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
/*    var w= chart.w;
    var h= chart.h; */
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
        maxAgeInSeconds: chart.maxAgeInSeconds,
        metrics: [],
        chart: chart.chart        
    };
    for(var i=0;i< chart.metrics.length; i++ ) {
        clonedChart.metrics[i]= {
          value:chart.metrics[i].value,
          layer: chart.metrics[i].layer
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
  //TODO: THIS IS A BROKEN HACK .. the config is not being properly
  // dealt with.
    chart.chart.config.metrics= chart.metrics;
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
function resizeChart( el ) {
  var id= el.attr("id");
  if( id && id.length > 5 && id.substring(0, 5) == "chart") {
    var chart= charts[id.substring(5)].chart;
    chart.resize( el.width(), el.height() );
  }
}
var margin= 30;
var size= 70;
function nS( val ){
  return Math.floor(val/10) * 10;
}
function addNewChart( metrics ) {
    chartCounter ++;
    var charts= $("#charts");
    charts.append( "<div class='draggable' style='width:170px;height:70px;background-color:white' id='chart"+ chartCounter + "' onclick=\"configureChart("+chartCounter +")\"><ul class='buttons'><li class='hpl'>h+</li><li class='hmi'>h-</li><li class='wpl'>w+</li><li class='wmi'>w-</li></ul></div>");
    $(".hpl").unbind("click").click( function(e) {
        e.stopPropagation();
        var el= $(this).parent().parent();
        el.height( nS(el.height() + size + margin) );
        resizeChart( el );
    });
    $(".hmi").unbind("click").click( function(e) {
      e.stopPropagation();
      var el= $(this).parent().parent();
        if( nS(el.height()) > size ) {
          el.height(  nS(el.height() - (size + margin)) );
          resizeChart( el );
          }
    });
    $(".wmi").unbind("click").click( function(e) {
      e.stopPropagation();
      var el= $(this).parent().parent();
      console.log( el.width() )
        if( nS(el.width()) > size ) {
          el.width( nS(el.width() - (size + margin)) );
          resizeChart( el );
        }
    });    
    $(".wpl").unbind("click").click( function(e) {
      e.stopPropagation();
      var el= $(this).parent().parent();
      el.width( nS(el.width() + size + margin) );
      resizeChart( el );
    });
    beginDisplayRollingChart( metrics, 170, size, chartCounter )    
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
    
    var metric= {value:"", layer:2};
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
//                        var newMetricRenderer= metricChartTypes[$('.metricEditor div.btn-group .btn.active input').val()].type;
                        var newMetricRenderer=2;
                        if( newMetricValue != "" ) {
                            //TODO: assert valid  here..
                            if( metricId == -1 ) metricId= activeEditedChart.metrics.length;
                            activeEditedChart.metrics[metricId]= { value: newMetricValue, layer:newMetricRenderer };
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

