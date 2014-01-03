var CSVResponseRenderer = require("./lib/response_renderers/csv"),
  DatesAndTimes = require("./lib/utils/DatesAndTimes"),
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
  return DatesAndTimes.parseATTime( moment );
}
  
var metricsStore= new MetricsStore( __dirname + path.sep + ".." + path.sep +"statsd"+ path.sep+ "ceres_tree");

var app = express();
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views')
app.set('view engine', 'jade')


app.get('/', function(req, res){
  res.render('index', { title : 'Home' })
});

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

process.on('uncaughtException', function (err) {
  console.log( err.stack );
});

app.listen(3000);
console.log('Listening on port 3000');
