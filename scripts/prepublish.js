var path = require('path');
var exec = require('child_process').exec;

exec('npm run-script generateparser', function(err, stdout,stderr) {
  console.log( stdout, stderr);
  if( err ) console.log( "!Error", err );
  else  {
    exec('npm run-script buildclient', function(err, stdout,stderr) {
      console.log( stdout, stderr);
        if( err ) console.log( "!Error", err );
    });
  }
});
