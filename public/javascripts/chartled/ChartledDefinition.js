if( typeof(Chartled) == 'undefined' ) Chartled = {};

Chartled.ChartledDefinition = function( definition, containerEl ) {
  this.containerEl = containerEl;
  this.deserialize( definition );
}

Chartled.ChartledDefinition.prototype.deserialize = function( definition ) {
  var that= this;
  that.chartleMargin = definition.chartleMargin;
  that.chartleMinSize = definition.chartleMinSize;
  if( layout ) {
    layout.remove_all_widgets();
    layout.destroy();
    layout= null;
    that.el= null;
  }
  this.el= document.createElement("ul");
  this.containerEl[0].appendChild( this.el );
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
            var c= chartles[el.id];
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
}

Chartled.ChartledDefinition.prototype.serialize = function() {
  var definition = {
      "version":  "0.0.1",
      "chartleMargin": this.chartleMargin,
      "chartleMinSize": this.chartleMinSize,
      "chartles": [],
      "clocks":   [],
      "layout":   {}
  };
  definition.layout.positions= layout.serialize();
  for(var k in chartles) {
      definition.chartles.push( chartles[k].serialize() );
  }
  return definition;
}
