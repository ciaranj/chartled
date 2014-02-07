var zlib = require("zlib");

var DefinitionSharer= function() {
}

DefinitionSharer.prototype= {
  /*
   * Given a chartled definition, provide a string of characters
   * that can be used to un-ambiguously recreate the chart (potentially from a URL parameter)
   */
  encode: function( definition, cb ) {
    var s= JSON.stringify( definition );
    zlib.deflate(s, function(err, buffer){
      if( err ) cb(err)
      else cb( null, buffer.toString('base64') );
    });
  },
  /*
   * Given a previously shared string, re-construct the chartled definition.
   */
  decode: function( definitionString, cb ) {
    zlib.inflate(new Buffer(definitionString, "base64"), function(err, buffer){
      if( err ) cb(err)
      else cb( null, JSON.parse(buffer.toString("utf8")) );
    });
  }  
};

module.exports.DefinitionSharer = DefinitionSharer;
