if( typeof(Chartled) == 'undefined' ) Chartled = {};

Chartled.DashingChartle = function( definition, el, baseUrl ) {
  Chartled.BaseChartle.call( this, definition, el, baseUrl );
};


Chartled.inheritPrototype(Chartled.DashingChartle, Chartled.BaseChartle, {
  initialize: function(definition) {
    Chartled.BaseChartle.prototype.initialize.call(this, definition);

    this.metric = definition.metric;
    this.title = definition.title;
    this.moreInfo = definition.moreInfo;

    // Need to grab the given element size prior to adding child elements as they may force it
    // to grow.
    var initialWidth= this.jEl.width();
    var initialHeight= this.jEl.height();
    if( !this.jEl.hasClass('clock') ) this.jEl.addClass('clock');
    this.jEl.addClass(definition.backgroundColorClass)

    this.dateTimeContainer= document.createElement('div');
    this.dateTimeContainer.setAttribute("class", "dateandtime");
    this.titleEl= document.createElement('div');
    this.titleEl.setAttribute("class", "title");
    $(this.titleEl).text( definition.title );

    this.valueEl= document.createElement('div');
    this.valueEl.setAttribute("class", "value");

    this.moreInfoEl= document.createElement('div');
    this.moreInfoEl.setAttribute("class", "more-info");
    $(this.moreInfoEl).text( this.moreInfo );
    this.updatedAtEl= document.createElement('div');
    this.updatedAtEl.setAttribute("class", "updated-at");
  
    this.el.appendChild( this.dateTimeContainer );

    if( definition.backgroundIcon ) {
      this.icon= document.createElement("i");
      this.icon.setAttribute("class", "background-icon icon-" + definition.backgroundIcon);
      this.el.appendChild(this.icon);
    }

    this.dateTimeContainer.appendChild(this.titleEl);
    this.dateTimeContainer.appendChild(this.valueEl);

    this.el.appendChild(this.moreInfoEl);
    this.el.appendChild(this.updatedAtEl);

    this.resize( initialWidth, initialHeight );
  },
  dispose: function() {
    this.el.removeChild( this.dateTimeContainer );
    if( typeof(this.icon) != 'undefined' ) {
      this.el.removeChild( this.icon );
      this.icon= null;
    }
    
    this.valueEl= null;
    this.dateTimeContainer= null;
    this.chartledContainer= null;
    this.updateAt= null;
    this.moreInfo= null;
    this.moreInfoEl= null;
    this.updatedAtEl= null;
    this.titleEl = null;
    this.icon = null;
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
    this._width= width;
    this._height= height;

    // First break section positions down 
    // Title, value ( grouped together centrally in the tile )
    // more-info, updated-at (absolutely position at the bottom of the tile.)
    this._calculateBlockSize();

    $(this.moreInfoEl)
      .css("bottom",  this._bottomBlocksHeight + this._bottomOffset + "px")
      .boxfit( { "width": Math.floor(this._width * 0.6), "height": this._bottomBlocksHeight} )
      .css({"width": "100%"})

      this._resizeValue();

      $(this.icon).css('font-size', height + 'px' );
  },
  serialize: function() {
    return { "id"      : this.id,
             "metric"  : this.metric,
             "moreInfo": this.moreInfo,
             "title"   : this.title};
  },
  fetch: function( clock, cb ) {
    Chartled.FetchMetric(this.baseUrl, [this.metric], clock,  cb);
  },
  update: function(err, data) {
    var that= this;
    if( err ) {
      d3.select(this.valueEl)
        .text( "???" );
      that._resizeValue();
    }
    else {
      var now= new Date();
      var result= (now.getHours()<10? "0"+now.getHours():now.getHours()) + ":" + (now.getMinutes()<10? "0"+now.getMinutes():now.getMinutes());
      d3.select(this.updatedAtEl)
        .text("Last updated at " + result ); 

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
  },
  _resizeValue: function() {
    // The value can change due to an update so allow this particular part of the resizing code to execute on its own.
    $(this.valueEl)
      .boxfit( { "width": Math.floor(this._width * 0.9), "height": this._bottomBlocksHeight * 6} )
      .css({"width": "100%", "height" : "2px"});

    $(this.updatedAtEl)
      .css("bottom",  this._bottomOffset + "px")
      .boxfit( { "width": Math.floor(this._width * 0.6), "height": this._bottomBlocksHeight} )
      .css({"width": "100%"})

    $(this.titleEl)
      .boxfit( { "width": Math.floor(this._width * 0.8), "height": this._bottomBlocksHeight * 2} )
      .css({"width": "100%", "height" : "2px"});

  }
});
