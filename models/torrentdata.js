var mongoose = require('mongoose')
  , Schema   = mongoose.Schema
  , ObjectId = Schema.ObjectId


var TorrentDataSchema = new Schema({
	_id: String,
	info: {
		piece_length: Number,
		pieces: Buffer,
		//private: {type: String, enum: {'none', 'private', 'public'}},
		private: Boolean,
		name: String,
		files: [{
			length: Number,
			md5sum: String,
			path: [String]
		}]
	},
	announce: String,
	announce_list: [],
	creation_date: Date,
	comment: String,
	created_by: String,
	encoding: String
});

mongoose.model('TorrentData', TorrentDataSchema);
module.exports = exports = mongoose.model('TorrentData');