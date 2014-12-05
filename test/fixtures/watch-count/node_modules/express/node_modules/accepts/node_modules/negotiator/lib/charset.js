module.exports = preferredCharsets;
preferredCharsets.preferredCharsets = preferredCharsets;

function parseAcceptCharset(accept) {
  return accept.split(',').map(function(e, i) {
    return parseCharset(e.trim(), i);
  }).filter(function(e) {
    return e;
  });
}

function parseCharset(s, i) {
  var match = s.match(/^\s*(\S+?)\s*(?:;(.*))?$/);
  if (!match) return null;

  var charset = match[1];
  var q = 1;
  if (match[2]) {
    var params = match[2].split(';')
    for (var i = 0; i < params.length; i ++) {
      var p = params[i].trim().split('=');
      if (p[0] === 'q') {
        q = parseFloat(p[1]);
        break;
      }
    }
  }

  return {
    charset: charset,
    q: q,
    i: i
  };
}

function getCharsetPriority(charset, accepted) {
  return (accepted.map(function(a) {
    return specify(charset, a);
  }).filter(Boolean).sort(function (a, b) {
    if(a.s == b.s) {
      return a.q > b.q ? -1 : 1;
    } else {
      return a.s > b.s ? -1 : 1;
    }
  })[0] || {s: 0, q:0});
}

function specify(charset, spec) {
  var s = 0;
  if(spec.charset.toLowerCase() === charset.toLowerCase()){
    s |= 1;
  } else if (spec.charset !== '*' ) {
    return null
  }

  return {
    s: s,
    q: spec.q,
  }
}

function preferredCharsets(accept, provided) {
  // RFC 2616 sec 14.2: no header = *
  accept = parseAcceptCharset(accept === undefined ? '*' : accept || '');
  if (provided) {
    return provided.map(function(type) {
      return [type, getCharsetPriority(type, accept)];
    }).filter(function(pair) {
      return pair[1].q > 0;
    }).sort(function(a, b) {
      var pa = a[1];
      var pb = b[1];
      return (pb.q - pa.q) || (pb.s - pa.s) || (pa.i - pb.i);
    }).map(function(pair) {
      return pair[0];
    });
  } else {
    return accept.sort(function (a, b) {
      // revsort
      return (b.q - a.q) || (a.i - b.i);
    }).filter(function(type) {
      return type.q > 0;
    }).map(function(type) {
      return type.charset;
    });
  }
}
