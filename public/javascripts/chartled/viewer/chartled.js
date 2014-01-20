function startAgain( definition ) {
  if( typeof(chartledDefinition) != 'undefined' ) { 
    chartledDefinition.dispose();
    if( document.getElementById("gridster") ) {
      document.getElementById("contents").removeChild( document.getElementById("gridster") );
    }
  }

  var gridster= document.createElement("div");
  gridster.setAttribute("id", "gridster");
  gridster.setAttribute("class", "container gridster");
  document.getElementById("contents").appendChild( gridster );
  chartledDefinition= new Chartled.ChartledDefinition(definition, gridster, "");
}
$(function() {
  startAgain({
    chartles: [{
        "id": "chartle-1"
      , "type": "Chartled.NumberChartle"
      , "title": "Flush Time (last hour)"
      , "moreInfo": "Average in ms"
      , "metric": "summarize(stats.statsd.ceres.flushTime, \"1hour\", true)"
    },
    {
        "id": "chartle-2"
      , "type": "Chartled.ClockChartle"
    }]
    , clocks: [{id:1, refreshRate:60, from:"-30minutes", to: "now", description:"default", chartleIds:["chartle-1"]}, {id:2, refreshRate:1, from:'now-1s', to:'now', description: "LastSecond", chartleIds:["chartle-2"]}]
    , "nextChartleId": 3
    , layout: {
        type: "fixed-grid",
        gridMinSize: 50,
        gridMargin: 5,
        "positions": [{
          "id": "chartle-1",
          "col": 1,
          "row": 1,
          "size_x": 2,
          "size_y": 2
        },
        {
          "id": "chartle-2",
          "col": 3,
          "row": 1,
          "size_x": 2,
          "size_y": 2
        }]
      }
  });
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
                      startAgain( JSON.parse( newDefinition ) );
                    }
                },  
                {
                    "label" : "Cancel", 
                    "class" :"btn-default"
                }], {"backdrop": false, "animate":false});
}