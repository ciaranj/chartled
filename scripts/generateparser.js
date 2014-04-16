var path = require('path');
var exec = require('child_process').exec;

var grammars= [{
    in: "grammars/TargetParser.pegjs"
  , out: "lib/TargetParser.js"
  , startRules: "start"
},
{
    in: "grammars/ATTimeParser.pegjs"
  , out: "lib/ATTimeParser.js"
  , startRules: "timestring,offset"
},
{
    in: "grammars/MetricRegexCreator.pegjs"
  , out: "lib/MetricRegexCreator.js"
  , startRules: "start"
}];


for(var k in grammars) {
  console.log( path.join(".", "node_modules", "pegjs", "bin", 'pegjs') );
  exec( "node \"" + path.join(__dirname, "..", "node_modules", "pegjs", "bin", 'pegjs') + "\" --allowed-start-rules " + grammars[k].startRules + " " + grammars[k].in + " "+ grammars[k].out, function(err,stdout,stderr) {
    if( err ) console.log("!Error", err)
    else {
      console.log( stdout );
    }
  });
}
