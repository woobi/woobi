/**
 * upd stream protoype found from http://ey3ball.github.io/posts/2014/07/17/node-streams-back-pressure/
 * 
 * 
 * */
var Ringbuffer = new require('ringbufferjs');
var Duplex = new require('stream').Duplex;

var util = require('util');

util.inherits(Leaky, Duplex);

function Leaky(opt) {
	Duplex.call(this, opt);

	this._rb = new Ringbuffer();
	this._wants_data = false;
}

Leaky.prototype._write = function(chunk, encoding, done) {
	
	this._rb.enq(chunk);

	if (this._wants_data) {
		this._wants_data = this.push(this._rb.deq());
	}
	done();
}

Leaky.prototype._read = function (size) {
	var go = true;

	while (!this._rb.isEmpty() && go) {
		go = this.push(this._rb.deq());
	}

	this._wants_data = go;
}

module.exports = Leaky;
