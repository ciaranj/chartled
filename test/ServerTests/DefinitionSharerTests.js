var assert= require("assert"),
    DefinitionSharer= require("../../lib/DefinitionSharer").DefinitionSharer;

describe("DefinitionSharer", function(){
  describe("#decode", function() {
    it("should decode a given hash to a specific chartled definition", function(done){
      var sharer= new DefinitionSharer();
      sharer.decode("eJyVUktvwjAM/iuVT2MKFaVjh94mpElIbIex20BTlroQrUlQHhsM8d/nAAWNl7RL7dqxv0eyAjHj1tfooHhbgSyhaCrtDBj45Ryp1N+WyvQ5qA+0u9/YlzEW8FgHN0tepcLkpubOJzMTbIsOKGNxoCtDZx6+0PIpJlInysUWeisFNVxQilv5gzfOc+/SzbdMBVp0aRU3x8UsGUMW146BJd4GbMGaHVHunqHcr434bBifTORnJobS+VOJo8jqsjqFOL8mSpigPdq9uttzeiYMRKR7uI2MgcWKjJi9cE807jsMKmsUIbTzjpI6eIxm+shBm29KS3TCyrmXRlOtxIqH2lN9J3lQxu1/bvlgxqQxqHuEm+1hCaSdXYUckkUjFEaXF1G7hERiNS4apwcEeseg5ksTPBSr5lYqucCyPbUyLovhSeoR2QpFr7MrcDuVhNtjMDdORhIXXrMw9dZRIh2joz3vi43YTbqk9Oyb2gzm/xzMjxHzC4OT9foXZvsoDg==", function(err, result) {
        assert.deepEqual( result, {
        chartles: [{
            "id": "chartle-1"
          , "type": "Chartled.NumberChartle"
          , "title": "Flush Time (last hour)"
          , "moreInfo": "Average in ms"
          , "metric": "summarize(stats.statsd.ceres.flushTime, \"1hour\", true)"
        },
        {
            "id": "chartle-2"
          , "type": "Chartled.ClockChartle"
        },
        {
            "id": "chartle-3"
          , "type": "Chartled.ListChartle"
          , "title": "Stats (last hour)"
          , "moreInfo": "meep"
          , "metric": "summarize(stats.counters.statsd.*, \"1hour\", true)"
        }]
        , clocks: [{id:1, refreshRate:60, from:"-30minutes", to: "now", description:"default", chartleIds:["chartle-1","chartle-3"]}, 
                   {id:2, refreshRate:1, from:'now-1s', to:'now', description: "LastSecond", chartleIds:["chartle-2"]}]
        , "nextChartleId": 4
        , layout: {
            type: "fixed-grid",
            gridMinSize: 50,
            gridMargin: 5,
            "positions": [{
              "id": "chartle-1",
              "col": 1,
              "row": 1,
              "size_x": 2,
              "size_y": 2
            },
            {
              "id": "chartle-2",
              "col": 3,
              "row": 1,
              "size_x": 2,
              "size_y": 2
            },
            {
              "id": "chartle-3",
              "col": 1,
              "row": 3,
              "size_x": 2,
              "size_y": 2
            }]
          }
        });
        done();
      });
    });
  });
  describe("#encode", function() {
    it("should provide a string of characters suitable for a url (potential problem around lengths > 2083 in IE!) when given a chartled definition", function(done){
      var sharer= new DefinitionSharer();
      sharer.encode({
        chartles: [{
            "id": "chartle-1"
          , "type": "Chartled.NumberChartle"
          , "title": "Flush Time (last hour)"
          , "moreInfo": "Average in ms"
          , "metric": "summarize(stats.statsd.ceres.flushTime, \"1hour\", true)"
        },
        {
            "id": "chartle-2"
          , "type": "Chartled.ClockChartle"
        },
        {
            "id": "chartle-3"
          , "type": "Chartled.ListChartle"
          , "title": "Stats (last hour)"
          , "moreInfo": "meep"
          , "metric": "summarize(stats.counters.statsd.*, \"1hour\", true)"
        }]
        , clocks: [{id:1, refreshRate:60, from:"-30minutes", to: "now", description:"default", chartleIds:["chartle-1","chartle-3"]}, 
                   {id:2, refreshRate:1, from:'now-1s', to:'now', description: "LastSecond", chartleIds:["chartle-2"]}]
        , "nextChartleId": 4
        , layout: {
            type: "fixed-grid",
            gridMinSize: 50,
            gridMargin: 5,
            "positions": [{
              "id": "chartle-1",
              "col": 1,
              "row": 1,
              "size_x": 2,
              "size_y": 2
            },
            {
              "id": "chartle-2",
              "col": 3,
              "row": 1,
              "size_x": 2,
              "size_y": 2
            },
            {
              "id": "chartle-3",
              "col": 1,
              "row": 3,
              "size_x": 2,
              "size_y": 2
            }]
          }
      }, function(err, result) {
        assert.equal( result, "eJyVUktvwjAM/iuVT2MKFaVjh94mpElIbIex20BTlroQrUlQHhsM8d/nAAWNl7RL7dqxv0eyAjHj1tfooHhbgSyhaCrtDBj45Ryp1N+WyvQ5qA+0u9/YlzEW8FgHN0tepcLkpubOJzMTbIsOKGNxoCtDZx6+0PIpJlInysUWeisFNVxQilv5gzfOc+/SzbdMBVp0aRU3x8UsGUMW146BJd4GbMGaHVHunqHcr434bBifTORnJobS+VOJo8jqsjqFOL8mSpigPdq9uttzeiYMRKR7uI2MgcWKjJi9cE807jsMKmsUIbTzjpI6eIxm+shBm29KS3TCyrmXRlOtxIqH2lN9J3lQxu1/bvlgxqQxqHuEm+1hCaSdXYUckkUjFEaXF1G7hERiNS4apwcEeseg5ksTPBSr5lYqucCyPbUyLovhSeoR2QpFr7MrcDuVhNtjMDdORhIXXrMw9dZRIh2joz3vi43YTbqk9Oyb2gzm/xzMjxHzC4OT9foXZvsoDg==");
        done();
      });
    });
  });
});