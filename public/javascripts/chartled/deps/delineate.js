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

  var toolTipEl= document.createElement('div');
  toolTipEl.setAttribute('id', this.tooltipId)
  toolTipEl.setAttribute('class', 'hidden tooltipx')
  var serii= document.createElement('ul');
  serii.setAttribute('class', 'serii')
  toolTipEl.appendChild(serii);
  // Try and defeat z-index issues by lifting the tooltips 'above' the chart element stacking context
  document.getElementById(parentEl).parentNode.appendChild(toolTipEl); 

  this.graphContainer = d3.select('#' + parentEl +'-chart').append("svg")
      .attr("width", this.outerWidth)
      .attr("height", this.outerHeight);

  this.canvasArea= this.graphContainer.append("g")
       .classed("canvasArea", true);

  this.chartArea = this.canvasArea.append("g")
                      .classed("layers", true);
  // Add in layer containers.
  for(var k in this.config.layers){
    this.chartArea.append("g")
                  .classed("layer" + k, true);
  }
  
  this._buildScales();
  this._buildChart();
  this._buildAxes(); 
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

Chart.prototype._updateChartAreaSize= function( margins ) {
  margins= margins || {top: 2, right: 40, bottom: 20, left: 40};
  this._margins= margins;
  this.width = this.outerWidth - margins.left - margins.right,
  this.height = this.outerHeight - margins.top - margins.bottom;
  
  // Update our transformation that 'simplifies' width + height  calculations elsewhere.
  this.canvasArea.attr("transform", "translate(" + margins.left + "," + margins.top + ")");
  this.scales.x.range([0, this.width]);
  this.scales.y[0].range([this.height, 0]);
  this.canvasArea.select("g.x-axis").attr("transform", "translate(0," + this.height + ")");
  this.canvasArea.select(".y-axis-right").attr("transform", "translate(" + this.width + ",0)");
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
  for(var key in this.config.metrics ) {
    if( this.config.metrics[key].value == metric.targetSource ) {
      return this.config.metrics[key].layer;
    }
  }

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

Chart.prototype._sampleData= function( data ) {
  for( var key in data ) {                     
      //TODO: A better approach might be to 'throw away' some older data to allow for several updates with the same
      // sample boundaries, rather than re-sample for *each* update always having a window offset 1 less than the
      // previous sample-set ?
      if( data[key].datapoints.length > this.width && data[key].aggregationMethod == 'avg' ) {
        var rawLength= data[key].datapoints.length;
        var skipFactor= Math.round( rawLength / this.width );
        var skipFactorCounter= 0;
        var cumulative= 0;
        var cumulativeX= data[key].datapoints[0][1];
        var newDataPoints= [];
        for( var i =0; i<rawLength; i++ ) {
            cumulative += yCoord( data[key].datapoints[i] );
            if( skipFactorCounter++ >= skipFactor ) {
                newDataPoints[newDataPoints.length]= [cumulative/skipFactorCounter, cumulativeX];
                skipFactorCounter= 0;
                cumulative= 0;
                if( i <=  rawLength ) {
                    cumulativeX= data[key].datapoints[i][1];
                }
                else {
                    cumulativeX= -1;
                }
            }
        }
        if( cumulativeX != -1 && skipFactorCounter != 0 ) {
          newDataPoints[newDataPoints.length]= [cumulative/skipFactorCounter, cumulativeX];
        }
        data[key].datapoints= newDataPoints;
      }
    }
}

Chart.prototype.refreshData= function( data ) {
    var unsampledData= data;
    if( data && data.length > 0 ) {
//      this._sampleData( data );


/*      var stack = d3.layout.stack()
          .x( xCoord )
          .y( yCoord )
          .out( function(d, y0, y) {
            d.oy= d[0];
            d[0] = y+y0;
          })
          .values(function(d) { 
            return d.datapoints; });

      var data= stack(data);
  */

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
      
      this._updateChartAreaSize({
        top: 5,
        right: (rightAxis ? 40 : 2),
        bottom: (this.config.axes.x.display ? 20: 2),
        left:  (leftAxis ? 40 : 2)
      });

      var that= this;
      var line = d3.svg.line()
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

      // Render layers
      var colours= d3.scale.category10().domain(d3.range(10));

      for( var k=0 ; k< this.config.layers.length; k++ ) {
        var layerEl= this.chartArea.select( "g.layer" + k );
        layerEl.selectAll("*").remove();
      }
      
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
      }
      d3.select('#' + that.id +' svg').on("mouseover", function(d, i) {
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
                    colour : d3.rgb(colours(d)).toString()
                  });
                }
              }
              if( page_mode == "readOnly" ) {
                d3.select('#' + that.tooltipId)
                  .style({ "left" : (chartOffset.left + xPos) +"px", "top": (chartOffset.top + yPos) +"px"})
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
                  .html(function(d) { return '<div><span style="color:'+ d.colour +'">' + d.name + '</span>' + '<span style="color:'+ d.colour +'">&nbsp;:&nbsp;'+ d.value +'</span></div>'; } );

                if( that._hidingTooltip ) {
                  clearTimeout(that._hidingTooltip);
                }

                d3.select('#' + that.tooltipId).classed("hidden", false);
                }
            }
          }
      })
      .on("mouseout", function(d, i) {
        that._hidingTooltip= setTimeout( function() {
          if( that._hidingTooltip ) {
            that._hidingTooltip= null;
            d3.select('#' + that.tooltipId).classed("hidden", true);
          }
        }, 200 );
      });      
      
      this._redrawAxes( leftAxis, rightAxis );
    }
    else { 
      // TODO: no data returned
    }
    this.previousData= unsampledData;
}
Chart.prototype._renderBarsLayer= function( data, metricLayer, dataKeys, colours )  {
  var barPadding = 1;
  var layerEl= this.chartArea.select( "g.layer" + metricLayer );
  var that= this;
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
