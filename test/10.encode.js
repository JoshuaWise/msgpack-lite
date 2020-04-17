'use strict';
var encode = require('../.').encode;
var Float = require('./..').Float;
var referenceEncode = require('msgpack-lite').encode;
var referenceDecode = require('msgpack-lite').decode;
var util = require('util');
var Long = require('long');
var expect = require('chai').expect;

function expectCorrectLength(value, expectedBytes) {
	var encoded = encode(value);
	expect(encoded).to.be.an.instanceof(Uint8Array);
	expect(encoded).to.not.be.an.instanceof(Buffer);
	if (encoded.byteLength !== expectedBytes) {
		throw new Error('\nExpected ' + value + ' to encode to ' + expectedBytes + ' bytes, not ' + encoded.byteLength + '.');
	}
	return encoded;
}

function expectToEqualReference(value, expectedBytes) {
	var encoded = expectCorrectLength(value, expectedBytes);
	var referenceEncoded = referenceEncode(value);
	if (!Buffer.from(encoded).equals(referenceEncoded)) {
		throw new Error(util.format('\nExpected:\n', referenceEncoded, '\nInstead got:\n', Buffer.from(encoded)));
	}
}

function expectToBeUnderstoodByReference(value, expectedBytes) {
	var encoded = expectCorrectLength(value, expectedBytes);
	expect(referenceDecode(Buffer.from(encoded))).to.deep.equal(value);
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

describe('msgpack.encode()', function () {
	this.timeout(5000);
	this.slow(5000);
	specify('null', function () {
		expectToEqualReference(null, 1);
	});
	specify('undefined', function () {
		expectToEqualReference(undefined, 1);
	});
	specify('boolean', function () {
		expectToEqualReference(true, 1);
		expectToEqualReference(false, 1);
	});
	specify('fixint', function () {
		expectToEqualReference(0, 1);
		expectToEqualReference(127, 1);
		expectToEqualReference(-1, 1);
		expectToEqualReference(-32, 1);
	});
	specify('uint', function () {
		expectToEqualReference(128, 2);
		expectToEqualReference(255, 2);
		expectToEqualReference(256, 3);
		expectToEqualReference(65535, 3);
		expectToEqualReference(65536, 5);
		expectToBeUnderstoodByReference(4294967295, 5);
	});
	specify('int', function () {
		expectToEqualReference(-33, 2);
		expectToEqualReference(-128, 2);
		expectToEqualReference(-129, 3);
		expectToEqualReference(-32768, 3);
		expectToEqualReference(-32769, 5);
		expectToEqualReference(-2147483648, 5);
	});
	specify('float', function () {
		expectToBeUnderstoodByReference(4294967296, 5);
		expectToBeUnderstoodByReference(-2147483904, 5);
		expectToBeUnderstoodByReference(0.5, 5);
		expectToBeUnderstoodByReference(0.25, 5);
		expectToBeUnderstoodByReference(-0.5, 5);
		expectToBeUnderstoodByReference(-0.25, 5);
		expectToBeUnderstoodByReference(4e39, 9);
		expectToBeUnderstoodByReference(-4e39, 9);
		expectToEqualReference(0.3, 9);
		expectToEqualReference(-0.3, 9);
	});
	specify('string', function () {
		expectToEqualReference('', 1);
		expectToEqualReference('x', 2);
		expectToEqualReference(stringOf(31), 32);
		expectToEqualReference(stringOf(32), 34);
		expectToEqualReference(stringOf(255), 257);
		expectToEqualReference(stringOf(256), 259);
		expectToEqualReference(stringOf(65535), 65538);
		expectToEqualReference(stringOf(65536), 65541);
	});
	specify('float', function () {
		expectCorrectLength(new Float(1.0), 5);
		expectCorrectLength(new Float(1.01), 9);
	});
	specify('long', function () {
		expectCorrectLength(Long.fromNumber(0), 1);
		expectCorrectLength(Long.fromNumber(32768), 3);
		expectCorrectLength(Long.fromNumber(-32768), 3);
		expectCorrectLength(Long.fromNumber(0x7fffffff), 5);
		expectCorrectLength(Long.fromNumber(-0x80000000), 5);
		expectCorrectLength(Long.fromNumber(Number.MIN_SAFE_INTEGER), 9);
		expectCorrectLength(Long.fromNumber(Number.MAX_SAFE_INTEGER), 9);
		expectCorrectLength(Long.fromBits(-1, 0x7fffffff), 9);
		expectCorrectLength(Long.fromBits(0, -0x80000000), 9);
	});
	specify('binary', function () {
		function expectToEqualReferenceBinary(value, expectedBytes) {
			var encoded = expectCorrectLength(value, expectedBytes);
			var referenceEncoded = referenceEncode(Buffer.from(value));
			if (!Buffer.from(encoded).equals(referenceEncoded)) {
				throw new Error(util.format('\nExpected:\n', referenceEncoded, '\nInstead got:\n', Buffer.from(encoded)));
			}
		}
		function expectToBeUnderstoodByReferenceBinary(value, expectedBytes) {
			var encoded = expectCorrectLength(value, expectedBytes);
			expect(referenceDecode(Buffer.from(encoded))).to.deep.equal(Buffer.from(value));
		}
		expectToEqualReferenceBinary(new Uint8Array(0).fill(0x77), 2);
		expectToEqualReferenceBinary(new Uint8Array(1).fill(0x77), 3);
		expectToEqualReferenceBinary(new Uint8Array(31).fill(0x77), 33);
		expectToEqualReferenceBinary(new Uint8Array(32).fill(0x77), 34);
		expectToBeUnderstoodByReferenceBinary(new Uint8Array(255).fill(0x77), 257);
		expectToEqualReferenceBinary(new Uint8Array(256).fill(0x77), 259);
		expectToEqualReferenceBinary(new Uint8Array(65535).fill(0x77), 65538);
		expectToEqualReferenceBinary(new Uint8Array(65536).fill(0x77), 65541);
	});
	specify('array', function () {
		expectToEqualReference(new Array(0).fill(true), 1);
		expectToEqualReference(new Array(1).fill(true), 2);
		expectToEqualReference(new Array(15).fill(true), 16);
		expectToEqualReference(new Array(16).fill(true), 19);
		expectToEqualReference(new Array(255).fill(true), 258);
		expectToEqualReference(new Array(256).fill(true), 259);
		expectToEqualReference(new Array(65535).fill(true), 65538);
		expectToEqualReference(new Array(65536).fill(true), 65541);
	});
	specify('object', function () {
		expectToBeUnderstoodByReference({}, 1);
		expectToBeUnderstoodByReference({0: true}, 3);
		expectToBeUnderstoodByReference({127: true}, 3);
		expectToBeUnderstoodByReference({128: true}, 4);
		expectToBeUnderstoodByReference({255: true}, 4);
		expectToBeUnderstoodByReference({256: true}, 5);
		expectToBeUnderstoodByReference({'-1': true}, 5);
		expectToBeUnderstoodByReference({'0.5': true}, 6);
		expectToBeUnderstoodByReference({'': true}, 3);
		expectToBeUnderstoodByReference({'foo': true}, 6);
		expectToBeUnderstoodByReference({'foo': true}, 6);
		expectToBeUnderstoodByReference(objectOf(15), 1 + 15 * 10);
		expectToBeUnderstoodByReference(objectOf(16), 3 + 16 * 10);
		expectToBeUnderstoodByReference(objectOf(65535), 3 + 65535 * 10);
		expectToBeUnderstoodByReference(objectOf(65536), 5 + 65536 * 10);
	});
	specify('symbol', function () {
		if (typeof Symbol === 'function') {
			Buffer.from(encode(Symbol())).equals(Buffer.from(encode(null)));
		}
	});
	specify('function', function () {
		Buffer.from(encode(function () {})).equals(Buffer.from(encode(null)));
	});
});
