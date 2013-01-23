var TargetParseContext= require("../lib/TargetParseContext"),
    MetricStore= require("../lib/MetricsStore");

function buildTargetParseContext( targetString, metrics, metricValues) {
    var realMetrics= {};
    for( var k in metrics ) {
        realMetrics[metrics[k].name]= metrics[k];
        realMetrics[metrics[k].name].info= {aggregationMethod: "average"};
        realMetrics[metrics[k].name].filename= metrics[k].name;
    }


    var hoardStub= {
      fetch: function( filename, from, to, cb ) {
        cb( null, [], (metricValues === undefined || metricValues[filename] === undefined ) ? []:metricValues[filename] );
      },
      info: function( filename, cb ) {
        cb( null, {} );
      }
    }
    var ms= new MetricStore( "/tmp", hoardStub);
    ms.availableMetrics= realMetrics;
    return new TargetParseContext( ms, targetString, 0, 0 ) ;
}

module.exports.buildTargetParseContext= buildTargetParseContext;