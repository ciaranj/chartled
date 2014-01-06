var assert = require("assert"),
    TargetParseContext= require("../../lib/TargetParseContext"),
    MetricInfo= require("../../lib/MetricInfo"),
    TargetParser= require("../../lib/TargetParser"),
    Utils= require("./TestUtils");

var doneCountDown= function ( count, done ) {
    return function(err) {
        if( err ) done(err);
        else {
            count--;
            if( count <= 0) done(err);
        }
    }
}

function convertFromArrayToIndexedCollectionOfLiterals( arr ) {
    var result= {};
    for( var k in arr ) {
        result[arr[k]]= new MetricInfo( arr[k], arr[k], {aggregationMethod: "avg"} );
    }
    return result;
}

function convertFromArrayToCollectionOfLiterals( arr ) {
    var result= [];
    for( var k in arr ) {
        var r= new MetricInfo( arr[k], arr[k], {aggregationMethod: "avg"} );
        r.data= { values:[], tInfo:[]};
        result[result.length]=  r;
    }
    return result;
}

function checkExpandMetrics( availableMetrics, metricsToTest, expectedResults, done ) {
    var doneCnt= doneCountDown( metricsToTest.length, done );
    for( var k in metricsToTest ) {
      (function( metric, expectedResult) {
         var ctx= Utils.buildTargetParseContext( metric, convertFromArrayToIndexedCollectionOfLiterals(availableMetrics), undefined, [] );
         TargetParser.parse( metric )(ctx).then(
            function (result) {
              assert.equal( expectedResult.realName, result.seriesList.realName);
              assert.equal( expectedResult.name, result.seriesList.name);
              assert.deepEqual( expectedResult.info, result.seriesList.info);
              doneCnt();
            })
        .end( );
      })( metricsToTest[k], convertFromArrayToCollectionOfLiterals(expectedResults[k]));
    }
}

describe('TargetParseContext', function(){
  describe('metric matching', function(){
    it('should return an empty array for no matches', function(done){
      checkExpandMetrics( ["foo", "foo.bar", "foo.bar.x.y.z"], ["xxx"], [[]], done);
    })
    it('should handle (non parameterised) metrics', function(done){
      checkExpandMetrics( ["foo", "foo.bar", "foo.bar.x.y.z"],
                          ["foo", "foo.bar", "foo.bar.x.y.z"],
                          [["foo"],["foo.bar"], ["foo.bar.x.y.z"]],
                          done);
    })
    it('should handle wildcard e.g.\'*\' metrics', function(done){
      checkExpandMetrics( [ "bar.z", "foo", "foo.bar", "foo.bar.x.y.z", "foo.far.x.y.z", "foo.far.x.y.j"],
                          ["foo*","foo.*.x.y.z","foo.*.x.y.*","*.z"],
                          [["foo.bar","foo.bar.x.y.z", "foo.far.x.y.z", "foo.far.x.y.j"],["foo.bar.x.y.z", "foo.far.x.y.z"],
                           ["foo.bar.x.y.z", "foo.far.x.y.z", "foo.far.x.y.j"],["bar.z", "foo.bar.x.y.z", "foo.far.x.y.z"]],
                          done);
    })
    it('should handle alternative e.g. \'{x,y,z}\' metrics', function(done){
      checkExpandMetrics( [ "bar.z", "foo", "foo.bar", "foo.bar.x.y.z", "foo.far.x.y.z", "foo.far.x.y.j"],
                          ["foo.far.x.y.{j,z}","foo.{bar,far}*"],
                          [["foo.far.x.y.z", "foo.far.x.y.j"],["foo.bar.x.y.z","foo.far.x.y.z","foo.far.x.y.j"]],
                          done);
    })
    it('should handle range based e.g. \'[12-19]\' metrics', function(done){
      checkExpandMetrics( [ "cpu.0.load", "cpu.1.load", "cpu.2.load", "cpu.total.load", "cpu.3.load", "mem.2.load"],
                          ["cpu.*.load","cpu.[1-3].load","cpu.[3].load","cpu.[2-3].load","*.[2-3].load"],
                          [["cpu.0.load", "cpu.1.load", "cpu.2.load", "cpu.total.load", "cpu.3.load"],
                           ["cpu.1.load", "cpu.2.load", "cpu.3.load"],
                           ["cpu.0.load", "cpu.1.load", "cpu.2.load", "cpu.3.load"],
                           ["cpu.2.load", "cpu.3.load"],
                           ["cpu.2.load", "cpu.3.load", "mem.2.load"]],
                          done);
    })
     it('should handle alternatives with nested metrics and ranges based e.g. \'{cpu-[0],cpu-[2-3], mem*}\' metrics', function(done){
      checkExpandMetrics( [ "cpu.0.load", "cpu.1.load", "cpu.2.load", "cpu.total.load", "cpu.3.load", "mem.2.load"],
                          ["cpu.{[0],[2-3]}.load","{cpu.[1-2],mem*}.load"],
                          [["cpu.0.load", "cpu.2.load", "cpu.3.load"],["cpu.1.load", "cpu.2.load", "mem.2.load"]],
                          done);
    })
  })
})

