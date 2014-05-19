Chartled.ClockChartleEditor = function() {
  Chartled.DashingChartleEditor.call( this );
};

Chartled.inheritPrototype(Chartled.ClockChartleEditor, Chartled.DashingChartleEditor, {
  initialize: function( definition ) {
    Chartled.DashingChartleEditor.prototype.initialize.call( this, definition, {
      title: "Configure Clockface",
      editable: {
        metrics: false,
        details_title: false,
        details_moreInfo: true,
        details_timeStamp: false
      }
    });
  },
  _additional_editor_html: function( html ) {
    if( this._tzEnabled() ) {
      html +=  "<fieldset><legend>Format</legend>";
      html +=   "<div class='timeZoneEditorContainer'/>";
      html +=  "</fieldset>";
    }
    return html;
  },
  _editor_dialog_completed: function( $dialog ) {
    if( this._tzEnabled() ) {
      this._timeZone= this._tzEditor.val();
      this._tzEditor.dispose();
      this._tzEditor= null;
    }
  },
  _editor_dialog_rendered: function( $dialog ) {
    if( this._tzEnabled() ) {
      if( this._tzEditor ) {
        this._tzEditor.dispose();
        this._tzEditor= null;
      }
      this._tzEditor= new Chartled.TimeZoneEditor( $dialog.find(".timeZoneEditorContainer"), this._timeZone );
    }
  }
});
Chartled.registerChartleEditor( Chartled.ClockChartle, Chartled.ClockChartleEditor.prototype);
