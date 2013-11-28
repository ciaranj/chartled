var  express = require('express')

process.on('uncaughtException', function (err) {
  console.log( err.stack );
});

var app = express();
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views')
app.set('view engine', 'jade')

app.get('/', function(req, res){
  res.render('example-client-index')
});

app.listen(4000);
console.log('Listening on port 4000');
