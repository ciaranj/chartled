$(function() {
  chartledDefinition= new Chartled.ChartledDefinition({
	layout: {
		type: "fixed-grid",
		gridMinSize: 50,
		gridMargin: 5
	}
  },
  $(".gridster"), "");
});


var previousFromValue= "";
var previousToValue= "";
setInterval(function(){
    if( previousFromValue != $("#from").val() || previousToValue != $("#to").val()) {
      previousFromValue= $("#from").val();
      previousToValue= $("#to").val();
      chartledDefinition.setTimeRange(previousFromValue, previousToValue);
    }
}, 1000);

function addNewChart( metrics ) {
	chartledDefinition.addNewChartle( {
		"type": "Chartled.ChartChartle", 
		"metrics": metrics
	}, 4, 2 );
}

function addNewTextBox() {
	chartledDefinition.addNewChartle( {
		"type": "Chartled.TextChartle", 
		text:"<h4>Something Awesome</h4>"
	}, 3, 1 );
}

function addNewSpacer() {
	chartledDefinition.addNewChartle( {
		"type": "Chartled.SpacerChartle"
	}, 2, 2 );
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