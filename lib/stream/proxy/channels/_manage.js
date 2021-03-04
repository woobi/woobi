
var debug = require('debug')('woobi:_channelManageApi');
var _ = require('lodash');
var fs = require('fs'); 
var path = require('path');
var Listeners = require('../../../core/listeners');

/**
 * proxy channel masnage routes. 
 *
 * ####Example:     
 *
 *    Broadcast.Stream.proxy.channels._manage(app)
 *
 *  @module   
 * @param {Object} app
 * @api private
 */
module.exports = function _channelManageApi(Broadcast) {
    var methods = {}
    
    methods.source = function source(req, res, channel) {
        if(channel && req._params[2] && channel.sources[req._params[2]]) {
            succeed();
        } else {
            fail();
        }
        function succeed() {
            res.setHeader('Content-Type', 'application/json');
            res.json(channel.sources[req._params[2]]);
        }
        function fail() {
            res.setHeader('Content-Type', 'application/json');
            res.json({ command: 'source', success: false, error: 'Channel not found'});
        }
    }

    methods.create = function create(req, res) {
        debug('new channel route');
                var pro = decodeURIComponent(req.query.config);
                debug('channel config', pro);
                pro = parse(pro);
                let link = false;
                if(pro) {
                    if (req.query.start === 'yes') {
                        // grab clone of original config
                        debug('wobble config', pro.name);
                        Broadcast.addChannel(pro.name, pro)
                        .then(program => {
                            link = Broadcast.channels[pro.name] ? Broadcast.channels[pro.name].hls.link : false;
                            keep(pro.name + ' Wobble Started.');
                            Broadcast.notify('channels', Broadcast.socketListeners.channels());
                        })
                        .catch(e => {
                            debug('Error adding channel', e);
                            fail(e);
                        });
                    } else {
                        keep('');
                    }
                } else {
                    fail('Wobble config required');
                }
                
                function keep(message= '') {
                    if (req.query.keep === 'yes') {
                        if(Broadcast.libs._mongo) {
                            debug('Keeping Config... autostart?', req.query.autostart);
                            var m = new Broadcast.libs._mongo.ChannelConfig.model({
                                name: pro.name,
                                config: req.query.config,
                                autostart: req.query.autostart === 'yes' ? true : false
                            });
                            m.save(() => {
                                debug('Config saved');
                                success(message + ', Config saved');
                            })
                        }
                    } else {
                        success(message);
                    }
                }
                
                function success(message = '') {
                    res.setHeader('Content-Type', 'application/json');
                    res.json({ success: true, message, link });
                    Broadcast.socketListeners.presets((err, p) => {
                        debug('emit preset');
                        Broadcast.notify('presets', p);
                    });
                }
                function fail(err) {
                    res.setHeader('Content-Type', 'application/json');
                    res.json({ success: false, error: err});
                }
    }

    methods.remove = function remove(req, res) {
        debug('remove channel route');
        if(req.params.id) {
            // grab clone of original config
            debug('channel config removal', req.params.id);
            if(Broadcast.libs._mongo) {
                Broadcast.libs._mongo.ChannelConfig.model.find({ _id: req.params.id }).remove().exec((err) => {
                    debug('Config removed', err);
                    if (err) {
                        res.setHeader('Content-Type', 'application/json');
                        res.json({ success: false, error: 'Channel config not removed'});
                    } else {
                        res.setHeader('Content-Type', 'application/json');
                        res.json({ success: true, message: ' Channel Removed.' });
                        Broadcast.socketListeners.presets((err, p) => {
                            debug('emit preset');
                            Broadcast.notify('presets', p);
                        });
                    }
                })
            } else {
                res.setHeader('Content-Type', 'application/json');
                res.json({ success: false, error: 'Missing mongo connection'});
            }
                
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.json({ success: false, error: 'Channel config required'});
        }
    }

    methods.update = function update(req, res) {
        debug('update channel route');
        var pro = req.query.config;
        //debug('channel config', pro);
        try {
            pro = JSON.parse(pro);
        } catch(e) {
            debug(e);
            pro = false;
        }
        if(pro && req.params.id) {
            // grab clone of original config
            debug('channel config update', pro.name);
            if(Broadcast.libs._mongo) {
                debug('Updating Config... autostart?', req.query.autostart);
                Broadcast.libs._mongo.ChannelConfig.model.update({ _id: req.params.id },{
                    name: pro.name,
                    config: req.query.config,
                    autostart: req.query.autostart === 'yes' ? true : false
                }).exec((err) => {
                    debug('Config saved', err);
                    if (err) {
                        res.setHeader('Content-Type', 'application/json');
                        res.json({ success: false, error: 'Channel config not updated'});
                    } else {
                        res.setHeader('Content-Type', 'application/json');
                        res.json({ success: true, name: pro.name, message: pro.name + ' Channel Updated.' });
                        Broadcast.socketListeners.presets((err, p) => {
                            debug('emit preset');
                            Broadcast.notify('presets', p);
                        });
                    }
                })
            } else {
                res.setHeader('Content-Type', 'application/json');
                res.json({ success: false, error: 'Missing mongo connection'});
            }
                
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.json({ success: false, error: 'Channel config required'});
        }
    }

    methods.kill = function kill(req, res) {
        debug('kill ' + Broadcast.wobble + ' route');
        var pro = Broadcast.channels[req.params.name];
        if (pro) {
            // grab clone of original config
            var save = pro.CONFIG();
            debug('' + Broadcast.wobble + ' config');
            if(_.isFunction(pro.KILL)) {
                pro.KILL(remove);
            } else {
                fail();
            }
        } else {
            fail();
        }
        function remove() {
            delete Broadcast.channels[this.channel];
            setTimeout(() => {
                Broadcast.notify('channels', Broadcast.socketListeners.channels());
            }, 250);
            res.setHeader('Content-Type', 'application/json');
            res.json({ success: true, message: ' Channel removed.' });
        }
        function fail() {
            res.setHeader('Content-Type', 'application/json');
            res.json({ success: false, error: 'Channel not found or failed to stop.'});
        }
    }

    /**
     * Start a channel
     * @param {*} req 
     * @param {*} res 
     */
    methods.start = function links(req, res, channel) {
        debug('start ' + Broadcast.wobble + ' route');
        var pro = Broadcast.channels[req.params.name];
        if (pro) {
            // grab clone of original config
            start( pro.CONFIG() );
        } else if (req.query.config) {
            start( parse(req.query.config) );
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.json({ success: false, error: 'Channel not found'});
        }
        
        function start( config ) {
            debug('' + Broadcast.wobble + ' config', config.name,  config);
            Broadcast.addChannel(config.name, config)
            .then(program => {
                res.setHeader('Content-Type', 'application/json');
                res.json({ success: true, name: program.channel, message: program.channel + ' Channel Started.' });
            })
            .catch(e => {
                debug('Error starting ' + Broadcast.wobble + '', e);
                res.setHeader('Content-Type', 'application/json');
                res.json({ success: false, error: e});
            });
        }
    }

    methods.restart = function restart(req, res) {
        debug('restart ' + Broadcast.wobble + ' route');
        var pro = Broadcast.channels[req.params.channel];
        if(pro) {
            debug('Try to restart ' + Broadcast.wobble + ' ' + pro.channel);
            var save = pro.CONFIG();
            if(_.isFunction(pro.RESTART)) {
                let config = {}
                if(req.query.passthrough === 'yes') {
                    config.hls = save.hls;
                    config.hls.passthrough = true;
                    debug('passthrough channel ' + pro.channel);
                }
                if(req.query.passthrough === 'no') {
                    config.hls = save.hls;
                    config.hls.passthrough = false;
                    debug('transcode channel ' + pro.channel);
                }
                if(req.query.keepQueue === 'yes') {
                    config.files = pro.sources;
                    debug('keep sources channel ' + pro.channel);
                }
                pro.RESTART(config)
                .then(newChannel => {
                    debug('Channel Rebooted', newChannel.channel);
                    res.setHeader('Content-Type', 'application/json');
                    res.json({ success: true, channel: newChannel.channel,  message:  'Channel Rebooted.' });
                })
                .catch((err) => {
                    debug(' err restarting channel', err);
                    res.setHeader('Content-Type', 'application/json');
                    res.json({ success: false, error: err});
                });
                    
            } else {
                restart();
            }
            
            function restart() {
                debug('channel config', save);
                debug('restart in .5 sec');
                Broadcast.addChannel(req.params.channel, save)
                .then(newChannel => {
                    res.setHeader('Content-Type', 'application/json');
                    res.json({ success: true, name: newChannel.channel, message: newChannel.name + ' Channel Restarted.' });
                })
                .catch((err) => {
                    debug(' err restarting channel', err);
                    res.setHeader('Content-Type', 'application/json');
                    res.json({ success: false, error: 'Channel not found'});
                });
            }
            
        } else {
            debug(' err no channel', req.params.channel);
            res.setHeader('Content-Type', 'application/json');
            res.json({ success: false, error: 'Channel not found'});
        }
    }

    /**
     * Jump to the requested item in the queue
     * @param {*} req 
     * @param {*} res 
     */
    methods.jumpTo = function jumpTo(req, res, channel) {
        var to = req._params[2]
        if(channel) {
            debug('jump to source ' + to);
            channel.jumpTo(Number(to), () => {
                succeed();
            });
            
        } else {
            fail();
        }
        function succeed() {
            res.setHeader('Content-Type', 'application/json');
            var source = channel.sources[1] ? channel.sources[1] : 'unknown';
            res.json({ success: true, channel: channel.id, source: source, message: source.name + ' will stream next' });
        }
        function fail() {
            res.setHeader('Content-Type', 'application/json');
            res.json({ success: false, error: 'Channel not found'});
        }
    }

    methods.next = function next(req, res, channel) {
        debug('play next source route');
        if(channel) {
            debug('channel play next');
            channel.nextSource();
            succeed();
        } else {
            fail();
        }
        function succeed() {
            res.setHeader('Content-Type', 'application/json');
            var source = channel.sources[1] ? channel.sources[1] : 'unknown';
            res.json({ command: 'next', success: true, channel: channel.id, source: source, message: source.name + ' will stream next' });
        }
        function fail() {
            res.setHeader('Content-Type', 'application/json');
            res.json({ command: 'next', success: false, error: 'Channel not found'});
        }
    }

    methods.prev = function prev(req, res, channel) {
        debug('unshift route');
        var pro = channel;
        var type = req._params[2];
        var source = req._params[3];
        if(pro) {
            
            if (type === 'file') {
                debug('Force a new file to top of ' + pro.channel);
                if(_.isFunction(pro.force)) { 
                    pro.force(parse(source), true);
                    succeed();
                } else {
                    fail();
                }
            } else if (type === 'index') {
                debug('Force a new source to top');
                if(_.isFunction(pro.force)) { 
                    pro.force(pro.sources[source], true);
                    succeed();
                } else {
                    fail();
                }
            } else if (type === 'history') {
                debug('Play an item from history');
                if(_.isFunction(pro.force)) { 
                    pro.force(pro.history[source], true);
                    succeed();
                } else {
                    fail();
                }
            } else  {
                debug('Start the prev episode');
                pro.prevSource(pro.sources[source]);
                succeed();
            }
        } else {
            fail();
        }
        function succeed() {
            res.setHeader('Content-Type', 'application/json');
            var source = channel.sources[channel.sources.length-1] ? channel.sources[channel.sources.length-1] : 'unknown';
            res.json({ command: 'prev', success: true, channel: channel.id, params: req._params.join('/'),  source: source, message: source.name + ' will stream next' });
        }
        function fail() {
            res.setHeader('Content-Type', 'application/json');
            res.json({ command: 'prev', success: false, error: 'Channel not found'});
        }
    }

    methods.program = function program(req, res) {
        debug('program channel route');
        var pro = Broadcast.programs[req.params.name];
        if(pro) {
            var save = pro.redo(req.params.cmd, req.params.cmd2);
            debug('save', save);
            if(!_.isFunction(pro.end)) {
                pro.end = (pass, cb) => {
                    cb();
                };
            }
            pro.end(null, () => {
                setTimeout(() => {
                    Broadcast.programs[req.params.name] = Broadcast.addProgram(req.params.name, save, (err, program) => {
                        res.setHeader('Content-Type', 'application/json');
                        res.json({ success: true, options: program.options });
                    });
                }, 1500);
            });
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.json({ success: false, error: 'Program not found'});
        }
    }

    methods.stop = function stop(req, res) {

    }

    methods.stop = function stop(req, res) {

    }

    methods.stop = function stop(req, res) {

    }

    methods.stop = function stop(req, res) {

    }

    methods.stop = function stop(req, res) {

    }

    return methods;
}
