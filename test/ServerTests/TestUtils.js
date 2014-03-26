var 
    CeresTree= require("ceres").CeresTree,
    TargetParseContext= require("../../lib/TargetParseContext"),
    MetricsStore= require("../../lib/MetricsStore");

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

    var ms= new MetricsStore( "/tmp" );
    ms.availableMetrics= realMetrics;
    return new TargetParseContext( ms, targetString, from, to ) ;
}

function populateRealMetricsStore( storedData, cb ) {
  var tmp_dir= "tree_" + new Date().getTime();
  CeresTree.create(tmp_dir, function(err, tree) {
    if( err ) { cb(err); }
    else {
      var keys=[];
      for(var k in storedData) { keys.push(k); }
      function popNext() {
        if( keys.length == 0 ) { 
          var metricsStore= new MetricsStore(tree.root, function(err) {
            if( err ) { cb(err); }
            else {
              metricsStore.getAvailableMetrics( function(err) {
                cb( err, metricsStore );
              });
            }
          });
        }
        else {
          var key= keys.shift();
          tree.createNode(key, {}, function(err, node) {
            if( err ) { cb(err); }
            else {
              node.write(storedData[key].data, function(err) {
                if( err ) { cb(err); }
                else {
                  setImmediate( popNext );
                }
              });
            }
          });
        }
      }
      popNext();
    }
  });
};

module.exports.buildTargetParseContext= buildTargetParseContext;
module.exports.populateRealMetricsStore= populateRealMetricsStore;