var   assert= require("assert"),
      MetricRegexCreator= require("../../lib/MetricRegexCreator");


// uggh time based tests, what could possibly go wrong :/
describe('MetricRegexCreator.parse', function(){
    it("should create a simple matching regex when no wildcards present", function() {
        var r=  MetricRegexCreator.parse("foo");
        assert(r.test("foo"));
        r=  MetricRegexCreator.parse("foo.bar");
        assert.equal(r.test("foo.bar"), true);
        assert.equal(r.test("fooxbar"), false);
    });
    it("should create a simple matching regex when a wildcard is present", function() {
        var r=  MetricRegexCreator.parse("foo.*");
        assert.equal(r.test("foo"), false);
        assert.equal(r.test("foo.bar"), true);
        assert.equal(r.test("fooxbar"), false);
        assert.equal(r.test("foo.tar"), true);
        assert.equal(r.test("boo.tar"), false);
    });
});
