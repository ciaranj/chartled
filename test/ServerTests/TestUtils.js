var TargetParseContext= require("../../lib/TargetParseContext"),
    MetricStore= require("../../lib/MetricsStore");

function buildTargetParseContext( targetString, metrics, metricValues, tInfo, from, to) {
    var realMetrics= {};
    var firstK= null;
    for( var k in metrics ) {
        if( firstK == null ) firstK= metrics[k].name;
        realMetrics[metrics[k].name]= metrics[k];
        realMetrics[metrics[k].name].info= {aggregationMethod: "avg"};
        realMetrics[metrics[k].name].filename= metrics[k].name;
        
        realMetrics[metrics[k].name].node = (function(name){
          return {
            read: function( from, to, cb ) {
              cb( null, {startTime:tInfo[0], endTime:tInfo[1], timeStep:tInfo[2], values:(metricValues === undefined || metricValues[name] === undefined ) ? []:metricValues[name]});
            }};
        })(metrics[k].name);
    }
    
    
    if( tInfo === undefined ) {
      var t= Math.floor( new Date().getTime() / 1000 );
      var interval= 10;
      var f= t - ( metricValues[firstK].length * interval);
      tInfo= [f, t, interval];
    }
    if( from === undefined ) from= 0;
    if( to === undefined ) to= 0;

    var ms= new MetricStore( "/tmp" );
    ms.availableMetrics= realMetrics;
    return new TargetParseContext( ms, targetString, from, to ) ;
}

module.exports.buildTargetParseContext= buildTargetParseContext;