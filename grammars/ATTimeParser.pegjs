timestring 
  =   seconds_since_epoch
    / timespec
    / & { return input!= null && input.trim().toLowerCase() == ""; } { return require('moment')(); }

seconds_since_epoch
  = timestamp:(digit19 digit digit digit digit digit digit digit digit digit) {
      return require('moment').unix( parseInt( timestamp.join(""), 10) );
    }


timespec
  =   off:offset {
        var ref= require('moment')();
        ref.add( off );
        return ref;
      }
    / ref:reference off:offset? {
        if(off) ref.add( off );
        return ref;
      }

// N.B. Not handling datetime.strptime(s,'%H:%M%Y%m%d') as the 11 length + the specified format doesn't seem to add up :/
reference
  =   "now" { return require('moment')(); }
    / h:paddedhr24 ":" m:paddedMinutes y:paddedYear mo:paddedMonth da:paddedDayOfMonth {
      //Format: 04:00_20110501
      return require('moment')({ "year": y, "month": (mo-1), "date": da, "hour": +h, "minute": m});
    }
    / tod:time_of_day_reference? moy:month_of_year_reference date:unpaddedDayOfMonth {
      //Format: 2pm? January 1
      var day= require('moment')();
      day.month( moy );
      day.date( date );
      if( tod ) {
        day.hours(tod.hours).startOf('hour');
        if(tod.minutes) day.minutes(tod.minutes);
      }
      return day;
    }
    / tod:time_of_day_reference? dow:day_of_week_reference {
      //Format: 2pm? Monday  (Returns the most-recent (exc. today) day that was requested)
      var now= require('moment')().startOf('second');
      var day= require('moment')().startOf('second');
      if( tod ) {
        day.hours(tod.hours).startOf('hour');
        if(tod.minutes) day.minutes(tod.minutes);
      }
      day.day(dow);
      if(day.isAfter(now) || day.isSame(now)) {
        //Format: The day chosen was either today, or in the future :/
        day.subtract({day: 7});
      }
      return day;
    }
    / tod:time_of_day_reference? day:day_reference? {
        //Format: 2pm/noon/midnight/teatime? tomorrow?
        //Format: 2pm/noon/midnight/teatime? 20091201?
        //Format: 2pm/noon/midnight/teatime? 040380?
        //Format: 2pm/noon/midnight/teatime? 04031980?
        if(!day) day= require('moment')();
        if( tod ) {
          day.hours(tod.hours).startOf('hour');
          if( tod.minutes ) day.minutes(tod.minutes);
        }
        return day;
    }

time_of_day_reference =   "noon" { return  {hours: 12}; }
                        / "midnight" { return {hours: 0}; }
                        / "teatime" { return {hours: 16}; }
                        / hours:optionallyPaddedhr12 minutes:minuteParts? ampm: amPm {
                          var m= 0;
                          if( minutes ) m = minutes;
                          if( ampm && ampm == "pm" && hours <12 ) hours += 12;
                          return {"hours": hours, minutes: m};
                        }

minuteParts = ":"? x:([0-5][0-9])  { return parseInt(x.join(""),10); }

amPm = "am" / "pm"

day_reference =   "yesterday" { return require('moment')().subtract('days','1'); }
                / "today" { return require('moment')(); }
                / "tomorrow" { return require('moment')().add('days','1'); }
                / year:(paddedYear) month:(paddedMonth) day:(paddedDayOfMonth) {
                  //Handle: YYYYMMDD
                  return require('moment')().year(year).month(month-1).date(day);
                }
                / month:(paddedMonth) "/" day:(paddedDayOfMonth) "/" yearPrefix:([1][9]/[2][0])? yearSuffix:([0-9][0-9]) {
                  //Handle: MMDDYY[YY]
                  var year= 1970;
                  if( yearPrefix && yearSuffix) {
                    year= parseInt( yearPrefix.join("") + yearSuffix.join(""), 10 );
                  }
                  else {
                    // Treat 2 digit years less that '70' as being in the 20XX range, otherwise the 19XX range
                    year = 1900 + parseInt( yearSuffix.join(""), 10 );
                    if( year < 1970 ) { year += 100; }
                  }

                  return require('moment')().year(year).month(month-1).date(day);
                }

month_of_year_reference = "january"/"jan"/"february"/"feb"/"march"/"mar"
                         /"april"/"apr"/"may"/"june"/"jun"/"july"/"jul"
                         /"august"/"aug"/"september"/"sep"/"october"
                         /"oct"/"november"/"nov"/"december"/"dec"

day_of_week_reference = day_of_week_mon/day_of_week_tue/day_of_week_wed/day_of_week_thurs/day_of_week_fri/day_of_week_sat/day_of_week_sun
day_of_week_mon = ("monday" / "mon") { return "Monday"; }
day_of_week_tue = ("tuesday" / "tue") { return "Tuesday"; }
day_of_week_wed = ("wednesday" / "wed") { return "Wednesday"; }
day_of_week_thurs = ("thursday" / "thur") { return "Thursday"; }
day_of_week_fri = ("friday" / "fri" ) { return "Friday"; }
day_of_week_sat = ("saturday" / "sat") { return "Saturday"; }
day_of_week_sun = ("sunday" / "sun" ) { return "Sunday"; }

offset
  =  sign:sign? value:positive_integer type:inc_period {
       var duration= {};
       if( sign && sign == "-" ) duration[type]= -value;
       else duration[type]= value;
      // Whilst it appears to work (adding negative durations)
      // looking at the momentjs code, I'm not sure why it should..might be a bug here :(
       return require('moment').duration( duration );
     }
   / "next"  inc_period

sign = "+" / "-"

inc_period = inc_period_minutes / inc_period_hours / inc_period_days / inc_period_weeks / inc_period_months / inc_period_years / inc_period_seconds

inc_period_minutes = ("minutes" / "minute" / "min") { return "minutes"; }
inc_period_hours = ("hours" / "hour" / "h") { return "hours"; }
inc_period_days = ("days" / "day" / "d") { return "days"; }
inc_period_weeks = ("weeks" / "week" / "w") { return "weeks"; }
inc_period_months = ("months" / "month" / "mon") { return "months"; }
inc_period_years = ("years" / "year" / "y" ) { return "years"; }
inc_period_seconds = ("seconds" / "second" / "s") { return "seconds"; }

positive_integer
  = d:digit19 ds:digits  { return parseInt(d+ ds.join(""), 10); }
  / d:digit  { return parseInt(d, 10); }

digits = digit+

digit = [0-9]

digit19 = [1-9]

paddedYear = y:([1-2][0-9][0-9][0-9]) { return parseInt(y.join(""),10); }

paddedMonth= m:([0][1-9]/[1][0-2]) { return parseInt(m.join(""),10); }

unpaddedDayOfMonth= d:([1-2][0-9]/[3][0-1]/[1-9]) { 
  var v= d;
  if( typeof(d) != 'string') v= d.join("");
  return parseInt(v,10);
}

paddedDayOfMonth= d:([1-2][0-9]/[3][0-1]/"0"[1-9]){ return parseInt(d.join(""),10); }

paddedhr24= h:("0"[0-9] / "1"[0-9] / "2"[0-3]) { return parseInt(h.join(""),10);}

optionallyPaddedhr12 = h:("1"[0-2] / "0"?[0-9]) { return parseInt(h.join(""),10); }

paddedMinutes= m:("0"[0-9] / [1-5][0-9]) { return parseInt(m.join(""),10);}
