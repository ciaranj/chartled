var DatesAndTimes = require("./utils/DatesAndTimes"),
    Q = require("q"),
    SeriesUtils = require("./SeriesUtils");

function TargetParseContext( metricsStore, targetString, from, to ) {
    this.metricsStore= metricsStore;
    this.from= from;
    this.to= to;
    this.targetString= targetString;
}

function Matcher( original, matcher) {
    this.original= original;
    this.name= original;
    this.matcher= matcher;
    this.expanded= false;
    this.populated= false;
    this.seriesList= [];
}

/**
 * Find the set of metrics that match the given regular expression.
 */
TargetParseContext.prototype._expandMetrics= function( pMetric ) {
    var that= this;
    return Q.when( pMetric, function( metric ) {
        var deferred = Q.defer();
        if( metric.expanded ) {
            // Should never happen, but just in case.
            deferred.resolve( metric );
        }
        else {
            that.metricsStore.getAvailableMetrics( function( err, availableMetrics ) {
                if( err ) throw err;
                var matchedMetrics= [];
                for( var availableMetric in availableMetrics ) {
                    if( metric.matcher.test( availableMetric ) ) {
                        var m= availableMetrics[availableMetric].clone();
                        metric.seriesList[metric.seriesList.length]= m;
                    }
                }
                metric.expanded= true;
                deferred.resolve( metric );
            });
        }
        return deferred.promise;
    });
}

TargetParseContext.prototype._populateMetrics= function( pMetric ) {
    var that= this;
    return Q.when( pMetric, function( metric ) {
        var deferred = Q.defer();
        if( metric.expanded && metric.seriesList.length == 0 ) {
            metric.populated= true;
            deferred.resolve( metric );
        }
        else {
            var resultDownCount= metric.seriesList.length;
            var errored= false;
            for( var i=0;i< metric.seriesList.length;i++) {
                (function(j) {
                    that.metricsStore.fetchMetricData( metric.seriesList[j].realName, that.from, that.to, function( err, data ) {
                        resultDownCount--;
                        if( err ) {
                             errored=true;
                             deferred.reject(err);
                        }
                        else {
                            metric.seriesList[j].data = data;
                            if( resultDownCount <=0 ) {
                                metric.populated= true;
                                if(!errored) deferred.resolve( metric );
                            }
                        }
                    } );
                })(i);
            }
        }
        return deferred.promise;
    });
}

TargetParseContext.prototype.$= function( val  ) {
    return Q.fcall(function(){ return val; });
}

TargetParseContext.prototype.$m= function( val ) {
    var m= new Matcher( val.o, new RegExp(val.r) );
    return m;
}

TargetParseContext.prototype.$chkSeries= function( pa, populateMetrics ) {
    var that= this;
    return Q.when( pa, function(value) {
        var deferred = Q.defer();
        if( value.constructor && value.constructor == Matcher ) {
            // If the series has already been expanded, and either has been populated, or we don't care
            // about populating the metrics right now, then carry on.  Otherwise we need to figure out 
            // if we should be expanding (and optionally populating) the metric, or just expanding it.
            // We need to expand (or populate) the metric.
            var funcs = [];
            if(!value.expanded) funcs.push( function(val){ return that._expandMetrics(val); } );
            if(!value.populated && populateMetrics) funcs.push( function(val){ return that._populateMetrics(val); } );
            
            if( funcs.length >0 ) {
                funcs.reduce(function (soFar, f) {
                    return soFar.then(f);
                }, Q.resolve(value))
                .then( function( expandedValue ) {
                    deferred.resolve( expandedValue );
                })
                .fail( function( err  ) {
                    deferred.reject( err );
                });
            }
            else {
                deferred.resolve( value );
            }
        }
        else {
            throw new Error("Expected a metric, found :" +  JSON.stringify(value) );
        }
        return deferred.promise;
    });
}

