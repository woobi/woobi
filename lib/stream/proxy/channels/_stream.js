
var debug = require('debug')('woobi:stream:_proxyRoutes:channels:_channelStreamApi');
var _ = require('lodash');
var Leaky = require('../../../node-streams/leaky');
var fs = require('fs'); 
var path = require('path');
//var parse = require('json-safe-parse');
var moment = require('moment');
/**
 * proxy channel stream routes. 
 *
 * ####Example:     
 *
 *     Broadcast.Stream.proxy.channels._stream(app)
 *
 *  @module   
 * @param {Object} app
 * @api private
 */
module.exports = function _channelStreamApi(Broadcast) {

    let methods = {};

    function lost(req, res) {
        res.status(404).send(Broadcast.simplePage("<div style='padding:20'><span  style='border-bottom:1px solid #aaa;'><div  style='padding-top:6px;'>You did someting not right.<br /></div></div>"));
    }

    function whoops(req, res) {
        res.status(301).send(Broadcast.simplePage("<div style='padding:20'><span  style='border-bottom:1px solid #aaa;'><div  style='padding-top:6px;'>You did someting not right.<br /></div></div>"));
    }

    function wrong(req, res) {
        res.status(501).send(Broadcast.simplePage("<div style='padding:20'><span  style='border-bottom:1px solid #aaa;'><div  style='padding-top:6px;'>You did someting not right.<br /></div></div>"));
    }

    /**
     * Play is just a passthrough to someone else
     * @param {*} req 
     * @param {*} res
     * @param {*} [channel]
     * @param {*} Broadcast 
     * @param {*} channel 
     */
    methods.play = function play(req, res, channel) {
        methods.unicast(req, res, channel)
    }

    /**
     * Send the m3u8 file for the channel
     * @param {*} req 
     * @param {*} res
     * @param {*} [channel]
     * @param {*} Broadcast 
     */
    methods.m3u8 = methods.hls = function(req, res, channel) {
        //debug('hls play channel route', req.params);
        //var cl = Broadcast.proxies.push({ip: req.ip, source: req.params.channel});
       //debug(req._params)
        if(!req._params[2]) {
            return res.redirect(301, path.join('/', channel.id, 'hls', 'm3u8'));
        }
        if(path.extname(req._params[2]+'') == '.ts') {
            var file = path.join(Broadcast.mediaPath, Broadcast.wobbles, channel.id, req._params[2]);
        } else {
            var file = path.join(Broadcast.mediaPath, Broadcast.wobbles, channel.id, channel.id + '.m3u8');
        }
        
        return res.sendFile(file);
    }

    /**
     * serve the broadcast stream directly
     * @param {*} req 
     * @param {*} res
     * @param {*} [channel]
     * @param {*} Broadcast 
     */
    methods.unicast = function unicast(req, res, channel) {
        debug('serves unicast stream route');
        if(Broadcast.isReadableStream(channel.currentSource.stream)) {
            debug('channel stream is good');
            var cl = Broadcast.proxies.push({ip: req.ip, source: channel});
            
            var range =  req.headers.range || undefined;
            var CS = channel.currentSource;
            if (range !== undefined && (range = range.match(/bytes=(.+)-(.+)?/)) !== null) {
                // Check range contains numbers and they fit in the file.
                // Make sure info.start & info.end are numbers (not strings) or stream.pipe errors out if start > 0.
                CS.start = _.isNumber(range[1]) && range[1] >= 0 && range[1] < CS.end ? range[1] - 0 : CS.start;
                CS.end = _.isNumber(range[2]) && range[2] > CS.start && range[2] <= CS.end ? range[2] - 0 : CS.end;
                CS.rangeRequest = true;
            } 
            
            var header = {};
            header.Pragma = "public";
            //header["Last-Modified"] = CS.modified.toUTCString();
            header["Content-Transfer-Encoding"] = "binary";
            //header["Content-Length"] = CS.length;
            header["Content-Type"] = 'video/mp4';
            header["Accept-Ranges"] = "bytes";
            //header["Content-Range"] = "bytes " + CS.start + "-" + CS.end + "/" + CS.total;
            
            res.writeHead(206, header);
            
            var stream = channel.stream; //.pipe(new Leaky());
            /*
            stream.pipe(res);
            */
            channel.stream.on('data', chunk);
            function chunk(data) {
                res.write(data);
            }
            channel.stream.once('end', end);
            function end() {
                res.end();
                //Broadcast.proxies.splice(cl - 1, 1);
            }
            req.connection.addListener('close', function () {
                Broadcast.proxies.splice(cl - 1, 1);
                //channel.stream.removeListener('end', end);
                channel.stream.removeListener('data', chunk);
            });

        
        } else {
            debug('channel err');
            whoops(req, res);
        }
    }

    /**
     * Stream a source file using the woobi redirection
     * set the passthrough routes in woobi.init
     * @param {*} req 
     * @param {*} res
     * @param {*} [channel]
     * @param {*} Broadcast 
     */
    methods.direct = function direct(req, res, channel) {
    //debug('video passthough route');
    var file = decodeURI(req._parsedUrl.pathname);
    file = file.replace('/' + channel.id + '/direct', Broadcast.get('video passthrough path'));
    debug(file)
    serveFile( file, req, res, Broadcast ); 
    }

    /**
     * Stream a recoreded file saved n the dvrPath
     * @param {*} req 
     * @param {*} res
     * @param {*} [channel]
     * @param {*} Broadcast 
     */
    methods.dvr = function dvr(req, res, channel) {
        debug('/channel/:channel route');
        if(channel) {
            var file = channel.links.dvrPath;
            //var cl = Broadcast.proxies.push({ip: req.ip, source: channel});
            serveFile( file, req, res, Broadcast );
        } else {
            return wrong();
        }
    }

    /**
     * Stream a file from anywhere on the filepath
     * it will be encoded with ffmpeg
     * @param {*} req 
     * @param {*} res
     * @param {*} [channel]
     * @param {*} Broadcast 
     */

    methods.stream = function stream(req, res, channel) {
        // streams a file from anywhere on the filepath
        debug('/stream route');
        var a = req.url.split('/');	
        a.splice(0,3);		
        var file = decodeURI('/' + a.join('/'));
        debug( file )
        fs.stat(file, function(err, stats) {
            if (err) {
                if (err.code === 'ENOENT') {
                    // 404 Error if file not found
                    return res.sendStatus(404);
                }
                res.end(err);
            }
            
            var range = req.headers.range;
            if (!range) {
                // 416 Wrong range
                return res.sendStatus(416);
            }
            
            var positions = range.replace(/bytes=/, "").split("-");
            var start = parseInt(positions[0], 10);
            var total = stats.size;
            var end = positions[1] ? parseInt(positions[1], 10) : total - 1;
            var chunksize = (end - start) + 1;
            
            debug('Trying to stream video file: ' + file );
        
            new Broadcast.Source.Fluent({
                name: Broadcast.randomName(),
                file,
                stream: false,
                streamable: false,
                encode: false,
                seekByBytes: start,
                onlyOptions: ['-b:a', '128k', '-acodec', 'aac', '-ar 44100', '-ac', '2', '-b:v', '1800k', '-vcodec', 'libx264', '-preset', 'fast', '-bsf:v', 'h264_mp4toannexb', '-tune', 'zerolatency', '-movflags', 'faststart', '-strict', 'experimental'],
                format: 'mpegts'
            }, (err, fluent) => {
                if (err || !Broadcast.isReadableStream(fluent.stream)) {
                    res.end(err);
                }					
                debug('Playing ' + fluent.name );		
                res.contentType('mp4');	
                /*
                fluent.stream.pipe(new Leaky()).on('data', function(chunk) {
                    res.write(chunk);
                });
                fluent.stream.on('end', function() {
                    res.end();
                });
                */
                // end the stream if the connection ends
                res.on( 'finish', () => {
                    fluent.end();
                    debug('end stream on stop');
                })
                .on( 'end', () => {
                    fluent.end();
                    debug('end stream on stop');
                })
                .on( 'error', () => {
                    fluent.end();
                    debug('end stream on error');
                });
                fluent.stream.pipe(res);
            });
                
        });
    }

    /**
     * Stream thwe channel with ffmpeg
     * 
     * @param {*} req 
     * @param {*} res
     * @param {*} [channel]
     */
    methods.http = function http(req, res, channel) {
        // streams a file from anywhere on the filepath
        debug('/http route');
        var range =  req.headers.range || undefined;
        var start;
        if (range !== undefined && (range = range.match(/bytes=(.+)-(.+)?/)) !== null) {
            // Check range contains numbers and they fit in the file.
            // Make sure info.start & info.end are numbers (not strings) or stream.pipe errors out if start > 0.
            start = _.isNumber(range[1]) && range[1] >= 0 && range[1] < 1024 ? range[1] - 0 : 0;
            //var end = _.isNumber(range[2]) && range[2] > CS.start && range[2] <= CS.end ? range[2] - 0 : CS.end;
            //var rangeRequest = true;
        } 
        var header = {};
            header.Pragma = "public";
            header["Content-Transfer-Encoding"] = "binary";
            header["Content-Type"] = 'video/mp4';
            header["Accept-Ranges"] = "bytes";

        debug('Trying to stream video stream: ', Broadcast.isReadableStream(channel.stream), start);
    
        new Broadcast.Source.Fluent({
            name: Broadcast.randomName(),
            stream: channel.stream,
            streamable: false,
            encode: false,
            seekByBytes: start || 0,
            onlyOptions: ['-y', '-c', 'copy', '-bsf:v', 'h264_mp4toannexb', '-tune', 'zerolatency', '-movflags', 'faststart', '-strict', 'experimental'],
            format: 'mpegts'
        }, (err, fluent) => {
            if (err || !Broadcast.isReadableStream(fluent.stream)) {
                res.end(err);
            }					
            debug('Playing ' + fluent.name );	
            res.writeHead(206, header);
        
            
            fluent.stream.pipe(new Leaky()).on('data', function(chunk) {
                res.write(chunk);
            });
            fluent.stream.on('end', function() {
                res.end();
            });
            
            // end the stream if the connection ends
            res.on( 'finish', () => {
                fluent.end();
                debug('end stream on stop');
            })
            .on( 'end', () => {
                fluent.end();
                debug('end stream on stop');
            })
            .on( 'error', () => {
                fluent.end();
                debug('end stream on error');
            });
            //fluent.stream.pipe(res);
        });
    }

    /**
     * Serve the current source as a video on demand
     * @param {*} req 
     * @param {*} res
     * @param {*} [channel]
     * @param {*} Broadcast 
     */
    methods.ondemand = function  ondemand(req, res, channel) {
        //debug('serve ondemand content');
        if(channel) {
            var file = channel.currentSource.file;
            //var cl = Broadcast.proxies.push({ip: req.ip, source: channel});
            debug(channel.name, 'serve ondemand content', file);
            serveFile( file, req, res, Broadcast );
        } else {
            return wrong();
        }
    }

    /**
     * passthrough route for media on the server
     * set the 'media passthrough route' in woobi.init
     * @param {*} req 
     * @param {*} res
     * @param {*} [channel]
     * @param {*} Broadcast 
     */
    methods.media = function media(req, res, channel) {
        /**
         *  this is a simple passthrough to local media
         *  for a dedicated system I  just use the media folder to mount smb paths
         *  Broadcast.set('media passthrough path', '')
         *  
         * */
        //debug('Fix media url', req.originalUrl)
        // serve asset media
        debug('media passthrough', path.join(channel.id, '/media', Broadcast.get('media passthrough route'), '*').replace(/\\/g,'/'))
        var file = decodeURI(req.originalUrl);
        file = file.replace(channel.id + '/media', Broadcast.get('media passthrough path'));
        //debug('Send media file', file)
        res.sendFile(file);
    }


    /**
     * Send the status for the channel
     * @param {*} req 
     * @param {*} res
     * @param {*} [channel]
     * @param {*} Broadcast 
     */
    methods.status = function status(req, res, channel) {
        //debug('channel', channel)
        var _send = Broadcast.socketListeners.channel({ channel: channel.id }) || {};
        //debug(_send)
        var send = ''
        var links = _.map(channel.links, (v,k) => {
            return _.isString(v) ? '<li><a href="' + v + '">' + k + '</a></li>' : '';
        }).filter(r => r != '');
        try {
            send = '<pre>' + JSON.stringify(_send.channel, null, 4) + '</pre>';
            //debug(send)
        } catch(e) {
            debug(e)
        }
        return res.status(200).send(Broadcast.simplePage("<ul>" + links.join('') + "</ul><div  style='padding:20px;'><h1>" + channel.id + "</h1>" + send + '<br /></div>'));
    }

    /**
     * Send an html list of channel links
     * @param {*} req 
     * @param {*} res
     * @param {*} [channel]
     * @param {*} Broadcast 
     */
    methods.links = function links(req, res, channel) {
        var send = _.map(channel.links, (v,k) => {
            return '<a href="' + v + '">' + k + '</a>';
        });
        
        res.setHeader('Content-Type', 'application/json');
        res.json({ command: 'links', ...channel.links });
    }

    /**
     * Send the source playlist for the channel
     * @param {*} req 
     * @param {*} res
     * @param {*} [channel]
     * @param {*} Broadcast 
     */
    methods.playlist = function playlist(req, res, channel) {
        //debug('hls channel playlist route');
        var list = _.map(channel.links, (v,k) => {
            return _.isString(v) ? '<li><a href="' + v + '">' + k + '</a></li>' : '';
        }).filter(r => r != '');
        var links = _.map(channel.sources, (v,k) => {
            //return '<a href="' + v + '">' + k + '</a>';
            return {
                name: v.name || v.title || v.movie,
                info: 'http://' + Broadcast.host + ':' + Broadcast.port + path.join('/', channel.id, 'source', k+''),
                jumpTo: 'http://' + Broadcast.host + ':' + Broadcast.port + path.join('/', channel.id, 'jumpTo', k+''),
                direct: 'http://' + Broadcast.host + ':' + Broadcast.port + path.join('/', channel.id, 'direct', v.file),
                moveTo: 'http://' + Broadcast.host + ':' + Broadcast.port + path.join('/', channel.id, 'moveTo', k+'', ':to'),
                prev: 'http://' + Broadcast.host + ':' + Broadcast.port + path.join('/', channel.id, 'prev'),
                next: 'http://' + Broadcast.host + ':' + Broadcast.port + path.join('/', channel.id, 'next'),
            }
        });
        links.shift();
        links.unshift({
            currentSource: true,
            name: 'Current Source: ' + channel.currentSource.name || channel.currentSource.title || channel.currentSource.movie,
            info: 'http://' + Broadcast.host + ':' + Broadcast.port + path.join('/', channel.id, 'source', 'current'),
            //jumpTo: 'http://' + Broadcast.host + ':' + Broadcast.port + path.join('/', channel.id, 'jumpTo', k+''),
            direct: 'http://' + Broadcast.host + ':' + Broadcast.port + path.join('/', channel.id, 'direct', channel.currentSource.file),
            prev: 'http://' + Broadcast.host + ':' + Broadcast.port + path.join('/', channel.id, 'prev'),
            next: 'http://' + Broadcast.host + ':' + Broadcast.port + path.join('/', channel.id, 'next'),

        });
        if(req._params[2] == 'html') {
            html()
        } else {
            json(links)
        }
        function json(links) {
            res.setHeader('Content-Type', 'application/json');
            res.json(links);
        }
        function html() {
            var ret = [];
            links.forEach((n) => {
                ret.push('<h3>'+n.name+'</h3>');
                ret.push('<div style="background-color:#dcdcdc;color:#2b2b2b;padding:10px;">');
                if(n.currentSource)ret.push('<b>Now Playing</b><br />');
                ret.push('<a href="'+n.info+'">Info</a><br />');
                if(!n.currentSource) {
                    ret.push('<a href="'+n.jumpTo+'">Cycle queue to this source</a><br />');
                } else {
                    ret.push('<a href="'+n.prev+'">Play last viewed video</a><br />');
                    ret.push('<a href="'+n.next+'">Play next video</a><br />');
                }
                if(!n.currentSource) ret.push('<a href="'+n.moveTo+'">Move this item to a new location in the queue</a><br />');
                ret.push('<a href="'+n.direct+'">Play Direct</a><br />');
                if(n.currentSource) {
                    ret.push('<div style="clear:both" ></div>')
                    ret.push('<div style="width:50px;text-align:center;margin-right:5px;background:#1f203a;color:#fff;padding:4px;float:left;">frames</div>');
                    ret.push('<div style="width:50px;text-align:center;margin-right:5px;background:#1f203a;color:#fff;padding:4px;float:left;">FPS</div>');
                    ret.push('<div style="width:60px;text-align:center;margin-right:5px;background:#1f203a;color:#fff;padding:4px;float:left;">kbps</div>');
                    ret.push('<div style="width:50px;text-align:center;margin-right:5px;background:#1f203a;color:#fff;padding:4px;float:left;">size</div>');
                    ret.push('<div style="width:95px;text-align:center;margin-right:5px;background:#1f203a;color:#fff;padding:4px;float:left;">time</div>');
                    ret.push('<div style="width:60px;text-align:center;margin-right:5px;background:#1f203a;color:#fff;padding:4px;float:left;">%</div>');
                    ret.push('<div style="clear:both" ></div>')
                    ret.push('<div style="width:50px;text-align:center;margin-right:5px;background:#1f203a;color:#fff;padding:4px;float:left;">' + channel.currentSource.progress.frames + '</div>');
                    ret.push('<div style="width:50px;text-align:center;margin-right:5px;background:#1f203a;color:#fff;padding:4px;float:left;">' + channel.currentSource.progress.currentFps + '</div>');
                    ret.push('<div style="width:60px;text-align:center;margin-right:5px;background:#1f203a;color:#fff;padding:4px;float:left;">' + channel.currentSource.progress.currentKbps + '</div>');
                    ret.push('<div style="width:50px;text-align:center;margin-right:5px;background:#1f203a;color:#fff;padding:4px;float:left;">' + channel.currentSource.progress.targetSize + '</div>');
                    ret.push('<div style="width:95px;text-align:center;margin-right:5px;background:#1f203a;color:#fff;padding:4px;float:left;">' + channel.currentSource.progress.timemark + '</div>');
                    ret.push('<div style="width:60px;text-align:center;margin-right:5px;background:#1f203a;color:#fff;padding:4px;float:left;">' + Number.parseFloat(channel.currentSource.progress.percent).toFixed(1) + ' %</div>');
                }
                ret.push('<div style="clear:both" ></div>')
                ret.push('</div><hr />');
            })
            return res.status(200).send(Broadcast.simplePage("<ul>" + list.join('') + "</ul><div style='padding:20px'><h1>" + channel.id + "</h2><br /><a href='/"+channel.id+"/playlist/json' style='color:white'>JSON Endpoint</a><br /><div  style='padding:20px;'>" + ret.join('') + '<br /></div></div>'));
        }

        
    }

    /**
     * Send the hls playlist for the server
     * @param {*} req 
     * @param {*} res
     * @param {*} [channel]
     * @param {*} Broadcast 
     */
    methods.m3u = function m3u(req, res, channel) {
    //debug('hls channel playlist route');
    var list =['#EXTM3U', ''];
                
    _.each(Broadcast.channels, (c,k) => {
        list.push('#EXTINF:-1,' + c.channel);
        list.push(c.links.m3u8);
        if (c.options.epg.unicast === true) {
            list.push('#EXTINF:-1,' + c.channel + ' Unicast');
            list.push(c.links.unicast);
        }
        if (c.options.epg.ondemand === true) {
            
            list.push('#EXTINF:-1,' + c.channel + ' On Demand');
            list.push(c.links.ondemand);
        }
    });
    
    res.writeHead(200, {'Content-Type': 'application/vnd.apple.mpegurl'});
    res.write(list.join('\n'));
    res.end(); 
    }

    /**
     * Send the epg for the server
     * @param {*} req 
     * @param {*} res
     * @param {*} [channel]
     * @param {*} Broadcast 
     */
    methods.epg = function epg(req, res, channel) {
        debug('epg route', req.params.days);
                
        var list =['<?xml version="1.0" encoding="ISO-8859-1"?>', '<!DOCTYPE tv SYSTEM "xmltv.dtd">'];
        // service provider.... tv
        list.push('<tv source-info-url="http://snowpark.inq.email:7002/woobi/epg" source-info-name="Woobi2" generator-info-name="XMLTV/Woobi2" generator-info-url="http://www.xmltv.org/">');
        var chans = new Array();
        var programs = new Array();
        //debug('each channel', Broadcast.channels);
        //return
        _.each(Broadcast.channels, (c,k) => {
            chans.push('<channel id="' + c.channel + '">');
            chans.push('<display-name>' + c.channel + '</display-name>');
            chans.push('</channel>');
            if (c.options.epg.unicast === true) {
                chans.push('<channel id="' + c.channel + '-unicast">');
                chans.push('<display-name>' + c.channel + ' Unicast</display-name>');
                chans.push('</channel>');
            }
            if (c.options.epg.ondemand === true) {
                //debug(c.options)
                chans.push('<channel id="' + c.channel + '-ondemand">');
                chans.push('<display-name>' + c.channel + ' On Demand</display-name>');
                chans.push('</channel>');
            }

            // add the sources
            var len = req.params.days ? req.params.days : 7;
            var start = moment(c.currentSource.startTime);
            var end = moment(c.currentSource.startTime).add(len, 'days');
            //debug(c.id,'channel started: ' + start)
            // repeat the channel lineup until we hit end
            if(c.sources.length > 0) {
                do {
                    addPgm(c, programs, start)
                } while (start.isBefore(end))	
            }			
        });

        // join the arrays
        list = list.concat(chans, programs);
        list.push('</tv>');
        
        res.writeHead(200, {'Content-Type': 'application/xml'});
        res.write(list.join('\n'));
        res.end();
    }

    methods.temp = function links(req, res, channel) {
        
    }
    methods.temp = function links(req, res, channel) {
        
    }
    methods.temp = function links(req, res, channel) {
        
    }
    methods.temp = function links(req, res, channel) {
        
    }

    return methods;

}


