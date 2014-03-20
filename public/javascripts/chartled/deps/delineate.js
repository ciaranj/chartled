Chart= function(parentEl, outerWidth, outerHeight, config ) {
  this.id= parentEl;
  this.tooltipId= parentEl + '-tooltip';
  this._setConfig( config );
  this.outerWidth= outerWidth;
  this.outerHeight= outerHeight;


  var chartEl= document.createElement('div');
  chartEl.setAttribute('id', parentEl + '-chart')
  chartEl.setAttribute('class', 'chart')
  document.getElementById(parentEl).appendChild(chartEl);

  this.toolTipEl= document.createElement('div');
  this.toolTipEl.setAttribute('id', this.tooltipId)
  this.toolTipEl.setAttribute('class', 'hidden tooltipx')
  var serii= document.createElement('ul');
  serii.setAttribute('class', 'serii')
  this.toolTipEl.appendChild(serii);
  // Try and defeat z-index issues by lifting the tooltips 'above' the chart element stacking context
  document.getElementById(this.id).parentNode.appendChild(this.toolTipEl); 

  this.graphContainer = d3.select('#' + parentEl +'-chart').append("svg")
      .attr("width", this.outerWidth)
      .attr("height", this.outerHeight);

  this.canvasArea= this.graphContainer.append("g")
       .classed("canvasArea", true);

  this.chartArea = this.canvasArea.append("g")
                      .classed("layers", true);
  for(var k in this.config.groups){
    this.chartArea.append("g")
                  .classed("layer" + k, true);
  }

  this._buildScales();
  this._buildChart();
  
  this._buildAxes( );
  this._buildTitle();
  if( typeof(config.title) != 'undefined' && config.title != "" ) {
    this.set_title(config.title);
  }
  if( typeof(config.horizontalAxisVisible) != 'undefined' && config.horizontalAxisVisible != "" ) {
    this.set_horizontalAxisVisible(config.horizontalAxisVisible);
  }
  if( typeof(config.autoSampleData) != 'undefined' && config.autoSampleData != "" ) {
    this.set_autoSampleData(config.autoSampleData);
  }

  this._updateChartAreaSize();
}

Chart.prototype.resize= function( outerWidth, outerHeight ) {
  this.outerWidth= outerWidth;
  this.outerHeight= outerHeight;
  this.graphContainer
      .attr("width", this.outerWidth)
      .attr("height", this.outerHeight);
 /* Setting the width with attr. doesn't seem to correctly shrink the displayed area in chrome! 
  * ( http://stackoverflow.com/questions/11622227/force-reflow-of-the-dom-container-for-a-resized-svg-element-in-chrome )
  */
  var containerEl= $(this.graphContainer[0]);
  containerEl.css({"width" : this.outerWidth + "px", "height" : this.outerHeight + "px"});
  this._updateChartAreaSize();
  if( this.previousData ) {
    this.refreshData( this.previousData );
  }
}

Chart.prototype._setConfig= function( config ) {
  var tmpConfig= config || { };

  if( !tmpConfig.axes ) {
    tmpConfig.axes= {
        x : {display:true},
        y : [{display:"left"}]
    };
  }

  // Validate the config. (enforces at least one [non-visible] y-axis)
  if( !tmpConfig.axes.y || tmpConfig.axes.y.length == 0 ) tmpConfig.axes.y= [{}];

  var lDisplay= 0;
  var rDisplay= 0;
  for( var k in tmpConfig.axes.y ) {
    if( tmpConfig.axes.y[k].display ) {
      if( tmpConfig.axes.y[k].display == "left" ) lDisplay++;
      else if( tmpConfig.axes.y[k].display == "right" ) rDisplay++;
    }
  }
  if(lDisplay > 1) throw new Error("Only 1 left-hand visual axis is allowed at a time.")
  if(rDisplay > 1) throw new Error("Only 1 right-hand visual axis is allowed at a time.")


  this.config= tmpConfig;
}

