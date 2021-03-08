var path = require('path');
var	_ = require('lodash');
var	debug = require('debug')('woobi:core:options');
var stream = require('stream');
var fs = require('fs');
var randomNumber = require('hat');
/** 
 * Manage broadcast channels
 * @module options 
 * 
 * */
function options() {
	
	var exports = {};

	/**
	 * This file contains methods specific to dealing with Keystone's options.
	 * All exports are added to the Keystone.prototype
	 */

	// Deprecated options that have been mapped to new keys
	var remappedOptions = {};

	// Determines if path is absolute or relative
	function isAbsolutePath(value) {
		return path.resolve(value) === path.normalize(value).replace(new RegExp(path.sep+'$'), '');
	}

	/**
	 * Sets ss options
	 *
	 * ####Example:
	 *
	 *     ss.set('user model', 'User') // sets the 'user model' option to `User`
	 *
	 * @param {String} key
	 * @param {String} value
	 * @api public
	 */
	exports.set = function(key, value) {
	 	
		if (arguments.length === 1) {
			return this._options[key];
		}
		
		if (remappedOptions[key]) {
			if (this.get('logger')) {
				debug('\nWarning: the `' + key + '` option has been deprecated. Please use `' + remappedOptions[key] + '` instead.\n\n' +
					'Support for `' + key + '` will be removed in a future version.');
			}
			key = remappedOptions[key];
		}
		
		// handle special settings
		switch (key) {
			default:
				break;
		}
		
		this._options[key] = value;
		return this;
	};


	/**
	 * Sets multiple ss options.
	 *
	 * ####Example:
	 *
	 *     ss.options({test: value}) // sets the 'test' option to `value`
	 *
	 * @param {Object} options
	 * @api public
	 */

	exports.options = function(options) {
		_this = this;
		if (!arguments.length) {
			return this._options;
		}
		if (_.isObject(options)) {
			debug('settings options');
			_.each(options, function(v,k) {
				_this.set(k, v);
			});
		}
		return this._options;
	};


	/**
	 * Gets ss options
	 *
	 * ####Example:
	 *
	 *     ss.get('test') // returns the 'test' value
	 *
	 * @param {String} key
	 * @api public
	 */

	exports.get = exports.set;

	/**
	 * Gets an expanded path option, expanded to include moduleRoot if it is relative
	 *
	 * ####Example:
	 *
	 *     ss.get('pathOption', 'defaultValue')
	 *
	 * @param {String} key
	 * @param {String} defaultValue
	 * @api public
	 */

	exports.getPath = function(key, defaultValue) {
		return this.expandPath(this.get(key) || defaultValue);
	};

	/**
	 * Expands a path to include moduleRoot if it is relative
	 *
	 * @param {String} pathValue
	 * @api public
	 */

	exports.expandPath = function(pathValue) {
		pathValue = ('string' === typeof pathValue && pathValue.substr(0, 1) !== path.sep && pathValue.substr(1, 2) !== ':\\')
			? path.join(this.get('module root'), pathValue)
			: pathValue;
		return pathValue;
	};
	
	exports.wrapHTMLError = function wrapHTMLError(title, err) {
		return '<html><head><meta charset=\'utf-8\'><title>Error</title>' +
		'<link rel=\'stylesheet\' href=\'/keystone/styles/error.css\'>' +
		'</head><body><div class=\'error\'><h1 class=\'error-title\'>' + title + '</h1>' +
		'<div class="error-message">' + (err || '') + '</div></div></body></html>';
	}
	
	exports.wrapHTML = function wrapHTML(title, msg) {
		return '<html><head><meta charset=\'utf-8\'><title>Status</title>' +
		'<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-BmbxuPwQa2lc/FVzBcNJ7UAyJxM6wuqIj61tLrc4wSX0szH/Ev+nYRRuWlolflfl" crossorigin="anonymous"><script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta2/dist/js/bootstrap.bundle.min.js" integrity="sha384-b5kHyXgcpbZJO/tY9Ul7kGkf1S0CWuKcCD38l8YkeH8z8QjE0GmW1gYU5S9FOnJ0" crossorigin="anonymous"></script>' +
		'</head><body><div class=\'error\'><h1 class=\'error-title\'>' + title + '</h1>' +
		'<div class="error-message">' + (msg || '') + '</div></div></body></html>';
	}
	
	exports.simplePage = function simplePage(body) {
		return '<!DOCTYPE html><html><head><style>body { font-family: "Open Sans",sans-serif; margin:0; font-size: 16px; background-color:#1f203a; color:#fff} ul { list-style-type: none; margin: 0; padding: 0; overflow: hidden; background-color: #19192f; position: fixed; top: 0; width: 100%;} li{ float: left;}li a { display: block; color: white; text-align: center;  padding: 14px 16px;  text-decoration: none;}li a:hover:not(.active) {  background-color: #fff; color:#1f203a;}.active { background-color: #4CAF50;}</style></head><body>' + body + '</body></html>';
	}

	exports.isFile = function isFile(file, cb) {
		if(!_.isFunction(cb)) {
			debug('no callback supplied to isFile... runing in sync mode');
			try {
				var is = fs.lstatSync(file);
			} catch(e) {
				debug('catch isFile ' + e);
				return false;
			}
			if(is.isFile()) {
				return true;
			} else {
				return false;
			}
		} else {
			fs.lstat(file, function(err, stats) {
				if (!err && stats.isFile()) {
					cb(null, true);
					return true;
				} else {
					cb('file must exist', false);
					return false;
				}
			});
		}
	}
	
	exports.isReadableStream = function isReadableStream(obj) {
		return (obj instanceof stream.Stream &&
			typeof (obj._read === 'function') &&
			typeof (obj._readableState === 'object')) ? true : false;
	}
	
	exports.trapResponse = function(socket, callback) {
		
		var unique = randomNumber();
		
		socket.once(unique, callback);
		
		return unique;
	}
	exports.trap = exports.trapResponse;
	
	exports.createArgument = function(line, query) {
		return line.split(' ').map(function(v) {
			if(v[0] === '%') {
				var str =  v.substring(1, v.length-1).toLowerCase();
				return query[str];
			} else {
				return v;
			}
		})
		.filter(function(v) { 
			return v !== '' 
		});
	}
	
	/**
	 * Imports all files from the given directory and returns an object of methods
	 * each file must return a function or be added to the skip array
	 * @param {String} dirname - dir to import files from recursivly
	 * @param {*} context - attach to this
	 * @param {Array} skip - skip these directory names.  Note skips by name only not path
	 */
	exports.import = function(dirname, context, skip) {
	
		var _this = this;
		skip = Array.isArray(skip) ? skip : []
		var initialPath = path.join(this.get('module root'), dirname);
		var doImport = function(fromPath) {
			
			var imported = {};
			
			fs.readdirSync(fromPath).forEach(function(name) {
				
				var fsPath = path.join(fromPath, name),
				info = fs.statSync(fsPath);
				
				// skip if needed
				if(skip.includes(name)) {
					return;
				}
				// loop
				if (info.isDirectory()) {
					imported[name] = doImport(fsPath);
				} else {
					// only import files that we can `require`
					var ext = path.extname(name);
					var base = path.basename(name, ext);
					imported[base] = require(fsPath)(context || _this);
				}
				
			});
			
			return imported;
		};
		
		return doImport(initialPath);
	};
	
	return exports;
	
}

module.exports = options;
