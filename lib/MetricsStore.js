var ceres   = require('../../ceres'),
    fs      = require('fs'),
    MetricInfo = require('./MetricInfo'),
    path    = require('path');

var MetricsStore= function( treePath ) {
    var that= this;
    that.availableMetrics= null;
    //Racey :/
    ceres.CeresTree.getTree(treePath, function(err, t ) {
      // Handle error somehow.
      that.tree= t;
    });
}

MetricsStore.prototype.getAvailableMetrics= function( cb ) {
    var that= this;
    if( that.availableMetrics !== null ) {
        cb( null, that.availableMetrics );   
    } else {
        that.tree.find( "**/*", function(err, nodes) {
          that.availableMetrics= {};
          var popNode= function() {
            var node= nodes.pop();
            that.availableMetrics[node.nodePath] = new MetricInfo(node.nodePath, node.fsPath, {}, node);
            if(nodes.length == 0 ) {
              if( cb ) cb(null, that.availableMetrics );
            } 
            else {
              popNode();
            }
          }
          popNode();
        });
    }
}

MetricsStore.prototype.fetchMetricData= function( metric, from, to, dataCallback ) {
  // TODO: cache data in same request.. or something like that..
  this.availableMetrics[ metric ].node.read( from, to, function( err, tsd ) {
    if( err ) dataCallback( err );
    else dataCallback( null, {values: tsd.values, tInfo: [tsd.startTime, tsd.endTime, tsd.timeStep] });
  });
}

module.exports= MetricsStore;