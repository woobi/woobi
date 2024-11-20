const Request = require('node-fetch')
var debug = require('debug')('woobi:core:adapter:Radarr');
const moment = require('moment');
const Promise = require('bluebird');
Request.Promise = Promise;
/** 
 * Manage broadcast channels
 * @module Broadcast/libs/Radarr
 * 
 * */
module.exports = function(Broadcast) {
	
	/**
     * Radarr adapter
     *
     * ####Example:
     *
     *     Broadcast.libs.Radarr({}, callback)
     * @class
     * @param {Object} opts
     * @param {Function} callback
     * @api public
     */

	var Radarr = function (opts, callback) {
		if (!(this instanceof Radarr)) return new Radarr(opts, callback);
		debug('Woobi Radarr Movie Adapter');
		
        this.connection;
		
		 if(!opts.apiKey || !opts.uri) {
			debug('opts:', opts)
			console.log('A correct adapter config is required!  Exiting now.');
			 process.exit();
			 return false;
		 }
		
        this.api = opts.apiKey;
        this.uri = opts.uri;
        var rep = Array.isArray(opts.replacePath) ? opts.replacePath: ['',''];
        this.replace = rep[0];
        this.replaceWith = rep[1];

		this.connection = (command) => {
            
            var go = this.uri + command;
            //debug('GET', go)
            return Request(go, { headers: {
                'x-api-key': this.api,
            }})
                .then(res => res.json())
                .then(r => {
                    //debug(r)
                    return r;
                })
                .catch(e => {
                    debug(e)
                })
                
        };

        if(callback) {
            //callback(null, this);
        }
        return 
    }
	
	
	/** movies **/
	Radarr.prototype.movies = function() {
		return this.connection('/movie')
            .then(r => {
                
                return r
            });
	}
	
    return Radarr;
}	
	