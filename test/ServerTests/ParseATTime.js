var   assert= require("assert")
    , DatesAndTimes= require("../../lib/utils/DatesAndTimes")
    , moment= require("moment")
    , tz_moment= require("moment-timezone");

function current_year() {
  return 2014; // Risky for tests running early on in the year ;) ..i.e. the first day ..or late on I suppose.
}

// uggh time based tests, what could possibly go wrong :/
describe('DatesAndTimes.ParseATTime', function(){
    it("should parse unix timestamps (such as 1234567890)", function() {
      assert.equal( DatesAndTimes.parseATTime("1388656171"), 1388656171 );
      assert.throws( function() {
        DatesAndTimes.parseATTime("-1388656171")
      }, Error );
      assert.throws( function() {
        DatesAndTimes.parseATTime("13886561710")
      }, Error );
    });
    it("should throw an error when provided with a null or undefined timestamp", function() {
      assert.throws( function() {
        DatesAndTimes.parseATTime(null)
      }, Error );
      assert.throws( function() {
        DatesAndTimes.parseATTime()
      }, Error );
    });
    it("empty string should be 'now'", function() {
      assert.equal( DatesAndTimes.parseATTime(""), Math.floor(new Date().getTime()/1000) );
    });
    it("should parse 'now'", function() {
      assert.equal( DatesAndTimes.parseATTime("now"), Math.floor(new Date().getTime()/1000) );
      assert.equal( DatesAndTimes.parseATTime(" NoW "), Math.floor(new Date().getTime()/1000) );
    });

    it("should parse 'now +1hour'", function() {
      assert.equal( DatesAndTimes.parseATTime("now +1hour"), Math.floor(new Date().getTime()/1000) + 3600 );
      assert.equal( DatesAndTimes.parseATTime("now +1 hours"), Math.floor(new Date().getTime()/1000) + 3600 );
      assert.equal( DatesAndTimes.parseATTime("now + 1h"), Math.floor(new Date().getTime()/1000) + 3600  );
      assert.equal( DatesAndTimes.parseATTime("+1hour"), Math.floor(new Date().getTime()/1000) + 3600 );
    });
    it("should parse 'now -120minutes'", function() {
      assert.equal( DatesAndTimes.parseATTime("now -120minute"), Math.floor(new Date().getTime()/1000) - 7200 );
      assert.equal( DatesAndTimes.parseATTime("now -120 minutes"), Math.floor(new Date().getTime()/1000) - 7200 );
      assert.equal( DatesAndTimes.parseATTime("now - 120min"), Math.floor(new Date().getTime()/1000) - 7200 );
      assert.equal( DatesAndTimes.parseATTime("-120minute"), Math.floor(new Date().getTime()/1000) - 7200 );
    });
    it("should parse 'noon yesterday'", function() {
      var m= tz_moment().tz("Europe/London").subtract('days',1).hours(12).startOf('hour');
      assert.equal( DatesAndTimes.parseATTime("noon yesterday"), m.unix() );
    });
    it("should parse 'noon today'", function() {
      var m= tz_moment().tz("Europe/London").hours(12).startOf('hour');
      assert.equal( DatesAndTimes.parseATTime("noon"), m.unix() );
      assert.equal( DatesAndTimes.parseATTime("noon today"), m.unix() );
    });
    it("should parse 'noon tomorrow'", function() {
      var m= tz_moment().tz("Europe/London").add('days',1).hours(12).startOf('hour');
      assert.equal( DatesAndTimes.parseATTime("noon tomorrow"), m.unix() );
    });
    it("should parse 'midnight yesterday'", function() {
      var m= tz_moment().tz("Europe/London").subtract('days',1).hours(0).startOf('hour');
      assert.equal( DatesAndTimes.parseATTime("midnight yesterday"), m.unix() );
    });
    it("should parse 'midnight today'", function() {
      var m= tz_moment().tz("Europe/London").hours(0).startOf('hour');
      assert.equal( DatesAndTimes.parseATTime("midnight"), m.unix() );
      assert.equal( DatesAndTimes.parseATTime("midnight today"), m.unix() );
    });
    it("should parse 'midnight today (Los Angeles)", function() {
      var m= tz_moment().tz("America/Los_Angeles").hours(0).startOf('hour');
      assert.equal( DatesAndTimes.parseATTime("midnight","America/Los_Angeles"), m.unix() );
      assert.equal( DatesAndTimes.parseATTime("midnight today","America/Los_Angeles"), m.unix() );
    });
    it("should parse 'midnight tomorrow'", function() {
      var m= tz_moment().tz("Europe/London").add('days',1).hours(0).startOf('hour');
      assert.equal( DatesAndTimes.parseATTime("midnight tomorrow"), m.unix() );
    });
    //teatime?
    it("should parse 'teatime yesterday'", function() {
      var m= tz_moment().tz("Europe/London").subtract('days',1).hours(16).startOf('hour');
      assert.equal( DatesAndTimes.parseATTime("teatime yesterday"), m.unix() );
    });
    it("should parse 'teatime today'", function() {
      var m= tz_moment().tz("Europe/London").hours(16).startOf('hour');
      assert.equal( DatesAndTimes.parseATTime("teatime"), m.unix() );
      assert.equal( DatesAndTimes.parseATTime("teatime today"), m.unix() );
    });
    it("should parse 'teatime tomorrow'", function() {
      var m= tz_moment().tz("Europe/London").add('days',1).hours(16).startOf('hour');
      assert.equal( DatesAndTimes.parseATTime("teatime tomorrow"), m.unix() );
    });
    it("should parse '6pm today'", function() {
      var m= tz_moment().tz("Europe/London").hours(18).startOf('hour');
      assert.equal( DatesAndTimes.parseATTime("6pm today"), m.unix() );
    })
    it("should parse '6am today'", function() {
      var m= tz_moment().tz("Europe/London").hours(6).startOf('hour');
      assert.equal( DatesAndTimes.parseATTime("6am today"), m.unix() );
    })
    it("should parse '4:23pm yesterday'", function() {
      var m= tz_moment().tz("Europe/London").subtract('days',1).hours(16).startOf('hour').minutes(23);
      assert.equal( DatesAndTimes.parseATTime("4:23pm yesterday"), m.unix() );
    })
    it("should parse 'tomorrow'", function() { 
      var m= moment().add('days',1);
      assert.equal( DatesAndTimes.parseATTime("tomorrow"), m.unix() );
    });
    it("should parse 'today'", function() { 
      var m= moment();
      assert.equal( DatesAndTimes.parseATTime("today"), m.unix() );
    });
    it("should parse 'yesterday'", function() { 
      var m= moment().subtract('days',1);
      assert.equal( DatesAndTimes.parseATTime("yesterday"), m.unix() );
    });
    it("should parse '-8d'", function() {
      var m= moment();
      m.subtract('days',8);
      assert.equal( DatesAndTimes.parseATTime("-8d"), m.unix() );
    })
    it("should parse 'january 5'", function() {
      // January this year.
      var m= moment().month(0).date(5);
      assert.equal( DatesAndTimes.parseATTime("january 5"), m.unix() );
      assert.equal( DatesAndTimes.parseATTime("jan 5"), m.unix() );
    })
    it("should parse '7:23pm june 28'", function() {
      var expected= tz_moment.tz( current_year() + "-06-28 19:23", "Europe/London").unix();
      assert.equal( DatesAndTimes.parseATTime("7:23pm jun 28"), expected );
      assert.equal( DatesAndTimes.parseATTime("7:23pm june 28"), expected );
    })
    it("should parse '2:05pm january 5 + 3h'", function() {
      var expected= tz_moment.tz(current_year() + "-01-05 17:05", "Europe/London").unix();
      assert.equal( DatesAndTimes.parseATTime("2:05pm january 5 + 3h"), expected );
    })
    it("should parse '04:05am january 5 - 3hour'", function() {
      var expected= tz_moment.tz(current_year() + "-01-05 01:05", "Europe/London").unix();
      assert.equal( DatesAndTimes.parseATTime("04:05am january 5 - 3hour"), expected );
    })
    it("should parse 'monday' (previous monday [or today if currently monday])", function() {
      // Previous monday (ughh which I could abstract a clock to check 'today is monday, tomorrow is monday, yesterday is monday' properly :(
      var parsed= moment.unix(DatesAndTimes.parseATTime("monday"));
      assert.equal( parsed.format("dddd"), "Monday" );
      assert( parsed.isBefore(moment()) );

      parsed= moment.unix(DatesAndTimes.parseATTime("mon"));
      assert.equal( parsed.format("dddd"), "Monday" );
      assert( parsed.isBefore(moment()) );
    })
    it("should parse 'saturday' (previous saturday [or today if currently saturday])", function() {
      // Previous saturday.
      var parsed= moment.unix(DatesAndTimes.parseATTime("saturday"));
      assert.equal( parsed.format("dddd"), "Saturday" );
      assert( parsed.isBefore(moment()) );
    })
    it("should parse 'noon monday'", function() {
      var m= tz_moment().tz("Europe/London").day("Monday").hours(12).startOf('hour');
      assert.equal( DatesAndTimes.parseATTime("noon monday"), m.unix() );
    })
    it("should parse 'noon monday +3h'", function() {
      var m= tz_moment().tz("Europe/London").day("Monday").hours(15).startOf('hour');
      assert.equal( DatesAndTimes.parseATTime("noon monday +3h"), m.unix() );
    })
    it("should parse '20091201'", function() {
      var m= moment().years(2009).months(11).date(1);
      assert.equal( DatesAndTimes.parseATTime("20091201"), m.unix() );
    })
    it("should parse 'midnight 20091201 +2h'", function() {
      var m= tz_moment.tz( "2009-12-01 02:00", "Europe/London");
      assert.equal( DatesAndTimes.parseATTime("midnight 20091201 +2h"), m.unix() );
    })
    it("should parse '04:00_20110507'", function() {
      var m= tz_moment.tz( "2011-05-07 04:00", "Europe/London");
      assert.equal( DatesAndTimes.parseATTime("04:00_20110507"), m.unix() );
    })
    it("should parse '16:00_20110501 +2d'", function() {
      var m= tz_moment.tz( "2011-05-03 16:00", "Europe/London");
      assert.equal( DatesAndTimes.parseATTime("16:00_20110501 +2d"), m.unix() );
    })
    it("should parse '16:00_20110501 +3min'", function() {
      var m= tz_moment.tz( "2011-05-01 16:03", "Europe/London");
      assert.equal( DatesAndTimes.parseATTime("16:00_20110501 +3min"), m.unix() );
    })
    it("should parse '04/03/70'", function() {
      // 2digit years >70 are considered as being part of 19XX 
      var m= moment().years(1970).months(3).date(3);
      assert.equal( DatesAndTimes.parseATTime("04/03/70"), m.unix() );
      m= moment().years(1980).months(3).date(3);
      assert.equal( DatesAndTimes.parseATTime("04/03/80"), m.unix() );
    })
    it("should parse '04/03/69'", function() {
      // 2digit years <70 are considered as being part of 20XX 
      var m= moment().years(2069).months(3).date(3);
      assert.equal( DatesAndTimes.parseATTime("04/03/69"), m.unix() );
      m= moment().years(2011).months(3).date(3);
      assert.equal( DatesAndTimes.parseATTime("04/03/11"), m.unix() );
    })
    it("should parse '04/03/1980'", function() {
      var m= moment().years(1980).months(3).date(3);
      assert.equal( DatesAndTimes.parseATTime("04/03/1980"), m.unix() );
    })
    it("should parse '04/03/2011'", function() {
      var m= moment().years(2011).months(3).date(3);
      assert.equal( DatesAndTimes.parseATTime("04/03/2011"), m.unix() );
    })
    it("should parse 'midnight 04/03/2011+1days'", function() {
      var m= tz_moment.tz( "2011-04-04 00:00", "Europe/London");
      assert.equal(  DatesAndTimes.parseATTime("midnight 04/03/2011+1days"), m.unix() );
    })
});
