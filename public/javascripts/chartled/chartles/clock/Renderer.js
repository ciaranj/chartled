if( typeof(Chartled) == 'undefined' ) Chartled = {};

Chartled.ClockChartle = function(definition, el) {
  this.id = definition.id;
  this.el= el;
  this.jEl= $(el);
  if( !this.jEl.hasClass('clock') ) this.jEl.addClass('clock');
  this.jEl.addClass('chartled-color-1')

  this.dateTimeContainer= document.createElement('div');
  this.dateTimeContainer.setAttribute("class", "dateandtime");
  this.dateSpan= document.createElement('h2');
  this.dateSpan.setAttribute("class", "date");
  this.timeSpan= document.createElement('h1');
  this.timeSpan.setAttribute("class", "time");

  this.icon= document.createElement("i");
  this.icon.setAttribute("class", "background-icon icon-time");
  el.appendChild( this.dateTimeContainer );
  el.appendChild(this.icon);
  this.dateTimeContainer.appendChild(this.dateSpan);
  this.dateTimeContainer.appendChild(this.timeSpan);

  this.initialise();
};

Chartled.ClockChartle.prototype = {
  setTimeRange: function() {},
  initialise: function() {
    var that= this;
    that._refreshInterval= setInterval( function() {
      that._update();
    }, 1000 );    
    that._update();
    that.resize();
  },
  dispose: function() {
    if( this._refreshInterval ) {
      clearInterval( this._refreshInterval );
      this._refreshInterval = null;
    }  
    this.el.removeChild( this.dateTimeContainer );
    this.el.removeChild( this.icon );
    this.el= null;
    this.id= null;
    this.jEl= null;
    this.timeSpan= null;
    this.dateSpan= null;
    this.dateTimeContainer= null;
    this.chartledContainer= null;
    this.icon = null;
  },
  resize: function(width, height) {
    // We assume that the strings are of fixed width so do not need resizing
    // on each update. ...
    var that= this;
    // Simulates a 5% padding.
    var maxWidth= this.jEl.width() * 0.6;
    var maxHeight= this.jEl.height() * 0.8;
    // approximate font width-to-height ratio

    // Flawed algorithm anyway, if the block we're trying to write into is wide, but short
    // the text will overflow.
    var factor = 1/2;  
    function resizey(el, ratio) {
      var width= (maxWidth * ratio) / ($(el).text().length * factor);
      $(el).css('font-size', width + 'px' );
    }
    // Rescale parts (based on tag)
    this.jEl.find('h1').each(function() {
      resizey(this, 1);
    });
    this.jEl.find('h2').each (function() {
      resizey(this, 0.6);
    });
    this.jEl.find('i.background-icon').each (function() {
      $(this).css('font-size', (that.jEl.height()) + 'px' );
    });
  },
  serialize: function() {
    return { "id"   : this.id,
             "type" : "Chartled.ClockChartle" };
  },
  _update: function() {
    var now = new Date();
    $(this.timeSpan).html( now.toLocaleTimeString() );
    $(this.dateSpan).html( now.toDateString() );
  }
};

