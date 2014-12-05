module.exports = preferredLanguages;
preferredLanguages.preferredLanguages = preferredLanguages;

function parseAcceptLanguage(accept) {
  return accept.split(',').map(function(e, i) {
    return parseLanguage(e.trim(), i);
  }).filter(function(e) {
    return e;
  });
}

function parseLanguage(s, i) {
  var match = s.match(/^\s*(\S+?)(?:-(\S+?))?\s*(?:;(.*))?$/);
  if (!match) return null;

  var prefix = match[1],
      suffix = match[2],
      full = prefix;

  if (suffix) full += "-" + suffix;

  var q = 1;
  if (match[3]) {
    var params = match[3].split(';')
    for (var i = 0; i < params.length; i ++) {
      var p = params[i].split('=');
      if (p[0] === 'q') q = parseFloat(p[1]);
    }
  }

  return {
    prefix: prefix,
    suffix: suffix,
    q: q,
    i: i,
    full: full
  };
}

function getLanguagePriority(language, accepted) {
  return (accepted.map(function(a){
    return specify(language, a);
  }).filter(Boolean).sort(function (a, b) {
    if(a.s == b.s) {
      return a.q > b.q ? -1 : 1;
    } else {
      return a.s > b.s ? -1 : 1;
    }
  })[0] || {s: 0, q: 0});
}

function specify(language, spec) {
  var p = parseLanguage(language)
  if (!p) return null;
  var s = 0;
  if(spec.full.toLowerCase() === p.full.toLowerCase()){
    s |= 4;
  } else if (spec.prefix.toLowerCase() === p.full.toLowerCase()) {
    s |= 2;
  } else if (spec.full.toLowerCase() === p.prefix.toLowerCase()) {
    s |= 1;
  } else if (spec.full !== '*' ) {
    return null
  }

  return {
    s: s,
    q: spec.q,
  }
};

function preferredLanguages(accept, provided) {
  // RFC 2616 sec 14.4: no header = *
  accept = parseAcceptLanguage(accept === undefined ? '*' : accept || '');
  if (provided) {

    var ret = provided.map(function(type) {
      return [type, getLanguagePriority(type, accept)];
    }).filter(function(pair) {
      return pair[1].q > 0;
    }).sort(function(a, b) {
      var pa = a[1];
      var pb = b[1];
      return (pb.q - pa.q) || (pb.s - pa.s) || (pa.i - pb.i);
    }).map(function(pair) {
      return pair[0];
    });
    return ret;

  } else {
    return accept.sort(function (a, b) {
      // revsort
      return (b.q - a.q) || (a.i - b.i);
    }).filter(function(type) {
      return type.q > 0;
    }).map(function(type) {
      return type.full;
    });
  }
}
