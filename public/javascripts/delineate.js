Chart= function(parentEl, outerWidth, outerHeight ) {
    
  var margin = {top: 20, right: 40, bottom: 20, left: 40};
  
  this.width = outerWidth - margin.left - margin.right,
  this.height = outerHeight - margin.top - margin.bottom;

  this._buildScales();
  this._buildGraph( parentEl, outerWidth, outerHeight, margin );
  this._buildBackground();
  this._buildAxes(); 
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
  this.svg.append("g")
          .attr("class", "x-axis")
          .attr("transform", "translate(0," + this.height + ")")
          .call(this.xAxis)
  // Y Axes.
//  this.svg.append("g")
//          .attr("class", "y axis")
//          .attr("transform", "translate(" + this.width + ",0)")
//          .call(this.yAxis);

  this.svg.append("g")
          .attr("class", "y-axis")
          .call(this.yAxis);
}

Chart.prototype._buildBackground= function() {
/*  this.graph.append("rect")
            .attr("class", "inner")
            .attr("width", this.width)
            .attr("height", this.height); */
}

Chart.prototype._buildGraph= function( el, w, h, margin ) {
  this.svg = d3.select("#" + el).append("svg")
      .attr("width", w)
      .attr("height", h)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");          
  this.graph = this.svg.append("g")
  var that= this;
  
  this.line = d3.svg.line()
                   .x(function(d) {
                     return that.x( new Date(d[1]*1000) ); })
                   .y(function(d) {
                      return that.y(d[0]); })  
  this.graph.append("path")
            .attr("fill", "none")
            .attr("stroke", "#000");
            
  //.attr("d", this.line([]));                   
}  

Chart.prototype._buildScales= function() {
  console.log( this.width );
  this.x = d3.time.scale()
      .range([0, this.width]);

  this.y = d3.scale.linear()
      .range([this.height, 0]);
}

Chart.prototype.refreshData= function( data ) {
    if( data && data.length > 0 ) {
      this.x.domain(  [new Date( data[0].datapoints[0][1]* 1000 ),  
                      new Date( data[0].datapoints[data[0].datapoints.length-1][1]* 1000 )] );

      this.y.domain([0, d3.max(data[0].datapoints, function(d) { return d[0]; })]);
      this.yAxis.scale(this.y);
      this.xAxis.scale(this.x);

      this.svg.select("g.x-axis").call(this.xAxis);
      this.svg.select("g.y-axis").call(this.yAxis);      
  /*
      graph.selectAll("path")
      					.data([data]) // set the new data
      					.attr("d", line); /
*/
      this.graph.selectAll("path")
      					.attr("d", this.line(data[0].datapoints) ); // set the new data
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