// This function assumes that the passed arguments are *real* (non-promises)
// and if they're series* then they have been both expanded and populated.
function _asPercent( numerator, denominator, deferred ) {
  var denominatorName= "";
  var isConstant= true;
  if( denominator ) {
    denominatorName= ",";
    if( denominator.constructor && denominator.constructor == Matcher ) {
      denominatorName+= denominator.name;
      isConstant= false;
      if( denominator.seriesList.length > 1 )  { 
        deferred.reject( new Error("Denominator must be a single series (was multiple)") );
        return
      }
      if( denominator.seriesList.length == 0 ) {
        deferred.reject( new Error("Denominator must be a single series (was none)") );
        return;
      }
    } else {
      denominatorName+= denominator;
    }
  } else {
    isConstant= false;
    denominator= {
      seriesList: SeriesUtils.sumSeriesList( numerator.seriesList )
    }
  }

  var denominatorFunc= function(i) {
    if( isConstant ) return denominator;
    else return denominator.seriesList[0].data.values[i];
  }
  numerator.name= "asPercent(" +numerator.name + denominatorName +")";
  for( var k in numerator.seriesList ) {
    for( var i in numerator.seriesList[k].data.values ) {
      numerator.seriesList[k].data.values[i] = (numerator.seriesList[k].data.values[i] / denominatorFunc(i) ) *100;
    }
    numerator.seriesList[k].name= "asPercent(" +numerator.seriesList[k].name + denominatorName + ")";
  }

  deferred.resolve( numerator );
}

TargetParseContext.prototype.asPercent=TargetParseContext.prototype.averageSeries= function ( pa, pt ) {
  var that= this;
  // Handily Q.spread safely resolves nulls + undefined so we can lazily evaulate the second
  // optional argument without complicating this logic here.
  return Q.spread( [pa, pt], function( value, optionalTarget ) {
      var deferred = Q.defer();
      that.$chkSeries( value, true).then( function( populatedMetric ) {
        // Define the function that does that magic..
        var seriesCount= populatedMetric.seriesList.length;

        // Second argument is a Series of some description we'll need to resolve it first as well...
        if( optionalTarget && optionalTarget.constructor && optionalTarget.constructor == Matcher ) {
          that.$chkSeries( optionalTarget, true).then( function( populatedTargetMetric ) {
            _asPercent( populatedMetric, populatedTargetMetric, deferred );
          });
        }
        else {
          _asPercent( populatedMetric, optionalTarget, deferred );
        }
      })
      .fail( function( err ) { 
          deferred.reject( err );
      });      
      return deferred.promise;
  });

};

TargetParseContext.prototype.avg=TargetParseContext.prototype.averageSeries= function ( pa ) {
    var that= this;
    return Q.when( pa, function(value) {
        var deferred = Q.defer();
        that.$chkSeries( value, true).then( function( populatedMetric ) {
            var result= {
                data: {}
            };

            var seriesCount= populatedMetric.seriesList.length;
            if( seriesCount > 1 ) {
                result.data.tInfo= populatedMetric.seriesList[0].data.tInfo;
                result.data.values= [];
                //TOdO: assert same lengths, and deal with different time granularities
                var seriesLen= populatedMetric.seriesList[0].data.values.length;
                for( var i=0;i<seriesLen;i++) {
                    result.data.values[result.data.values.length]= 0;
                    for( var k= 0; k< seriesCount;k++) {
                        result.data.values[i] += populatedMetric.seriesList[k].data.values[i];
                    }
                    result.data.values[i] /= seriesCount;
                }
                populatedMetric.seriesList= [result];
            }
            if( seriesCount > 0 ){ 
                populatedMetric.seriesList[0].name= "avg(" +  populatedMetric.name + ")";
                populatedMetric.name= "avg(" +populatedMetric.name +")";
            }
            deferred.resolve( populatedMetric );
        })
        .fail( function( err ) { 
            deferred.reject( err );
        });
        return deferred.promise;
    });
}