function serveFile( file, req, res, Broadcast ) {
    fs.stat(file, function(err, stats) {
        if (err) {
            debug('404', file);
            if (err.code === 'ENOENT') {
                // 404 Error if file not found
                return res.sendStatus(404);
            }
            res.end(err);
        }
        
        debug('Trying to direct stream video file: ' + file, req.headers.range );
        var total = stats.size;
        if (!req.headers.range) {
            // 416 Wrong range
            //debug('no range');
            //return res.sendStatus(416);
            var start = 0;
            var end = total - 1;
        } else {
            var positions = req.headers.range.replace(/bytes=/, "").split("-");
            var start = parseInt(positions[0], 10);
            var end = positions[1] ? parseInt(positions[1], 10) : total - 1;
        }
        var chunksize = (end - start) + 1;
        if(start > end) start = 0;

        if (req.query.audio === 'yes') {
            new Broadcast.Source.Fluent({
                name: Broadcast.randomName(),
                file,
                stream: false,
                onlyOptions: ['-codec:v','copy','-codec:a', 'aac', '-preset','fast'],
                format: 'mpegts',
                seekByBytes: start
            }, (err, fluent) => {
                if (err || !Broadcast.isReadableStream(fluent.stream)) {
                    res.end(err);
                }					
                debug('Playing ' + fluent.name );		
                    
                    res.writeHead(206, {
                        "Content-Range": "bytes " + start + "-" + end + "/" + total,
                        "Accept-Ranges": "bytes",
                        "Content-Length": chunksize,
                        "Content-Type": "video/mp4"
                    });	
                    fluent.stream.pipe(new Leaky()).on('data', function(chunk) {
                        res.write(chunk);
                    });
                    fluent.stream.on('end', function() {
                        res.end();
                    });	
                    
                /*res.sendSeekable(fluent.stream, {
                      type: "video/mp4",
                      length: fluent.size
                });*/
                //fluent.stream.pipe(res);
            });
        } else {
            debug('create stream and write', start, end)
            var stream = fs.createReadStream(file, { start: start })
            .on("open", function() {
                res.writeHead(206, {
                    "Content-Range": "bytes " + start + "-" + end + "/" + total,
                    "Accept-Ranges": "bytes",
                    //"Content-Length": chunksize,
                    "Content-Type": "video/mp4"
                });
                stream.pipe(res);
            }).on("error", function(err) {
                res.end(err);
            });
        }
    
    });	
}

