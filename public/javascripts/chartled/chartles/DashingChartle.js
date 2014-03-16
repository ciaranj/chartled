if( typeof(Chartled) == 'undefined' ) Chartled = {};

Chartled.DashingChartle = function( definition, el, baseUrl ) {
  Chartled.BaseChartle.call( this, definition, el, baseUrl );
};


Chartled.inheritPrototype(Chartled.DashingChartle, Chartled.BaseChartle, {
  initialize: function(definition) {
    Chartled.BaseChartle.prototype.initialize.call(this, definition);
    // Support both (not simultaneously) a single 'metric value' definition
    // or the more complex 'list of metrics' definition style.
    if( typeof(definition.metrics) != 'undefined' ) {
      this.metrics = definition.metrics;
    }
    else if( typeof(definition.metric) != 'undefined' ) { 
      this.metrics= [definition.metric];
    }

    // Need to grab the given element size prior to adding child elements as they may force it
    // to grow.
    var initialWidth= this.jEl.width();
    var initialHeight= this.jEl.height();
    if( !this.jEl.hasClass('clock') ) this.jEl.addClass('clock');

    this.dateTimeContainer= document.createElement('div');
    this.dateTimeContainer.setAttribute("class", "dateandtime");

    this.valueEl= document.createElement('div');
    this.valueEl.setAttribute("class", "value");


    this.el.appendChild( this.dateTimeContainer );

    this.set_title( definition.title );
    this.dateTimeContainer.appendChild(this.valueEl);


    this.set_backgroundColorClass(definition.backgroundColorClass);
    this.set_backgroundIcon( definition.backgroundIcon );
    this.set_moreInfo( definition.moreInfo );
    this.set_displayUpdatedAt( definition.displayUpdatedAt );

    this.resize( initialWidth, initialHeight );
  },
  dispose: function() {
    this.el.removeChild( this.dateTimeContainer );
    if( this._updatedAtEl ) this.el.removeChild(this._updatedAtEl);
    if( typeof(this.icon) != 'undefined' ) {
      this.el.removeChild( this.icon );
      this.icon= null;
    }
    
    this.valueEl= null;
    this.dateTimeContainer= null;
    this.chartledContainer= null;
    this.updateAt= null;
    this._moreInfo= null;
    this._moreInfoEl= null;
    this._updatedAtEl= null;
    this._titleEl = null;
    this.icon = null;
    this._backgroundIcon = null;
    this._backgroundColorClass = null;
    Chartled.BaseChartle.prototype.dispose.call(this);
  },
  _calculateBlockSize: function() {
    this._bottomOffset=  0
    this._bottomBlocksHeight= this._height * (1/10);
    if( this._bottomBlocksHeight < 8 ) { 
      this._bottomBlocksHeight= 8; 
      this._bottomOffset= 2;
    }
  },
  resize: function(width, height) {
    if(width && height)  {
      this._width= width;
      this._height= height;
    }

    // First break section positions down 
    // Title, value ( grouped together centrally in the tile )
    // more-info, updated-at (absolutely position at the bottom of the tile.)
    this._calculateBlockSize();

    $(this._moreInfoEl)
      .css("bottom",  this._bottomBlocksHeight + this._bottomOffset + "px")
      .boxfit( { "width": Math.floor(this._width * 0.6), "height": this._bottomBlocksHeight} )
      .css({"width": "100%"})

      this._resizeValue();

      $(this.icon).css('font-size', this._height + 'px' );
  },
  serialize: function() {
    var o= Chartled.BaseChartle.prototype.serialize.call(this);
    if( this.metrics ) {
      if( this.metrics.length ==1 ) {
        o.metric= this.metrics[0];
      }
      else {
        o.metrics= this.metrics;
      }
    }
    o.moreInfo= this._moreInfo;
    o.title= this._title;
    o.backgroundColorClass= this._backgroundColorClass;
    o.backgroundIcon= this._backgroundIcon;
    o.displayUpdatedAt = this._displayUpdatedAt;
    return o;
  },
  fetch: function( clock, cb ) {
    Chartled.FetchMetric(this.baseUrl, this.metrics, clock,  cb);
  },

  update: function(err, data) {
    var that= this;
    if( err ) {
      d3.select(this.valueEl)
        .text( "???" );
      that._resizeValue();
    }
    else {
      var currentText = d3.select(this.valueEl).text()
      var currentTextLength= 0;
      if(!currentText) currentTextLength=0;
      else if(!currentText) currentTextLength= currentText.text().length;

      // Select the first series, last data point, hopefully thats what the metric author intended!
      data= data[0].datapoints[data[0].datapoints.length-1][0];
      d3.select(this.valueEl)
      .select("span")
        .data( [data] )
        .transition()
        .duration( 5000 )
        .tween("text", function(d) {
          var i = d3.interpolate(this.textContent, d),
            prec = (d + "").split("."),
            round = (prec.length > 1) ? Math.pow(10, prec[1].length) : 1;
            return function(t) {
              this.textContent = Math.round(i(t) * round) / round;
              if( this.textContent.length != currentTextLength ) {
                that._resizeValue();
                currentTextLength= this.textContent.length;
              }
            };
        })
        .each("start", function() {
          that._resizeValue();
        })
        .each("end", function() {
          that._resizeValue();
        });
    }
    if( this._displayUpdatedAt ) {
      var now= new Date();
      var result= (now.getHours()<10? "0"+now.getHours():now.getHours()) + ":" + (now.getMinutes()<10? "0"+now.getMinutes():now.getMinutes());
      d3.select(this._updatedAtEl)
        .text("Last updated at " + result ); 
    }
  },
  set_backgroundColorClass: function( backgroundColorClass ) {
    if( backgroundColorClass != this._backgroundColorClass ) {
      if( this._backgroundColorClass ) { this.jEl.removeClass( this._backgroundColorClass ); }

      this._backgroundColorClass= backgroundColorClass;
      this.jEl.addClass(this._backgroundColorClass)
    }
  },
  set_backgroundIcon: function( backgroundIcon ) {
    if(backgroundIcon != this._backgroundIcon ) {
      if( typeof(this.icon) != 'undefined' ) {
        this.el.removeChild( this.icon );
        this.icon= null;
      }

      this._backgroundIcon= backgroundIcon;

      if( typeof(this._backgroundIcon) == 'string' && this._backgroundIcon != "") {
        this.icon= document.createElement("i");
        this.icon.setAttribute("class", "background-icon fa fa-" + this._backgroundIcon);
        this.el.appendChild(this.icon);
      }
    }
  },
  set_displayUpdatedAt: function( displayUpdatedAt ) {
    displayUpdatedAt= (displayUpdatedAt === false) ? false : true;
    if( this._displayUpdatedAt != displayUpdatedAt ) {
      this._displayUpdatedAt= displayUpdatedAt;
      if(!this._updatedAtEl && displayUpdatedAt) {
        this._updatedAtEl= document.createElement('div');
        this._updatedAtEl.setAttribute("class", "updated-at");
        this.el.appendChild(this._updatedAtEl);
      }
      else if( this._updatedAtEl && !displayUpdatedAt) {
        this.el.removeChild( this._updatedAtEl);
        this._updatedAtEl= null;
      }
      
    }
  },
  set_moreInfo: function( moreInfo ) {
      if( moreInfo != this._moreInfo ) {
        this._moreInfo = moreInfo;
        if(!this._moreInfoEl ) {
          this._moreInfoEl= document.createElement('div');
          this._moreInfoEl.setAttribute("class", "more-info");
          this.el.appendChild(this._moreInfoEl);
        }
        $(this._moreInfoEl).text( this._moreInfo );
    }
  },
  set_title: function( title ) {
    if( title != this._title ) {
      this._title = title;
      if(!this._titleEl) {
        this._titleEl= document.createElement('div');
        this._titleEl.setAttribute("class", "title");
        this.dateTimeContainer.appendChild(this._titleEl);
      }
      $(this._titleEl).text( this._title );
    }
  },
  _resizeValue: function() {
    // The value can change due to an update so allow this particular part of the resizing code to execute on its own.
    $(this.valueEl)
      .boxfit( { "width": Math.floor(this._width * 0.9), "height": this._bottomBlocksHeight * 6} )
      .css({"width": "100%", "height" : "2px"});

    if( this._displayUpdatedAt ) { 
      $(this._updatedAtEl)
        .css("bottom",  this._bottomOffset + "px")
        .boxfit( { "width": Math.floor(this._width * 0.6), "height": this._bottomBlocksHeight} )
        .css({"width": "100%"})
    }
    $(this._titleEl)
      .boxfit( { "width": Math.floor(this._width * 0.8), "height": this._bottomBlocksHeight * 2} )
      .css({"width": "100%", "height" : "2px"});

  }
});
