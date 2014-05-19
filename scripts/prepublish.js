var path = require('path');
var exec = require('child_process').exec;
var fs = require('fs');

exec('npm run-script generateparser', function(err, stdout,stderr) {
  console.log( stdout, stderr);
  if( err ) console.log( "!Error", err );
  else  {
    exec('npm run-script buildclient', function(err, stdout,stderr) {
      console.log( stdout, stderr);
        if( err ) console.log( "!Error", err );
    });
    fs.createReadStream('./node_modules/moment/min/moment.min.js').pipe(fs.createWriteStream('./public/javascripts/chartled/deps/moment.min.js'));    
    fs.createReadStream('./node_modules/moment-timezone/min/moment-timezone.min.js').pipe(fs.createWriteStream('./public/javascripts/chartled/deps/moment-timezone.min.js'));    
  }
});
