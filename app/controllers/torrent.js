var Torrent 	= require('../models/torrent')
  , TorrentData = require('../models/torrentdata')
  , UserCtrl    = require('./user')
  , checkUser   = UserCtrl.checkUser

var Bencode		= require('bencode')
  , fs 			= require('fs')
  , crypto      = require('crypto')
  , _ 		    = require('underscore')

exports.upload = function(req, res){
	var form = req.data.form;

	if (!checkUser('torrent_upload', req, res))
		return;
	
	fs.readFile(req.files.torrent_file.path, function(err, file){
		var tData = Bencode.decode(file);

		var sha = crypto.createHash('sha1');
		sha.update(Bencode.encode(tData.info));
		infoHash = sha.digest('hex');

		tData.announce_list = tData['announce-list'];
		tData.created_by = tData['created by'];
		tData.creation_date = tData['creation date'];
		tData.info.piece_length = tData.info['piece length'];

		delete tData['announce-list'];
		delete tData['created by'];
		delete tData['creation date'];
		delete tData.info['piece length'];

		tData._id = infoHash;
		tData = TorrentData(tData);

		var torrent = {
			 _id: infoHash,
			torrent: infoHash,

			name: form.name,
			//category: req.data.form.category    // TODO CHANGE
			tags: form.tags,
			upload_date: Date(),
			seeder_count: 0,
			leecher_count: 0,
			completed_count: 0,
			like_count: 0,
			dislike_count: 0
		};

		torrent = Torrent(torrent);

		tData.markModified('info.name');
		tData.markModified('info.pieces');

		tData.save();
		torrent.save();

		res.json({
			action: 'torrent_upload',
			state: 'successful'
		})
	});
}

exports.download = function(req, res){
	if (!checkUser("torrent_download", req, res))
		return;

	var form = req.data.form;

	TorrentData
	.findOne({_id: form.torrent_id})
	.select('-_id -info.files._id -__v') // info.pieces info.private info.name info.files announce announce_list creation_date created_by encoded')
	.lean()
	.exec(function(err, tData){
		if (tData == null){
			res.json({
				action: "torrent_download",
				error: {
					message: "Torrent does not exist",
					name: "TorrentError"
				}
			})
			return;
		}

		announce = "http://213.233.181.196:8080/tracker/announce/" + req.session.userId;

		tData.info.pieces = tData.info.pieces.buffer;

		tData.announce = announce;
		tData['announce list'] =  [ announce ];
		if (tData.created_by)
			tData['created by'] = tData.created_by;
		if (tData.creation_date)
			tData['creation date'] = tData.creation_date;
		tData.info['piece length'] = tData.info.piece_length;

		tData.info = _.omit(tData.info, 'piece_length');
		tData = _.omit(tData, 'announce_list', 'created_by', 'creation_date');

		res.set('Content-disposition' , 'inline; filename="' + tData.info.name + '.torrent"');
		res.set('Content-type', 'application/x-bittorrent');
		res.send(Bencode.encode(tData));
	});
}