if( typeof(Chartled) == 'undefined' ) Chartled = {};

Chartled.SpacerChartle = function(definition, el) {
  this.id = definition.id;
  this.el= el;
  var jEl= $(el);
  if( !jEl.hasClass('spacer') ) jEl.addClass('spacer');
};

Chartled.SpacerChartle.prototype = {
  resize: function(width, height) {
    // Nothing to do.
  },
  serialize: function() {
    return { "id": this.id, 
             "type": "Chartled.SpacerChartle"};
  },
  dispose: function() {
	// Nothing to do.
  }
}