TargetParseContext.prototype._simpleFactorApplication= function( pa, pFactor, functionName, factorFunction) {
    var that= this;
    return Q.spread( [pa, pFactor], function(value, factor) {
        var deferred = Q.defer();
        that.$chkSeries( value, true)
            .then( function( populatedMetric ) {
                for( var k in populatedMetric.seriesList) {
                    var series= populatedMetric.seriesList[k];
                    for( var i in series.data.values ) {
                      series.data.values[i] = factorFunction( series.data.values[i], factor );
                    }
                    series.name= functionName + "("+ series.name+","+ factor +")";
                }
                populatedMetric.name= functionName + "("+ populatedMetric.name +","+factor+")";
                deferred.resolve( populatedMetric );
            })
            .fail( function( err ) { 
                deferred.reject( err );
            });
        return deferred.promise;
    });
}
TargetParseContext.prototype.scale= function ( pa , pfactor ) {
	return this._simpleFactorApplication( pa, pfactor, "scale", function(v, f) { if(v != null) return v * f; else return v;} );
}

TargetParseContext.prototype.offset= function ( pa , pfactor ) {
	return this._simpleFactorApplication( pa, pfactor, "offset", function(v, f) { if(v != null) return v + f; else return v;} );
}

TargetParseContext.prototype.sum=TargetParseContext.prototype.sumSeries= function( pa  ) {
    var that= this;
    return Q.when( pa, function(value) {
        var deferred = Q.defer();
        that.$chkSeries( value, true).then( function( populatedMetric ) {
            populatedMetric.seriesList= SeriesUtils.sumSeriesList( populatedMetric.seriesList );
            // Update the title (even when a single series is passed )
            if( populatedMetric.seriesList.length > 0 ){ 
                populatedMetric.seriesList[0].name= "sum(" +  populatedMetric.name + ")";
                populatedMetric.name= populatedMetric.seriesList[0].name;
            }
            deferred.resolve( populatedMetric);
        })
        .fail( function( err ) { 
            deferred.reject( err );
        });
        
        return deferred.promise;
    });
}
TargetParseContext.prototype.bestFit= function( pa ) {

  var toty=0, totxy=0, totx=0, totx2=0, a=0, b=0;
  var that= this;
  return Q.when( pa, function(value) {
      var deferred = Q.defer();
      that.$chkSeries( value, true).then( function( populatedMetric ) {
        var fittedSeries= { data: {},
                            info: {}
        };

        var seriesCount= populatedMetric.seriesList.length;
        //TODO: assert only 1 series

        var seriesLen= populatedMetric.seriesList[0].data.values.length;
        //Calculate the gradients.
        for( var i=0;i<seriesLen;i++) {
          totx += i;
          totxy += ( i * populatedMetric.seriesList[0].data.values[i] );
          totx2 += (i*i);
          toty += populatedMetric.seriesList[0].data.values[i];
        }

        fittedSeries.data.tInfo= populatedMetric.seriesList[0].data.tInfo;
        fittedSeries.data.values= [];
        fittedSeries.info.aggregationMethod= populatedMetric.seriesList[0].info.aggregationMethod;


        a = (seriesLen*totxy - totx*toty) / (seriesLen*totx2 - totx*totx);
        b = (toty - a*totx) / seriesLen;

        for( var i=0;i<seriesLen;i++) {
          fittedSeries.data.values[i]=  (a*i) + b;
        }

        populatedMetric.seriesList= [fittedSeries]


        // Update the title (even when a single series is passed )
        if( populatedMetric.seriesList.length > 0 ){ 
            populatedMetric.seriesList[0].name= "bestFit(" +  populatedMetric.name + ")";
            populatedMetric.name= populatedMetric.seriesList[0].name;
        }
        deferred.resolve( populatedMetric);
      })
      .fail( function( err ) { 
          deferred.reject( err );
      });
      
      return deferred.promise;
  });  
}


