var path = require('path');
var exec = require('child_process').exec;

var grammars= [{
    in: "grammars/TargetParser.pegjs"
  , out: "lib/TargetParser.js"
},
{
    in: "grammars/ATTimeParser.pegjs"
  , out: "lib/ATTimeParser.js"
}];


for(var k in grammars) {
  exec( 'pegjs ' + grammars[k].in + " "+ grammars[k].out, function(err,stdout,stderr) {
    if( err ) console.log("!Error", err)
    else {
      console.log( stdout );
    }
  });
}
