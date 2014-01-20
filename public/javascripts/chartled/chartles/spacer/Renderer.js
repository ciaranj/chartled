Chartled.SpacerChartle = function( definition, el, baseUrl ) {
  Chartled.BaseChartle.call( this, definition, el, baseUrl );
};

Chartled.inheritPrototype(Chartled.SpacerChartle, Chartled.BaseChartle, {
  initialize: function(definition) {
    Chartled.BaseChartle.prototype.initialize.call(this, definition);
    if( !this.jEl.hasClass('spacer') ) this.jEl.addClass('spacer');
  }
});
