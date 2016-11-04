var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var assetSchema = new Schema({
	issueAddress: {type: String, required: true},
	assetId: {type: String, required: true},
	amount: {type: Number, required: true},
	assetName: {type: String, required: true},
	issuer: {type: String, required: true},
	description: {type: String, required: true},
	price: {type: Number, required: true},
	image: {type: String, required: true}
});

module.exports = mongoose.model('Asset', assetSchema);