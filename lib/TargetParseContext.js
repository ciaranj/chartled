var TRACE=false;

var DatesAndTimes = require("./utils/DatesAndTimes"),
    MetricInfo = require("./MetricInfo"),
    MetricRegexCreator = require("./MetricRegexCreator"),
    Q = require("q"),
    SeriesUtils = require("./SeriesUtils"),
    util = require("util");

function TargetParseContext( metricsStore, targetString, from, to ) {
    this.metricsStore= metricsStore;
    this.from= from;
    this.to= to;
    this.targetString= targetString;
}

function Matcher( original ) {
    var that= this;
    this.original= original;
    this.name= original;
    this.matches= function(valueToTest) {
        if( isNone(that.matcher) ) that.matcher= MetricRegexCreator.parse( original );
        return that.matcher.test( valueToTest );
    }
}

function isNone(value) {
    return (typeof(value) == 'undefined' || value == null);
}

function isNumber(n) { return /^\d+$/.test(n); } 

function isMetric(object) {
  return !isNone(object) && !isNone(object.constructor) && (object.constructor == MetricInfo || object.constructor == Matcher);
}

TargetParseContext.prototype._formatPathExpressions = function(metrics) {
    var pathExpressions = [];
    for(var metricKey in metrics) {
        var name = metrics[metricKey].pathExpression;
        if(pathExpressions.indexOf(name) == -1) {
            pathExpressions.push(name);
        }
    }    
    return pathExpressions.join(",");
}

/**
 * Find the set of metrics that match the given regular expression.
 * Converts from *Matchers* to *Metrics*
 */
TargetParseContext.prototype._expandMatchers= function( matchers ) {
    var that= this;
    if( !util.isArray(matchers) ) matchers= [matchers];
    var deferred = Q.defer();
    var metricInfos= [];
    that.metricsStore.getAvailableMetrics( function( err, availableMetrics ) {
        if( err ) deferred.reject(err);
        for (var arg in matchers) {
            for( var availableMetric in availableMetrics ) {
                if( matchers[arg].matches( availableMetric ) ) {
                    var m= availableMetrics[availableMetric].clone(matchers[arg].name);
                    metricInfos.push(m);
                }
            }
        }
        if(TRACE) { console.log("Expanding:\n", JSON.stringify(matchers), "\n Into:\n"+ JSON.stringify(metricInfos) ); }
        deferred.resolve( metricInfos );
    });
    return deferred.promise;
}

TargetParseContext.prototype._populateMetrics= function( pMetrics, from, to ) {
    var that= this;
    if( util.isArray(pMetrics) ) {}
    else {pMetrics = [pMetrics]; }
    return Q.all( pMetrics ).then(flatten).then(function( metrics ) {
        var deferred = Q.defer();
        var resultDownCount= metrics.length;
        var errored= false;
        if(metrics.length >0) {
            for( var i=0;i< metrics.length;i++) {
                (function(j) {
                    that.metricsStore.fetchMetricData( metrics[j].realName, from, to, function( err, data ) {
                        resultDownCount--;
                        if( err ) {
                             errored=true;
                             deferred.reject(err);
                        }
                        else {
                            metrics[j].data = data;
                            metrics[j].populated= true;
                            if( resultDownCount <=0 ) {
                                if(TRACE) { console.log("Populated:\n", JSON.stringify(metrics)); }
                                if(!errored) deferred.resolve( metrics );
                            }
                        }
                    } );
                })(i);
            }
        }
        else {
            deferred.resolve( metrics );
        }
        return deferred.promise;
    });
}

TargetParseContext.prototype.$= function( val  ) {
    return Q.fcall(function(){ return val; });
}

TargetParseContext.prototype.$m= function( val ) {
    var m= new Matcher( val );
    return m;
}


function flatten(arrayOfArraysPotentially) {
    return Q(_flatten(arrayOfArraysPotentially));
}

function _flatten(arrayOfArraysPotentially) {
    var result= [];
    for(var k in arrayOfArraysPotentially ) {
        if( util.isArray(arrayOfArraysPotentially[k] ) ){ 
            result= result.concat( _flatten(arrayOfArraysPotentially[k])); // Recursion bad :(
        }
        else {
            result.push( arrayOfArraysPotentially[k] );
        }
    }
    return result;
}

