Chartled.registerChartleEditor( Chartled.TextChartle, {
  initialize: function(definition) {
    $(this.realValue).hallo({
      editable: (page_mode == "content" ),
      plugins: {
        'halloformat': {
          formattings: {"bold": true, "italic": true, "strikethrough": true, "underline": true}
        },
        halloheadings : {headers:  [1,2,3,4,5]},
        hallolists: {},
        hallojustify: {},
        halloreundo: {}
      }
    });
  }
});