// push the program
function addPgm(c, programs, start) {
    debug('addPgm', c.sources.length)
    _.each(c.sources, (s) => {
        var item = s.metadata;
        //debug(item)
        var a = c.epgTime(start);
        //debug('begin: ' + start.format(), a)
        if ( !item.totalTimeInSeconds ) {
            item.totalTimeInSeconds = (60 * 60)
        }
        start = start.add( item.totalTimeInSeconds + 60, 'seconds');
        //debug('length: ' + item.totalTimeInSeconds);
        //debug('end: ' + start.format())
        var b = c.epgTime(start);
        
        printPgm('', programs, item, a , b, c, s, false, () => {
            //debug('done with program')
            if (c.options.epg.ondemand === true) {
                printPgm('-ondemand', programs, item, a, b, c, s, true)
            }
            if (c.options.epg.unicast === true) {
                printPgm('-unicast', programs, item, a, b, c, s, false)
            }
        });	
        
    });
    return programs;
}
function printPgm(who, programs, item, a , b, c, s, isvod, callback) {
    var sizes = {
        banner: ' width="758" height="160" ',
        poster: ' width="680" height="1000" ',
        fanart: ' width="1920" height="1080" ',
        thumb: ' width="640" height="360" ',
    }
    var sanitize = function HtmlEncode(mystring){
        //return mystring;
        if(!mystring) mystring = '';
        return mystring.replace(/&/g, "\&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/'/g, "&quot;");
    }
    var desc = (isvod == false) ? '' : 'ON DEMAND\r\n\r\nStart the current program over on demand.\r\n\r\n';
    var vod = (isvod == false) ? '' : '[VOD]: ';
    programs.push('<programme start="' + a + '" stop="' + b + '" channel="' + c.channel + who + '">');
        programs.push('<title lang="en">' + vod + sanitize(item.show || item.name || s.name) +  '</title>');
        if(item.show) programs.push('<sub-title lang="en">' + item.title + '</sub-title>');
        //if(item.rating) programs.push('<star-rating><value>' + item.rating + '</value></star-rating>');
        //if(item.rating) programs.push('<rating><value>' + item.rating + '</value></rating>');
        //if(item.premiered || item.airDate) programs.push('<date>' + (item.premiered || item.airDate) + '</date>');
        programs.push('<desc lang="en">' + desc + (sanitize(item.description) || item.plot || item.overview || s.plot || 'no description available.') + '</desc>');
        if(item.movieFile) {
            programs.push('<category lang="en">movie</category>');
        }
        if(item.genre) {
            //debug(item.genre)
            //var genre = (item.genre || '').split('/');
            _.each(item.genre, g => {
                if(g)programs.push('<category lang="en">' + (g) + '</category>');
            })
        }
        
        if( item.art ) {
            //_.each(item.art, art => {
            //	programs.push('<icon src="' + Broadcast._options.artStringReplace(art.url) + '" ' + sizes[art.type] + ' />');
            //})
        }
        if(item.imdbId)programs.push('<episode-num system="dd_progid">' + (item.imdbId) + '</episode-num>');
        if(item.season)programs.push('<episode-num system="onscreen">s' + (item.season || '') + 'e' + (item.episode || '') + '</episode-num>');
    programs.push('</programme>');
    if(callback) callback();
}