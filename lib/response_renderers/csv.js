module.exports.renderResults= function( request, response, results, cb ) {
    response.set({'Content-Type': 'text/csv'});
    for( var k in results ) {
        var series= results[k];
        if( series.datapoints != null ) {
            var firstVal= true;
            for(var d=0;d< series.datapoints.length;d++ ) {
                var v= series.datapoints[d][0];
                if( v == null || typeof(v) == 'undefined' ) v = "null"
                response.write( series.target + "," + series.datapoints[d][1] + "," + v + "\n");
            }
        }
    }
    response.end();
    if(cb) cb();
}