TargetParseContext.prototype.alias= function ( pa, palias ) {
    var that= this;
    return Q.spread( [pa, palias], function(value, alias) {
        var deferred = Q.defer();
        that.$chkSeries( value ).then( function( populatedMetric ) {
            var seriesCount= populatedMetric.seriesList.length;
            populatedMetric.name= "alias("+ populatedMetric.name +",\""+ alias + "\")";
            for( var seriesKey in populatedMetric.seriesList ) {
                var series= populatedMetric.seriesList[seriesKey];
                series.name= alias;
            }

            deferred.resolve( populatedMetric);
        })
        .fail( function( err ) { 
            deferred.reject( err );
        });
        
        return deferred.promise;
    });
}

// Retrieves a node segment's name, given a (0-based) index and a series name.
// e.g foo.bar.doo and 1 would return 'bar'.
TargetParseContext.prototype.aliasByNode= function ( pa, palias ) {
    var that= this;
    return Q.spread( [pa, palias], function(value, alias) {
        var deferred = Q.defer();
        that.$chkSeries( value ).then( function( populatedMetric ) {
            var seriesCount= populatedMetric.seriesList.length;
            populatedMetric.name= "aliasByNode("+ populatedMetric.name +",\""+ alias + "\")";
            for( var seriesKey in populatedMetric.seriesList ) {
                var series= populatedMetric.seriesList[seriesKey];
                var nodes= series.realName.split(".");
                if( nodes.length > alias ) series.name= nodes[alias];
            }

            deferred.resolve( populatedMetric);
        })
        .fail( function( err ) {
            deferred.reject( err );
        });

        return deferred.promise;
    });
}

TargetParseContext.prototype.sin=TargetParseContext.prototype.sinFunction= function( pname, pamplitude  ) {
    if(pamplitude === undefined ) pamplitude= 1;
    var that= this;
	//TODO: how should we choose this interval !?!?
    var interval= 60;
    return Q.spread( [pname, pamplitude], function(name, amplitude) {
        var result= new Matcher(name);
        result.expanded= true;
        result.populated= true;
        result.seriesList[0]= {
            data: {
            },
            info: {
            }
        };
        result.seriesList[0].data.tInfo= [that.from, that.to, interval];
        result.seriesList[0].data.values= [];
        result.seriesList[0].info.aggregationMethod="avg";
        result.seriesList[0].name= name;
        for(var i=that.from; i<=that.to; i+=interval){
            result.seriesList[0].data.values.push( Math.sin(i) * amplitude );
        }

        var deferred = Q.defer();
        deferred.resolve( result );
             
        return deferred.promise;
    });
};

TargetParseContext.prototype.constantLine= function( pvalue ) {
    var that= this;
	//TODO: how should we choose this interval !?!?
    var interval= 60;
    return Q.spread( [pvalue], function(value) {
        var result= new Matcher("constantLine("+pvalue+")");
        result.expanded= true;
        result.populated= true;
        result.seriesList[0]= {
            data: {
            },
            info: {
            }
        };
        result.seriesList[0].data.tInfo= [that.from, that.to, interval];
        result.seriesList[0].data.values= [];
        result.seriesList[0].info.aggregationMethod="avg";
        result.seriesList[0].name= "constantLine("+pvalue+")";
        for(var i=that.from; i<=that.to; i+=interval){
            result.seriesList[0].data.values.push( value );
        }

        var deferred = Q.defer();
        deferred.resolve( result );
             
        return deferred.promise;
	});
}

function sum(values) {
  var acc =0;
  for( var i in values) {
    if( values[i] != null ) acc += values[i];
  }
  return acc;
}

