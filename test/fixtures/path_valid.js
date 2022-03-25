#!/usr/bin/env node
const process = require('process');
const path = require('path');

const isWindows = process.platform === 'win32';
const re = isWindows ? /^[A-Z]:(?:\\[\w&_ .()\-@]+)+\\?$/i : /^(?:\/[\w&_ .()\-@]+)+\/?$/i

console.log(process.env.PATH.split(isWindows?';':':').
    filter( f => f !=='').map( folder => { let t = path.normalize(folder).match(re); if (!t) {console.log(folder)}; return t;}
).reduce( (a,b) => a && b , true)? "OK":"FAIL");


