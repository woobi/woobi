var	_ = require('lodash');
var	debug = require('debug')('woobi:lib:core:socket');
var async = require("async");
var Listeners = require('./listeners');

function sockets() { 
	
	var exports = {};
	/**
	 * All exports are added to the snowstreams.prototype
	 */
	
	exports.socketRoutes = function() {
		
		var listen = this.socketListeners =  Listeners(this);
		var Live = this.io
		// create a new connection for open requests
		this.io.on("disconnect", function(s) {
			debug('snowstreams socket disconnected');
		});
		this.io.on("connection", function(socket) {
			
			socket.on('status',function() {
				socket.emit('status',listen.status());
			});
			
			
			
			// auth
			socket.on('auth', listen.auth);
			
		});
		
		debug('/lodge socket connection');
		// lodge connection can be auth based
		var lodge = this.lodge = this.io.of('/lodge');
		
		setInterval(() => {
			lodge.emit('status', listen.status());
		}, 10000);
		
		lodge.on("connection", function (socket) {
			
			socket.on('status',function(data) {
				socket.emit('status', listen.status());
				if(data.iden) {
					socket.emit(data.iden, listen.status());
				}
			});
			
			socket.on('presets', function() {
				listen.presets((err, p) => {
					debug('emit preset');
					socket.emit('presets', p);
				});
			});
			
			socket.on('channels', function (data) {
				var chans = listen.channels();
				socket.emit('channels', chans);
				if(data.iden) {
					socket.emit(data.iden, chans);
				}
			});
			
			socket.on('tvshows', function (data) {
				var chans = listen.tvshows()
				.then(tv => {
					socket.emit('tvshows', tv);
					if(data.iden) {
						socket.emit(data.iden, tv);
					}
				});
			});
			
			socket.on('tvshow', function (data) {
				var chans = listen.tvshow(data)
				.then(tv => {
					socket.emit('tvshow::'+ tv.showID, tv);
					if(data.iden) {
						socket.emit(data.iden, tv);
					}
				});
			});
			
			socket.on('recentshows', function (data) {
				listen.recentshows(data)
				.then(tv => {
					socket.emit('recentshows', tv);
					if(data.iden) {
						socket.emit(data.iden, tv);
					}
				});
			});
			
			socket.on('movies', function (data) {
				listen.movies()
				.then(movies => {
					socket.emit('movies', movies);
					if(data.iden) {
						socket.emit(data.iden, movies);
					}
				});
			});
			
			socket.on('recentmovies', function (data) {
				listen.recentmovies()
				.then(recentmovies => {
					socket.emit('recentmovies', recentmovies);
					if(data.iden) {
						socket.emit(data.iden, recentmovies);
					}
				});
			});
			
			socket.on('movie', function (data) {
				var chans = listen.movie(data)
				.then(movie => {
					socket.emit('movie::'+ movie.idMovie, movie);
					if(data.iden) {
						socket.emit(data.iden, movie);
					}
				});
			});
			
			
			/* Live TV */
			socket.on('getTVChannels', function ( data ) {
				listen.getTVChannels( data )
				.then( tv => {
					socket.emit( 'getTVChannels', tv );
					if ( data.iden ) {
						socket.emit( data.iden, tv );
					}
				});
			});
			
			socket.on('getGuideData', function ( data ) {
				listen.getGuideData( data.id, data.start, data.end )
				.then( epg => {
					socket.emit( 'getGuideData', epg );
					if ( data.iden ) {
						socket.emit( data.iden, epg );
					}
				});
			});
			
			socket.on('getGuideProgram', function ( data ) {
				listen.getGuideProgram( data.search, data.key )
				.then( epg => {
					socket.emit( 'getGuideProgram', epg );
					if ( data.iden ) {
						socket.emit( data.iden, epg );
					}
				});
			});
			
			socket.on('getChannelGroups', function ( data ) {
				listen.getChannelGroups( )
				.then( groups => {
					socket.emit( 'getChannelGroups', groups );
					if ( data.iden ) {
						socket.emit( data.iden, groups );
					}
				});
			});
			
			socket.on('getRecordings', function ( data ) {
				listen.getRecordings( )
				.then( recordings => {
					socket.emit( 'getRecordings', recordings );
					if ( data.iden ) {
						socket.emit( data.iden, recordings );
					}
				});
			});
			
			socket.on('getSeriesTimers', function ( data ) {
				listen.getSeriesTimers( )
				.then( series => {
					socket.emit( 'getSeriesTimers', series );
					if ( data.iden ) {
						socket.emit( data.iden, series );
					}
				});
			});
			
			socket.on('getTimers', function ( data ) {
				listen.getTimers( )
				.then( timers => {
					socket.emit( 'getTimers', timers );
					if ( data.iden ) {
						socket.emit( data.iden, timers );
					}
				});
			});
			
			socket.on('setTimer', function ( data ) {
				listen.setTimer( data.timer )
				.then( timers => {
					socket.emit( 'setTimer', timers );
					if ( data.iden ) {
						socket.emit( data.iden, timers );
					}
				});
			});
			
			socket.on('deleteTimer', function ( data ) {
				listen.deleteTimer( data.timer )
				.then( timers => {
					socket.emit( 'deleteTimer', timers );
					if ( data.iden ) {
						socket.emit( data.iden, timers );
					}
				});
			});
			
			socket.on('deleteSeriesTimer', function ( data ) {
				listen.deleteSeriesTimer( data.timer )
				.then( timers => {
					socket.emit( 'deleteSeriesTimer', timers );
					if ( data.iden ) {
						socket.emit( data.iden, timers );
					}
				});
			});
			
			// console help
			socket.on('help',function(data) {
				debug('help emitted', 'send to', data.iden, data);
				if(data.iden) socket.emit(data.iden, {message: consoleHelp()});
				socket.emit('help',{message: consoleHelp()});
			});
						
			// stop
			//socket.on('stop', listen.stop);
			
			// runProgram
			socket.on('runProgram', listen.runProgram);
			
			// manager
			socket.on('manager', listen.manager);
		
		});
		
	}
	
	return exports;
}

