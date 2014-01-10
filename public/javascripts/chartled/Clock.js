if( typeof(Chartled) == 'undefined' ) Chartled = {};

Chartled.Clock = function( definition ) {
  this.deserialize( definition );
};

Chartled.Clock.prototype = {
  deserialize : function( definition ) {
    var that= this;
    that.id= definition.id;

    // How often (in seconds) the clock will 'tick'
    if( typeof(definition.refreshRate) == 'undefined' || definition.refreshRate == null ) that.refreshRate = 30;
    else that.refreshRate= definition.refreshRate;

    // How far back in the pass this clock cares about (by default 24 hours)
    if( typeof(definition.from) == 'undefined' || definition.from == null ) that.from = "-24hours";
    else that.from= definition.from;

    // How far into the future this clock will care about (default is 'now', i.e. not at all into the future).
    if( typeof(definition.until) == 'undefined' || definition.until == null ) that.until= "now";
    else that.until= definition.until;
    
    if( typeof(definition.description) == 'undefined' || definition.description == null ) that.description= "From '" + that.from + "' to '" + that.until + "' every "+ that.refreshRate +" seconds";
    else that.description= definition.description;
  },
  serialize: function() {
    return { "id"             : this.id,
             "refreshRate"    : this.refreshRate,
             "from"           : this.from,
             "until"          : this.until,
             "description"    : this.description
    };
  },
  dispose: function() {}
};
