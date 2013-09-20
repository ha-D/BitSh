var mongoose = require('mongoose')
  , Schema   = mongoose.Schema
  , ObjectId = Schema.ObjectId


var PeerSchema = new Schema({
	user: {type: ObjectId, ref: 'User'},
	torrent: {type: String},
	peer_id: String,
	last_update: Date,
	download: Number,
	upload: Number,
	completed: {type:Boolean, default: false},
	ip: String,
	port: Number
});


mongoose.model('Peer', PeerSchema)

module.exports = exports = mongoose.model('Peer')