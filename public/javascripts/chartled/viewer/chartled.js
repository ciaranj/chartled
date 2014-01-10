$(function() {
  chartledDefinition= new Chartled.ChartledDefinition({
      clocks: [{id:1, refreshRate:60, from:"-30minutes", to: "now", description:"default"}]
    , layout: {
        type: "fixed-grid",
        gridMinSize: 50,
        gridMargin: 5
    }
  }, $(".gridster"), "");
});


var previousFromValue= "";
var previousToValue= "";
setInterval(function(){
    if( previousFromValue != $("#from").val() || previousToValue != $("#to").val()) {
      previousFromValue= $("#from").val();
      previousToValue= $("#to").val();
      var defaultClock= chartledDefinition.timeKeeper.getClock("default");
      chartledDefinition.timeKeeper.updateClock( defaultClock.id, {from: previousFromValue, until: previousToValue} );
    }
}, 1000);

function addNewChart( metrics ) {
	return chartledDefinition.addNewChartle( {
		"type": "Chartled.ChartChartle", 
		"metrics": metrics
	}, 1, 4, 2 );
}

function addNewClock(  ) {
  var clockId;
  try {
    clockId= chartledDefinition.timeKeeper.getClock("LastSecond").id;
  }
  catch(e) {
    clockId= chartledDefinition.timeKeeper.addClock( {refreshRate:1, from:'now-1s', to:'now', description: "LastSecond"} );
  }
	chartledDefinition.addNewChartle( {
		"type": "Chartled.ClockChartle"
	}, clockId, 2, 2 );
}

function addNewTextBox() {
	chartledDefinition.addNewChartle( {
		"type": "Chartled.TextChartle", 
		text:"<h4>Something Awesome</h4>"
	}, null, 3, 1 );
}

function addNewSpacer() {
	chartledDefinition.addNewChartle( {
		"type": "Chartled.SpacerChartle"
	}, null, 2, 2 );
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