var TargetParseContext= require("../lib/TargetParseContext"),
    MetricStore= require("../lib/MetricsStore");

function buildTargetParseContext( targetString, metrics, metricValues, tInfo, from, to) {
    var realMetrics= {};
    var firstK= null;
    for( var k in metrics ) {
        if( firstK == null ) firstK= metrics[k].name;
        realMetrics[metrics[k].name]= metrics[k];
        realMetrics[metrics[k].name].info= {aggregationMethod: "average"};
        realMetrics[metrics[k].name].filename= metrics[k].name;
    }
    if( tInfo === undefined ) {
      var t= Math.floor( new Date().getTime() / 1000 );
      var interval= 10;
      var f= t - ( metricValues[firstK].length * interval);
      tInfo= [f, t, interval];
    }
    if( from === undefined ) from= 0;
    if( to === undefined ) to= 0;


    var hoardStub= {
      fetch: function( filename, from, to, cb ) {
        cb( null, tInfo, (metricValues === undefined || metricValues[filename] === undefined ) ? []:metricValues[filename] );
      },
      info: function( filename, cb ) {
        cb( null, {} );
      }
    }
    var ms= new MetricStore( "/tmp", hoardStub);
    ms.availableMetrics= realMetrics;
    return new TargetParseContext( ms, targetString, from, to ) ;
}

module.exports.buildTargetParseContext= buildTargetParseContext;