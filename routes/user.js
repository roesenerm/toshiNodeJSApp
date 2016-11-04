var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var passport = require('passport');
var Colu = require('colu');

var csrfProtection = csrf();
router.use(csrfProtection);

router.get('/profile', isLoggedIn, function(req, res, next) {
	var privateSeed = req.user.privateSeed;
	var address = req.user.address;

	var settings = {
	    network: 'testnet',
	    privateSeed: privateSeed
	};

	var colu = new Colu(settings);
	
	colu.on('connect', function () {
	  colu.coloredCoins.getAddressInfo(address, function (err, body) {

	        if (err) {
	        	return console.error(err)
	        } else {
	        	var assets = {}
	        	for (tx in body.utxos) {
	        		try {
	        			var assetId = body.utxos[tx].assets[0].assetId;
	        			var amount = body.utxos[tx].assets[0].amount;

	        			if (assets[assetId] == undefined) {
		        			assets[assetId] = amount;
		        		} else {
		        			var newAmount = amount + assets[assetId];
		        			assets[assetId] = newAmount;
		        		}
	        		}
	        		catch (e) {
	        			console.log(e);
	        			continue;
	        		}
	        	}
	        	console.log(assets);
	        	res.render('user/profile', {address: address, assets: assets});
	        }
	    });
	});

	colu.init();
});

router.get('/logout', isLoggedIn, function(req, res, next) {
	req.logout();
	res.redirect('/');
});

router.use('/', notLoggedIn, function(req, res, next) {
	next();
});

router.get('/signup', function(req, res, next) {
	var messages = req.flash('error');
	res.render('user/signup', {csrfToken: req.csrfToken(), messages: messages, hasErrors: messages.length > 0});
});

router.post('/signup', passport.authenticate('local.signup', {
	successRedirect: '/user/profile',
	failureRedirect: '/user/signup',
	failureFlash: true
}));

router.get('/signin', function(req, res, next) {
	var messages = req.flash('error');
	res.render('user/signin', {csrfToken: req.csrfToken(), messages: messages, hasErrors: messages.length > 0});
});

router.post('/signin', passport.authenticate('local.signin', {
	successRedirect: '/user/profile',
	failureRedirect: '/user/signin',
	failureFlash: true
}));

module.exports = router;

function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect('/');
}

function notLoggedIn(req, res, next) {
	if (!req.isAuthenticated()) {
		return next();
	}
	res.redirect('/');
}