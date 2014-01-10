if( typeof(Chartled) == 'undefined' ) Chartled = {};

Chartled.TextChartle = function(definition, el) {
  this.id = definition.id;
  this.el= el;
  var jEl= $(el);
  if( !jEl.hasClass('text') ) jEl.addClass('text');

  this.realValue= document.createElement('div')
  $(this.realValue).html( definition.text );
  this.realValue.setAttribute('class', 'realValue');
  this.el.appendChild( this.realValue );

  this.initialise();
};

Chartled.TextChartle.prototype = {
  initialise: function() {},
  dispose: function() {
    this.el.removeChild( this.realValue );
    this.el= null;
    this.id= null;
    this.realValue = null;
  },
  resize: function(width, height) {
    // Nothing to do.
  },
  serialize: function() {
    return { "id"   : this.id,
             "type" : "Chartled.TextChartle",
             "text" : $(this.realValue).html() };
  },
};
