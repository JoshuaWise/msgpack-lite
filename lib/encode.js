'use strict';
var BufferLite = require('./buffer-lite');
var token = require('./write-token').token;
var uint8 = require('./write-uint8').uint8;
var ExtBuffer = require('./ext-buffer');
var IS_BUFFER_SHIM = ('TYPED_ARRAY_SUPPORT' in Buffer);

var encode = module.exports = function (encoder, value) {
	type[typeof value](encoder, value);
};

var nil = function (encoder, value) {
	// nil -- 0xc0
	var type = 0xc0;
	token[type](encoder, value);
};

var boolean = function (encoder, value) {
	// false -- 0xc2
	// true -- 0xc3
	var type = value ? 0xc3 : 0xc2;
	token[type](encoder, value);
};

var number = function (encoder, value) {
	var ivalue = value | 0;
	var type;
	if (value !== ivalue) {
		// float 64 -- 0xcb
		type = 0xcb;
		token[type](encoder, value);
		return;
	} else if (-0x20 <= ivalue && ivalue <= 0x7F) {
		// positive fixint -- 0x00 - 0x7f
		// negative fixint -- 0xe0 - 0xff
		type = ivalue & 0xFF;
	} else if (0 <= ivalue) {
		// uint 8 -- 0xcc
		// uint 16 -- 0xcd
		// uint 32 -- 0xce
		// uint 64 -- 0xcf
		type = (ivalue <= 0xFF) ? 0xcc : (ivalue <= 0xFFFF) ? 0xcd : 0xce;
	} else {
		// int 8 -- 0xd0
		// int 16 -- 0xd1
		// int 32 -- 0xd2
		// int 64 -- 0xd3
		type = (-0x80 <= ivalue) ? 0xd0 : (-0x8000 <= ivalue) ? 0xd1 : 0xd2;
	}
	token[type](encoder, ivalue);
};

var string = function (encoder, value) {
	// str 8 -- 0xd9
	// str 16 -- 0xda
	// str 32 -- 0xdb
	// fixstr -- 0xa0 - 0xbf

	// prepare buffer
	var length = value.length;
	var maxsize = 5 + length * 3;
	encoder.reserve(maxsize);

	// expected header size
	var expected = (length < 32) ? 1 : (length <= 0xFF) ? 2 : (length <= 0xFFFF) ? 3 : 5;

	// expected start point
	var start = encoder.offset + expected;

	// write string
	length = BufferLite.writeString.call(encoder.buffer, value, start);

	// actual header size
	var actual = (length < 32) ? 1 : (length <= 0xFF) ? 2 : (length <= 0xFFFF) ? 3 : 5;

	// move content when needed
	if (expected !== actual) {
		var targetStart = encoder.offset + actual;
		var end = start + length;
		if (IS_BUFFER_SHIM) {
			BufferLite.copy.call(encoder.buffer, encoder.buffer, targetStart, start, end);
		} else {
			encoder.buffer.copy(encoder.buffer, targetStart, start, end);
		}
	}

	// write header
	var type = (actual === 1) ? (0xa0 + length) : (actual <= 3) ? 0xd7 + actual : 0xdb;
	token[type](encoder, length);

	// move cursor
	encoder.offset += length;
};

var extmap = [];
extmap[1] = 0xd4;
extmap[2] = 0xd5;
extmap[4] = 0xd6;
extmap[8] = 0xd7;
extmap[16] = 0xd8;

var object = function (encoder, value) {
	var packer;
	if (value === null) return nil(encoder, value);
	if (Array.isArray(value)) return array(encoder, value);
	if (Buffer.isBuffer(value)) return bin(encoder, value);
	if (encoder.codec) {
		if (packer = encoder.codec.getPacker(value)) {
			return ext(encoder, packer(value));
		}
	}
	map(encoder, value);
};

var array = function (encoder, value) {
	// fixarray -- 0x90 - 0x9f
	// array 16 -- 0xdc
	// array 32 -- 0xdd
	var length = value.length;
	var type = (length < 16) ? (0x90 + length) : (length <= 0xFFFF) ? 0xdc : 0xdd;
	token[type](encoder, length);
	for (var i = 0; i < length; i++) {
		encode(encoder, value[i]);
	}
};

var bin = function (encoder, value) {
	// bin 8 -- 0xc4
	// bin 16 -- 0xc5
	// bin 32 -- 0xc6
	var length = value.length;
	var type = (length < 0xFF) ? 0xc4 : (length <= 0xFFFF) ? 0xc5 : 0xc6;
	token[type](encoder, length);
	encoder.send(value);
};

var ext = function (encoder, value) {
	// fixext 1 -- 0xd4
	// fixext 2 -- 0xd5
	// fixext 4 -- 0xd6
	// fixext 8 -- 0xd7
	// fixext 16 -- 0xd8
	// ext 8 -- 0xc7
	// ext 16 -- 0xc8
	// ext 32 -- 0xc9
	var buffer = value.buffer;
	var length = buffer.length;
	var type = extmap[length] || ((length < 0xFF) ? 0xc7 : (length <= 0xFFFF) ? 0xc8 : 0xc9);
	token[type](encoder, length);
	uint8[value.type](encoder);
	encoder.send(buffer);
};

var map = function (encoder, value) {
	// fixmap -- 0x80 - 0x8f
	// map 16 -- 0xde
	// map 32 -- 0xdf
	var keys = Object.keys(value);
	var length = keys.length;
	var type = (length < 16) ? (0x80 + length) : (length <= 0xFFFF) ? 0xde : 0xdf;
	token[type](encoder, length);
	keys.forEach(function (key) {
		encode(encoder, key);
		encode(encoder, value[key]);
	});
};

var type = {
	boolean: boolean,
	function: nil,
	number: number,
	object: object,
	string: string,
	symbol: nil,
	undefined: nil
};