Chart.prototype._updateChartAreaSize= function() {
  var margins = {
        top: 4, 
        right: 4, 
        bottom: (this._horizontalAxisVisible ? 20 :4 ), 
        left: 40};
  this._margins= margins;
  this.width = this.outerWidth - margins.left - margins.right,
  this.height = this.outerHeight - margins.top - margins.bottom;
  
  // Update our transformation that 'simplifies' width + height  calculations elsewhere.
  this.canvasArea.attr("transform", "translate(" + margins.left + "," + margins.top + ")");
  this.scales.x.range([0, this.width]);
  this.scales.y[0].range([this.height, 0]);
  this.canvasArea.select("g.x-axis").attr("transform", "translate(0," + this.height + ")")
                 .attr("style", (this._horizontalAxisVisible)?"":"display:none")
  this.canvasArea.select(".y-axis-right")
    .attr("transform", "translate(" + this.width + ",0)");
  
  // The title is attached to the outer container, not the inner canvas, so the height + width calculations
  // need to be relative to the outer container.
  this.title.attr("transform", "translate("+(this.outerWidth/2)+","+(this.outerHeight/2)+")");
}

Chart.prototype._buildAxes= function() {

  this.xAxis = d3.svg.axis()
      .orient("bottom");

  this.yAxisLeft = d3.svg.axis()
      .ticks(5)
      .orient("left");

  this.yAxisRight = d3.svg.axis()
      .ticks(5)
      .orient("right");

  this.canvasArea.append("g")
          .classed("axis", true)
          .classed("x-axis", true);

  this.canvasArea.append("g")
          .classed("axis", true)
          .classed("y-axis", true)
          .classed("y-axis-left", true);

  this.canvasArea.append("g")
          .classed("axis", true)
          .classed("y-axis", true)
          .classed("y-axis-right", true);
}
Chart.prototype._buildTitle= function() {
  this.title= this.graphContainer
                  .append("text")
                  .classed("chart-title", true)
                  .attr("style", "text-anchor:middle");
}
Chart.prototype._buildChart= function() {

  var that= this;
  

}  

Chart.prototype._buildScales= function() {
  this.scales= {};
  this.scales.y=[]; // There can be >=1 y scales
  this.scales.x= d3.time.scale();
  this.scales.y[0] = d3.scale.linear();
}
var yCoord= function(point) {
  return point[0] == null ? 0 : point[0];
}
var xCoord= function(point) {
  return point[1] * 1000;
}

Chart.prototype._getLayerForMetric= function( metric ) {
/*  for(var key in this.config.metrics ) {
    if( this.config.metrics[key].value == metric.targetSource ) {
      return this.config.metrics[key].layer;
    }
  }*/
  

  // If we got here we couldn't find the layer configuration.. assume layer 0.
  return 0;
}

Chart.prototype._getLeftAxis= function( ) {
  for(var k in this.config.axes.y ) {
    if( this.config.axes.y[k].display == "left" ) return k;
  }
  return null;
}

Chart.prototype._getRightAxis= function( ) {
  for(var k in this.config.axes.y ) {
    if( this.config.axes.y[k].display == "right" ) return k;
  }
  return null;
}

Chart.prototype._aggregateSample= function( aggregationMethod, values ) {
  function getSum() {
    var acc=0;
    for( var k in values ) {
      acc += values[k];
    }
    return acc;
  }
  switch(aggregationMethod) {
    case('min'):
      return Math.min.apply(this, values);
    case('max'):
      return Math.max.apply(this, values);
    case('sum'):
      return getSum();
    case('median'):
      values.sort();
      return values[ values.length / 2 ];
    default:
      // Average by default
      return getSum() / values.length;
  }
};
Chart.prototype._sampleData= function( data ) {
  if( this._autoSampleData === true ) {
    var w= this.width;
    
    for( var g in this.config.groups ) {
      var group= this.config.groups[g];
      if(group.renderer == 'bar' ) {
        // If we're drawing any bars, they take up more horizontal space per 'point' than lines or areas
        // so we need to pretend we have less space around overall! 
        w= w / 2;
        break;
      }
    }
    for( var key in data ) {
        if( data[key].datapoints.length > w ) {
          var rawLength= data[key].datapoints.length;
          var skipFactor= Math.round( rawLength / w );
          var skipFactorCounter= 0;
          var cumulative= [];
          var newTs= data[key].datapoints[0][1];
          var initialTs= newTs;
          var newDataPoints= [];
          for( var i =0; i<rawLength; i++ ) {
            // TODO: take into account xFileFactor and ensure nulls are treated appropriately.
              var v= yCoord( data[key].datapoints[i] );
              if( v == null ){
                console.log( v );
              }
              else { 
                cumulative.push( v );
              }
              if( skipFactorCounter++ >= skipFactor ) {
                  newDataPoints.push( [this._aggregateSample(data[key].aggregationMethod, cumulative), newTs] );
                  skipFactorCounter= 0;
                  cumulative= [];
                  if( i <=  rawLength ) {
                      newTs= data[key].datapoints[i][1];
                  }
                  else {
                      newTs= -1;
                  }
              }
          }
          if( newTs != -1 && skipFactorCounter != 0 ) {
            newDataPoints.push( [this._aggregateSample(data[key].aggregationMethod, cumulative), newTs] );
            data[key].tInfo[1]= newTs;
          }
          data[key].datapoints= newDataPoints;

          // Update new sampled timestamp information.
          data[key].tInfo[0]= initialTs;
          data[key].tInfo[2]= data[key].tInfo[2] * skipFactor;
        }
      }
      return data;
    }
    else {
      return data;
    }
}

