var mongoose = require('mongoose')
  , Schema   = mongoose.Schema
  , ObjectId = Schema.ObjectId



var UTStatus = new Schema({
	user: 		{type: ObjectId, ref: 'User'},
	torrent: 	{type: ObjectId, ref: 'Torrent'},
	has_downloaded: {type: Boolean, default: false},  // Has downloaded torrent file from site
	has_completed:  {type: Boolean, default: false},
	download: Number,
	upload: Number
});


mongoose.model('UTStatus', UTStatus);
module.exports = exports = mongoose.model('User');