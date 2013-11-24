module.exports.renderResults= function( request, response, results, cb) {

  if( results == null ) results = [];
  var resultsAsJson= JSON.stringify( results );
  var isJSONP= !!request.query.jsonp;

  if( isJSONP ) {
    response.set({'Content-Type': 'application/javascript' });
    response.send( request.query.jsonp + "(" + resultsAsJson + ")");
  }
  else {
    response.set({'Content-Type': 'application/json' });
    response.send( resultsAsJson );
    
  }
  response.end();
  if(cb) cb();
}