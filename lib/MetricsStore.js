var ceres   = require('ceres'),
    fs      = require('fs'),
    MetricInfo = require('./MetricInfo'),
    path    = require('path');

var MetricsStore= function( treePath, cb ) {
    var that= this;
    that.availableMetrics= null;
    //Racey :/
    ceres.CeresTree.getTree(treePath, function(err, t ) {
      if( err && cb ) cb(err);
      else {
        that.tree= t;
        if( cb ) cb();
      }
    });
}

MetricsStore.prototype.getAvailableMetrics= function( cb ) {
    var that= this;
    if( that.availableMetrics !== null ) {
        if( cb ) cb( null, that.availableMetrics );
    } 
    else {
      that.availableMetrics= [];
      that.tree.walk( function(node, cb) {
        that.availableMetrics[node.nodePath] = new MetricInfo(node.nodePath, node.fsPath, {}, node);
        cb();
      }, 
      function(err) {
        cb(err);
      });
    }
}

MetricsStore.prototype.fetchMetricData= function( metric, from, to, dataCallback ) {
  // TODO: cache data in same request.. or something like that..
  var that= this;
  var node= that.availableMetrics[ metric ].node;
  node.read( from, to, function( err, tsd ) {
    if( err ) dataCallback( err );
    else {
      // Now data has been read we can safely update the aggregationmethod.
      if( node.metadata ) {
        that.availableMetrics[ metric ].info.aggregationMethod= node.metadata.aggregationMethod;
      }
      dataCallback( null, {values: tsd.values, tInfo: [tsd.startTime, tsd.endTime, tsd.timeStep] });
    }
  });
}

module.exports= MetricsStore;