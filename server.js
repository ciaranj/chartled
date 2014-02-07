var CSVResponseRenderer = require("./lib/response_renderers/csv"),
  DatesAndTimes = require("./lib/utils/DatesAndTimes"),
  DefinitionSharer= require("./lib/DefinitionSharer").DefinitionSharer,
  express = require('express')
    fs      = require('fs'),
  JSONResponseRenderer= require("./lib/response_renderers/json"),
    MetricsStore= require('./lib/MetricsStore'),
    path    = require('path'),
  RawResponseRenderer= require("./lib/response_renderers/raw"),
    TargetParseContext= require("./lib/TargetParseContext"),
    TargetParser= require("./lib/TargetParser");
  
function parseMoment(momentReqParam, unspecifiedValue) {
  var moment = momentReqParam ? momentReqParam: unspecifiedValue;
  try {
    var result= DatesAndTimes.parseATTime( moment );
    return result
  }
  catch(e) {
    console.log("Problem parsing: '" + moment +"', ", e.message);
    throw e;
  }
}
  
var metricsStore= new MetricsStore( __dirname + path.sep + ".." + path.sep +"statsd"+ path.sep+ "ceres_tree");
var definitionSharer= new DefinitionSharer();

var app = express();
app.use(express.static(__dirname + '/public'));
app.use(express.bodyParser());
app.set('views', __dirname + '/views')
app.set('view engine', 'jade')



app.get('/explorer', function(req, res){
  metricsStore.getAvailableMetrics( function( err, metrics ) {
      res.render('explorer', { title : 'Explorer', 'metrics': metrics })
  });
});

app.get('/metrics', function(req, res){
  metricsStore.getAvailableMetrics( function( err, metrics ) {
    res.set({'Content-Type': 'text/javascript' });
    var results= {};
    
    for(var k in metrics ) {
      results[k] = { "name": metrics[k].name};
    }
    var js= "try { if( chartd == undefined) chartd= {};} catch (e ) { chartd= {}; }  chartd.metrics= " + JSON.stringify( results ) + ";";
    res.send( js );
  });
});

app.get('/series', function(req, res){
    var from= parseMoment(req.query.from, "yesterday");
    var to= parseMoment(req.query.until, "now");
    if( to <= from  || from < 0 || to < 0 ) throw new Error( "Calculated/Passed time frame invalid, '" + from + "' -> '"+ to +"'");
    var now= new Date().getTime();

    //TODO: danger, no checking of params!!!
    var metrics= req.query.target;
    var format= req.query.format;

	if( !format ) format= "json";
	
	var responseRenderer= null;
	
	switch( format.toLowerCase() ) {
		case "csv":
			responseRenderer= CSVResponseRenderer;
			break;
		case "raw":
			responseRenderer= RawResponseRenderer;
			break;
		case "json":
		default:
			responseRenderer= JSONResponseRenderer;
	}

    var results= [];
    if( !Array.isArray( metrics ) ) {
        metrics= [metrics];
    }
    
    var metricsCountDown= metrics.length;
    var carryOn= function() {
        metricsCountDown--;
        if( metricsCountDown <=0 ) {
			//TODO: think results should come back in target order. (wildcards alpha sorted)
			var r= results.sort( function compare(a,b) {
				return (a.target<b.target?-1:(a.target>b.target?1:0));
			});
			responseRenderer.renderResults( req, res, r, function(err) {
				console.log(req.url + " completed in: " + (new Date().getTime() - now) + "ms");
			});
        }
    };
    
    for( var k in metrics ) {
        (function( metric ) {
            var ctx= new TargetParseContext( metricsStore, metric, from, to );
            TargetParser.parse( metric )( ctx ).then( 
                function (result) {
                    var seriesList= result.seriesList;
                    for(var i=0; i< seriesList.length; i++ ) {
                        var series= {
                                datapoints : [],
                                target: seriesList[i].name,
                                targetSource: metric,
                                aggregationMethod: seriesList[i].info.aggregationMethod,
								// Assumes all timeseries are the same shape (they should be!)
								tInfo: seriesList[i].data.tInfo
                        };
                        results[results.length]= series;
                        var runningTime= seriesList[i].data.tInfo[0];
                        
                        for(var j=0;j < seriesList[i].data.values.length; j++) {
                            series.datapoints[series.datapoints.length]= [ seriesList[i].data.values[j], runningTime ];
                            runningTime+= seriesList[i].data.tInfo[2];
                        }
                    }
                    carryOn();
                }, function( error) {
                    console.log( error.stack );
                    carryOn();
            })
            .end();
        })( unescape(metrics[k]) );
    }
});
app.get('/favicon.ico', function(req,res){
  res.end();
});
app.post('/share', function(req,res) {
  definitionSharer.encode(req.body, function(err, result) { 
    if( err ) {
      console.log( err )
      result = "";
    }
    res.end( result );
  });

});
app.get('/:definition?', function(req, res){
  var d= req.param('definition');
  var sampleDefinition= {chartles: [{
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
  , clocks: [{id:1, refreshRate:60, from:"-30minutes", to: "now", description:"default", chartleIds:["chartle-1"]}, 
             {id:2, refreshRate:1, from:'now-1s', to:'now', description: "LastSecond", chartleIds:["chartle-2"]}]
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
  };  
  if( typeof(d) == 'undefined' ) {
    res.render('index', { title : 'Home', definition: JSON.stringify(sampleDefinition)})
  }
  else {
    definitionSharer.decode(d, function(err, definition) {
      if( err ) {
        console.log( err );
        definition= sampleDefinition;
      }
       res.render('index', { title : 'Home', definition: JSON.stringify(definition) })
    });
  }
});

process.on('uncaughtException', function (err) {
  console.log( err.stack );
});

app.listen(3000);
console.log('Listening on port 3000');
