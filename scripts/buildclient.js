var path = require('path');
var exec = require('child_process').exec;
var filesToInclude= [
   'public/javascripts/deps/jquery-1.9.1.js'
  , 'public/javascripts/deps/jquery-ui.js'
  , 'public/javascripts/chartled/ChartledDefinition.js'
  , 'public/javascripts/chartled/deps/jquery.gridster.with-extras.min.js'
  , 'public/javascripts/chartled/deps/d3.v2.min.js'
  , 'public/javascripts/chartled/deps/delineate.js'
  , 'public/javascripts/chartled/chartles/BaseChartle.js'
  , 'public/javascripts/chartled/chartles/chart/Renderer.js'
  , 'public/javascripts/chartled/chartles/text/Renderer.js'
  , 'public/javascripts/chartled/chartles/spacer/Renderer.js'
]
exec('node node_modules/uglify-js/bin/uglifyjs ' +  filesToInclude.join(' ') + ' -o public/js/chartled-client.js -v', function(err, stdout,stderr) {
  console.log( stdout, stderr);
  if( err ) console.log( "!Error", err );
});
