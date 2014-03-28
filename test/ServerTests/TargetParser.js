var TargetParser= require("../../lib/TargetParser")
var assert = require("assert")


function executeParsed( parsed ) {
    return parsed( new TargetParseContext() );
}

describe('TargetParser', function(){
  describe('#parse()', function(){
    it('should parse scale(stats.gauges.overwatch.backlog,1)', function(){
        var functionString= TargetParser.parse( "scale(stats.gauges.overwatch.backlog,1)" ).toString() ;
        assert.ok( functionString.indexOf("ctx.$chkSeries(ctx.scale(ctx.$m({\"o\":\"stats.gauges.overwatch.backlog\",\"r\":\"^stats\\\\.gauges\\\\.overwatch\\\\.backlog$\"}),ctx.$(1)), true, 0, 0)") != -1 );
    })
    it('should parse scale(avg(stats.*.processor.[7].pct_processor_time),100)', function(){
        TargetParser.parse( "scale(avg(stats.*.processor.[7].pct_processor_time),100)" );
    })
    it('shoud parse nested multi argument functions scale(scale(sumSeries(foo.bar*),4),5)', function(){
        TargetParser.parse( "scale(scale(sumSeries(foo.bar*),4),5)" );
    })
    it('shoud parse nested single argument functions averageSeries(avg(sumSeries(foo.bar*[1])))', function(){
        TargetParser.parse( "averageSeries(avg(sumSeries(foo.bar*[1])))" );
    })
    it('should parse simple methods', function(){
      TargetParser.parse( "sumSeries(foo.bar*)" );
      TargetParser.parse( "avg(foo.bar*)" );
      TargetParser.parse( "averageSeries(foo.bar*)" );
      TargetParser.parse( "scale(foo.bar*,3.4)" );
      
    })
    it('should not parse non-whitelisted methods', function(){
      assert.throws( function(){ TargetParser.parse( "xxx(foo.bar*)" ); },TargetParser.SyntaxError );
      assert.throws( function(){ TargetParser.parse( "sumSeries(yyy(foo.bar*),zz(12))" ); },TargetParser.SyntaxError );
    })
    it('should parse individual metrics', function(){
      TargetParser.parse( "foo" );
      TargetParser.parse( "foo.bar-123-poo[1]*{a,b}" );
    })    
  })
})