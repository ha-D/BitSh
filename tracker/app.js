var express = require('express')
  , fs 		= require('fs')

var config   = require('../config')
  , mongoose = require('mongoose')


// Bootstrap db connection
mongoose.connect(config.db);

// Bootstrap models
var models_path = __dirname + '/../models'
fs.readdirSync(models_path).forEach(function (file) {
  if (~file.indexOf('.js')) require(models_path + '/' + file)
})

var app = express();

require('./settings/express')(app, config);
require('./settings/routes').init(app);

var port = config.tracker.port;
app.listen(port);
console.log("Tracker started on port " + port);

exports = module.exports = app;