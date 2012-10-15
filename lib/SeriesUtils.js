module.exports= {};

module.exports.sumSeriesList= function( seriesList ) {
    var summedSeries= {
        data: {
        }
    };
    if( seriesList.length > 0 ) {
      var seriesCount= seriesList.length;
      summedSeries.data.tInfo= seriesList[0].data.tInfo;
      summedSeries.data.values= [];
      //TODO: assert same lengths, and deal with different time granularities
      var seriesLen= seriesList[0].data.values.length;
      for( var i=0;i<seriesLen;i++) {
          summedSeries.data.values[summedSeries.data.values.length]= 0;
          for( var k= 0; k< seriesCount;k++) {
              summedSeries.data.values[i] += seriesList[k].data.values[i];
          }
      }
      return [summedSeries];
    }
    else return seriesList;
}