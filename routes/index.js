/*
 * routes/index.js
 *
 * Routes contains the functions (callbacks) associated with request urls.
 */

var request = require('request'); // library to make requests to remote urls

var Rdio = require("node-rdio");

var RDIO_KEY = 'uw67ypksf4u87dhpufd5uwcq';

var rdio = new Rdio([RDIO_KEY, "YHQKQEFNBf"]);

var spotify = require('spotify');

var documentModel = require("../models/document.js"); //db model

var flash = require('connect-flash');

exports.index = function(req, res, next) {
	res.render('index.html', {
		messages: req.flash('info')
	});
};

exports.new = function(req, res, next) {
	var url = req.body.url;
	if (!url) {
		return res.redirect('/');
	}
	var doc = new documentModel();
	if ( !! url.match(/spotify/i)) {
		var type = url.split(':')[1];
		grabber.spotify.parse(url, type, function(err, data) {
			if (err) {
				req.flash('info', 'Not found!');
				return res.redirect('/');
			}
			doc.spotify = url;
			doc.spotifyHTTP = data.href;
			doc.type = type;
			var query;
			if (type == 'track') {
				query = [data.details.name, data.details.artist].join(' - ');
				doc.friendly_name = [data.details.name, data.details.artist].join(' by ');
			} else if (type == 'artist') {
				query = data.details.name;
				doc.friendly_name = data.details.name;
			} else if (type == 'album') {
				query = [data.details.artist, data.details.name].join(' - ');
				doc.friendly_name = [data.details.name, data.details.artist].join(' by ');
			}
			grabber.rdio.lookup(type, query, function(err, data) {
				if (err) {
					doc.rdio = null;
				} else {
					doc.rdio = data.href;
				}
				saveDoc(doc, res, next);
			});
		});
	} else if ( !! url.match(/rd\.io/i)) {
		grabber.rdio.parse(url, function(err, data) {
			if (err) {
				doc.rdio = null;
			} else {
				doc.rdio = url;
				doc.type = data.type;
				var query;
				if (data.type == 'track') {
					query = "track:" + data.details.name + "+AND+artist:" + data.details.artist;
					doc.friendly_name = [data.details.name, data.details.artist].join(' by ');
				} else if (data.type == 'album') {
					query = "album:" + data.details.name + "+AND+artist:" + data.details.artist;
					doc.friendly_name = [data.details.name, data.details.artist].join(' by ');
				} else if (data.type == 'artist') {
					query = "artist:" + data.details.artist;
					doc.friendly_name = data.details.artist;
				}
				grabber.spotify.lookup(data.type, query, function(err, data) {
					if (err) {
						doc.spotify = null;
						doc.spotifyHTTP = null;
					} else {
						doc.spotify = data.href;
						doc.spotifyHTTP = data.http;
					}
					saveDoc(doc, res, next);
				});
			}
		});
	} else {
		return res.redirect('/');
	}
};

var saveDoc = function(doc, res, next) {
	doc.save(function(err, d) {
		if (err) {
			return next(err);
		}
		res.redirect('/q/' + d._id);
	});
};

var grabber = {
	spotify: {
		parse: function(url, type, callback) {
			request('http://ws.spotify.com/lookup/1/.json?uri=' + url, function(error, response, body) {
				if (!error && response.statusCode == 200) {
					var data = JSON.parse(body);
					if (!data[type]) {
						return callback(404);
					} else {
						var href = 'http://open.spotify.com/' + type + '/' + data[type].href.split(':')[2];
						var details = {};
						if (type == 'track') {
							details.artist = data[type].artists[0].name;
							details.name = data[type].name;
						} else if (type == 'artist') {
							details.name = data[type].name;
						} else if (type == 'album') {
							details.artist = data[type].artist;
							details.name = data[type].name;
						}
						callback(null, {
							type: type,
							details: details,
							href: href
						});
					}
				} else {
					callback(404);
				}
			});
		},
		lookup: function(type, string, callback) {
			request('http://ws.spotify.com/search/1/' + type + '.json?q=' + string, function(error, response, body) {
				if (!error && response.statusCode == 200) {
					var data = JSON.parse(body);
					if (!data.tracks && !data.artists && !data.albums) {
						callback(404);
					} else {
						var details = {};
						var href;
						if (type == 'track') {
							if (!data.tracks[0]) {
								return callback(404);
							}
							details.artist = data.tracks[0].artist;
							details.name = data.tracks[0].name;
							href = data.tracks[0].href;
							http = 'http://open.spotify.com/' + type + '/' + data.tracks[0].href.split(':')[2];
						} else if (type == 'artist') {
							if (!data.artists[0]) {
								return callback(404);
							}
							details.artist = data.artists[0].name;
							href = data.artists[0].href;
							http = 'http://open.spotify.com/' + type + '/' + data.artists[0].href.split(':')[2];
						} else if (type == 'album') {
							if (!data.albums[0]) {
								return callback(404);
							}
							details.name = data.albums[0].name;
							href = data.albums[0].href;
							http = 'http://open.spotify.com/' + type + '/' + data.albums[0].href.split(':')[2];
						}

						callback(null, {
							type: type,
							details: details,
							href: href,
							http: http
						});
					}
				} else {
					callback(404);
				}
			});
		}
	},
	rdio: {
		parse: function(url, callback) {
			rdio.call('getObjectFromShortCode', {
				keys: RDIO_KEY,
				short_code: url.split('http://rd.io/x/')[1].slice(0, -1)
			}, function(err, data) {
				if (err) {
					return callback(404);
				}
				var details = {};
				var type;
				switch (data.result.type) {
					case 't':
						type = 'track';
						break;
					case 'a':
						type = 'album';
						break;
					case 'r':
						type = 'artist';
						break;
				}

				if (type == 'track') {
					details.artist = data.result.artist;
					details.name = data.result.name;
				} else if (type == 'album') {
					details.artist = data.result.artist;
					details.name = data.result.name;
				} else if (type == 'artist') {
					details.artist = data.result.name;
				}

				callback(null, {
					details: details,
					type: type
				});
			});
		},
		lookup: function(type, string, callback) {
			rdio.call('search', {
				keys: RDIO_KEY,
				query: string,
				types: type
			}, function(err, data) {
				if (!data) {
					return callback(404);
				}
				var item = data.result.results[0];
				if(!item){
					return callback(404);
				}
				var href = item.shortUrl;
				var details = {};
				if (type == 'track') {
					details.artist = item.artist;
					details.name = item.name;
				} else if (type == 'album') {
					details.artist = item.artist;
					details.name = item.name;
				} else if (type == 'artist') {
					details.name = item.name;
				}
				callback(null, {
					type: type,
					details: details,
					href: href
				});
			});
		}
	}
};

exports.get = function(req, res, next) {
	var id = req.params.id;
	if (!id) {
		return res.redirect('/');
	}
	documentModel.findOne({
		_id: id
	}, function(err, document) {
		if (!document) {
			return res.redirect('/');
		}
		res.render('show.html', {
			document: document
		});
	});
};