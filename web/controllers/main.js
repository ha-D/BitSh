var path   = require('path')
var config = require('../../config')
var user   = require('./user')
var routes = require('../settings/routes')

exports._index = function(req, res){
	res.sendfile(config.publicRoot + '/index.html');
}

exports.doAction = function(req, res){''
	try{
		jReq = JSON.parse(req.body.data);

		if (jReq === undefined) 
			throw "No data given";

		if (jReq.action === undefined)
			throw "No action given";
		if (routes.actions[jReq.action] === undefined)
			throw "Action " + jReq.action + " not defined";

		req.data = jReq;
		routes.actions[jReq.action](req, res);
	}catch(err){
		console.log(err)
		res.json({
			error: {
				message: err,
				name: "ServerError"
			}
		});		
	}
}

