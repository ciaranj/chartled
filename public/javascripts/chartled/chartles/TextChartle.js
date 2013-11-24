if( typeof(Chartled) == 'undefined' ) Chartled = {};

Chartled.TextChartle = function(definition, el) {
  this.id = definition.id;
  this.el= el;
  var jEl= $(el);
  if( !jEl.hasClass('text') ) jEl.addClass('text');
  
  this.realValue= document.createElement('div')
  $(this.realValue).html( definition.text );
  this.realValue.setAttribute('class', 'realValue');
  el.appendChild( this.realValue );
  $(this.realValue).hallo({
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
    return { "id": this.id,
             "type": "Chartled.TextChartle",
			 "text": $(this.realValue).html() };
  },
  setMaxAgeInSeconds: function( previousValue ) {},
  dispose: function() {
	// Nothing to do.
	this.el= null;
	this.layout= null;
	this.id= null;
	this.realValue = null;
  }
}
