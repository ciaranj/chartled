var MetricInfo= function( name, filename, info ) {
    this.realName= name;
    this.name= name;
    this.filename= filename;
    this.info= info;
}

MetricInfo.prototype.clone= function() {
    // Bit worried about the lack of cloning on the info object..if someone mutates this externally....
    return new MetricInfo( this.name, this.filename, this.info );
}

module.exports= MetricInfo;