TargetParseContext.prototype.$chkSeries= function( pa, populateMetrics, fromOffset, toOffset ) {
    var that= this;
    if( util.isArray(pa) ) {}
    else {pa = [pa]; }
    return Q.all(pa).then(flatten).then(function(values) {
        var deferred = Q.defer();
        var valueDownCount = values.length;
        var errored = false;
        var result = [];
        if(values.length == 0) {
            deferred.resolve( [] )
        } else {
            for( var i=0;i< values.length;i++) {
                (function(j) {
                    if( values[j].constructor && (values[j].constructor == Matcher || values[j].constructor == MetricInfo)) {
                        // If the series has already been expanded, and either has been populated, or we don't care
                        // about populating the metrics right now, then carry on.  Otherwise we need to figure out 
                        // if we should be expanding (and optionally populating) the metric, or just expanding it.

                        // We need to expand (or populate) the metric.
                        var funcs = [];
                        if( values[j].constructor == Matcher ) {
                            funcs.push( function(val){ return that._expandMatchers(val); } );
                        }
                        if( (populateMetrics===true && !values[j].populated) || populateMetrics == "always" ) {
                            // Don't need to check the constructor type here, as if it *wasn't* a MetricInfo the expansion function will
                            // have been pushed onto 'funcs' before this gets executed.
                            funcs.push( function(val){ return that._populateMetrics(val, that.from + fromOffset, that.to + toOffset); } );
                        }
                        function areWeDoneYet() {
                            valueDownCount--;
                            if( valueDownCount <=0 ) {
                                if(!errored) deferred.resolve( result );
                            }
                        }
                        
                        if( funcs.length >0 ) {
                            funcs.reduce(function (soFar, f) {
                                return soFar.then(f);
                            }, Q.resolve(values[j]))
                            .then( function( expandedValues ) {
                                result= result.concat(expandedValues);
                                areWeDoneYet()
                            })
                            .fail( function( err  ) {
                                if(!errored) {
                                    errored=true;
                                    deferred.reject(err);
                                }
                            });
                        } else {
                            result.push( values[j] );
                            areWeDoneYet();
                        }
                    }
                    else {
                        if(!errored) {
                            errored=true;
                            deferred.reject(new Error("Expected a metric, found :" +  JSON.stringify(values[j]) ));
                        }
                    }
                })(i);
            }
        }
        return deferred.promise;
    });
}

// This function assumes that the passed arguments are *real* (non-promises)
// and if they're series* then they have been both expanded and populated.
function _asPercent( numerators, denominator, deferred ) {
  var denominatorName= "";
  var isConstant= true;
  if( denominator ) {
    denominatorName= ",";
    if(typeof(denominator) != 'number') {
      isConstant= false;
      if( denominator.length > 1 )  { 
        deferred.reject( new Error("Denominator must be a single series (was multiple)") );
        return
      }
      if( denominator.length == 0 ) {
        deferred.reject( new Error("Denominator must be a single series (was none)") );
        return;
      }
        denominatorName +=  denominator[0].name;
    } else {
      denominatorName+= denominator;
    }
  } else {
    isConstant= false;
    denominator= [SeriesUtils.sumSeriesList( numerators )];
  }

  var denominatorFunc= function(i) {
    if( isConstant ) return denominator;
    else return denominator[0].data.values[i];
  }
  for( var k in numerators ) {
    var numerator= numerators[k];
    for( var i in numerator.data.values ) {
      // Pretty sure this will never actually be 'undefined', but could be null... being safe!
      if( !isNone(numerator.data.values[i]) ) {
        var denom= denominatorFunc(i);
        if( isNone(denom) ) {
          numerator.data.values[i]= null;
        }
        else {
          numerator.data.values[i] = (numerator.data.values[i] / denom ) *100;
        }
      }
    }
    numerator.name= "asPercent(" +numerator.name + denominatorName + ")";
  }
  deferred.resolve( numerators );
}