Chart.prototype.refreshData= function( data ) {
    for( var k in this.config.groups ) {
      var layerEl= this.chartArea.select( "g.layer" + k );
      layerEl.selectAll("*").remove();
    }

    if( data && data.length > 0 ) {
      data= this._sampleData( data );

      // Assumes that all the data coming back is the same timespan.
      this.scales.x.domain( [xCoord(data[0].datapoints[0]),
                             xCoord(data[0].datapoints[data[0].datapoints.length-1]) ] );
      // This will only work for non-stacked areas (presumably)
      var minY= 100000000;
      var maxY= -10000000;
      for( var key in data ) {
        maxY= d3.max([d3.max(data[key].datapoints, yCoord), maxY])
        minY= d3.min([d3.min(data[key].datapoints, yCoord), minY])
      }
      this.scales.y[0].domain([minY, maxY]);

      var leftAxis= this._getLeftAxis();
      var rightAxis= this._getRightAxis();

      var that= this;
  /*    var line = d3.svg.line()
                       .x(function(d) {
                         return that.scales.x( xCoord(d) );
                       })
                       .y(function(d) {
                          return that.scales.y[0]( yCoord(d) );
                        })
      var area = d3.svg.area()
        .x(line.x())
        .y1(line.y())
        .y0(this.scales.y[0](0));
*/
      // Render layers
      var colours= d3.scale.category10().domain(d3.range(10));
      var colourKey= 0;
      // Iterate over each group (only really ever 2 at the minute.)
      for( var g in this.config.groups ) {
        var metrics= this.config.groups[g].metrics;
        if( metrics && metrics.length > 0 ) {
          var layerEl= this.chartArea.select( "g.layer" + g );

          // Build the renderer for this group.
          var line = d3.svg.line()
                 .x(function(d) {
                   return that.scales.x( xCoord(d) );
                 })
                 .y(function(d) {
                    return that.scales.y[0]( yCoord(d) );
                  })
                  .interpolate( this.config.groups[g].interpolation );


          if( that.scales.y[0].domain()[0] > 0 ) {
            var areaY0 = this.scales.y[0](that.scales.y[0].domain()[0]);
          }
          else {
            var areaY0 = this.scales.y[0](0);
          }
          var area = d3.svg.area()
            .x(line.x())
            .y1(line.y())
            .y0(areaY0)
            .interpolate( this.config.groups[g].interpolation );

          var renderer= this.config.groups[g].renderer;
          for( var m in metrics ) {
            for( var d in data ) {
              if( data[d].targetSource == metrics[m] ) {
                var c= d3.rgb(colours(colourKey));
                colourKey= (++colourKey)%10;

                if( renderer == "line" ) {
                  var lPath= line(data[d].datapoints);
                   /*if( this.config.layers[metricLayer].dropShadow ) {
                      layerEl.append("path")
                             .classed("shadow", true)
                             .attr("fill", "none")
                             .attr("stroke-width", "2px")
                             .attr("stroke", "black" )
                             .attr("d", lPath )
                             .attr("opacity", 0.6)
                             .attr("transform", "translate(1,1)");
                   }*/
                   layerEl.append("path")
                          .attr("fill", "none")
                          .attr("stroke-width", "2px")
                          .attr("stroke", c )
                          .attr("d", lPath );
                }
                else if( renderer == "area" ){
                  var areaPath= layerEl.append("path")
                                  .attr("fill", c.toString() )
                                  .attr("opacity", 0.6)
                                  .attr("d", area(data[d].datapoints) );

                  var linePath= layerEl.append("path")
                                   .attr("fill", "none")
                                   .attr("stroke-width", "2px")
                                   .attr("stroke", c.darker().toString() )
                                   .attr("d", line(data[d].datapoints) );
                }
                else if( renderer == "bar" ){
                  var barPadding = 1;
                  var maxBarWidth= (that.width / data[d].datapoints.length) - barPadding;
                  var barOffset= -maxBarWidth/2;
                  if( that.scales.y[0].domain()[0] < 0 ) {
                    var originY= that.scales.y[0](0);
                  }
                  else {
                    var originY= undefined;
                  }
                  // Not sure why selectAll(BLANK!!) works here, but it does .. must get a better understanding soon.
                  layerEl.selectAll()
                          .data( data[d].datapoints )
                          .enter()
                          .append("rect")
                          .attr("x", function(d, i) {
                             return that.scales.x(xCoord(d)) + barOffset;
                          })
                          .attr("y", function(d) {
                            var val= yCoord(d);
                            if( typeof(originY) != 'undefined' ) {
                              val= Math.max(0, yCoord(d));
                            }
                            return that.scales.y[0](val);
                            
                          })
                          .attr("width", maxBarWidth)
                          .attr("height", function(d) {
                            if( originY ) {
                              return Math.abs(that.scales.y[0](yCoord(d)) - originY);
                            }
                            else {
                              return that.height - that.scales.y[0](yCoord(d));
                            }
                          })
                          .attr("fill", function(d) {
                             return c;
                          });
                }
             }
            }
          }
        }
      }

/*
      // Group by layers
      var layered= [];
      for( var key in data ) {
        var metricLayer= this._getLayerForMetric( data[key] );
        if( !layered[metricLayer] ) layered[metricLayer]= [];
        layered[metricLayer].push( key );
      }

      for( var metricLayer in layered ) {
        var renderer= this.config.layers[metricLayer].renderer;
        if( renderer == "bar" ) {
          this._renderBarsLayer( data, metricLayer, layered[metricLayer], colours )
        }
        else {
          var layerEl= this.chartArea.select( "g.layer" + metricLayer );
          for( var key in layered[metricLayer] ) {
            var c= d3.rgb(colours(key));
            if( renderer == "line" ) {
              var lPath= line(data[key].datapoints);
               if( this.config.layers[metricLayer].dropShadow ) {
                  layerEl.append("path")
                         .classed("shadow", true)
                         .attr("fill", "none")
                         .attr("stroke-width", "2px")
                         .attr("stroke", "black" )
                         .attr("d", lPath )
                         .attr("opacity", 0.6)
                         .attr("transform", "translate(1,1)");
               }
               layerEl.append("path")
                      .attr("fill", "none")
                      .attr("stroke-width", "2px")
                      .attr("stroke", c )
                      .attr("d", lPath );
            }
            else if( renderer == "area" ){
              var areaPath= layerEl.append("path")
                              .attr("fill", c.toString() )
                              .attr("opacity", 0.6)
                              .attr("d", area(data[key].datapoints) );

              var linePath= layerEl.append("path")
                               .attr("fill", "none")
                               .attr("stroke-width", "2px")
                               .attr("stroke", c.darker().toString() )
                               .attr("d", line(data[key].datapoints) );
            }
          }
        }
      }*/
      d3.select('#' + that.id +' svg').on("mouseover", function(d, i) {
        if( page_mode == "readonly" ) {
          if( data && data.length > 0 && data[0].datapoints.length && data[0].datapoints.length > 0 ) {
            var chartOffset= $("#"+that.id).offset()
            var xPos= d3.mouse(this)[0] - that._margins.left;
            var yPos= d3.mouse(this)[1];

            var paths= [];

            var timestamp = (+that.scales.x.invert( xPos ))/1000;
            var offsetIndex= Math.floor((timestamp - data[0].tInfo[0]) / data[0].tInfo[2] );
            if( offsetIndex >= 0 && offsetIndex < data[0].datapoints.length  ) {

              for(var d in data ) {
                var value= data[d].datapoints[offsetIndex][0];
                if( value != null ) {
                  paths.push({
                    name : data[d].target,
                    value : data[d].datapoints[offsetIndex][0],
                    precision: data[d].tInfo[2],
                    colour : d3.rgb(colours(d)).toString()
                  });
                }
              }
                var $window= $(window);
                d3.select('#' + that.tooltipId)
                  .style({ "left" : (chartOffset.left + xPos -$window.scrollLeft()) +"px", "top": (chartOffset.top + yPos - $window.scrollTop()) +"px"})
                  .select('ul.serii')
                  .selectAll('li')
                  .data(paths, function(d) { 
                    return d.name; })
                  .enter()
                  .append('li');

                  d3.select('#' + that.tooltipId)
                  .select('ul.serii')
                  .selectAll('li')
                  .data(paths, function(d) {
                    return d.name; })
                  .exit()
                  .remove();

                  d3.select('#' + that.tooltipId)
                  .select('ul.serii')
                  .selectAll('li')
                  .data(paths , function(d) { 
                    return d.name; })
                  .html(function(d) { return '<div><span style="color:'+ d.colour +'">' + d.name + ' (' + d.precision +')s</span>' + '<span style="color:'+ d.colour +'">&nbsp;:&nbsp;'+ d.value +'</span></div>'; } );

                if( that._hidingTooltip ) {
                  clearTimeout(that._hidingTooltip);
                }

                d3.select('#' + that.tooltipId).classed("hidden", false);
              }
            }
          }
      })
      .on("mouseout", function(d, i) {
        if( page_mode == "readonly" ) {
          that._hidingTooltip= setTimeout( function() {
            if( that._hidingTooltip ) {
              that._hidingTooltip= null;
              d3.select('#' + that.tooltipId).classed("hidden", true);
            }
          }, 200 );
        }
      });      
      
      this._redrawAxes( leftAxis, rightAxis );
      // If we're here because we've resized the chart to be *Wider* than previously
      // we will have a loss of precision until the next true refresh occurs.
      this.previousData= data;
    }
    else { 
      // TODO: no data returned
    }
}
Chart.prototype._renderBarsLayer= function( data, metricLayer, dataKeys, colours )  {
  var layerEl= this.chartArea.select( "g.layer" + metricLayer );
  var that= this;
  var barPadding = 1;
  var maxBarWidth= that.width / data[0].datapoints.length - barPadding;
  var barOffset= 0;
  for( var key in dataKeys ) {
    var c= d3.rgb(colours(key));
    layerEl.selectAll("rect.d" + key)
       .data( data[key].datapoints )
       .enter()
       .append("rect")
       .classed("d"+key, true)
       .attr("x", function(d, i) {
           return (i * (that.width / data[key].datapoints.length))+ barOffset;
       })
       .attr("y", function(d) {
           return that.scales.y[0](yCoord(d));
       })
       .attr("width", maxBarWidth)
       .attr("height", function(d) {
           return that.height - that.scales.y[0](yCoord(d));
       })
       .attr("fill", function(d) {
           return c;
       });
       maxBarWidth -= 4;
       barOffset +=2;
   }
}

