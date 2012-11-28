Chart= function(parentEl, outerWidth, outerHeight ) {
  this.outerWidth= outerWidth;
  this.outerHeight= outerHeight;

  var graphContainer = d3.select("#" + parentEl).append("svg")
      .attr("width", this.outerWidth)
      .attr("height", this.outerHeight);

  this.canvasArea= graphContainer.append("g")
       .classed("canvasArea", true);

  this.chartArea = this.canvasArea.append("g")
                      .classed("chartArea", true);
  
  this._buildBackground();
  this._buildScales();
  this._buildChart();
  this._buildAxes(); 
  this._updateChartAreaSize();
}

Chart.prototype._updateChartAreaSize= function( margins ) {
  margins= margins || {top: 5, right: 40, bottom: 20, left: 40};
  this.width = this.outerWidth - margins.left - margins.right,
  this.height = this.outerHeight - margins.top - margins.bottom;
  
  // Update our transformation that 'simplifies' width + height  calculations elsewhere.
  this.canvasArea.attr("transform", "translate(" + margins.left + "," + margins.top + ")");
  this.x.range([0, this.width]);
  this.y.range([this.height, 0]);
  this.canvasArea.select("g.x-axis").attr("transform", "translate(0," + this.height + ")");
}

Chart.prototype._buildAxes= function() {

  this.xAxis = d3.svg.axis()
      .scale(this.x)
      .orient("bottom");

  this.yAxis = d3.svg.axis()
      .scale(this.y)
      .ticks(5)
      .orient("left");

//  this.yAxis2 = d3.svg.axis()
//      .scale(this.y)
//      .orient("right");
      
  // X Axis
  this.canvasArea.append("g")
          .attr("class", "x-axis")
          .call(this.xAxis)
  // Y Axes.
//  this.canvasArea.append("g")
//          .attr("class", "y axis")
//          .attr("transform", "translate(" + this.width + ",0)")
//          .call(this.yAxis);

  this.canvasArea.append("g")
          .attr("class", "y-axis")
          .call(this.yAxis);
}

Chart.prototype._buildBackground= function() {
/*  this.chartArea.append("rect")
            .attr("class", "inner")
            .attr("width", this.width)
            .attr("height", this.height); */
}

Chart.prototype._buildChart= function() {

  var that= this;
  
  this.line = d3.svg.line()
                   .x(function(d) {
                     return that.x( new Date(d[1]*1000) ); })
                   .y(function(d) {
                      return that.y(d[0]); })
  this.area = d3.svg.area()
    .x(this.line.x())
    .y1(this.line.y())
    .y0(this.y(0));

  var c= d3.rgb("#9CC1E0")
  this.areaPath= this.chartArea.append("path")
                      .attr("fill", c.toString() );

  this.linePath= this.chartArea.append("path")
                       .attr("fill", "none")
                       .attr("stroke-width", "2px")
                       .attr("stroke", c.darker().toString() );
}  

Chart.prototype._buildScales= function() {
  this.x = d3.time.scale()
  this.y = d3.scale.linear()
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
      this.x.domain(  [new Date( data[0].datapoints[0][1]* 1000 ),  
                      new Date( data[0].datapoints[data[0].datapoints.length-1][1]* 1000 )] );

      this.y.domain([0, d3.max(data[0].datapoints, function(d) { return d[0]; })]);
//      this._updateChartAreaSize(
//       { left:Math.random()*40, right:Math.random()*40, top:Math.random()*40, bottom:Math.random()*40 }
//       );

      this.yAxis.scale(this.y);
      this.xAxis.scale(this.x);

      this.canvasArea.select("g.x-axis").call(this.xAxis);
      this.canvasArea.select("g.y-axis").call(this.yAxis);
      this.area.y0(this.y(0));
      

      this.linePath
          .attr("d", this.line(data[0].datapoints) ); // set the new data
      this.areaPath
          .attr("d", this.area(data[0].datapoints) ); // set the new data
          
/*
      					.attr("transform", "translate(" + x(1) + ")") // set the transform to the right by x(1) pixels (6 for the scale we've set) to hide the new value
      					.attr("d", line) // apply the new data values ... but the new value is hidden at this point off the right of the canvas
      					.transition() // start a transition to bring the new value into view
      					.ease("linear")
      					.duration(transitionDelay) // for this demo we want a continual slide so set this to the same as the setInterval amount below
      					.attr("transform", "translate(" + x(0) + ")"); // animate a slide to the left back to x(0) pixels to reveal the new value
  */    
    }
    else { 
      // TODO: no data returned
    }
}