var Woobi = require('../woobi');
var path = require('path');
var list;
var debug = require('debug')('woobi:test');
var async = require('async');

Woobi.init({
	channelPort: 13000,
	host: 'studio',
	loadSaved: false,
	proxy: {
		port: 7002,
		nodeadmin: true,
		host: '0.0.0.0',
		keystone: true,
		logger: 'dev',
		'auth': false,
	},
	adapters:  [
		{
			name: 'mysql',
			adapter: 'mysql',
			config: {
				user: 'MYSQLUSER',
				pass: 'MYSQLPASS',
				host: 'MYSQLHOST',
				database: 'MYSQLDB'
			},
		}
	]
})
.then(r => Woobi.libs.mysql.recentEpisodes(50))
.then((recent) => {
	recent = recent.filter((r,i) => {
		return i>-1;
	}).map(r => {
		return { name: r.name, file: r.file, progress: true, metadata: r }
	});
	
	var channel = Woobi.addChannel('recentEpisodes', {
		loop: true,
		files: recent,
		noTransition: true,
		hls: {
			type: 'hls',
			name: 'recentEpisodes',
			passthrough: true, // uses the stream as is / no transcoding
			//source: "udp://10.10.10.87:13334?fifo_size=1000000&overrun_nonfatal=1",
		},
		assets: [],
		
	}).catch((err) => {
		if(err) debug('##ERROR##',err);
	});
	
	return channel;
	
})
.then(r => Woobi.libs.mysql.recentMovies())
.then((movie) => {
	movie = movie.filter((r,i) => {
		return true;//i>3;
	}).map(r => {
		return { name: r.name, file: r.file, progress: true, metadata: r, encode: false }
	});
	return Woobi.addChannel('recentMovies', {
		files: movie,
		loop: true,
		noTransition: true,
		hls: {
			type: 'hls',
			name: 'movieChannel',
			passthrough: true, // uses the stream as is / no transcoding
		}
	}).catch((err) => {
		if(err) debug('##ERROR##',err);
	});
})

.catch((err) => {
	if(err) debug('##ERROR##',err);
});


