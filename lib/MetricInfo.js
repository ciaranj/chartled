var MetricInfo= function( name, filename, info, node ) {
    this.realName= name;
    this.name= name;
    this.filename= filename;
    this.info= info;
    this.node= node;
}

MetricInfo.prototype.clone= function() {
    // Bit worried about the lack of cloning on the info & node objects..if someone mutates this externally....
    return new MetricInfo( this.name, this.filename, this.info, this.node );
}

module.exports= MetricInfo;