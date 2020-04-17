'use strict';
var encode = require('../.').encode;
var decode = require('../.').decode;
var Float = require('../.').Float;
var referenceDecode = require('msgpack-lite').decode;
var util = require('util');
var Long = require('long');
var expect = require('chai').expect;

function expectToDecodeLikeReference(value) {
	var encoded = encode(value);
	expect(decode(encoded)).to.deep.equal(referenceDecode(Buffer.from(encoded)));
}

function expectToDecodeExactly(value) {
	var encoded = encode(value);
	expect(decode(encoded)).to.deep.equal(value);
	expect(decode(encoded)).to.deep.equal(referenceDecode(Buffer.from(encoded)));
}

function expectToDecodeExactlyWithoutReference(value) {
	var encoded = encode(value);
	expect(decode(encoded)).to.deep.equal(value);
}

function stringOf(length) {
	var str = '';
	while (str.length < length) {str += 'x';}
	return str;
}

function objectOf(keyCount) {
	var obj = {};
	for (var i=0; i<keyCount; ++i) {obj[-1000000 - i] = true;}
	return obj;
}

[Array, Uint8Array].forEach(function (Class) {
	if (typeof Class.prototype.fill !== 'function') {
		Class.prototype.fill = function (value) {
			for (var i=0; i<this.length; ++i) {this[i] = value;}
			return this;
		};
	}
});

describe('msgpack.decode()', function () {
	this.timeout(5000);
	this.slow(5000);
	specify('null', function () {
		expectToDecodeExactly(null);
	});
	specify('undefined', function () {
		expectToDecodeLikeReference(undefined);
	});
	specify('boolean', function () {
		expectToDecodeExactly(true);
		expectToDecodeExactly(false);
	});
	specify('fixint', function () {
		expectToDecodeExactly(0);
		expectToDecodeExactly(127);
		expectToDecodeExactly(-1);
		expectToDecodeExactly(-32);
	});
	specify('uint', function () {
		expectToDecodeExactly(128);
		expectToDecodeExactly(255);
		expectToDecodeExactly(256);
		expectToDecodeExactly(65535);
		expectToDecodeExactly(65536);
		expectToDecodeExactly(4294967295);
	});
	specify('int', function () {
		expectToDecodeExactly(-33);
		expectToDecodeExactly(-128);
		expectToDecodeExactly(-129);
		expectToDecodeExactly(-32768);
		expectToDecodeExactly(-32769);
		expectToDecodeExactly(-2147483648);
	});
	specify('float', function () {
		expectToDecodeExactly(4294967296);
		expectToDecodeExactly(-2147483904);
		expectToDecodeExactly(0.5);
		expectToDecodeExactly(0.25);
		expectToDecodeExactly(-0.5);
		expectToDecodeExactly(-0.25);
		expectToDecodeExactly(4e39);
		expectToDecodeExactly(-4e39);
		expectToDecodeExactly(0.3);
		expectToDecodeExactly(-0.3);
	});
	specify('string', function () {
		expectToDecodeExactly('');
		expectToDecodeExactly('x');
		expectToDecodeExactly(stringOf(31));
		expectToDecodeExactly(stringOf(32));
		expectToDecodeExactly(stringOf(255));
		expectToDecodeExactly(stringOf(256));
		expectToDecodeExactly(stringOf(65535));
		expectToDecodeExactly(stringOf(65536));
	});
	specify('float', function () {
		var expectDecodeForFloat = function (value) {
			var float = new Float(value);
			var encoded = encode(float);
			expect(decode(encoded)).to.equal(float.value);
		};
		// 32-bit
		expectDecodeForFloat(1.0);
		// 64-bit
		expectDecodeForFloat(-1.1);
	});
	specify('long', function () {
		expectToDecodeExactlyWithoutReference(Long.fromNumber(Number.MIN_SAFE_INTEGER));
		expectToDecodeExactlyWithoutReference(Long.fromNumber(Number.MAX_SAFE_INTEGER, true));
		expectToDecodeExactlyWithoutReference(Long.fromBits(0, -0x80000000));
		expectToDecodeExactlyWithoutReference(Long.fromBits(-1, 0x7fffffff, true));
	});
	specify('binary', function () {
		function expectToDecodeExactBinary(value) {
			var encoded = encode(value);
			expect(decode(encoded)).to.deep.equal(value);
			var decodedBuffer = referenceDecode(Buffer.from(encoded));
			if (!decodedBuffer.equals(Buffer.from(decode(encoded)))) {
				throw new Error(util.format('\nExpected:\n', decodedBuffer, '\nInstead got:\n', Buffer.from(decode(encoded))));
			}
		}
		expectToDecodeExactBinary(new Uint8Array(0).fill(0x77));
		expectToDecodeExactBinary(new Uint8Array(1).fill(0x77));
		expectToDecodeExactBinary(new Uint8Array(31).fill(0x77));
		expectToDecodeExactBinary(new Uint8Array(32).fill(0x77));
		expectToDecodeExactBinary(new Uint8Array(255).fill(0x77));
		expectToDecodeExactBinary(new Uint8Array(256).fill(0x77));
		expectToDecodeExactBinary(new Uint8Array(65535).fill(0x77));
		expectToDecodeExactBinary(new Uint8Array(65536).fill(0x77));
	});
	specify('array', function () {
		expectToDecodeExactly(new Array(0).fill(true));
		expectToDecodeExactly(new Array(1).fill(true));
		expectToDecodeExactly(new Array(15).fill(true));
		expectToDecodeExactly(new Array(16).fill(true));
		expectToDecodeExactly(new Array(255).fill(true));
		expectToDecodeExactly(new Array(256).fill(true));
		expectToDecodeExactly(new Array(65535).fill(true));
		expectToDecodeExactly(new Array(65536).fill(true));
	});
	specify('object', function () {
		expectToDecodeExactly({});
		expectToDecodeExactly({0: true});
		expectToDecodeExactly({127: true});
		expectToDecodeExactly({128: true});
		expectToDecodeExactly({255: true});
		expectToDecodeExactly({256: true});
		expectToDecodeExactly({'-1': true});
		expectToDecodeExactly({'0.5': true});
		expectToDecodeExactly({'': true});
		expectToDecodeExactly({'foo': true});
		expectToDecodeExactly({'foo': true});
		expectToDecodeExactly(objectOf(15));
		expectToDecodeExactly(objectOf(16));
		expectToDecodeExactly(objectOf(65535));
		expectToDecodeExactly(objectOf(65536));
	});
	specify('symbol', function () {
		if (typeof Symbol === 'function') {
			expectToDecodeLikeReference(Symbol());
		}
	});
	specify('function', function () {
		expectToDecodeLikeReference(function () {});
	});
});
