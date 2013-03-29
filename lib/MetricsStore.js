var fs      = require('fs'),
    MetricInfo = require('./MetricInfo'),
    path    = require('path');

var MetricsStore= function( whisperPath, hoard ) {
    var that= this;
    that.whisperPath= whisperPath;
    that.availableMetrics= null;
    that.hoard= hoard;
}

MetricsStore.prototype.getAvailableMetrics= function( cb ) {
    if( this.availableMetrics !== null ) {
        cb( null, this.availableMetrics );   
    } else {
        var that= this;
        walk( that.whisperPath, function(err, results) {
            if( err ) { 
                console.log(  "THERE WAS A PROBLEM WITH THE PATH SPECIFIED: " + that.whisperPath , err )
                if( cb ) cb( err );
            } else {
                var remainingWhispers= results.length;
                var realResults= {};
                for(var i=0;i< results.length; i++ ) {
                    (function( filename) {
                        that.hoard.info( filename, function(err, info ) {
                            if( err ) { console.log( "There was a problem with a whisper file: "+ filename); }
                            remainingWhispers--;
                            var name= filename.substring( that.whisperPath.length +1, filename.length - 4).replace(/\//g, ".");
                            realResults[ name ]= new MetricInfo(name, filename, info);
                            if( remainingWhispers <= 0 ) {
                                that.availableMetrics= realResults;
                                if( cb ) cb(null, this.availableMetrics);
                            }
                        });
                    } )( results[i] );
                }
            }
        });
    }
}

MetricsStore.prototype.fetchMetricData= function( metric, from, to, dataCallback ) {
    // TODO: cache data in same request.. or something like that..
    this.hoard.fetch( this.availableMetrics[ metric ].filename , from, to, function(err, tInfo, values ) {
        if( err ) dataCallback( err );
        else {
          // To allow for 'future' times (e.g. trend analysis, we end-pad with nulls if no data is available)
          if( tInfo[1] < to ) {
            var interval= tInfo[2];
            var increaseSlotsBy=  Math.ceil( to / interval ) - (tInfo[1] / interval);
            for(var i=0;i< increaseSlotsBy; i++) {
              values.push(null);
            }
          }
          dataCallback( null, {values:values, tInfo: tInfo} );
        }
    });
}

var walk = function(dir, done) {
  var results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = dir + '/' + file;
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            if( res != undefined ) results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

module.exports= MetricsStore;