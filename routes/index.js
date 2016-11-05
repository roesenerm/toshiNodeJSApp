var express = require('express');
var router = express.Router();
var Colu = require('colu');
var Asset = require('../models/asset');
var User = require('../models/user');

/* GET home page. */
router.get('/', function(req, res, next) {
	Asset.find(function(err, docs) {
		res.render('ticketing/index', { assets: docs });
	});
});

/* Issue ticket. */
router.get('/issue', isLoggedIn, function(req, res, next) {
  	res.render('ticketing/issue', { success: req.session.success, errors: req.session.errors });
	req.session.errors = null
	req.session.success = null
});

router.post('/issue/issuance', isLoggedIn, function(req, res, next) {
	req.check('ticketImage', 'Missing Album Photo URL.').notEmpty();
	req.check('eventName', 'Missing Event Name.').notEmpty();
	req.check('artistName', 'Missing Artist Name.').notEmpty();
	req.check('ticketDescription', 'Missing Description.').notEmpty();
	req.check('ticketPrice', 'Missing Ticket Price.').notEmpty();
	req.check('issuedAmount', 'Missing Issued Amount.').notEmpty();

	var ticketImage = req.body.ticketImage;
	var eventName = req.body.eventName;
	var artistName = req.body.artistName;
	var ticketDescription = req.body.ticketDescription;
	var ticketPrice = req.body.ticketPrice;
	var issuedAmount = req.body.issuedAmount;

	var errors = req.validationErrors();
	
	if (errors) {
		req.session.errors = errors;
		req.session.success = false;
		res.redirect('/issue');
	} else {
		var settings = {
		    network: 'testnet',
		    privateSeed: req.user.privateSeed
		}
		var colu = new Colu(settings)
		var asset = {
		    amount: issuedAmount,
		    metadata: {        
		        'assetName': eventName,
		        'issuer': artistName,
		        'description': ticketDescription,
		        'userData': {
	                'meta' : [
	                    {'price': ticketPrice},
	                    {'image': ticketImage}
	                ]
	            }
		    }
		}
		colu.on('connect', function () {
		    colu.issueAsset(asset, function (err, body) {
		        if (err) {
		        	return console.error(err) 
		        	req.session.errors = err
		        	req.session.success = false;
		        	res.redirect('/issue');
		        } else {
		        	console.log("Body: ", body)
					var assets = new Asset({
						issueAddress: body.issueAddress,
			    		assetId: body.assetId,
					    amount: issuedAmount,
					    assetName: eventName,
					    issuer: artistName,
					    description: ticketDescription,
					    price: ticketPrice,
				        image: ticketImage
					});

					assets.save();

					req.session.success = true;
					res.redirect('/issue');
		        }        
		    });
		});
		colu.init()
	}
});

/* GET ticket */
router.get('/ticket/:id', function(req, res, next) {
	assetId = req.params.id;
	var settings = {
	    network: 'testnet'
	};
	var colu = new Colu(settings);
	var asset = {
	    assetId: assetId
	}
	colu.on('connect', function () {
	    colu.coloredCoins.getAssetData(asset,function (err, body) {
	        if (err) {
	        	return console.error(err)
	        	res.redirect('/')
	        } else {
		        if (body.assetData === undefined || body.assetData.length == 0) {
		        	res.redirect('/')
		        } else {
		        	console.log(body);
		        	assetId = body.assetId;
		        	issueAddress = body.assetData[0].metadata.issueAddress;
		        	issuer = body.assetData[0].metadata.metadataOfIssuence.data.issuer;
		        	assetName = body.assetData[0].metadata.metadataOfIssuence.data.assetName;
		        	description = body.assetData[0].metadata.metadataOfIssuence.data.description;
		        	price = body.assetData[0].metadata.metadataOfIssuence.data.userData.meta[0].price;
		        	image = body.assetData[0].metadata.metadataOfIssuence.data.userData.meta[1].image;
		        	res.render('ticketing/ticket', {assetName: assetName, assetId: assetId, issuer: issuer, issueAddress: issueAddress, description: description, price: price, image: image });
		        }
	        }
	    });
	});

	colu.init()

});

router.post('/ticket/search', function(req, res, next) {
	var assetId = req.body.assetId;
	if (assetId != '') {
		console.log('id:', assetId);
		res.redirect('/ticket/' + assetId);
	} else {
		res.redirect('/')
	}
});

/* Transfer ticket */
router.post('/transfer', function(req, res, next) {
	User.findOne({address: req.body.fromAddress}, function(err, doc) {
		if (err) {
			return console.error(err);
		} else {
			var privateSeed = doc.privateSeed;
			var assetId = req.body.assetId;
			var fromAddress = req.body.fromAddress;
			var toAddress = req.user.address;
			var phoneNumber = '+1234567890'
			var assetName = req.body.assetName;
			var issuer = req.body.issuer;
			var description = req.body.description;

			var settings = {
			    network: 'testnet',
			    privateSeed: privateSeed
			}
			var colu = new Colu(settings);

			var send = {
			    from: [fromAddress],
			    to: [{
			        address: toAddress,
			        assetId: assetId,
			        amount: 1
			    },{
			        phoneNumber: phoneNumber,
			        assetId: assetId,
			        amount: 1
			    }],
			    metadata: {        
			        'assetName': assetName,
			        'issuer': issuer,
			        'description': description
			    }
			};

			colu.on('connect', function () {
			    colu.sendAsset(send, function (err, body) {
			        if (err) {
			        	return console.error(err); 
			        } else {
			        	console.log("Body: ",body)
			        	res.render('ticketing/transfer');
			        }    
			    });
			});

			colu.init()
		}
	});
});


function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect('/');
}

module.exports = router;
