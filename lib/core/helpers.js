var debug = require('debug')('lodge:lib:routes:helpers');
var _ = require('lodash');

module.exports.channels = function(opts) {
		return new Promise((resolve, reject) => {
			var ch = this.socketListeners.channels().channels;
			resolve(ch);
		});
}
