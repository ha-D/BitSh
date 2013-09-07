var mongoose = require('mongoose')
  , Schema   = mongoose.Schema
  , ObjectId = Schema.ObjectId

var TorrentSchema = new Schema({
	_id: String,
	name: String,
	category: {
		id: ObjectId,
		name: String
	},
	tags: 		   [ String ],
	upload_date:   {type: Date, default: Date.now},
	seeder_count:  Number,
	leecher_count: Number,
	completed_count: Number,
	like_count:    Number,
	dislike_count: Number,
	comments: 	   [{
		post_date: {type: Date, default: Date.now},
		author: {
			id: {type: ObjectId, ref: 'User'},
			name: String,
		},
		text: String
	}],
	torrent: {type: String, ref: 'TorrentData'}
});

mongoose.model('Torrent', TorrentSchema)

module.exports = exports = mongoose.model('Torrent')