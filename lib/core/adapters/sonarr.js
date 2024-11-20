const Request = require('node-fetch')
var debug = require('debug')('woobi:core:adapter:sonarr');
const moment = require('moment');
const Promise = require('bluebird');
Request.Promise = Promise;
/** 
 * Manage broadcast channels
 * @module Broadcast/libs/sonarr
 * 
 * */
module.exports = function(Broadcast) {
	
	/**
     * Sonarr adapter
     *
     * ####Example:
     *
     *     Broadcast.libs.sonarr({}, callback)
     * @class
     * @param {Object} opts
     * @param {Function} callback
     * @api public
     */

	var Sonarr = function (opts, callback) {
		if (!(this instanceof Sonarr)) return new Sonarr(opts, callback);
		debug('Woobi Sonarr Tv Show Adapter ');
		
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
	

	/** recent tv episodes **/
	Sonarr.prototype.recentEpisodes = function(days) {
		debug('recentEpisodes')
        var till = days || 7;
        var cmd = '/calendar?start=' + moment().subtract(till, 'days').format() + '&end=' + moment().format();

		return this.connection(cmd)
            .then(eps => {
                debug('SONARR got eps', eps.length)
                var mappy = Promise.map(eps, ep => {
                    if(!ep.hasFile) {
                        return false;
                    }
                    //debug('/episodefile/'+ ep.id+'?seriesId='+ep.seriesId)
                    return this.connection('/episodefile/'+ ep.episodeFileId+'?seriesId='+ep.seriesId)
                        .then(r => {
                            debug('got file', r.path)
                            return {
                                ...ep,
                                ...r,
                                file: r.path.replace(this.replace, this.replaceWith)
                            };
                        })
                });
                
                return mappy.then(r => r)
            })
            .then(r => {
                debug('done recent')
                return r;
            });
	}
	
	/** tv shows **/
	Sonarr.prototype.tvShows = function(limit, order) {
		return this.connection('/series');
	}

	
	/** tv show **/
	Sonarr.prototype.tvShow = function(ID) {
		if(!ID) {
			debug('No ID');
			return []
		}
		return this.connection('/series/'+ID);
	}
	
	/** tv show by name **/
	Sonarr.prototype.tvShowByName = function(name) {
		if(!name) {
			debug('No Name');
			return {}
		}
		return Promise.reject('Not implemented');	
		
	}
	
	/** tv show by id **/
	Sonarr.prototype.tvShowByIMDB = function(IMDB) {
		return Promise.reject('Not implemented');
	}
	
	/** show episodes **/
	Sonarr.prototype.tvShowEpisodes = function(showID) {
		if(!showID) {
			debug('No showID');
			return []
		}
		return this.connection('/episode?serisId=' + showID)
        .then(eps => {
            return this.connection('/episodefile?serisId=' + showID)
                .then(files => {
                    return eps.files = files
                })
                .catch(e => {
                    debug('ERR getting episode files')
                });
        });
	}
	
    return Sonarr;
}	
	