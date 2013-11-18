if( typeof(Chartled) == 'undefined' ) Chartled = {};

Chartled.TextChartle = function(id, layout, text) {
  chartles[id] = this;
  this.id = id;
  this.layout = layout;
  var widget= layout.add_widget("<div class='new textbox' id='" + id + "'><div class='realValue'>" + text + "</div></div>", 4, 1);
  widget.hallo({
    plugins: {
      'halloformat': {
          formattings: {"bold": true, "italic": true, "strikethrough": true, "underline": true}
      },
      halloheadings : {headers:  [1,2,3,4,5]},
      hallolists: {},
      hallojustify: {},
      halloreundo: {}
    }
  });
};

Chartled.TextChartle.prototype = {
  resize: function(width, height) {
    // Nothing to do.
  },
  serialize: function() {
    return { "id": this.id, "type": "dynamic_text", "text": $("#" + this.id + " .realValue").html() };
  }
}
