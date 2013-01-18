var TargetParseContext= require("../lib/TargetParseContext");

function buildTargetParseContext( targetString, metrics, metricValues ) {
    var realMetrics= {};
    for( var k in metrics ) {
        realMetrics[metrics[k].name]= metrics[k];
        realMetrics[metrics[k].name].info= {aggregationMethod: "average"};
    }
    var mStore= {
        getAvailableMetrics: function( callback ) {
            process.nextTick(function() {
                callback( null, realMetrics );
            });
        },
        fetchMetricData:function( metric, from, to, dataCallback  ) {
            process.nextTick(function() {
                dataCallback( null, {
                                    values: (metricValues === undefined || metricValues[metric] === undefined ) ? []:metricValues[metric] , 
                                    tInfo: []} );
            });
        }
    }
    return new TargetParseContext( mStore, targetString, 0, 0 );
}

module.exports.buildTargetParseContext= buildTargetParseContext;