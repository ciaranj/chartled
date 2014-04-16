var MetricInfo = require("./MetricInfo");

var emptyMetricInfo= new MetricInfo("","", {},  {} );
module.exports= {};

module.exports.sumSeriesList= function( seriesList ) {
    var summedSeries= emptyMetricInfo.clone("");
    if( seriesList.length > 0 ) {
      var seriesCount= seriesList.length;
      summedSeries.data.tInfo= seriesList[0].data.tInfo;
      summedSeries.data.values= [];
      //TODO: assert same lengths, and deal with different time granularities
      var seriesLen= seriesList[0].data.values.length;
      for( var i=0;i<seriesLen;i++) {
          for( var k= 0; k< seriesCount;k++) {
            if( typeof(seriesList[k].data.values[i]) != 'undefined' && seriesList[k].data.values[i] != null ) {
              if( typeof(summedSeries.data.values[i]) == 'undefined' ) summedSeries.data.values[i] = seriesList[k].data.values[i];
              else summedSeries.data.values[i] += seriesList[k].data.values[i];
            }
          }
      }
      // Edge case where all data ends with nulls, need to inject a final null in
      // where one would have been previously.
      if( typeof(summedSeries.data.values[seriesLen-1]) == 'undefined' ) summedSeries.data.values[seriesLen-1]= null;

      /// TODO: .. We need to poke this through so clients can do data-sampling when we return too many points
      /// .... btu since theoretically a user could be summing different metrics with different aggregation
      /// policies, it would perhaps make more sense to do the sampling on the server :( ?
      /// For now just return the aggregationMethod of the first series entry.
      summedSeries.info.aggregationMethod=  seriesList[0].info.aggregationMethod;
      summedSeries.populated= true;
      return summedSeries;
    }
    else return seriesList;
}