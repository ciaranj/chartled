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
  setPageModeReadOnly();
}

var previousFromValue= "";
var previousToValue= "";
setInterval(function(){
    if( previousFromValue != $("#from").val() || previousToValue != $("#to").val()) {
      if( typeof(chartledDefinition) != 'undefined' ) {
        previousFromValue= $("#from").val();
        previousToValue= $("#to").val();
        var defaultClock= chartledDefinition.timeKeeper.getClock("default");
        chartledDefinition.timeKeeper.updateClock( defaultClock.id, {from: previousFromValue, until: previousToValue} );
      }
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
function addNewNumber() {
	return chartledDefinition.addNewChartle( {
		"type": "Chartled.NumberChartle"
	}, 1, 2, 2 );
}

function exportChartles() {
  var serialisedDefinition= chartledDefinition.serialize();
  $.post("/share", serialisedDefinition, function(data) {
    var html = "<textarea style='width:100%;height:240px'>" + JSON.stringify(serialisedDefinition,null, "  ")+ "</textarea>";
        html+= "<a target='_blank' href='" + window.location.origin + "/" + encodeURIComponent(data)+ "'> Shareable Link</a>";
    bootbox.dialog( { message:html,
                      title: "Chartled Export",
                      buttons:{
                        "Ok" : {
                          className: "btn-primary"
                        }
                      },
                      "backdrop": true,
                      "animate" : false
                    });
  })
  .fail(function() {
      alert("Problem sharing current definition");
  });


}

function importChartles() {
    var html = "<textarea style='width:100%;height:240px' id='chartledDefinitionToImport'></textarea>";
    bootbox.dialog( { message:html,
                      title: "Chartled Import",
                      buttons:{
                        "Ok" : {
                          className: "btn-primary",
                          callback: function() {
                            // 'cache' the definition value as the DOM will get torn down before our
                            // set timeout fires (we use a settimeout deliberately so the import dialog
                            // doesn't hang around whilst we're re-building...
                            var newDefinition= $('#chartledDefinitionToImport').val();
                            setTimeout(function() {
                              startAgain( JSON.parse( newDefinition ) );
                            }, 0);
                          }
                        },
                        "Cancel" : {
                          className: "btn-default"
                        }
                      },
                      "backdrop": true,
                      "animate" : false
                    });
}