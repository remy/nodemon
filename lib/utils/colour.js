/**
 * Encodes a string in a colour: red, yellow or green
 * @param  {String} c   colour to highlight in
 * @param  {String} str the string to encode
 * @return {String}     coloured string for terminal printing
 */
function colour(c, str) {
  return colour[c] + str + '\x1B[39m';
}

colour.red = '\x1B[31m';
colour.yellow = '\x1B[33m';
colour.green = '\x1B[32m';

module.exports = colour;