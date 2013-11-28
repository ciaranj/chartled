if( typeof(Chartled) == 'undefined' ) Chartled = {};

Chartled._createHandOffFunction = function( originalMethod, newMethod ) {
  return function() {
    // lets errors bubble out.
    originalMethod.apply( this, arguments );
    newMethod.apply( this, arguments );
  }
}

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
}