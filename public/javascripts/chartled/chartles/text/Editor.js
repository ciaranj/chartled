Chartled.RegisterChartleEditor( Chartled.TextChartle, {
  initialise: function(definition) {
    $(this.realValue).hallo({
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