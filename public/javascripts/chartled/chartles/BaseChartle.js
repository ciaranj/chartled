if( typeof(Chartled) == 'undefined' ) Chartled = {};

Chartled.create = function (o) {
    function F() {}
    F.prototype = o;
    return new F();
};

Chartled.inheritPrototype = function(childObject, parentObject, childPrototype) {
  var copyOfParent = Chartled.create(parentObject.prototype);
  copyOfParent.constructor = childObject;
  childObject.prototype = copyOfParent;
  if( childPrototype ) { 
    for( var k in childPrototype) childObject.prototype[k] = childPrototype[k];
  }
};

Chartled._is_array = function (value) {
    return value &&
        typeof value === 'object' &&
        typeof value.length === 'number' &&
        typeof value.splice === 'function' &&
        !(value.propertyIsEnumerable('length'));
};

Chartled.FetchMetric = function(baseUrl, metrics, clock,  cb) {
  if(!metrics) cb( new Error("No metrics defined.") );
  if(!Chartled._is_array(metrics))  { 
    metrics= [metrics]; 
  }
  var dataUrl=  baseUrl + "/series?from=" + clock.from+ "&until=" + clock.until + "&jsonp=?";
  
  var targetString= "";
  for( var k in metrics ) {
    if( !metrics[k] || /^\s*$/.test(metrics[k]) ) {
      
    }
    else {
      targetString += "&target=" + metrics[k];
    }
  }
  if( targetString == "" ) {
     cb( new Error("No metrics defined.") );
  }
  else {
    $.getJSON(dataUrl+=targetString, function(data){
      cb(null, data);
    })
    .fail(function() {
      cb(new Error());
    });
  }
};

Chartled.registerChartleEditor = function(chartleRenderer, editorPrototype) {
  if( typeof(chartleRenderer) == 'undefined') throw new Error("Specified renderer is undefined.");

  for(var k in editorPrototype) {
    if( k == "initialize" || k == "dispose" ) {
      chartleRenderer.prototype["_editor_" + k]= editorPrototype[k]
    } else {
      // There could (will be) naming conflicts here if someone re-declares a renderer's method in their editor
      // need a better solution that this!
      chartleRenderer.prototype[k]= editorPrototype[k];
    }
  }
};

Chartled.BaseChartle= function(definition, el, baseUrl) {
  this.el= el;
  this.jEl= $(el);
  this.baseUrl= baseUrl;

  this.initialize( definition );
  if( this._editor_initialize ) this._editor_initialize( definition );
};

Chartled.BaseChartle.prototype= {
  initialize: function(definition) {
    if( !definition || !definition.id ) throw new Error("Attempt to construct a chartle without an Id.");
    this.id= definition.id;
    this.type= definition.type;
  },
  dispose: function() {
    if( this._editor_dispose ) this._editor_dispose();
    this.el= null;
    this.id= null;
    this.jEl= null;
    this.type= null;
  },
  resize: function() {},
  serialize: function() {
    return { 
      "id": this.id, 
      "type": this.type 
    };
  }
}
