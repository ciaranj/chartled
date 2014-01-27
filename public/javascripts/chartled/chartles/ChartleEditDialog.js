Chartled.ChartleEditDialog = function(options) {
  this._options= {
    animate: false,
    background: true,
    closeButton: false,
    title: ""
  };
  for(var k in options) this._options[k]= options[k];
};

Chartled.ChartleEditDialog.prototype= {
  dispose: function () {
    if( this._chartEditorDialog ) this._chartEditorDialog= null;
    this._options= null;
  },
  show: function(html, okCallback, cancelCallback) {
    var that= this;
    that._chartEditorDialog= bootbox.dialog({"background": this._options.background,
                                            "animate":this._options.animate, 
                                            "className":"graphEditor",
                                            "message":html, 
                                            "title": this._options.title,
                                            closeButton: this._options.closeButton,
                                            buttons: {
                                              "Ok": {
                                                className : "btn-primary",
                                                callback: function() {
                                                 okCallback.call(this, that._chartEditorDialog); 
                                                }
                                              },  
                                              "Cancel": {
                                                className :"btn-default",
                                                callback: function() {
                                                 cancelCallback.call(this, that._chartEditorDialog); 
                                                }
                                              }
                                            }});
    return  that._chartEditorDialog;
  }
};
