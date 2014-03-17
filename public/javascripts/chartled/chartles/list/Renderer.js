Chartled.ListChartle = function(definition, el, baseUrl) {
  Chartled.DashingChartle.call( this, definition, el, baseUrl );
};

Chartled.inheritPrototype(Chartled.ListChartle, Chartled.DashingChartle, {
  initialize: function( definition ) {
    if( typeof(definition.backgroundColorClass) == 'undefined' ) definition.backgroundColorClass= 'chartled-color-3';
    if( typeof(definition.backgroundIcon) == 'undefined' ) definition.backgroundIcon= 'tachometer';
    if( typeof(definition.displayUpdatedAt) == 'undefined' ) definition.displayUpdatedAt= true;

    Chartled.DashingChartle.prototype.initialize.call(this, definition);
  },
  update: function(err, data) {
    var that= this;
    if( err ) {
      d3.select(this.valueEl)
        .text( "???" );
      that._resizeValue();
    }
    else {
      var results= [];
      if( data && data.length > 0 ) {
        for( var k in data ) {
          // Select the last data point from each series, hopefully thats what the metric author intended!
          results.push({target: data[k].target, value: data[k].datapoints[data[k].datapoints.length-1][0]} );
        }
      }
      console.log( results );
      var allLi= d3
        .select(this.valueEl)
        .selectAll('li')
        .data( results, function(d) {
          return d.target;
        } );
        
      var newLi= allLi
        .enter()
        .append("li");

        allLi
        .exit()
        .remove();

      newLi.append("span")
           .classed("label", true);

      newLi.append("span")
           .classed("value", true);

      allLi.selectAll("span.label")
          .text(function(d) {
            return d.target;} 
          );
      allLi.selectAll("span.value")
          .text(function(d) {
              console.log( d.value );
              return d.value;
            } 
          );
    }
    if( this._displayUpdatedAt ) {
      var now= new Date();
      var result= (now.getHours()<10? "0"+now.getHours():now.getHours()) + ":" + (now.getMinutes()<10? "0"+now.getMinutes():now.getMinutes());
      d3.select(this._updatedAtEl)
        .text("Last updated at " + result ); 
    }
  
    if( this._displayUpdatedAt ) {
      var now= new Date();
      var result= (now.getHours()<10? "0"+now.getHours():now.getHours()) + ":" + (now.getMinutes()<10? "0"+now.getMinutes():now.getMinutes());
      d3.select(this._updatedAtEl)
        .text("Last updated at " + result ); 
    }    
  }
});
