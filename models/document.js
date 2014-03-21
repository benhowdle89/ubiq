var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DocumentSchema = new Schema({
	spotify: String,
	spotifyHTTP: String,
	rdio: String,
	created: {
		type: Date,
		default: Date.now
	}
});

module.exports = mongoose.model('Document', DocumentSchema);