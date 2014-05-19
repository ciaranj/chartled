Chartled.TimeZoneEditor = function( parentEl, currentTimeZone ) {
  this.initialize( parentEl, currentTimeZone );
};

Chartled.TimeZoneEditor.prototype= {
  initialize: function( parentEl, currentTimeZone ) {
    this.parentEl= parentEl;
    this.currentTimeZone= ( typeof(currentTimeZone) == 'undefined' ? "" : currentTimeZone );
    if( typeof(this.currentTimeZone))
    var html = "";
    html += "<div class='form-group'><label class='col-sm-3 control-label'>Timezone</label><div class='controls col-sm-9'><select class='form-control timeZones'>" + this.getTimeZonesDropDown() + "</select></div></div>";

    var jel= $(html);
    parentEl[0].appendChild(jel[0]);
  },
  getTimeZonesDropDown : function() {
    var timeZonesDropDownString= "";
    var zones= moment.tz.zones();
    var timeZones= [];
    timeZones.push(["", " -- Use browser timezone -- "]);

    for( var k in zones ) {
      timeZones.push([zones[k].displayName, zones[k].displayName]);
    }
    timeZones.sort();
    for( var tz in timeZones ){
      timeZonesDropDownString += "<OPTION value='" + timeZones[tz][0] + "' "+ ((timeZones[tz][0] == this.currentTimeZone) ? "SELECTED": "") +" >" + timeZones[tz][1] + "</OPTION>";
    }
    return timeZonesDropDownString;
  },  
  dispose: function() {
    this.parentEl[0].innerHTML= "";
    this.parentEl= null;
  },
  val: function() {
    return $(this.parentEl).find(".timeZones").val();
  }
};