module.exports = sockets();


function consoleHelp() {
	return '<pre ><p ><span >helping fingers... help </span><i >h</i></p><h4 ><u >Manage Documents</u></h4><p ><b >List::action::key:value::anotherkey:value::doc::putdoc:last::andmimic:therest</b></p><p ><b>List Choices:</b> <span >Channel </span><i >C</i><span > | File </span><i >F</i><span > | Program </span><i >P</i><span > | ProgramArgument </span><i >A</i><span > | Source </span><i >I</i><span > | Stream </span><i >O</i><span > | User </span><i >U</i><span > </span></p><h5 >Example</h5><p ><b >Program::get::slug:streamable::populate:arguments updatedBy::exclude:__v</b></p><p ><b >I::update::id:9878y08790tg89::doc::name:webbier</b></p><p >** first letter must be uppercase **</p><p ><br ></p><p ></p><h4 ><u >Manage Assets</u></h4><p ><b >manager::type::action:value::search::slug:dvgrab</b></p><p ><b>Type Choices:</b> <span >channel </span><i >c</i><span > | file </span><i >f</i><span > | program </span><i >p</i><span > | source </span><i >i</i><span > | stream </span><i >o</i></p><h5 >Example</h5><p ><b >manager::channel::start:true::search::slug:tv</b></p><p ><b >manager::p::action:run::argument:0::channel:724::search::slug:change-channel</b></p><p >** first letter must be lowercase **</p><p ><br ></p><p ></p><h4 ><u >Chat</u></h4><p ><b >where::event::data</b></p><h5 >Example</h5><p ><b >wan::message::message:hello</b></p><p ><b >room::message::message:hi</b></p></pre>';
}
