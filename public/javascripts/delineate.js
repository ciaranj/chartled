Chart= function(parentEl, outerWidth, outerHeight, config ) {
  this._setConfig( config );
  this.outerWidth= outerWidth;
  this.outerHeight= outerHeight;

  var graphContainer = d3.select("#" + parentEl).append("svg")
      .attr("width", this.outerWidth)
      .attr("height", this.outerHeight);

  this.canvasArea= graphContainer.append("g")
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
      if( data[key].datapoints.length > this.width && data[key].aggregationMethod == 'average' ) {
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
    if( data && data.length > 0 ) {
      this._sampleData( data );


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
      }
      this.scales.y[0].domain([0, maxY]);

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

      for( var key in data ) {
        var c= d3.rgb(colours(key));
        var metricLayer= this._getLayerForMetric( data[key] );
        var renderer= this.config.layers[metricLayer].renderer;
        var layerEl= this.chartArea.select( "g.layer" + metricLayer );
        if( renderer == "line" ) {
          var linePath= layerEl.append("path")
                             .attr("fill", "none")
                             .attr("stroke-width", "2px")
                             .attr("stroke", c )
                             .attr("d", line(data[key].datapoints) ); // set the new data
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
        else {
          var barPadding = 1;
          layerEl.selectAll("rect.d"+key)
             .data( data[key].datapoints )
             .enter()
             .append("rect")
             .classed("d"+key, true)
             .attr("x", function(d, i) {
                 return i * (that.width / data[key].datapoints.length);
             })
             .attr("y", function(d) {
                 return that.scales.y[0](yCoord(d));
             })
             .attr("width", that.width / data[key].datapoints.length - barPadding)
             .attr("height", function(d) {
                 return that.height - that.scales.y[0](yCoord(d));
             })
             .attr("opacity", 0.6)
             .attr("fill", function(d) {
                 return c;
             });
        }
      }
      this._redrawAxes( leftAxis, rightAxis );
    }
    else { 
      // TODO: no data returned
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
