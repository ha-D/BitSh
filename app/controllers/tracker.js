var Torrent  = require('../models/torrent')
  , Peer     = require('../models/peer')
  , UTStatus = require('../models/utstatus')
  , Bencode  = require('bencode')
  , _        = require('underscore')
  //, Buffer   = require('buffer')

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

// TODO check not to send self
function sendPeerList(req, res){
	var numwant = req.query.numwant;
	if (numwant == null)
		numwant = 50;



	console.log(req.query);
	
	Torrent
	.findOne({_id: req.query.info_hash})
	.select('seeder_count leecher_count completed_count')
	.exec(function(err, torrent){

		// Torrent not found
		if (torrent == null){
			res.send(Bencode.encode({
				"failure reason": "Torrent does not exist in the database"
			}));
			return;
		}

		Peer.find({torrent: req.query.info_hash}, 'peer_id ip port', function(err, peers){

			// Shuffle peer List, and get first numwant from it
			_.shuffle(peers);
			peers = _.first(peers, numwant);

			if (req.query.compact == 1){
				
				// Make compact peer list

				var byteCount = 0;
				var buf = _.reduce(peers, function(buf, peer){
					ip = _.map(peer.ip.split('.'), parseInt)
					_.each(ip, function(x){
						buf.write(x, byteCount++);
					});
					buf.write(peer.port >> 8, byteCount++);
					buf.write(peer.port - ((peer.port >> 8) << 8), byteCount++);
				}, new Buffer(peers.length * 6));

				peers = buf.toString();

			} else {
				peers = _.map(peers, function(peer){
					return {
						"peer id": peer.peer_id,
						"ip": peer.ip,
						"port": peer.port
					};
				});
			}

			res.send(Bencode.encode({
				interval: 300,
				complete: torrent.seeder_count,
				incomplete: torrent.leecher_count,
				peers: peers
			}));
		});
	});
}

function updatePeer(req, res){

	ev = req.query.event;
	userId = req.params.userId;

	Peer
	.findOne({torrent: req.query.info_hash, peer_id: req.query.peer_id})
	.exec(function(err, peer){
		if (ev === 'started'){
		
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
			peer.ip = req.connection.remoteAddress;
			peer.port = req.query.port;

			// Update Seeder Leecher Count in Torrent
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
		} 

		if(peer == null){
			res.send(Bencode.encode({
				"failure reason": "No start event recieved for this torrent"
			}));
			return;
		}

		if (ev === 'stopped'){
			finalizePeer(userId, req.query.info_hash, peer);
			peer.remove();
			res.send("");
			return;

		} else if (ev === 'completed'){
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

	});
}

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

function AnnounceException(message){
	this.message = message;
}

function validateQuery(req, res){
	try{
		if (req.params.userId == null)
			throw new AnnounceException("No user specified with torrent. Please download from site");
		if (!validateInfoHash(req, res))
			throw new AnnounceException("No info hash given in request query");
		if (req.query.port == null)
			throw new AnnounceException("No port number given in request query");
		return true;
	}catch(err){
		if (err instanceof AnnounceException)
			throw err;
		res.send(Bencode.encode({
			"failure reason": err.message
		}));
		return false;
	}
}

exports.announce = function(req, res){
	//console.log(req.query.info_hash);
	
	console.log(req.query.info_hash);

	if (!validateQuery(req, res))
		return;
	
	sendPeerList(req, res);
	updatePeer(req, res);
}