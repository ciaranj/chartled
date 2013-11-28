var path = require('path');
var exec = require('child_process').exec;

exec('npm run-script generateparser', function(err, stdout,stderr) {
  console.log( stdout, stderr);
  if( err ) console.log( "!Error", err );
  else  {
    console.log("Performing install of git-fetched module");
    exec('npm install node_modules/hoard', function(err, stdout,stderr) {
      console.log( stdout, stderr);
      if( err ) console.log( "!Error", err );
      else {
        console.log("Performing build of shared client js");
        exec('npm run-script buildclient', function(err, stdout,stderr) {
          console.log( stdout, stderr);
          if( err ) console.log( "!Error", err );
        });
      }
    });
  }
});
