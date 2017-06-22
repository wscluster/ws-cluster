/*!
 * Utils Module
 * @author Lanfei
 * @module util
 */

function isType(type) {
	return function (obj) {
		return Object.prototype.toString.call(obj) === '[object ' + type + ']';
	};
}

exports.isObject = isType('Object');
exports.isString = isType('String');
exports.isNumber = isType('Number');
exports.isBoolean = isType('Boolean');
exports.isFunction = isType('Function');
exports.isArguments = isType('Arguments');
exports.isArray = Array.isArray;

exports.forEach = function (target, iterator, thisObj) {
	var i, l;
	if (Array.isArray(target) || exports.isArguments(target)) {
		for (i = 0, l = target.length; i < l; ++i) {
			if (iterator.call(thisObj, target[i], i, target) === false) {
				break;
			}
		}
	} else if (exports.isObject(target)) {
		var key,
			keys = Object.keys(target);
		for (i = 0, l = keys.length; i < l; ++i) {
			key = keys[i];
			if (iterator.call(thisObj, target[key], key, target) === false) {
				break;
			}
		}
	} else if (target !== undefined) {
		iterator.call(thisObj, target, 0, target);
	}
};
