'use strict';

function Float (value) {
	this.value = value;
}

Float.prototype.isSinglePrecision = function isSinglePrecision () {
	return this.value === Math.fround(this.value);
}

Float.prototype.__isFloat__;

Object.defineProperty(Float.prototype, '__isFloat__', {value: true});

Float.isFloat = function isFloat (obj) {
	return (obj && obj['__isFloat__']) === true;
}

module.exports = Float;
