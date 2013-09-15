var Torrent 	= require('../models/torrent')
  , TorrentData = require('../models/torrentdata')
  , UserCtrl    = require('./user')
  , checkUser   = UserCtrl.checkUser

var Bencode		= require('bencode')
  , fs 			= require('fs')
  , crypto      = require('crypto')
  , _ 		= require('underscore')

exports.upload = function(req, res){
	var form = req.data.form;

	if (!checkUser("torrent_upload", req, res))
		return;
	
	fs.readFile(req.files.torrent_file.path, function(err, file){
		var tData = Bencode.decode(file, 'ascii');
		// fs.writeFile("/home/hadi/Desktop/tmp.torrent", Bencode.encode(tData), function(err){
		// 	console.log(err);
		// });

		tData.announce_list = tData['announce-list'];
		tData.created_by = tData['created by'];
		tData.creation_date = tData['creation_date'];
		tData.info.piece_length = tData.info['piece length'];


		delete tData['announce-list'];
		delete tData['created by'];
		delete tData['creation date'];
		delete tData.info['piece length'];


		// TODO No need for this, just fix 'piece length' space problem
		/*
			Fix order of keys in info dict to get correct SHA1
			Not really doing a good thing here, but works for now
		*/
		var tmpData = Object()
		tmpData['files'] = tData.info.files;
		tmpData['name'] = tData.info.name;
		tmpData['pieces'] = tData.info.pieces;
		tmpData['piece length'] = tData.info.piece_length;



		var sha = crypto.createHash('sha1');
		sha.update(Bencode.encode(tmpData))
		infoHash = sha.digest('hex');

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
	.findOne({_id: form.torrent_id})  // TODO ADD PIECE LENGTH
	.select('-_id -info.files._id -__v')// info.pieces info.private info.name info.files announce announce_list creation_date created_by encoded')
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

		announce = "http://localhost:8080/tracker/announce/" + req.session.userId;

		tData.announce = announce;
		tData['announce list'] =  [ announce ];
		tData['created by'] = tData.created_by;
		tData['creation date'] = tData.creation_date;
		tData.info['piece length'] = tData.info.piece_length;

		tData.info = _.omit(tData.info, 'piece_length');
		tData = _.omit(tData, 'announce_list', 'created_by', 'creation_date');

		res.set('Content-disposition' , 'inline; filename="' + tData.info.name + '.torrent"');
		res.set('Content-type', 'application/x-bittorrent');
		res.send(Bencode.encode(tData));
	});
}