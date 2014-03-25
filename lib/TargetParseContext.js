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

function isNone(value) {
    return (typeof(value) == 'undefined' || value == null);
}

function isNumber(n) { return /^\d+$/.test(n); } 

function isMetric(object) {
  return !isNone(object) && !isNone(object.constructor) && object.constructor == Matcher;
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
                if( err ) deferred.reject(err);
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
      // Pretty sure this will never actually be 'undefined', but could be null... being safe!
      if( !isNone(numerator.seriesList[k].data.values[i]) ) {
        var denom= denominatorFunc(i);
        if( isNone(denom) ) {
          numerator.seriesList[k].data.values[i]= null;
        }
        else {
          numerator.seriesList[k].data.values[i] = (numerator.seriesList[k].data.values[i] / denom ) *100;
        }
      }
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
                var seriesLen= populatedMetric.seriesList[0].data.values.length;
                for( var i=0;i<seriesLen;i++) {
                  var divisor= 0;
                    for( var k= 0; k< seriesCount;k++) {
                      if( !isNone(populatedMetric.seriesList[k].data.values[i]) ) {
                        if( typeof(result.data.values[i]) == 'undefined' ) result.data.values[i] = populatedMetric.seriesList[k].data.values[i];
                        else result.data.values[i] += populatedMetric.seriesList[k].data.values[i];
                        divisor++;
                      }
                    }
                    if( typeof(result.data.values[i]) != 'undefined' && divisor > 1 ) result.data.values[i] /= divisor;
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


TargetParseContext.prototype._simpleFactorApplication= function( pa, pFactor, functionName, sparseSafe, factorFunction) {
    var that= this;
    return Q.spread( [pa, pFactor], function(value, factor) {
        var deferred = Q.defer();
        that.$chkSeries( value, true)
            .then( function( populatedMetric ) {
                for( var k in populatedMetric.seriesList) {
                    var series= populatedMetric.seriesList[k];
                    if(sparseSafe) {
                      // Safe to process sparse array by keys in this context.
                      for( var i in series.data.values ) {
                        series.data.values[i] = factorFunction( series.data.values[i], factor );
                      }
                    }
                    else {
                      for( var i=0;i< series.data.values.length;i++ ) {
                        series.data.values[i] = factorFunction( series.data.values[i], factor );
                      }
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
  return this._simpleFactorApplication( pa, pfactor, "scale", true, function(v, f) { if(!isNone(v)) return v * f; else return v;} );
}

TargetParseContext.prototype.offset= function ( pa , pfactor ) {
  return this._simpleFactorApplication( pa, pfactor, "offset", true, function(v, f) { if(!isNone(v)) return v + f; else return v;} );
}

TargetParseContext.prototype.transformNull= function ( pa , pfactor ) {
  if( typeof(pfactor) == 'undefined' ) { pfactor= 0; }
  return this._simpleFactorApplication( pa, pfactor, "transformNull", false, function(v, f) {
    if( isNone(v) )
      return f || 0;
    else return v;
  });
}

TargetParseContext.prototype.sum=TargetParseContext.prototype.sumSeries= function( pa ) {
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

  var toty=0, totxy=0, totx=0, totx2=0;
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
        var n= 0;
        //Calculate the gradients.
        for( var i=0;i<seriesLen;i++) {
          var val=  populatedMetric.seriesList[0].data.values[i];
          if( !isNone(val) ) {
            n++;
            totx += i;
            totxy += ( i * val );
            totx2 += (i*i);
            toty += val;
          }
        }

        fittedSeries.data.tInfo= populatedMetric.seriesList[0].data.tInfo;
        fittedSeries.data.values= [];
        fittedSeries.info.aggregationMethod= populatedMetric.seriesList[0].info.aggregationMethod;

        // Special case of 1 data point
        var calc;
        if( n == 0 ) {
          calc= function() { return null; }
        }
        else if( n == 1 ) {
          calc= function() { return toty; }
        }
        else {
          var a = (n*totxy - totx*toty) / (n*totx2 - totx*totx);
          var b = (toty - a*totx) / n;
          calc= function(i) {
            return (a*i) + b;
          }
        }

        for( var i=0;i<seriesLen;i++) {
          fittedSeries.data.values[i]= calc(i);
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
    if( !isNone(values[i]) ) acc += values[i];
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
            // 're-quote' the interval string for display later.
            intervalString= "\"" + intervalString + "\"";
            for( var k in populatedMetric.seriesList) {
                var series= populatedMetric.seriesList[k];
                var buckets= {};
                var currentTimeStamp= series.data.tInfo[0];
                for( var i=0;i<series.data.values.length;i++ ) {
                  var val= series.data.values[i];
                  var bucketInterval;
                  if( alignToFrom ) {
                    bucketInterval = Math.floor( (currentTimeStamp - series.data.tInfo[0]) / interval );
                  }
                  else {
                    bucketInterval = currentTimeStamp - (currentTimeStamp % interval);
                  }
                  if(!buckets[bucketInterval]) buckets[bucketInterval]= [];
                  if( !isNone(val) ) {
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

TargetParseContext.prototype.removeAboveValue= function ( pa , pn ) {
  return this._simpleFactorApplication( pa, pn, "removeAboveValue", true, function(v, f) { if(!isNone(v) && v > f) return null; else return v;} );
}

TargetParseContext.prototype.removeBelowValue= function( pa, pn ) {
  return this._simpleFactorApplication( pa, pn, "removeBelowValue", true, function(v, f) { if(!isNone(v) && v < f) return null; else return v;} );
}

TargetParseContext.prototype.keepLastValue= function( pa, plimit ) {
  var that= this;
  // Handily Q.spread safely resolves nulls + undefined so we can lazily evaluate the second
  // optional argument without complicating this logic here.
  return Q.spread( [pa, plimit], function( value, limit ) {
      if( typeof(limit) == 'undefined' ) limit = Infinity;
      var deferred = Q.defer();
      that.$chkSeries( value, true ).then( function( populatedMetric ) {
        // Iterate over each series in the seriesList
        for( var i=0; i < populatedMetric.seriesList.length; i++ ) {
          populatedMetric.seriesList[i].name = "keepLastValue(" + populatedMetric.seriesList[i].name + ")";
          var consecutiveNones = 0;
          var seriesLength = populatedMetric.seriesList[i].data.values.length;
          // Iterate over each value in the series
          for( var k=0; k < seriesLength; k++ ) {
            var val = populatedMetric.seriesList[i].data.values[k];
            if( k == 0 ) {
              // No 'keeping' can be done on the first value because we have no idea what came before it.
              continue;
            }
            if( isNone(val) ) {
              consecutiveNones++;
            }
            else {
              if( consecutiveNones > 0 && consecutiveNones <= limit) {
                // If a non-None value is seen before the limit of Nones is hit,
                // backfill all the missing values with the last known value.
                for( var m=(k - consecutiveNones); m < k; m++ ) {
                  populatedMetric.seriesList[i].data.values[m] = populatedMetric.seriesList[i].data.values[k - consecutiveNones - 1];
                }
              }
              consecutiveNones = 0;
            }
          }
          // If the series ends with some None values, try to backfill (providing we have a suitable value) to cover it.
          if( consecutiveNones > 0 && consecutiveNones < limit ) {
            var backfillVal = populatedMetric.seriesList[i].data.values[seriesLength - consecutiveNones - 1];
            if(!isNone(backfillVal)) {
              for( var p=(seriesLength - consecutiveNones); p < seriesLength; p++ ) {
                populatedMetric.seriesList[i].data.values[p] = backfillVal;
              }
            }
          }
        }
        deferred.resolve( populatedMetric );
      })
      .fail( function( err ) { 
          deferred.reject( err );
      });      
      return deferred.promise;
  });
}

TargetParseContext.prototype.integral= function( pa ) {
  var that= this;
  return Q.when( pa, function( value ) {
      var deferred = Q.defer();
      that.$chkSeries( value, true ).then( function( populatedMetric ) {
        for( var i=0; i < populatedMetric.seriesList.length; i++ ) {
          populatedMetric.seriesList[i].name = "integral(" + populatedMetric.seriesList[i].name + ")";
          var current = 0;
          for(var k in populatedMetric.seriesList[i].data.values) {
            var val = populatedMetric.seriesList[i].data.values[k];
            if( !isNone(val) ) {
              current += val;
              populatedMetric.seriesList[i].data.values[k] = current;
            }
          }
        }
        deferred.resolve( populatedMetric );
      })
      .fail( function( err ) { 
          deferred.reject( err );
      });      
      return deferred.promise;
  });
}

TargetParseContext.prototype.derivative= function( pa ) {
  var that= this;
  return Q.when( pa, function( value ) {
      var deferred = Q.defer();
      that.$chkSeries( value, true ).then( function( populatedMetric ) {
        for( var i=0; i < populatedMetric.seriesList.length; i++ ) {
          populatedMetric.seriesList[i].name = "derivative(" + populatedMetric.seriesList[i].name + ")";
          var newValues = [];
          // Copying the graphite implementation for this. I think we should use 0 not null.
          var prev = null; 
          for (var k=0; k < populatedMetric.seriesList[i].data.values.length; k++) {
            var val = populatedMetric.seriesList[i].data.values[k];
            if(isNone(prev) || isNone(val)) {
                newValues.push(null);
            }
            else {
                newValues.push(val - prev);
            }
            prev = val;
          }
          populatedMetric.seriesList[i].data.values = newValues;
        }
        deferred.resolve( populatedMetric );
      })
      .fail( function( err ) { 
          deferred.reject( err );
      });      
      return deferred.promise;
  });
}

TargetParseContext.prototype.diffSeries= function() {
  var that = this;
  return Q.spread( arguments, function() {
    var firstArg = arguments[0];
    var firstArgIsMetric = isMetric(firstArg);
    var deferred = Q.defer();
    var newValues =[];
    var metricsToResolve= [];
    var notMetrics= [];
    var metricParamNames = "";
    for(var k=0; k < arguments.length; k++) {
      if( isMetric(arguments[k]) ) {
        metricsToResolve.push( that.$chkSeries( arguments[k], true, k ) );
        metricParamNames += ("," + arguments[k].name);
      }
      else {
        notMetrics.push( arguments[k] );
        metricParamNames += ("," + arguments[k]);
      }
    };
    metricParamNames = metricParamNames.substring(1);

    Q.spread( metricsToResolve, function( ) {
      var resolvedMetrics = Array.prototype.slice.call(arguments, 0);
      var numVals = resolvedMetrics[0].seriesList[0].data.values.length;

      var lhs = null;
      if(firstArgIsMetric) {
        if( firstArg.seriesList.length > 1) {
          lhs= firstArg.seriesList.shift();
        }
        else {
          lhs= resolvedMetrics.shift().seriesList[0];
        }
      }
      else {
        lhs = firstArg;
        notMetrics.shift();
      }
      for(var i=0; i < numVals; i++) {
        var lhsVal = 0;
        if(firstArgIsMetric) {
          var firstArgVal = lhs.data.values[i];
          if(isNone(firstArgVal)) {
            newValues.push(firstArgVal);
            continue;
          }
          else {
            lhsVal = firstArgVal;
          }
        }
        if(!firstArgIsMetric) {
          lhsVal += firstArg;
        }
        
        for(var j in resolvedMetrics) {
          var diffLists = resolvedMetrics[j].seriesList;
          for(var l=0; l < diffLists.length; l++) {
            var dl = diffLists[l];
              var valToDiff = dl.data.values[i];
              if(!isNone(valToDiff)) {
                lhsVal -= valToDiff;
              }
          }
        }
        for(var m=0; m < notMetrics.length; m++) {
            lhsVal -= notMetrics[m];
        }
        newValues.push(lhsVal);
      }
      
      var result= new Matcher("diffSeries("+metricParamNames+")");
      result.expanded= true;
      result.populated= true;
      result.seriesList[0]= {
          data: {
          },
          info: {
          }
      };
      result.seriesList[0].data.tInfo = resolvedMetrics[0].seriesList[0].data.tInfo;
      result.seriesList[0].data.values = newValues;
      // Using the first series' aggregation method (no other choice really!)
      result.seriesList[0].info.aggregationMethod = resolvedMetrics[0].seriesList[0].info.aggregationMethod;
      result.seriesList[0].name = "diffSeries("+metricParamNames+")";
      deferred.resolve(result);
    })
    .fail( function( err ) { 
        deferred.reject( err );
    });
    return deferred.promise;
    
  });
}

TargetParseContext.prototype.movingAverage= function( pa, pWindowSize ) {
  var that= this;
  return Q.spread( [pa, pWindowSize], function( value, windowSize ) {
      var deferred = Q.defer();
      that.$chkSeries( value, true ).then( function( populatedMetric ) {
        var numberOfTimeSteps = windowSize;        
        if(!isNone(numberOfTimeSteps) && isNumber(numberOfTimeSteps)) {
            numberOfTimeSteps = parseInt(numberOfTimeSteps,10);
        }
        else if(!isNone(numberOfTimeSteps) && typeof(windowSize) == 'string') {
          numberOfTimeSteps = Math.floor(DatesAndTimes.parseTimeOffset(windowSize) / populatedMetric.seriesList[0].data.tInfo[2]);
          windowSize = "\"" + windowSize + "\"";
        }
        else {
          deferred.reject( new Error("Unexpected windowSize parameter value of: " + windowSize + " - valid window sizes are integers or time strings.") );
          return;
        }
        var result= new Matcher("movingAverage(" + populatedMetric.name + "," + windowSize + ")");
        result.expanded= true;
        result.populated= true;
        for( var i=0; i < populatedMetric.seriesList.length; i++ ) {
          result.seriesList[i] = {
            data: {
            },
            info: {
            }
          };
          result.seriesList[i].data.tInfo = populatedMetric.seriesList[i].data.tInfo;
          result.seriesList[i].data.values = [];
          result.seriesList[i].info.aggregationMethod = populatedMetric.seriesList[i].info.aggregationMethod;
          result.seriesList[i].name = "movingAverage(" + populatedMetric.seriesList[i].name + "," + windowSize + ")";
          var currentSafeSum = 0;
          var currentSafeLength = 0;
          var valuesLength = populatedMetric.seriesList[i].data.values.length;
          for( var k=0; k < valuesLength; k++) {
            var val = populatedMetric.seriesList[i].data.values[k];
            var nullVal = isNone(val);
            var start = k - numberOfTimeSteps;
            if ( start < 0 ) { start = 0 };
            if( k == 0 ) { 
              if( nullVal ) {
                continue;
              }
              else {
                currentSafeSum += val;
                currentSafeLength += 1;
              }
            }
            else {
              var leftVal = populatedMetric.seriesList[i].data.values[start - 1];
              if(!isNone(leftVal)) {
                currentSafeSum -= leftVal;
                currentSafeLength -= 1;
              }
              if(!nullVal){
                currentSafeSum += val;
                currentSafeLength += 1;
              }
            }
            if(currentSafeLength == 0) {
              if(k == (valuesLength - 1)) {
                result.seriesList[i].data.values[k] = val;
              }
              continue;
            }
            var windowAvg = currentSafeSum / currentSafeLength;
            result.seriesList[i].data.values[k] = windowAvg;
          }
        }
        deferred.resolve( result );
      })
      .fail( function( err ) { 
          deferred.reject( err );
      });      
      return deferred.promise;
  });
}

TargetParseContext.prototype.limit= function( pa, pLimit ) {
  var that= this;
  return Q.spread( [pa, pLimit], function( value, limit ) {
      var deferred = Q.defer();
      that.$chkSeries( value, false ).then( function( populatedMetric ) {
        populatedMetric.name = "limit(" + populatedMetric.name + "," + limit + ")";
        if(isNone(limit) || !isNumber(limit)) {
          deferred.reject( new Error("Invalid limit parameter value of: " + limit + ".") );
        }
        else {
          populatedMetric.seriesList.splice(limit - 1, value.seriesList.length - limit);
          deferred.resolve( that.$chkSeries( populatedMetric, true) );
        }
      })
      .fail( function( err ) { 
          deferred.reject( err );
      });
      return deferred.promise;
  });
}

module.exports = TargetParseContext;