TargetParseContext.prototype.asPercent= function ( pa, pt ) {
  var that= this;
  // Handily Q.spread safely resolves nulls + undefined so we can lazily evaluate the second
  // optional argument without complicating this logic here.
  return Q.spread( [pa, pt], function( value, optionalTarget ) {
      var deferred = Q.defer();
      that.$chkSeries( value, true, 0, 0).then( function( populatedMetric ) {
        // Define the function that does that magic..
        var seriesCount= populatedMetric.length;
        // Second argument is a Series of some description we'll need to resolve it first as well...
        if( optionalTarget && typeof(optionalTarget) != 'number' ) {
          that.$chkSeries( optionalTarget, true, 0, 0).then( function( populatedTargetMetric ) {
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


// Takes in 1 or metric/wildcards
TargetParseContext.prototype.avg=TargetParseContext.prototype.averageSeries= function () {
    var that= this;
    return Q.spread( arguments, function() {
        var deferred = Q.defer();
        that.$chkSeries( Array.prototype.slice.call(arguments), true, 0, 0 ).then( function( populatedMetrics ) {
            if( populatedMetrics.length > 0 ) {
                var result= new MetricInfo( "averageSeries(" + that._formatPathExpressions(populatedMetrics) +")","", {},  {} ).clone("");
                result.populated= true;
                result.data.tInfo= populatedMetrics[0].data.tInfo;
                result.info.aggregationMethod=populatedMetrics[0].info.aggregationMethod;
                var seriesLen= populatedMetrics[0].data.values.length;
                var seriesCount= populatedMetrics.length;
                var values= [];
                for( var i=0;i<seriesLen;i++) {
                    var divisor= 0;
                    for( var k= 0; k< seriesCount;k++) {
                      var val= populatedMetrics[k].data.values[i];
                      if( !isNone(val) ) {
                        if( isNone(values[i]) ) values[i] = val;
                        else values[i] += val;
                        divisor++;
                      }
                    }
                    if( !isNone(values[i]) && divisor > 1 ) values[i] /= divisor;
                }
                result.data.values=  values;
                deferred.resolve( result );
            }
            else { deferred.resolve( [] ); }
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
        that.$chkSeries( value, true, 0, 0)
            .then( function( populatedMetrics ) {
                for( var k in populatedMetrics) {
                    var series= populatedMetrics[k];
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
                    series.pathExpression= functionName + "("+ series.pathExpression+","+ factor +")";
                    
                }
                deferred.resolve( populatedMetrics );
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
    var deferred = Q.defer();
    that.$chkSeries( pa, true, 0, 0).then( function( populatedMetrics ) {
        if( populatedMetrics.length >0 ) {
            var summedMetric= SeriesUtils.sumSeriesList( populatedMetrics );
            summedMetric.pathExpression= "sum(" +  that._formatPathExpressions(populatedMetrics) + ")";
            summedMetric.name= summedMetric.pathExpression;
            deferred.resolve( summedMetric );
        }
        else {
            deferred.resolve( populatedMetrics );
        }
    })
    .fail( function( err ) { 
        deferred.reject( err );
    });
    
    return deferred.promise;
}
TargetParseContext.prototype.bestFit= function( pa ) {

  var toty=0, totxy=0, totx=0, totx2=0;
  var that= this;
  return Q.when( pa, function(value) {
      var deferred = Q.defer();
      that.$chkSeries( value, true, 0, 0).then( function( populatedMetrics ) {
        if(populatedMetrics.length > 0 ) {
            var fittedSeries= new MetricInfo( "bestFit(" +  populatedMetrics[0].name + ")","", {},  {} ).clone();
            fittedSeries.populated= true;
            fittedSeries.data.tInfo= populatedMetrics[0].data.tInfo;
            fittedSeries.data.values= [];
            fittedSeries.info.aggregationMethod= populatedMetrics[0].info.aggregationMethod;

            var seriesCount= populatedMetrics.length;
            //TODO: assert only 1 series

            var seriesLen= populatedMetrics[0].data.values.length;
            var n= 0;
            //Calculate the gradients.
            for( var i=0;i<seriesLen;i++) {
              var val=  populatedMetrics[0].data.values[i];
              if( !isNone(val) ) {
                n++;
                totx += i;
                totxy += ( i * val );
                totx2 += (i*i);
                toty += val;
              }
            }

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
            // Update the title (even when a single series is passed )
            deferred.resolve( fittedSeries );
        }
        else { 
            deferred.resolve( [] );
        }
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
        that.$chkSeries( value,false, 0, 0 ).then( function( populatedMetric ) {
            var seriesCount= populatedMetric.length;
            for( var seriesKey in populatedMetric ) {
                var series= populatedMetric[seriesKey];
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
        that.$chkSeries( value,false,0, 0 ).then( function( populatedMetric ) {
            var seriesCount= populatedMetric.length;
            for( var seriesKey in populatedMetric ) {
                var series= populatedMetric[seriesKey];
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
        var result= new MetricInfo(name,"", {},  {} ).clone("");
        result.pathExpression= result.name;
        result.populated= true;
        result.data.tInfo= [that.from, that.to, interval];
        result.data.values= [];
        result.info.aggregationMethod="avg";
        for(var i=that.from; i<=that.to; i+=interval){
            result.data.values.push( Math.sin(i) * amplitude );
        }    
        var deferred = Q.defer();
        deferred.resolve( result );
        return deferred.promise;
    });
};

TargetParseContext.prototype.timeShift= function( pa, pintervalString ) {
  var that= this;
  return Q.spread( [pa, pintervalString], function(value, intervalString) {
    var deferred = Q.defer();
    var originalIntervalString= intervalString;
    var sign= intervalString[0];
    if( sign == '+') {}
    else if( sign == '-' ) {}
    else intervalString= "-"+ intervalString;

    var delta= DatesAndTimes.parseTimeOffset(intervalString);

    that.$chkSeries( value, true, delta, delta )
        .then( function( populatedMetrics ) {
            for( var seriesKey in populatedMetrics ) {
                var series= populatedMetrics[seriesKey];
                series.name= "timeShift(" +  series.name + ",\""+ originalIntervalString +"\")";
                series.data.tInfo[0] -= delta;
                series.data.tInfo[1] -= delta;
            }
          deferred.resolve( populatedMetrics );
      });

    return deferred.promise;
  });
};

TargetParseContext.prototype.constantLine= function( pvalue ) {
    var that= this;
	//TODO: how should we choose this interval !?!?
    var interval= 60;
    return Q.when( pvalue, function(value) {
        var result= new MetricInfo("constantLine("+value+")","", {},  {} ).clone("");
        result.pathExpression= result.name;
        result.populated= true;
        result.data.tInfo= [that.from, that.to, interval];
        result.data.values= [];
        result.info.aggregationMethod="avg";
        for(var i=that.from; i<=that.to; i+=interval){
            result.data.values.push( value );
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
    that.$chkSeries( value, true,0,0 )
        .then( function( populatedMetrics ) {
            var interval= DatesAndTimes.parseTimeOffset(intervalString);
            // 're-quote' the interval string for display later.
            intervalString= "\"" + intervalString + "\"";
            for( var k in populatedMetrics) {
                var series= populatedMetrics[k];
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
            deferred.resolve( populatedMetrics );
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
      that.$chkSeries( value, true,0,0 ).then( function( populatedMetrics ) {
        // Iterate over each series in the seriesList
        for( var i=0; i < populatedMetrics.length; i++ ) {
          populatedMetrics[i].name = "keepLastValue(" + populatedMetrics[i].name + ")";
          var consecutiveNones = 0;
          var seriesLength = populatedMetrics[i].data.values.length;
          // Iterate over each value in the series
          for( var k=0; k < seriesLength; k++ ) {
            var val = populatedMetrics[i].data.values[k];
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
                  populatedMetrics[i].data.values[m] = populatedMetrics[i].data.values[k - consecutiveNones - 1];
                }
              }
              consecutiveNones = 0;
            }
          }
          // If the series ends with some None values, try to backfill (providing we have a suitable value) to cover it.
          if( consecutiveNones > 0 && consecutiveNones < limit ) {
            var backfillVal = populatedMetrics[i].data.values[seriesLength - consecutiveNones - 1];
            if(!isNone(backfillVal)) {
              for( var p=(seriesLength - consecutiveNones); p < seriesLength; p++ ) {
                populatedMetrics[i].data.values[p] = backfillVal;
              }
            }
          }
        }
        deferred.resolve( populatedMetrics );
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
      that.$chkSeries( value, true,0,0 ).then( function( populatedMetrics ) {
        for( var i=0; i < populatedMetrics.length; i++ ) {
          populatedMetrics[i].name = "integral(" + populatedMetrics[i].name + ")";
          var current = 0;
          for(var k in populatedMetrics[i].data.values) {
            var val = populatedMetrics[i].data.values[k];
            if( !isNone(val) ) {
              current += val;
              populatedMetrics[i].data.values[k] = current;
            }
          }
        }
        deferred.resolve( populatedMetrics );
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
      that.$chkSeries( value, true,0,0 ).then( function( populatedMetrics ) {
        for( var i=0; i < populatedMetrics.length; i++ ) {
          populatedMetrics[i].name = "derivative(" + populatedMetrics[i].name + ")";
          var newValues = [];
          // Copying the graphite implementation for this. I think we should use 0 not null.
          var prev = null; 
          for (var k=0; k < populatedMetrics[i].data.values.length; k++) {
            var val = populatedMetrics[i].data.values[k];
            if(isNone(prev) || isNone(val)) {
                newValues.push(null);
            }
            else {
                newValues.push(val - prev);
            }
            prev = val;
          }
          populatedMetrics[i].data.values = newValues;
        }
        deferred.resolve( populatedMetrics );
      })
      .fail( function( err ) { 
          deferred.reject( err );
      });      
      return deferred.promise;
  });
}

TargetParseContext.prototype.diffSeries= function() {
  var that = this;
  return Q.spread(arguments, function() {
    var deferred = Q.defer();
      flatten(arguments).then(function(args){
        var firstArg = args[0];
        var firstArgIsMetric = isMetric(firstArg);
        var newValues =[];
        var metricsToResolve= [];
        var notMetrics= [];
        var metricParamNames = "";
        for(var k=0; k < args.length; k++) {
          if( isMetric(args[k]) ) {
            metricsToResolve.push(  args[k] );
            metricParamNames += ("," + args[k].name);
          }
          else {
            notMetrics.push( args[k] );
            metricParamNames += ("," + args[k]);
          }
        };
            
        metricParamNames = metricParamNames.substring(1);
        that.$chkSeries( metricsToResolve, true, 0, 0 ).then(function( resolvedMetrics ) {
          var numVals = resolvedMetrics[0].data.values.length;
          var result= new MetricInfo( "diffSeries("+metricParamNames+")","", {},  {} ).clone("");
          result.data.tInfo= resolvedMetrics[0].data.tInfo;
          result.info.aggregationMethod=resolvedMetrics[0].info.aggregationMethod;

          var lhs = null;
          if(firstArgIsMetric) {
            lhs= resolvedMetrics.shift();
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
              var dl= resolvedMetrics[j];
              var valToDiff = dl.data.values[i];
              if(!isNone(valToDiff)) {
                lhsVal -= valToDiff;
              }
            }
            for(var m=0; m < notMetrics.length; m++) {
                lhsVal -= notMetrics[m];
            }
            newValues.push(lhsVal);
          }
          result.data.values= newValues;
          result.populated= true;
          deferred.resolve(result);
        })
        .fail( function( err ) {
          deferred.reject( err );
        });
      });
    return deferred.promise;
  });
}

TargetParseContext.prototype.movingAverage= function( pa, pWindowSize ) {
  var that= this;
  return Q.spread( [pa, pWindowSize], function( value, windowSize ) {
      var deferred = Q.defer();
      var timeInterval = null;
      if(typeof(windowSize) != 'string') {
        deferred.reject( new Error("Unexpected windowSize parameter value of: " + windowSize + " - valid window sizes are time strings.") );
        return;
      }
      try {
        timeInterval = DatesAndTimes.parseTimeOffset(windowSize);
      }
      catch (err) {
        deferred.reject( new Error("Unexpected windowSize parameter value of: " + windowSize + " - valid window sizes are time strings.") );
        return;
      }
      windowSize = "\"" + windowSize + "\"";
      var delta = (timeInterval * -1);
      that.$chkSeries( value, true, delta, 0 ).then( function( populatedMetrics ) {
        var numberOfTimeSteps = Math.floor(timeInterval / populatedMetrics[0].data.tInfo[2]);
        if(numberOfTimeSteps == 0) {
          for( var i=0; i < populatedMetrics.length; i++ ) {
            populatedMetrics[i].name = "movingAverage(" + populatedMetrics[i].name + "," + windowSize + ")";
          }
          deferred.resolve( populatedMetrics );
          return;
        }
        
        var results = [];
        
        
        for( var i=0; i < populatedMetrics.length; i++ ) {
          var result= new MetricInfo( "movingAverage(" + populatedMetrics[i].name + "," + windowSize + ")","", {},  {} ).clone("");
          result.populated= true;
          result.data.tInfo=[
            populatedMetrics[i].data.tInfo[0] + (numberOfTimeSteps * populatedMetrics[i].data.tInfo[2]),
            populatedMetrics[i].data.tInfo[1],
            populatedMetrics[i].data.tInfo[2]
          ];
          result.info.aggregationMethod=populatedMetrics[i].info.aggregationMethod;
          result.data.values = [];
          var currentSafeSum = 0;
          var currentSafeLength = 0;
          var valuesLength = populatedMetrics[i].data.values.length;
          for( var k=0; k < valuesLength; k++) {
            var val = populatedMetrics[i].data.values[k];
            var nullVal = isNone(val);
            if( k < numberOfTimeSteps) {
              if(!nullVal){
                currentSafeSum += val;
                currentSafeLength += 1;
              }
              continue;
            }
            if(!nullVal){
              currentSafeSum += val;
              currentSafeLength += 1;
            }
            var leftVal = populatedMetrics[i].data.values[k-numberOfTimeSteps];
            if(!isNone(leftVal)) {
              currentSafeSum -= leftVal;
              currentSafeLength -= 1;
            }
            if(currentSafeLength == 0) {
              if(k == (valuesLength - 1)) {
                result.data.values[k-numberOfTimeSteps] = val;
              }
            continue;
            }
            var windowAvg = currentSafeSum / currentSafeLength;
            result.data.values[k-numberOfTimeSteps] = windowAvg;
          }
          results.push(result)
        }
        deferred.resolve( results );
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
      that.$chkSeries( value, false, 0, 0 ).then( function( expandedMetrics ) {
        if(isNone(limit) || !isNumber(limit)) {
          deferred.reject( new Error("Invalid limit parameter value of: " + limit + ".") );
        }
        else {
          expandedMetrics.splice(limit - 1, expandedMetrics.length - limit);
          deferred.resolve( expandedMetrics );
        }
      })
      .fail( function( err ) { 
          deferred.reject( err );
      });
      return deferred.promise;
  });
}

TargetParseContext.prototype.groupByNode= function( pa, pNodeNum, callback ) {
  var that= this;
  return Q.spread( [pa, pNodeNum, callback], function( value, nodeNum, cb ) {
      var deferred = Q.defer();
      that.$chkSeries( value, false, 0, 0 ).then( function( metrics ) {
        if(isNone(nodeNum) || !isNumber(nodeNum)) {
          deferred.reject( new Error("Invalid 'nodeNum' parameter value of: " + nodeNum + ".") );
        }
        else {
          if(isNone(cb) || typeof(cb) != 'string' || cb == "groupByNode" || typeof(TargetParseContext.prototype[cb]) != 'function') {
            deferred.reject( new Error("Invalid 'callback' parameter value of: " + cb + ".") );
          }
          else {
            var metaSeries = {};
            var keys = [];
            for( var i=0; i < metrics.length; i++ ) {
              var key = metrics[i].name.split(".")[nodeNum];
              if(isNone(metaSeries[key])) {
                metaSeries[key] = [];
                keys.push(key);
              }
              var metric = metrics[i];
              var peArray = metric.pathExpression.split(".");
              peArray[nodeNum] = key;
              metric.pathExpression = peArray.join(".");
              metaSeries[key].push(metric);
            }
            var result = [];
            for( var k=0; k < keys.length; k++ ) { 
              var x = TargetParseContext.prototype[cb].call(that, metaSeries[keys[k]]);
              result.push(x);
            }
            Q.all( result ).then( function(resolved) {
                deferred.resolve( resolved );
            } );
          }
        }
      })
      .fail( function( err ) { 
          deferred.reject( err );
      });
      return deferred.promise;
  });
}

module.exports = TargetParseContext;
