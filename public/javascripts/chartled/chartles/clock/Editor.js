Chartled.registerChartleEditor( Chartled.ClockChartle, {
  initialize: function( definition ) {
    this.configuringChartle = false;
    this.configureDelegate= $.proxy( this.configureChartle, this );
    this.jEl.on( 'click', this.configureDelegate);
  },
  dispose: function() {
    this.jEl.off( 'click', this.configureDelegate);
    this.configureDelegate = null;
  },
  addRefreshListener: function( refresher ) {
    this.refresh= refresher;
  },
  configureChartle : function() {
    var that= this;
    if( that.configuringChartle || page_mode != "content" ) return;
    else that.configuringChartle= true;

    // Take a copy of the current metrics, prior to edit.

    html =   "<form class='form-horizontal'>";
    html +=   "<fieldset><legend>Background</legend>";
    html +=   "<div class='form-group'><label class='col-sm-3 control-label'>Icon (FontAwesome)</label><div class='col-sm-9'><input class='backgroundImage form-control' type='text'/></div></div>";
    html +=   "<div class='form-group'><label class='col-sm-3 control-label'>Colour (Class)</label><div class='col-sm-9'><input class='backgroundClass form-control' type='text'/></div></div>";
    html +=   "</fieldset>"
    html +=  "</form>";
    that.chartEditorDialog= bootbox.dialog({"backdrop": true, 
                                            "animate":false, 
                                            "className":"graphEditor",
                                            message:html, 
                                            title: "Configure Clockface Chartle",
                                            closeButton: false,
                                            buttons: {
                                              "Ok": {
                                                className : "btn-primary",
                                                callback: function() {
                                                    that.configuringChartle= false;
                                                    that.set_backgroundIcon( that.chartEditorDialog.find(".backgroundImage").val() );
                                                    that.set_backgroundColorClass(that.chartEditorDialog.find(".backgroundClass").val());
                                                    that.resize();
                                                    that.refresh();
                                                }
                                              },  
                                              "Cancel": {
                                                className :"btn-default",
                                                callback: function() {
                                                  that.configuringChartle= false;
                                                }
                                              }
                                            }});
    that.chartEditorDialog.find(".backgroundImage").val(this._backgroundIcon);
    that.chartEditorDialog.find(".backgroundClass").val(this._backgroundColorClass);
  }
});
