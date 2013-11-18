var chartles= [];
var layout;

$(function() {
  chartledDefinition= new Chartled.ChartledDefinition({
    chartleMinSize: 50,
    chartleMargin: 5
  },
  $(".gridster"));
});

var chartCounter= 0;
var textBoxCounter= 0;
var spacerCounter= 0;

var lookback= $("#lookback");
var previousValue= 1800;
if( lookback ) {
    setInterval(function(){
        if( previousValue != $("#lookback").val() ) {
            for(var c in chartles ) {
                previousValue= $("#lookback").val();
                chartles[c].maxAgeInSeconds= previousValue;
                displayRollingChart(c);
            }
        }
    }, 250);
}

function addNewChart( metrics ) {
    chartCounter ++;
    var id= 'chart' + chartCounter;
    new Chartled.ChartChartle( id, layout, metrics );
}

function addNewTextBox() {
    textBoxCounter++;
    var id= "textbox" + textBoxCounter;
    chartles[ id ] = new Chartled.TextChartle(id, layout, "<h4>Some Awesome Text</h4>");
}

function addNewSpacer() {
    spacerCounter++;
    var id= "spacer" + spacerCounter;
    chartles[ id ] = new Chartled.SpacerChartle(id, layout);
}

function exportChartles() {
    var html= "<h2>Chartled Export</h2>";
    html += "<textarea class='span7' style='height:240px'>" + JSON.stringify(chartledDefinition.serialize(),null, "  ") + "</textarea>";

    bootbox.dialog( html, [{
                    "label" : "OK",
                    "class" : "btn-primary"
                }], {"backdrop": false, "animate":false});
}

function importChartles() {
    var html= "<h2>Chartled Import</h2>";
    html += "<textarea class='span7' style='height:240px' id='chartledDefinitionToImport'></textarea>";

    bootbox.dialog( html, [{
                    "label" : "OK",
                    "class" : "btn-primary",
                    "callback": function() {
                      var newDefinition= $('#chartledDefinitionToImport').val();
                      chartledDefinition.deserialize( JSON.parse( newDefinition ) );
                    }
                },  
                {
                    "label" : "Cancel", 
                    "class" :"btn-default"
                }], {"backdrop": false, "animate":false});
}