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
  
function parseMoment(momentReqParam, unspecifiedValue, tz) {
  var moment = momentReqParam ? momentReqParam: unspecifiedValue;
  try {
    var result= DatesAndTimes.parseATTime( moment, tz );
    return result
  }
  catch(e) {
    console.log("Problem parsing: '" + moment +"', ", e.message);
    throw e;
  }
}
  
var definitionSharer= new DefinitionSharer();

var zones= require('moment-timezone').tz.zones();
var timeZones= [];
for( var k in zones ) {
  timeZones.push(zones[k].displayName);
}
timeZones.sort();
zones= null;

var app = express();
app.use(function(req, res, next){
 res.setHeader('Access-Control-Allow-Origin', '*');
 res.setHeader('Access-Control-Allow-Methods', '*');
 next();
});

app.use(express.bodyParser());
app.set('views', __dirname + '/views')
app.set('view engine', 'jade')
app.disable('etag');

app.get('/timezones', function(req,res) {
  res.send( timeZones );
});

app.get('/explorer', function(req, res){
  metricsStore.getAvailableMetrics( function( err, metrics ) {
      res.render('explorer', { title : 'Explorer', 'metrics': metrics })
  });
});
app.get('/metrics/find', function(req, res){
  metricsStore.getAvailableMetrics( function( err, metrics ) {
    var resultArray=[];
    for(var k in metrics) {
      resultArray.push({
        "leaf": 0,
        "context": {},
        "text":k,
        "id": k,
        "allowChildren":1
        });
    }
    res.send( JSON.stringify(resultArray) );
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


app.get('/series',getSeriesData);

// Support graphite style 'render' urls too.
app.get('/render',getSeriesData);
app.post('/render',getSeriesData);

function getSeriesData(req,res) {
  var dataSource= req.query;

  if(typeof(req.body) === 'object' && typeof(req.body.target) != 'undefined') {
    dataSource= req.body;
  }

  var tz= dataSource.tz;
  if( !tz ) tz="Europe/London";
  var from= parseMoment(dataSource.from, "yesterday", tz);
  var to= parseMoment(dataSource.until, "now", tz);
  if( to <= from  || from < 0 || to < 0 ) throw new Error( "Calculated/Passed time frame invalid, '" + from + "' -> '"+ to +"'");
  var now= new Date().getTime();

  //TODO: danger, no checking of params!!!
  var metrics= dataSource.target;
  var format= dataSource.format;

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
              function (seriesList) {
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
          });
      })( unescape(metrics[k]) );
  }
}
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
  var isDashboard= false;
  var dashboardColour= "black";
  if( req.query.dashboard ) {
    isDashboard = req.query.dashboard.toLowerCase() == 'true';
  }
  if( req.query.dashboardcolour ) {
    dashboardColour= req.query.dashboardcolour;
  }
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
  , clocks: [{id:1, refreshRate:60, from:"-30minutes", to: "now", description:"default", chartleIds:["chartle-1"], timeZone: "Europe/London"}, 
             {id:2, refreshRate:1, from:'now-1s', to:'now', description: "LastSecond", chartleIds:["chartle-2"], timeZone: "Europe/London"}]
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
    res.render('index', { title : 'Home', definition: JSON.stringify(sampleDefinition), 'isDashboard': isDashboard, 'dashboardColour': dashboardColour});
  }
  else {
    definitionSharer.decode(d, function(err, definition) {
      if( err ) {
        console.log( err );
        definition= sampleDefinition;
      }
       res.render('index', { title : 'Home', definition: JSON.stringify(definition), 'isDashboard': isDashboard, 'dashboardColour': dashboardColour})
    });
  }
});

app.use(express.static(__dirname + '/public'));

process.on('uncaughtException', function (err) {
  console.log( err.stack );
});

console.log("Preloading metrics...")
var metricsStore= new MetricsStore( __dirname + path.sep + ".." + path.sep +"statsd"+ path.sep+ "ceres_tree", function(err) {
  if( err ) console.log( "Problem loading in the metrcs", err);
  else {
    metricsStore.getAvailableMetrics(function( err ) {
      app.listen(3000);
      console.log('Listening on port 3000');
    });
  }
});
