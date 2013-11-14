module.exports.renderResults= function( response, results, cb) {
    response.set({'Content-Type': 'application/json' });
    //TODO: currently has excess tInfo object present (as was required by csv/raw :( ) 
    if( results == null ) response.send( [] );
    else response.send( results );

    response.end();

    if(cb) cb();
}