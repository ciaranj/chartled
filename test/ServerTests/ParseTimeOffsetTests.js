var   assert= require("assert")
    , DatesAndTimes= require("../../lib/utils/DatesAndTimes")
    , moment = require("moment");

describe('DatesAndTimes.ParseTimeOffset', function(){
    it("should parse negative as well as positive offsets", function() {
      assert.equal( DatesAndTimes.parseTimeOffset("1s"), 1 );
      assert.equal( DatesAndTimes.parseTimeOffset("+1s"), 1 );
      assert.equal( DatesAndTimes.parseTimeOffset("-1s"), -1 );
    });
    it("should parse seconds", function() {
      assert.equal( DatesAndTimes.parseTimeOffset("1s"), 1 );
      assert.equal( DatesAndTimes.parseTimeOffset("-23seconds"), -23 );
    });
    it("should parse minutes", function() {
      assert.equal( DatesAndTimes.parseTimeOffset("1min"), 60 );
      assert.equal( DatesAndTimes.parseTimeOffset("-2minutes"), -120 );
    });
    it("should parse hours", function() {
      assert.equal( DatesAndTimes.parseTimeOffset("1h"), 3600 );
      assert.equal( DatesAndTimes.parseTimeOffset("-10hours"), -36000 );
    });
    it("should parse days", function() {
      assert.equal( DatesAndTimes.parseTimeOffset("1d"), 86400 );
      assert.equal( DatesAndTimes.parseTimeOffset("-5days"), -432000 );
    });
    it("should parse weeks", function() {
      assert.equal( DatesAndTimes.parseTimeOffset("1w"), 604800 );
      assert.equal( DatesAndTimes.parseTimeOffset("-5weeks"), -3024000 );
    });
    it("should parse months", function() {
      assert.equal( DatesAndTimes.parseTimeOffset("1mon"), 2592000 );
      assert.equal( DatesAndTimes.parseTimeOffset("-2months"), -5184000 );
    });
    it("should parse years", function() {
      assert.equal( DatesAndTimes.parseTimeOffset("1y"), 31536000 );
      assert.equal( DatesAndTimes.parseTimeOffset("-2years"), -63072000 );
    });
});