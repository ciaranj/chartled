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

    var html= "<h2>Configure Clockface Chartle</h2>";
    html +=   "<form class='form-horizontal'>";
    html +=   "<fieldset><legend>Background</legend>";
    html +=   "<div class='control-group'><label class='control-label'>Icon (Awesome Font)</label><div class='controls'><input class='backgroundImage input-xlarge' type='text'/></div></div>";
    html +=   "<div class='control-group'><label class='control-label'>Colour (Class)</label><div class='controls'><input class='backgroundClass input-xlarge' type='text'/></div></div>";
    html +=   "</fieldset>"
    html +=  "</form>";
    that.chartEditorDialog= bootbox.dialog( html, [
                {
                    "label" : "OK",
                    "class" : "btn-primary",
                    "callback": function() {
                        that.configuringChartle= false;
                        that.set_backgroundIcon( that.chartEditorDialog.find(".backgroundImage").val() );
                        that.set_backgroundColorClass(that.chartEditorDialog.find(".backgroundClass").val());
                        that.resize();
                        that.refresh();
                    }
                },  
                {
                    "label" : "Cancel", 
                    "class" :"btn-default",
                    "callback": function() {
                        that.configuringChartle= false;
                    }
                }
    ], {"backdrop": false, "animate":false, "classes":"graphEditor"});
    that.chartEditorDialog.find(".backgroundImage").val(this._backgroundIcon);
    that.chartEditorDialog.find(".backgroundClass").val(this._backgroundColorClass);
  }
});