TargetParseContext.prototype.summarize= function( pa, pintervalString, paggregateFunc, palignToFrom ) {
  var that= this;
  return Q.spread( [pa, pintervalString, paggregateFunc, palignToFrom], function(value, intervalString, aggregateFunc, alignToFrom) { 
    // Both aggregatefunction and aligntofrom are optional, so we can see;
    // both, neither or the aligntofrom in the place of the aggregatefunc
    var aggregateFuncSpecified= true;
    var alignToFromSpecified= true;
    if( aggregateFunc === undefined && alignToFrom === undefined ) {
      aggregateFunc = "sum";
      alignToFrom = false;
      aggregateFuncSpecified= false;
      alignToFromSpecified= false;
    }
    else if (alignToFrom === undefined ) {
      if( typeof(aggregateFunc) == "boolean" ) {
        alignToFrom= aggregateFunc;
        aggregateFunc= "sum"
        aggregateFuncSpecified= false;
        alignToFromSpecified= true;
      }
      else {
        alignToFrom= false;
        aggregateFuncSpecified= true;
        alignToFromSpecified= false;
      }
    }
    var deferred = Q.defer();
    that.$chkSeries( value, true)
        .then( function( populatedMetric ) {
            var interval= DatesAndTimes.parseTimeOffset(intervalString);
            for( var k in populatedMetric.seriesList) {
                var series= populatedMetric.seriesList[k];
                var buckets= {};
                var currentTimeStamp= series.data.tInfo[0];
                for( var i in series.data.values ) {
                  var val= series.data.values[i];
                  var bucketInterval;
                  if( alignToFrom ) {
                    bucketInterval = Math.floor( (currentTimeStamp - series.data.tInfo[0]) / interval );
                  }
                  else {
                    bucketInterval = currentTimeStamp - (currentTimeStamp % interval);
                  }
                  if(!buckets[bucketInterval]) buckets[bucketInterval]= [];
                  if( val != null && typeof(val) != 'undefined' ) {
                    buckets[bucketInterval].push( val );
                  }
                  currentTimeStamp += series.data.tInfo[2];
                }
                var newStart, newEnd, newValues=[];
                if( alignToFrom ) {
                  newStart = series.data.tInfo[0];
                  newEnd= series.data.tInfo[1];
                }
                else {
                  newStart = series.data.tInfo[0] - (series.data.tInfo[0] % interval);
                  newEnd = series.data.tInfo[1] - (series.data.tInfo[1] % interval) + interval;
                }
                var start= newStart;
                var end= newEnd;
                for(currentTimeStamp= start; currentTimeStamp < end; currentTimeStamp += interval ) {
                  if( alignToFrom ) {
                    newEnd= currentTimeStamp;
                    bucketInterval = Math.floor( (currentTimeStamp - series.data.tInfo[0]) / interval );
                  }
                  else {
                    bucketInterval = currentTimeStamp - (currentTimeStamp % interval);
                  }
                  var bucket= buckets[bucketInterval];
                  if( bucket ) {
                    // Aggregation functions.
                    var v= 0;
                    switch(aggregateFunc) {
                      case "avg":
                      case "average":
                        v= (sum(bucket) + 0.0) / bucket.length;
                        break;
                      case "last":
                        v= bucket[bucket.length-1];
                        break;
                      case "max":
                        v= Math.max.apply(this, bucket);
                        break;
                      case "min":
                        v= Math.min.apply(this, bucket);
                        break;
                      default:
                        v= sum(bucket);
                    }
                    
                    newValues.push( v );
                  }
                  else {
                    newValues.push( null );
                  }
                }
                if( alignToFrom ) newEnd += interval;
                series.data.values= newValues;
                series.data.tInfo[0]= newStart;
                series.data.tInfo[1]= newEnd;
                series.data.tInfo[2]= interval;
                series.name= "summarize("+ series.name+","+ intervalString + (aggregateFuncSpecified? ",\"" + aggregateFunc+ "\"": "") + (alignToFromSpecified? "," + alignToFrom : "") + ")";
                series.info.aggregationMethod= aggregateFunc;
            }
            populatedMetric.name= "summarize("+ populatedMetric.name+","+ intervalString +(aggregateFuncSpecified? ",\"" + aggregateFunc+ "\"": "")+ (alignToFromSpecified? "," + alignToFrom: "") + ")";
            deferred.resolve( populatedMetric );
        })
        .fail( function( err ) { 
            deferred.reject( err );
        });
    
        return deferred.promise;
  });
}
module.exports= TargetParseContext;
