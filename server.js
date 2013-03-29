var express = require('express'),
    hoard   = require('hoard'),
    fs      = require('fs'),
    MetricsStore= require('./lib/MetricsStore'),
    path    = require('path'),
    TargetParseContext= require("./lib/TargetParseContext"),
    TargetParser= require("./lib/TargetParser");
  
var metricsStore= new MetricsStore( __dirname + path.sep + ".." + path.sep + "statsd"+ path.sep+ "wsp_data", hoard);

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
    var js= "try { if( chartd == undefined) chartd= {};} catch (e ) { chartd= {}; }  chartd.metrics= " + JSON.stringify( metrics ) + ";";
    res.send( js );
  });
});

app.get('/series', function(req, res){
    //TOTEST: mis-matched time frames.
    //TODO: danger, no checking of params!!!
    var from= parseInt(req.query.from);
    var to= parseInt(req.query.to);
    var metrics= req.query.target;
    var now= new Date().getTime();

    var results= [];
    if( !Array.isArray( metrics ) ) {
        metrics= [metrics];
    }
    
    var metricsCountDown= metrics.length;
    var carryOn= function() {
        metricsCountDown--;
        if( metricsCountDown <=0 ) {
            res.set({'Content-Type': 'application/json' });
            //TODO: think results should come back in target order. (wildcards alpha sorted)
            results= results.sort( function compare(a,b) {
                return (a.target<b.target?-1:(a.target>b.target?1:0));
            });
            res.send( results )
            console.log(req.url + " completed in: " + (new Date().getTime() - now) + "ms");
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
                                aggregationMethod: seriesList[i].info.aggregationMethod
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
