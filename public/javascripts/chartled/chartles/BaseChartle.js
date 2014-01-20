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

Chartled._createHandOffFunction = function( originalMethod, newMethod ) {
  return function() {
    // lets errors bubble out.
    originalMethod.apply( this, arguments );
    newMethod.apply( this, arguments );
  }
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

Chartled.RegisterChartleEditor = function(chartleRenderer, editorPrototype) {
  if( typeof(chartleRenderer) == 'undefined') throw new Error("Specified renderer is undefined.");

  // Simplistic inheritance (only allows overriding of initialise and dispose)
  for(var k in editorPrototype) {
    if( (k == "initialise" || k == "dispose") &&  typeof(chartleRenderer.prototype[k]) == 'function' ) {
      // Rightly/Wrongly? We call the renderer initialise before the editor initialise, and the editor dispose before the renderer dispose.
      if( k == "initialise" ) chartleRenderer.prototype[k]= Chartled._createHandOffFunction( chartleRenderer.prototype[k], editorPrototype[k] );
      else chartleRenderer.prototype[k]= Chartled._createHandOffFunction(  editorPrototype[k], chartleRenderer.prototype[k] );
    } else {
      chartleRenderer.prototype[k]= editorPrototype[k];
    }
  }
};

Chartled.BaseChartle= function(definition, el, baseUrl) {
  this.el= el;
  this.jEl= $(el);
  this.baseUrl= baseUrl;

  this.initialize( definition );
};

Chartled.BaseChartle.prototype= {
  initialize: function(definition) {
    if( definition && definition.id ) this.id= definition.id;
  },
  dispose: function() {
    this.el= null;
    this.id= null;
    this.jEl= null;
  }
}
