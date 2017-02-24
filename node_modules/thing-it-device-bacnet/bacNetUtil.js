/**
 * Created by backes on 18.01.17.
 */

"use strict";

module.exports = {};

exports.toHexStr = function(num, l) {
    return  ("0x"+ (num+0x10000).toString(16).substr(-l).toUpperCase());
};


exports.isBitSet = function(num, bitPos) {
    var mask = 1 << (bitPos-1); // gets the bit

    if ((num & mask) != 0) {
        return true;
    } else {
        return false;
    }
};