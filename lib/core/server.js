var keystone = require('keystone');
var Live = require('keystone-live');
var	_ = require('lodash');
var	debug = require('debug')('snowstreams:lib:core:keystone');
var async = require('async');

function key() {
	
	var exports = {};
	/**
	 * This file contains methods specific to dealing with Keystone's options.
	 * All exports are added to the Keystone.prototype
	 */
	
	exports.server = function(opts) {
		
		var ss = this;
		
		ss.keystone = keystone;
		
		var moduleRoot = ss.get('module root');
		if(!_.isObject(opts)) {
			opts = {};
		}
		ss.options(opts);
		keystone.init({
			'name': opts.name || 'snowstreams',
			'brand': opts.brand || 'inquisive',
			'less': 'public',
			'static': ['client','public'],
			'favicon': 'public/favicon.ico',
			'views': 'templates/views',
			'view engine': 'jade',
			'emails': 'templates/emails',
			'auto update': true,
			'auth': opts.auth === false ? false : true,
			'user model': 'User',
			'mongo': opts.mongo || process.env.MONGO_URI || ss.defaults.mongo || 'mongodb://localhost/snowstreams',
			'port': opts.port || ss.get('port') || 10000,
			'ssl': opts.ssl || false,
			'ssl port': opts.sslPort ,
			'ssl key': opts.sslKey,
			'ssl cert': opts.sslCert,
			'session': true,
			'session store':'mongo',
			'module root': moduleRoot,
			'session options': {
				key: opts.name + '.sid' || 'snowstreams.sid',
			},
			'cookie secret': process.env.COOKIE_SECRET || ss.defaults.cookieSecret || 'uy97w3qqhTI9jYHT54Tgf3E3huuiINBGHhyui8hyYDTd(765ft976fov',
			'trust proxy':true,
			'allow register':false,
		});
		
		keystone.import('models');
		
		keystone.set('locals', {
			_: _,
			env: keystone.get('env'),
			utils: keystone.utils,
			editable: keystone.content.editable
		});
		
		ss.routes.push(require(moduleRoot + '/routes'));
		keystone.set('routes', function(app) {
			_.each(ss.routes, function(route) {
				route(app);
			});
		});
		
		ss.servers.keystone.port = keystone.get('port');
		
		keystone.start({
			onMount: function() {
				// clear any streaming bits
				keystone.lists.Channel.model.update( {}, { streaming: false } , { multi: true }).exec();
				keystone.lists.Source.model.update( {}, { streaming: false } , { multi: true }).exec();
				var opts = {
					exclude: '',
					route: 'ipa',
					auth1: function requireUser(req, res, next) {
						next();
					},
					routes: {}
				}
				Live.init(keystone).apiRoutes(null, opts);
			},
			onStart: function() {
				var opts = {
					exclude: '',
					routes: {
						managePrograms : function(data, req, socket, callback) {
							//debug('manage programs', data)
							if(data.action === 'create') {
								var list = data.list;
								var doc = data.doc;
								var item = new list.model();
								var args = keystone.lists['ProgramArgument'];
								if(!list) return callback('list required');
								if(!_.isObject(doc)) return callback('doc required');
								if(!_.isObject(req)) req = {};
								
								var newdoc = {
									name: doc.name,
									program: doc.program,
									expose: doc.expose,
									type: doc.type,
									stderror: doc.stderror
								}
								
								item.getUpdateHandler(req).process(newdoc, function(err) {
									
									if (err) {
										if(err) ss.emit('log:error', { location: 'core:keystone:180', error: err});
										return callback(err);
									}
									var data2 = {
										arguments: [],
										iden: data.iden
									}
									data2[list.path] = item;
									
									async.forEachOf(doc.arguments, function(v,k,next) {
										var send = new args.model({
											program: item._id,
											argument: v.argument || '',
											anchor: v.anchor,
										});
										send.save(function(err) {
											if(err) ss.emit('log:error', { location: 'core:keystone:195', error: err});
											if(!err) {
												item.update({ $addToSet: { arguments: send._id } }, function(err, updated) {
														if(err) ss.emit('log:error', { location: 'core:keystone:201', error: err});
													});
												data2.arguments.push(send.toObject());
											}
											next();
										});
										
									}, function(err) {
										debug("done with series");
										callback(null, data2);
									});
								});	
							} else if(data.action === 'update') {
									
								var list = data.list;
								var doc = data.doc;
								var id = doc._id
								var item = new list.model();
								var args = keystone.lists['ProgramArgument'];
								if(!list) return callback('list required');
								if(!_.isObject(doc)) return callback('doc required');
								if(!_.isObject(req)) req = {};
								
								var updatedoc = {
									name: doc.name,
									program: doc.program,
									expose: doc.expose,
									type: doc.type,
									stderror: doc.stderror
								}
								
								list.model.findById(id).exec(function(err, item) {
									
									if (err) {
										if(err) ss.emit('log:error', { location: 'core:keystone:180', error: err});
										return callback(err);
									}
									if (!item) {
										ss.emit('log:error', { location: 'core:keystone:180',data: doc, error: 'Item not found'});
										return callback('not found');
									}
									
									item.getUpdateHandler(req).process(updatedoc, function(err) {
										
										if (err) return callback(err);
										
										var data2 = {};
										data2[list.path] = item;
										var count = doc.arguments.length - 1;
										async.forEachOf(doc.arguments, function(v,k,next) {
											if(v !== null) {
												if(v.anchor !== '') {
													
													debug('not empty... find and update', send, v._id);
													if(v._id) {
														var send ={
															program: item._id,
															argument: v.argument || '',
															anchor: v.anchor
														};
														args.model.findOneAndUpdate({ _id: v._id  }, {"$set":send}, function(err, doc){
															if(err) {
																ss.emit('log:error', { location: 'core:keystone:254', error: err});
																debug(err);
																return callback(err);
															}
															args.model.postSave(doc);
															args.model.preSavePost(doc);
															next()
														});
													} else {
														var send = new args.model({
															program: item._id,
															argument: v.argument || '',
															anchor: v.anchor,
														});
														send.save(function(err) {
															if(err) {
																ss.emit('log:error', { location: 'core:keystone:254', error: err});
																debug(err);
																return callback(err);
															}
															args.model.postSave(send);
															next();
														});
													}
												} else if(v._id) {
													debug(' empty... delete', v._id);
													args.model.findOneAndRemove({ _id: v._id }, function(err, doc){
														if(err) {
															ss.emit('log:error', { location: 'core:keystone:254', error: err});
															return callback(err);
														}
														args.model.postSave(v,true);
														next()
													});
												} else {
													debug(' empty... skip', v);
													next();
												}
											} else {
												next()
											}										
										}, function(err) {
											debug("done with update");
											callback(null, data2);
										});
										
									});
									
								});
							}
										
						}, //end managePrograms
						get1: function(data, req, socket, callback) {
	
							if(!_.isFunction(callback)) callback = function(err,data){ 
								debug('callback not specified for get',err,data);
							};
							if(!data.list ) return callback('list required');
							if(!data.slug) return callback('slug required');
							
							var q = data.list.model.find({slug:data.slug});
							var select = selectFields(data,data.list.apiOptions);
							if(select) q.select(select);
							if(_.isString(data.populate)) {
								q.populate(data.populate); 
							} else { 
								q.populate('createdBy updatedBy');
							}
							q.exec(function(err, item) {
								
								if (err) return callback(err);
								if (!item) return callback('not found');
								
								var send = {}
								send[data.list.path] = item;
								
								callback(null, send);
								
							});
						}
					}
				}
				
				Live
					.apiSockets(opts)
					.listEvents();
				ss.socketRoutes(Live);
				
				
			}
		});
	} 
	
	return exports;
	
}

module.exports = key;


function selectFields(user, main) {
	
	function inex(str, val) {
		var obj = {};
		_.each(str.split(','), function(v) {
			obj[v] = val;
		});
		return obj;
	}
	if(_.isString(user.exclude)) {
		var select = inex(user.exclude, 0);
	} else if(_.isString(user.include)) {
		var select = inex(user.include, 1);			
	} else if(_.isString(main.exclude)) {
		var select = inex(main.exclude, 0);
	} else if(_.isString(main.include)) {
		var select = inex(main.include, 1);			
	}
	
	return select;
}


