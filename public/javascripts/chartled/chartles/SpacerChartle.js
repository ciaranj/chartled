if( typeof(Chartled) == 'undefined' ) Chartled = {};

Chartled.SpacerChartle = function(id, layout) {
  chartles[id] = this;
  this.id = id;
  this.layout = layout;
  var widget= layout.add_widget("<div class='new spacer' id='" + id + "'>&nbsp;</div>", 2, 2);
};

Chartled.SpacerChartle.prototype = {
  resize: function(width, height) {
    // Nothing to do.
  },
  serialize: function() {
    return { "id": this.id, "type": "spacer" };
  }
}
