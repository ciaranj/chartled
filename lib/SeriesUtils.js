module.exports= {};

module.exports.sumSeriesList= function( seriesList ) {
    var summedSeries= {
        data: {
        },
        info: {
        }
    };
    if( seriesList.length > 0 ) {
      var seriesCount= seriesList.length;
      summedSeries.data.tInfo= seriesList[0].data.tInfo;
      summedSeries.data.values= [];
      //TODO: assert same lengths, and deal with different time granularities
      var seriesLen= seriesList[0].data.values.length;
      for( var i=0;i<seriesLen;i++) {
          summedSeries.data.values[i]= null;
          for( var k= 0; k< seriesCount;k++) {
              if( summedSeries.data.values[i] == null ) summedSeries.data.values[i] = seriesList[k].data.values[i];
              else summedSeries.data.values[i] += seriesList[k].data.values[i];
          }
      }
      /// TODO: .. We need to poke this through so clients can do data-sampling when we return too many points
      /// .... btu since theoretically a user could be summing different metrics with different aggregation
      /// policies, it would perhaps make more sense to do the sampling on the server :( ?
      /// For now just return the aggregationMethod of the first series entry.
      summedSeries.info.aggregationMethod=  seriesList[0].info.aggregationMethod;
      return [summedSeries];
    }
    else return seriesList;
}