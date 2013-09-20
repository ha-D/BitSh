var fs 		 = require('fs')
  , mkdirp = require('mkdirp')
  , config 	 = require('./config')

var argv = process.argv;

function printUsage(){
	process.stderr.write("Usage: node app.js { web | tracker } \n\n");
}

/* Check usage */
if (argv.length < 3){
	process.stderr.write("Bitsh Torrent Tracker\n");
	printUsage();
	process.exit(1);
}

/* Create log directories */
mkdirp(config.web.logPath);
mkdirp(config.tracker.logPath);

/* Load app */
var app = argv[2];
if (app === 'web')
	require('./web/app');
else if (app === 'tracker')
	require('./tracker/app');
else{
	process.stderr.write("Unrecognized application '" + app + "'\n\n");
	printUsage();
	process.exit(1);
}
