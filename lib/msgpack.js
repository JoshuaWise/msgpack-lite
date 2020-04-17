'use strict';
var Codec = require('./codec');
var Paper = require('./paper');
var Float = require('./float');
var encode = require('./encode');
var decode = require('./decode');

exports.encode = function (input, codec) {
	if (codec != null && !(codec instanceof Codec)) {
		throw new TypeError('Expected second argument to be a Codec, if provided.');
	}
	var encoder = new Paper(codec);
	encode(encoder, input);
	return encoder.read();
};
exports.decode = function (input, codec) {
	if (codec != null && !(codec instanceof Codec)) {
		throw new TypeError('Expected second argument to be a Codec, if provided.');
	}
	if (!(input instanceof Uint8Array) && !(input instanceof Uint8ClampedArray)) {
		throw new TypeError('Expected first argument to be a Uint8Array or Uint8ClampedArray.');
	}
	var decoder = new Paper(codec);
	decoder.setBuffer(input);
	return decode(decoder);
};
exports.Codec = Codec;
exports.Float = Float;
