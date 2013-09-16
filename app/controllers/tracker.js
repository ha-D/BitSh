var Torrent  = require('../models/torrent')
  , Peer     = require('../models/peer')
  , User 	 = require('../models/user')
  , UTStatus = require('../models/utstatus')
  , Bencode  = require('bencode')
  , _        = require('underscore')
  , util 	 = require('util')
  , zutil	 = require('../../lib/util')
  , logger   = require('../../lib/log')('tracker')

/*	TODO
    
    + Check different failure cases such as bad user id ...
    + Any validation check left
    + Test seeder leecher count correctness
 
*/

function AnnounceError(message){
	AnnounceError.super_.call(this, message, this.constructor)
}
util.inherits(AnnounceError, zutil.AppError);
AnnounceError.prototype.message = "Tracker Error";


var requestCount = 1;

/*
 *	Returns a wrapper function for functions used in handling announce request
 *  Returned function handles errors and returns appropiate response to client
 *  so all announce related functions that return a response should be called 
 *  through this wrapper
 */
function announceErrorWrapper(req, res, fun){
	return function(){
		try{
			fun.apply(this, arguments);
		}catch(err){
			res.send(Bencode.encode({
				"failure reason": err.message
			}));

			logger.error("announce [%d] failed: %s\n%s", req.requestId, err.message, err.stack);
		}
	}
}

/*
 *	Updates the torrent assigned to the peer with the peer stats.
 *	This function doesn't remove the peer from the database, that
 *	should be done manually if needed
 */
function finalizePeer(userId, torrentId, peer){
	UTStatus.update(
		{ user: userId, torrent: torrentId }, 
		{ $inc: { download: peer.download, upload: peer.upload } },
		{ upsert: true }
	);
	if (peer.completed){
		Torrent.update(
			{ _id: torrentId },
			{ $inc: {seeder_count: -1} }
		);
	} else {
		Torrent.update(
			{ _id: torrentId },
			{ $inc: {leecher_count: -1} }
		);
	}
}

/*
 * Creates suitable peer list for sending as announce response
 * Also compresses if specified in request query
 */
function makePeerList(req, res, peers){
	_.shuffle(peers);
	peers = _.first(peers, req.query.numwant);

	if (req.query.compact == 1){
		var byteCount = 0;
		var buf = _.reduce(peers, function(buf, peer){
			ip = _.map(peer.ip.split('.'), parseInt)
			_.each(ip, function(x){
				buf.write(String.fromCharCode(x), byteCount++);
			});
			buf.write(String.fromCharCode(peer.port >> 8), byteCount++);
			buf.write(String.fromCharCode(peer.port - ((peer.port >> 8) << 8)), byteCount++);
			return buf;
		}, new Buffer(peers.length * 6));

		formatedPeers = buf.toString();

	} else {
		formatedPeers = _.map(peers, function(peer){
			return {
				"peer id": peer.peer_id,
				"ip": peer.ip,
				"port": peer.port
			};
		});
	}

	logger.debug("announce [%d] sending %d peers", req.requestId, peers.length);
	return formatedPeers;
}

/*
 * Sends peer list as announce response
 */
function sendPeerList(req, res){
	Torrent
	.findOne({_id: req.query.info_hash})
	.select('seeder_count leecher_count completed_count')
	.exec(announceErrorWrapper(req, res, function(err, torrent){

		if (torrent == null)
			throw new AnnounceError('Torrent does not exist in the database');
		
		Peer
		.find({torrent: req.query.info_hash, peer_id: {$ne: req.query.peer_id}})
		.select('peer_id ip port')
		.exec(announceErrorWrapper(req, res, function(err, peers){
			peers = makePeerList(req, res, peers);

			res.send(Bencode.encode({
				interval: 300,
				complete: torrent.seeder_count,
				incomplete: torrent.leecher_count,
				peers: peers
			}));
		}));
	}));
}

/*
 *	Handles the start even of an announce request
 *	If a peer object previously existed for this peer and torrent
 *	in the datab
 */
