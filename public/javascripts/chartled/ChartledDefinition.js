if( typeof(Chartled) == 'undefined' ) Chartled = {};

Chartled.ChartledDefinition = function( definition, containerEl, baseUrl ) {
  if( containerEl && containerEl.length ) containerEl= containerEl[0];
  this.containerEl = containerEl;
  this.baseUrl = baseUrl;
  this.deserialize( definition );
}

Chartled.ChartledDefinition.prototype.addNewChartle = function( chartle, size_x, size_y, col, row ) {
  if(!chartle.id) {
    chartle.id = "chartle-" + (++this.nextChartleId);
  }
  var widget= layout.add_widget("<div id='" + chartle.id + "'/>", size_x, size_y, col, row);
  try{
    var c= new (eval(chartle.type))( chartle, widget[0], this.baseUrl );
		this.chartles[chartle.id]= c;
	}
	catch(e) {
//		console.log( "Unable to import chartle: " + JSON.stringify(chartle) );
    throw e
	}

}

Chartled.ChartledDefinition.prototype.deserialize = function( definition ) {
  var that= this;
  
  that.chartleMargin = definition.layout.gridMargin;
  that.chartleMinSize = definition.layout.gridMinSize;
  that.nextChartleId= (definition.nextChartleId ? definition.nextChartleId : 0);

  if( this.chartles ) {
    for(var k in this.chartles) {
      this.chartles[k].dispose();
    }
  }

  this.chartles= [];
  
  if( typeof(layout) != 'undefined' ) {
    layout.remove_all_widgets();
    layout.destroy();
    layout= null;
    that.el= null;
  }
  this.el= document.createElement("ul");
  this.containerEl.appendChild( this.el );
  layout = $(that.el).gridster({
    widget_margins: [that.chartleMargin, that.chartleMargin],
    widget_base_dimensions: [that.chartleMinSize, that.chartleMinSize],
    max_size_x: 24,
    max_size_y: 24,
    resize: {
        enabled: true,
        start: function(e, ui, $widget) {
        },
        resize: function(e, ui, $widget) {
        },
        stop: function(e, ui, $widget) {
            var el= $widget[0];
            var c= that.chartles[el.id];
            // Oddness here, have to do the actual content resize outside of this method (and after a delay)?
            setTimeout(function() {
                c.resize( $(el).width(), $(el).height() );
            }, 250);
        }
    },
    serialize_params : function($w, wgd) { 
        return { id: $w[0].id, col: wgd.col, row: wgd.row, size_x: wgd.size_x, size_y: wgd.size_y };
    }
  }).data('gridster');
  
  
  var chartleBlocks= {};
  for(var k in definition.layout.positions ) {
    var pos= definition.layout.positions[k];
    chartleBlocks[pos.id]= pos;
  }
  
  for(var k in definition.chartles) {
    var chartle= definition.chartles[k];
    var chartlePos= chartleBlocks[chartle.id];

    this.addNewChartle( chartle, chartlePos.size_x, chartlePos.size_y, chartlePos.col, chartlePos.row );
  }
}

Chartled.ChartledDefinition.prototype.serialize = function() {
  var definition = {
      "version":  "0.0.1",
      "exported": +new Date(),
      "nextChartleId": this.nextChartleId,
      "chartles": [],
      "clocks":   [],
      "layout":   {}
  };
  definition.layout.type= "fixed-grid";
  definition.layout.gridMargin= this.chartleMargin;
  definition.layout.gridMinSize= this.chartleMinSize;
  definition.layout.positions= layout.serialize();
  for(var k in this.chartles) {
      definition.chartles.push( this.chartles[k].serialize() );
  }
  return definition;
}

// TODO: this 'mechanism' should be replaced by proper 'clocks' this is just temporary.
Chartled.ChartledDefinition.prototype.setMaxAgeInSeconds = function(previousValue) {
	for(var c in this.chartles ) {
		this.chartles[c].setMaxAgeInSeconds( previousValue );
	}
}