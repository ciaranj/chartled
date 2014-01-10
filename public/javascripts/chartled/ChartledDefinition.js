if( typeof(Chartled) == 'undefined' ) Chartled = {};

Chartled.ChartledDefinition = function( definition, containerEl, baseUrl ) {
  if( containerEl && containerEl.length ) containerEl= containerEl[0];
  this.containerEl = containerEl;
  this.baseUrl = baseUrl;
  this.deserialize( definition );
}

Chartled.ChartledDefinition.prototype.addNewChartle = function( chartle, clock, size_x, size_y, col, row ) {
  var chartle= this._addNewChartle(chartle, size_x, size_y, col, row);
  if( clock ) {
    this.timeKeeper.registerChartle( clock, chartle );
  }
  return chartle;
}
Chartled.ChartledDefinition.prototype._addNewChartle = function( chartle, size_x, size_y, col, row ) {
  if(!chartle.id) {
    chartle.id = "chartle-" + this.nextChartleId;
    this.nextChartleId ++;
  }
  var $widget= layout.add_widget("<div id='" + chartle.id + "' class='chartled'/>", size_x, size_y, col, row);
  $widget.css("display", "table");
  try{
    var c= new (eval(chartle.type))( chartle, $widget[0], this.baseUrl );
    this.chartles[chartle.id]= c;
    return c;
  }
  catch(e) {
    throw e
  }
}

Chartled.ChartledDefinition.prototype.deserialize = function( definition ) {
  var that= this;
  
  that.chartleMargin = definition.layout.gridMargin;
  that.chartleMinSize = definition.layout.gridMinSize;

  that.nextChartleId= (definition.nextChartleId ? definition.nextChartleId : 1);

  if( this.chartles ) {
    for(var k in this.chartles) {
      if( this.chartles[k].dispose ) this.chartles[k].dispose();
    }
  }

  this.chartles= [];

  if( this.timeKeeper ) {
    this.timeKeeper.dispose();
    this.timeKeeper= null;
  }

  if( typeof(layout) != 'undefined' ) {
    this.containerEl.removeChild( this.el );
    that.el= null;
    layout.remove_all_widgets();
    layout.destroy();
    layout= null;
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

    this._addNewChartle( chartle, chartlePos.size_x, chartlePos.size_y, chartlePos.col, chartlePos.row );
  }
  this.timeKeeper= new Chartled.TimeKeeper( definition.clocks , this.chartles );
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
  definition.clocks= this.timeKeeper.serialize();
  return definition;
}