Chart.prototype._redrawAxes= function( leftAxis, rightAxis ) {
  // Redraw the axes
  if( leftAxis ) {
    this.yAxisLeft.scale(this.scales.y[leftAxis]);
    this.canvasArea.select(".y-axis-left").call(this.yAxisLeft);
  } else {
    this.canvasArea.select(".y-axis-left").selectAll("*").remove();
  }
  if( rightAxis ) {
    this.yAxisRight.scale(this.scales.y[rightAxis]);
    this.canvasArea.select(".y-axis-right").call(this.yAxisRight);
  }
  else {
      this.canvasArea.select(".y-axis-right").selectAll("*").remove();
  }
  if( this.config.axes.x.display === true) {
    this.xAxis.scale(this.scales.x);
    this.canvasArea.select(".x-axis").call(this.xAxis);
  }
}

Chart.prototype.set_title= function( title ) {
  this._title= title;
  this.title.text(this._title);
}

Chart.prototype.set_horizontalAxisVisible= function( visible ) {
  this._horizontalAxisVisible= visible;
  this._updateChartAreaSize();
}

// Note changes to this property only take effect on the next refresh.
Chart.prototype.set_autoSampleData= function( sample ) {
  this._autoSampleData= sample;
}

Chart.prototype.dispose= function() {
  document.getElementById(this.id).parentNode.removeChild(this.toolTipEl); 
}