var fs = require('fs-extra');
var debug = require('debug')('woobi:_channelManageApi');
var _ = require('lodash');
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
        var c = {}
        debug('source', req._params[2], channel.sources[req._params[2]].name)
        if(channel && req._params[2] && channel.sources[req._params[2]]) {
            c = channel.sources[req._params[2]]
            succeed();
        } else if(channel && channel.currentSource) {
            c = channel.currentSource;
            succeed();
        } else {
            fail();
        }
        function succeed() {
            res.setHeader('Content-Type', 'application/json');
            res.json(c);
        }
        function fail() {
            res.setHeader('Content-Type', 'application/json');
            res.json({ command: 'source', success: false, error: 'Channel not found'});
        }
    }

    methods.create = function create(req, res) {
        debug('new channel route');
        var pro = req.body;
        debug('channel config', pro);
        //pro = parse(pro);
        let link = false;
        if(pro) {
            debug('add channel', pro.name);
            Broadcast.addChannel(pro.name, pro)
            .then(program => {
                Broadcast._options.savedConfigs.push(pro);
                Broadcast.notify('channels', Broadcast.socketListeners.channels());
                if (req.query.start === 'yes') {
                    Broadcast.channels[pro.name].start();
                }
                success('Channel Added')
            })
            .catch(e => {
                debug('Error adding channel', e);
                fail(e);
            });
        } else {
            fail('Wobble config required');
        }
        
        function success(message = '') {
            res.setHeader('Content-Type', 'application/json');
            res.json({ success: true, message: message });
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
        debug('kill ' + Broadcast.wobble + ' ' +  req._params[0]);
        var pro = Broadcast.channels[ req._params[0]];
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
     * load a saved channel from a config file
     * @param {*} req 
     * @param {*} res 
     */
    methods.load = function (req, res) {
        debug('load ' + Broadcast.wobble + ' from json file');
        var chan =  req.params.channel;
        var pro = Broadcast.channels[chan];
        if (pro) {
            res.setHeader('Content-Type', 'application/json');
            res.json({ success: false, error: 'Channel exists'});
            Broadcast.notify('channels', Broadcast.socketListeners.channels());
        } else {
            const file = chan + '.json';
            const channel = fs.readJsonSync(path.join( Broadcast.wobblePath, file), { throws: false })
            if (channel instanceof Object) {
                debug('load saved channels config', channel.id);
                let clone = { ...channel };
                delete clone.files;
                delete clone.currentSources;
                delete clone.currentHistory;
                Broadcast.addChannel(channel.channel, {
                    ...clone,
                    files: channel.currentSources || channel.files
                })
                .then(r => {
                    Broadcast.notify('channels', Broadcast.socketListeners.channels());
                    res.setHeader('Content-Type', 'application/json');
                    res.json({ success: true, name: channel.channel, message: channel.channel + ' Channel Started.' });
                })
                .catch(e => {
                    debug('error starting', e);
                    res.setHeader('Content-Type', 'application/json');
                    res.json({ success: false, name: pro.channel, error: channel.channel + ' Channel Failed to start.' });
                });
            }
            
        }
    }

    /**
     * delete a saved  config file
     * @param {*} req 
     * @param {*} res 
     */
    methods.deleteSavedConfig = function (req, res) {
        debug('delete ' + Broadcast.wobble + ' saved json file');
        var chan =  req.params.channel;
        var pro = Broadcast.channels[chan];
        const file = chan + '.json';
        const filename = path.join( Broadcast.wobblePath, file);
        const directory = path.join( Broadcast.wobblePath, chan);
        // With Promises:
        fs.removeSync(filename)
        fs.removeSync(directory)
        Broadcast._options.savedConfigs = [];
        let filenames = fs.readdirSync(Broadcast.wobblePath);				
        filenames.filter(r => path.extname(r) == '.json' ).forEach(file => { 
            let channel = fs.readJsonSync(path.join( Broadcast.wobblePath, file), { throws: false })
            debug('save config file for later', channel.channel)
            Broadcast._options.savedConfigs.push(channel);
            Broadcast.notify('channels', Broadcast.socketListeners.channels());
        });
        debug('success!');
        res.setHeader('Content-Type', 'application/json');
        res.json({ success: true, message: chan + ' configuration file deleted successfully.' });
        
       
    }

    /**
     * Start a channel
     * @param {*} req 
     * @param {*} res 
     */
    methods.start = function (req, res, channel) {
        debug('start ' + Broadcast.wobble + ' hls stream');
        var chan =  req._params[0];
        var pro = Broadcast.channels[chan];
        if (pro) {
            if(pro.state.current == "Play") {
                res.setHeader('Content-Type', 'application/json');
                res.json({ success: false, error: 'Channel currently playing'});
                return;
            }
            pro.setState('Play')
            pro.start();
            Broadcast.notify('channels', Broadcast.socketListeners.channels());
            res.setHeader('Content-Type', 'application/json');
            res.json({ success: true, name: pro.channel, message: pro.channel + ' Channel Started.' });
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.json({ success: false, error: 'Channel not found'});
        }
    }

    /**
     * Syop a channel
     * @param {*} req 
     * @param {*} res 
     */
    methods.stop = function (req, res, channel) {
        debug('stop ' + Broadcast.wobble + ' hls stream');
        var chan =  req._params[0];
        var pro = Broadcast.channels[chan];
        if (pro) {
            if(pro.state.current == "Stop") {
                res.setHeader('Content-Type', 'application/json');
                res.json({ success: false, error: 'Channel currently stopped'});
                return;
            }
            pro.setState('Stop')
            pro.stop();
            Broadcast.notify('channels', Broadcast.socketListeners.channels());
            res.setHeader('Content-Type', 'application/json');
            res.json({ success: true, name: pro.channel, message: pro.channel + ' Channel Stopped.' });
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.json({ success: false, error: 'Channel not found'});
        }
    }

    methods.restart = function restart(req, res) {
        var chan =  req._params[0];
        debug('restart ' + Broadcast.wobble + ' ' + chan);
        var pro = Broadcast.channels[chan];
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
                    newChannel.start(() => {
                        res.setHeader('Content-Type', 'application/json');
                        res.json({ success: true, channel: newChannel.channel,  message:  'Channel Rebooted.' });
                    });
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
                Broadcast.addChannel(req._params[0], save)
                .then(newChannel => {
                    newChannel.start(() => {
                        res.setHeader('Content-Type', 'application/json');
                        res.json({ success: true, name: newChannel.channel, message: newChannel.name + ' Channel Restarted.' });
                    });
                    
                })
                .catch((err) => {
                    debug(' err restarting channel', err);
                    res.setHeader('Content-Type', 'application/json');
                    res.json({ success: false, error: 'Channel not found'});
                });
            }
            
        } else {
            debug(' err no channel', req._params[0]);
            res.setHeader('Content-Type', 'application/json');
            res.json({ success: false, error: 'Channel not found ' + req._params[0]});
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
            Broadcast.notify('channels', Broadcast.socketListeners.channels());
            res.json({ success: true, channel: channel.id, message: source.name + ' will stream next' , source: source});
        }
        function fail() {
            res.setHeader('Content-Type', 'application/json');
            res.json({ success: false, error: 'Channel not found'});
        }
    }

    /**
     * move to next item in queue
     * @param {*} req 
     * @param {*} res 
     * @param {*} channel 
     */
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
            res.json({ command: 'next', success: true, channel: channel.id, message: source.name + ' will stream next', source: source });
        }
        function fail() {
            res.setHeader('Content-Type', 'application/json');
            res.json({ command: 'next', success: false, error: 'Channel not found'});
        }
    }

    /**
     * Move to prev item in queue
     * @param {*} req 
     * @param {*} res 
     * @param {*} channel 
     */
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
            res.json({ command: 'prev', success: true, channel: channel.id, params: req._params.join('/'), message: source.name + ' will stream next',  source: source });
        }
        function fail() {
            res.setHeader('Content-Type', 'application/json');
            res.json({ command: 'prev', success: false, error: 'Channel not found'});
        }
    }

    /**
     * Move an item to a new queue position
     * @param {*} req 
     * @param {*} res
     * @param {*} channel 
     */
    methods.moveTo = function moveTo(req, res, channel) {
        var from = req._params[2]
        var to = req._params[3]
        if(!from || !to) {
            return fail();
        }
        if(channel) {
            debug('jump to source ' + to);
            channel.moveTo(Number(from), Number(to), () => {
                succeed();
            });
            
        } else {
            fail();
        }
        function succeed() {
            res.setHeader('Content-Type', 'application/json');
            var source = channel.sources[to] ? channel.sources[to] : 'unknown';
            Broadcast.notify('channels', Broadcast.socketListeners.channels());
            res.json({ success: true, channel: channel.id, message: source.name + ' will stream in its new order' , source: source});
        }
        function fail() {
            res.setHeader('Content-Type', 'application/json');
            res.json({ success: false, error: 'Channel not found'});
        }
    }

    /**
     * Strt a program
     * @param {*} req 
     * @param {*} res
     * @param {*} channel
     */
    methods.program = function program(req, res, channel) {
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




    return methods;
}