function eventStart(req, res, peer){
	if (peer != null){
		finalizePeer(userId, req.query.info_hash, peer);
	} else{
		peer = new Peer({ 
			peer_id: req.query.peer_id,
			torrent: req.query.info_hash
		});
	}

	peer.user = userId;
	peer.donwload = req.query.downloaded;
	peer.upload = req.query.uploaded;
	peer.ip = req.query.ip;
	peer.port = req.query.port;


	/* Update Seeder Leecher Count in Torrent */

	UTStatus
	.findOne({user: userId, torrent: req.query.info_hash})
	.select('has_completed')
	.exec(function(err, utstat){
		if(utstat != null){
			if (utstat.has_completed){
				Torrent.update(
					{ _id: req.query.info_hash },
					{ $inc: {seeder_count: 1}}
				);
				Peer.update(
					{ _id: peer._id },
					{ $set: {completed: true} }
				);
			}else{
				Torrent.update(
					{ _id: req.query.info_hash },
					{ $inc: {leecher_count: 1}}
				);
			}

		}
	});

	return peer;
}

/*
 *	Update peer object corresponding to announce request parameters
 *	Also handle events given with the request
 */
function updatePeer(req, res){
	Peer
	.findOne({torrent: req.query.info_hash, peer_id: req.query.peer_id})
	.exec(announceErrorWrapper(req, res, function(err, peer){
		ev = req.query.event;
		userId = req.query.userId;

		if (ev === 'started'){
			logger.info("announce [%d] event: started", req.requestId);
			peer = eventStart(req, res, peer);
		}

		if(peer == null)
			throw new AnnounceError('No start event recieved for this torrent');

		if (ev === 'stopped'){
			logger.info("announce [%d] event: stopped", req.requestId);
			finalizePeer(userId, req.query.info_hash, peer);
			peer.remove();
			res.send("");
			return;

		}

		if (ev === 'completed'){
			logger.info("announce [%d] event: completed", req.requestId);
			peer.completed = true;	

			UTStatus.update(
				{ user: userId, torrent: req.query.info_hash }, 
				{ $set: { has_completed: true } },
				{ upsert: true }
			);
			Torrent.update(
				{ _id: req.query.info_hash },
				{ $inc: {leecher_count: -1, seeder_count: 1} }
			);
		}

		peer.last_update = Date();
		peer.save();

	}));
}

/*
 *	Checks existence of info_hash in request query
 * 	Also converts queries info_hash from binary to pure string format
 */
function validateInfoHash(req, res){

	if (req.query.info_hash == null)
		return false;

	var hash_buf = unescape(req.query.info_hash);
	var info_hash = new Buffer(40, 'ascii');
	for (var i = 0; i < 20; i+=1){
		var s = hash_buf[i].charCodeAt().toString(16);
		if (s.length == 1){
			info_hash.write('0', i*2);		
			info_hash.write( s, i*2 + 1);
		}else{
			info_hash.write(hash_buf[i].charCodeAt().toString(16), i*2);
		}
	}
	req.query.info_hash = info_hash.toString();

	return true;
}

/*
 *	Validate announce queries parameters
 */
function validateQuery(req, res){

	if (req.params.userId == null)
		throw new AnnounceError("No user specified with torrent. Please download from site");
	else
		req.query.userId = req.params.userId;

	if (!validateInfoHash(req, res))
		throw new AnnounceError("No info hash given in request query");
	if (req.query.port == null)
		throw new AnnounceError("No port number given in request query");

	if (req.query.numwant == null)
		req.query.numwant = 50;
	else
		req.query.numwant = parseInt(req.query.numwant);
	
	/* Retrieve IP */
	req.query.ip = req.connection.remoteAddress;
}

exports.announce = function(req, res){	

	var announceHandler = announceErrorWrapper(req, res, function(){
		validateQuery(req, res);

		logger.info('announce [%d] recieved (ip: %s, user: %s, peer_id: %s, info_hash: %s)', 
			requestCount, req.query.ip, req.query.userId, req.query.peer_id, req.query.info_hash);

		req.requestId = requestCount++;

		/* Check user id exists */
		User
		.findOne({_id: req.params.userId})
		.exec(announceErrorWrapper(req, res, function(err, user){
			if (user == null)
				throw new AnnounceError("Invalid announce url. User id does not exist");

			if (req.query.event != 'stopped')
				sendPeerList(req, res);
			updatePeer(req, res);
		}));
	});

	announceHandler();	
}
