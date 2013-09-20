var util = require('util')

var AppError = function (msg, constr) {
  Error.captureStackTrace(this, constr || this);
  this.message = msg || 'Error';
}

util.inherits(AppError, Error);

exports.AppError = AppError;