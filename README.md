# msgpack-typed-numbers [![Build Status](https://travis-ci.org/mattbishop/msgpack-typed-numbers.svg?branch=master)](https://travis-ci.org/mattbishop/msgpack-typed-numbers)

A minimalistic [MessagePack](http://msgpack.org/index.html) encoder and decoder for JavaScript. Supports typed numbers for 64-bit longs and consistent floating point values. Based on Joshua Wise's excellent [tiny-msgpack](https://github.com/JoshuaWise/tiny-msgpack) project.

- Tiny Size (2.63 kB minified and gzipped)
- Fast performance (Slightly faster than [msgpack-lite](https://github.com/kawanet/msgpack-lite/))
- Supports true 64-bit longs and consistent floating-point values
- Extension support
- No other bells or whistles

By default, `msgpack` can encode numbers, strings, booleans, nulls, arrays, objects, and binary data (`Uint8Array`). However, additional types can be registered by using [extensions](#extensions).

## Installation

```bash
npm install --save msgpack-typed-numbers
```

## Usage

```js
var msgpack = require('msgpack-typed-numbers');

var uint8array = msgpack.encode({foo: 'bar', baz: 123});
var object = msgpack.decode(uint8array);
```

## Typed Numbers

Javascript numbers reqpresent both integer and floating point values. This poses two problems for msgpack:
 
1. integer values > 53 bits cannot be represented
2. floating point values with whole numbers (ie. 1.0) are indistinguishable from integers, so msgpack treats them as integers

When one is using msgpack to send and receive data with other systems that do not have this limitation, like Python or Java, these limitations can ruin the data being transmitted. `msgpack-with-numbers` provides a way to specify Float and Long values to encode and decode numeric data correctly.

### Floating-Point Numbers

To used typed Float values, wrap the value in a `msgpack.Float` class.

```js
const msgpack = require('msgpack-typed-numbers');

// NOTE: integer number input
const float1 = new msgpack.Float(100); 
const float2 = new msgpack.Float(1.1);

const uint8array = msgpack.encode({
  floatField1: float1, 
  floatField2: float2
});

// float1 is encoed as a 32-bit float
// float2 is encoded as a 64-bit float
const obj = msgpack.decode(uint8array);
console.log(obj);
/* =>
{ floatField1: 100, floatField2: 1.1 }
*/
```

### Long Numbers

To use Long values, create a Long value with the [Long](https://www.npmjs.com/package/long) library.

```js
const msgpack = require('msgpack-typed-numbers');
const Long = require('long');

// max 64-bit number
const long1 = Long.fromBits(-1, 0x7fffffff);
const long2 = Long.fromNumber(-100);

const uint8array = msgpack.encode({
  longField1: long1, 
  longField2: long2, 
});

// long1 is encoded as a 64-bit uint
// long2 is encoded as an 8-bit int
var obj = msgpack.decode(uint8array);
console.log(obj);
/* =>
{ longField1: Long { low: -1, high: 2147483647, unsigned: false },
  longField2: -100 }
*/
```

The use of Long and Float are optional. One can still pass primitive JS numbers and they will be treated as variant-type numeric data.

## Extensions

```js
var msgpack = require('msgpack-typed-numbers');
var codec = new msgpack.Codec;

function encodeDate(date) {
  return msgpack.encode(+date);
}
function decodeDate(uint8array) {
  return new Date(msgpack.decode(uint8array));
}
codec.register(0x42, Date, encodeDate, decodeDate);

var uint8array = msgpack.encode({timestamp: new Date}, codec);
var object = msgpack.decode(uint8array, codec);
console.log(object.timestamp instanceof Date); // => true
```

## Browser Support

In the browser, `msgpack-typed-numbers` requires the [Encoding API](https://developer.mozilla.org/en-US/docs/Web/API/Encoding_API), which is currently only implemented by Chrome and Firefox. However, if you polyfill it, this package is supported by the following browsers:

- Chrome 9+
- Firefox 15+
- Safari 5.1+
- Opera 12.1+
- Internet Explorer 10+

## Zero copy

In the [MessagePack](http://msgpack.org/index.html) format, binary data is encoded as... binary data! To maximize performance, `msgpack-typed-numbers` does not copy binary data when encoding or decoding it. So after decoding, the contents of a returned `Uint8Array` can be affected by modifying the input `Uint8Array` (the same can happen with encoding).

## License

[MIT](https://github.com/mattbishop/tiny-msgpack/blob/master/LICENSE)
