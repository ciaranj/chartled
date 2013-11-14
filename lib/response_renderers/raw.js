module.exports.renderResults= function( response, results, cb ) {
    response.set({'Content-Type': 'text/plain'});
    for( var k in results ) {
        var series= results[k];
        response.write( series.target + "," + series.tInfo[0] + "," + series.tInfo[1]+","+series.tInfo[2]+"|");
        if( series.datapoints != null ) {
            var firstVal= true;
            for(var d in series.datapoints ) {
                if( !firstVal ) response.write(",");
                var v= series.datapoints[d][0];
                if( v == null ) response.write("null")
                else response.write("" + v);
                firstVal= false;
            }
        }
        response.write( "\n" );
    }
    response.end();
    if(cb) cb();
}