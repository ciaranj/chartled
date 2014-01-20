Chartled.TextChartle = function( definition, el, baseUrl ) {
  Chartled.BaseChartle.call( this, definition, el, baseUrl );
};


Chartled.inheritPrototype(Chartled.TextChartle, Chartled.BaseChartle, {
  initialize: function(definition) {
    Chartled.BaseChartle.prototype.initialize.call(this, definition);

    if( !this.jEl.hasClass('text') ) this.jEl.addClass('text');
    this.realValue= document.createElement('div')
    $(this.realValue).html( definition.text );
    this.realValue.setAttribute('class', 'realValue');
    this.el.appendChild( this.realValue );
  },
  dispose: function() {
    this.el.removeChild( this.realValue );
    this.realValue= null;
    Chartled.BaseChartle.prototype.dispose.call(this);
  },
  serialize: function() {
    var o= Chartled.BaseChartle.prototype.serialize.call(this);
    o.text= $(this.realValue).html();
    return o;
  }
});
