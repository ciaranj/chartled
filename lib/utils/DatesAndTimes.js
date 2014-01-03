var  ATTimeParser = require( "../ATTimeParser" )
   , moment= require( "moment" );

module.exports= {};

// The Graphite documentation is puzzling here, as it claims parity with http://pubs.opengroup.org/onlinepubs/9699919799/utilities/at.html
// but that doesn't appear to be the reality of the code :( .. Urk, rock + hard place,  mostly I guess its because graphite (and chartled) primarily
// deal with historical events, but at deals with future events.

// Going to try maintaining compatibility with Graphite but also use (an extended form of) the BNF described for 'at'

module.exports.parseATTime= function(momentStr) {
  if( momentStr == null || typeof(momentStr) == "undefined") throw new Error("No time string available to parse");
  momentStr= momentStr.trim().toLowerCase().replace(/_/g,'').replace(/,/g,'').replace(/ /g,'');
  var result= ATTimeParser.parse(momentStr);
  return result.unix();
}

/*
 Parses timeoffsets such as;
  -1s  or +1seconds
  1min or 1minutes
  +5h or -5hours
  76d or 76days
  +4w or -4weeks
  +12mon or 12months
  1y or 1years

 Still attempting to remain compatible with the (still awesome) Graphite API, this follows the patterns
that python's timedelta method supports [http://docs.python.org/release/2.5.2/lib/datetime-timedelta.html] )

Note, that for compatibility with Graphite this means; 
  A Month is considered to always consist of 30 days.
  A Year is considered to always consist of 365 days
  (Fortunately these are the same rules that momentjs uses too ; ) )
*/
module.exports.parseTimeOffset= function(offset) {
  offset= offset.trim().toLowerCase().replace(/_/g,'').replace(/,/g,'').replace(/ /g,'');
  var result= ATTimeParser.parse(offset, "offset");
  return result.as('seconds');
}
