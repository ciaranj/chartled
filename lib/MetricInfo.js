var MetricInfo= function( name, filename, info, node ) {
    this.realName= name; // The original true 'name' for the node this data 'came' from i.e. foo.bar
    this.name= name;     // The 'aliased' name for this metric, based on the expression i.e. sumSeries(foo.bar)
    this.filename= filename;
    this.info= info;
    this.node= node;
}

MetricInfo.prototype.clone= function(matcher) {
    // Bit worried about the lack of cloning on the info & node objects..if someone mutates this externally....
    var mi= new MetricInfo( this.name, this.filename, this.info, this.node );
    mi.pathExpression= matcher;
    mi.populated= false;
    mi.data= {
        tInfo: [],
        values: []
    };
    return mi;
}

module.exports= MetricInfo;