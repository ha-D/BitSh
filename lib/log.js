var winston = require('winston');

winston.loggers.add('tracker', {
	console: {
		level: 'debug',
		colorize: 'true'
	}
});

winston.loggers.add('indexer', {
	console: {
		colorize: 'true'
	}
});

var loadLogger = function(loggerName){
	return winston.loggers.get(loggerName);
}

exports = module.exports = loadLogger;