module.exports.renderResults= function( response, results, cb ) {
    response.set({'Content-Type': 'text/csv'});
    for( var k in results ) {
        var series= results[k];
        if( series.datapoints != null ) {
            var firstVal= true;
            for(var d in series.datapoints ) {
                var v= series.datapoints[d][0];
                if( v == null ) v = "null"
                response.write( series.target + "," + series.datapoints[d][1] + "," + v + "\n");
            }
        }
    }
    response.end();
    if(cb) cb();
}