'use strict';
/*global describe:true, it: true */
const assert = require('assert'),
  match = require('../../lib/monitor/match'),
  config = require('../../lib/config'),
  path = require('path'),
  fs = require('fs'),
  nodemonUtils = require('../../lib/utils'),
  defaults = require('../../lib/config/defaults'),
  utils = require('../utils'),
  watch = require('../../lib/monitor/watch'),
  merge = nodemonUtils.merge;

describe('match', function () {
  const monitor = [
    '!.git',
    '!node_modules/*',
    '!public/*',
    '!npm-debug.log',
    '!node_modules/*',
    'views/server/*',
    '!*.coffee',
  ];

  it('should resolve ./ in positive match', () => {
    const cwd = process.cwd();
    const res = match(
      [cwd + '/app.nodemon'],
      ['./*.nodemon', '!**/dir/*.nodemon'],
      'js,mjs,json,nodemon'
    );

    assert.equal(res.result.length, 1, JSON.stringify(res));
  });

  it('should resolve ./ in positive match (miss test)', () => {
    const cwd = process.cwd();
    const res = match(
      [cwd + '/dir/app.nodemon'],
      ['./*.nodemon', '!**/dir/*.nodemon'],
      'js,mjs,json,nodemon'
    );

    assert.equal(res.result.length, 0, JSON.stringify(res));
    assert.equal(res.ignored, 1, JSON.stringify(res));
  });

  it('should resolve ./ in negative match (hit test)', () => {
    const cwd = process.cwd();
    const res = match(
      [cwd + '/app.nodemon'],
      ['!./*.nodemon', '**/dir/*.nodemon'],
      'js,mjs,json,nodemon'
    );

    assert.equal(res.result.length, 0, JSON.stringify(res));
    assert.equal(res.ignored, 1, JSON.stringify(res));
  });

  it('should handle lots of **s!', () => {
    const res = match(
      ['test/fixtures/app.js'],
      [
        '*.*',
        '!**/.git/**',
        '!**/.nyc_output/**',
        '!**/.sass-cache/**',
        '!**/bower_components/**',
        '!**/coverage/**',
      ],
      'js,mjs,json'
    );

    assert.equal(res.result.length, 1, JSON.stringify(res));
  });

  it('should match zero files', function () {
    const files = [
      'views/server/remy.coffee',
      'random.coffee',
      '/User/remy/app/server/foo.coffee',
    ];

    const results = match(files, monitor); // ignoring extension support
    assert(results.result.length === 0, 'matched ' + results.result.length);
  });

  it('should match one file', function () {
    const files = [
      'views/server/remy.js',
      'random.coffee',
      '/User/remy/app/server/foo.coffee',
    ];

    const results = match(files, monitor);
    assert(results.result.length === 1, 'matched ' + results.result.length);
  });

  it('should match two files', function () {
    const files = [
      'views/server/test.js',
      'views/server/test2.js',
      'views/server/test.coffee',
    ];

    const results = match(files, monitor);
    assert(results.result.length === 2, 'matched ' + results.result.length);
  });

  it('should match one file', function () {
    const files = [
      'views/server/remy.js',
      'views/server/ignore.js',
      'random.coffee',
      '/User/remy/app/server/foo.coffee',
    ];
    monitor.push('!views/server/ignore.js');

    const results = match(files, monitor);
    assert(results.result.length === 1, 'matched ' + results.result.length);
  });

  it('should apply *.js to any js file', function () {
    const files = [utils.appjs];

    const result = match(files, ['*.*'], 'js');

    assert.deepEqual(result.result, files, 'file returned from match, matches');
    assert(result.ignored === 0, 'no files were ignored');
    assert(result.watched === files.length, 'a single file was matched');
  });

  it('should ignore .coffee if watching *.js', function () {
    const files = [utils.appcoffee];

    const result = match(files, ['*.*'], 'js');

    assert.deepEqual(
      result.result,
      [],
      'no results returned: ' + result.result
    );
  });

  it('should match .coffee if watching *.js & *.coffee', function (done) {
    config.load(
      {
        ext: 'js coffee',
      },
      function (config) {
        const files = [utils.appcoffee];

        const result = match(
          files,
          config.options.monitor,
          config.options.execOptions.ext
        );

        assert.deepEqual(result.result, files, 'coffee file matched');
        assert(result.ignored === 0, '0 files ignored');
        done();
      }
    );
  });

  it('should ignore nodemon default rules', function (done) {
    config.load({ ext: '*.js' }, function (config) {
      const files = [utils.appjs, path.join(__dirname, '/.git/foo.js')];

      const result = match(
        files,
        config.options.monitor,
        config.options.execOptions.ext
      );

      assert.deepEqual(result.result, files.slice(0, 1), 'first file matched');
      assert(result.ignored === 1, '.git file was ignored');
      assert(result.watched === 1, 'a single file was matched');

      done();
    });
  });

  it('should ignore directories', function (done) {
    config.load(
      {
        ext: 'js',
        ignore: 'test/fixtures',
      },
      function (config) {
        const files = [utils.appjs];

        const result = match(
          files,
          config.options.monitor,
          config.options.execOptions.ext
        );

        assert.deepEqual(result.result, [], 'should be no files matched');
        done();
      }
    );
  });

  it('should check all directories by default', function (done) {
    config.load(
      {
        ext: 'js',
      },
      function (config) {
        const files = [utils.appjs];
        const result = match(
          files,
          config.options.monitor,
          config.options.execOptions.ext
        );
        assert.deepEqual(result.result, files, 'results should match');
        done();
      }
    );
  });

  it('should be specific about directories', function (done) {
    config.load(
      {
        ext: 'js md pug',
        watch: ['lib'],
      },
      function (config) {
        const files = [utils.appjs];
        const result = match(
          files,
          config.options.monitor,
          config.options.execOptions.ext
        );

        assert.deepEqual(result.result, [], 'no results');
        done();
      }
    );
  });

  it('should not match coffee when monitoring just js', function (done) {
    config.load(
      {
        script: utils.appjs,
      },
      function (config) {
        const result = match(
          [utils.appcoffee],
          config.options.monitor,
          config.options.execOptions.ext
        );

        assert.deepEqual(result.result, [], 'no results');
        done();
      }
    );
  });

  it('should ignore case when comparing paths on Windows', function () {
    if (!nodemonUtils.isWindows) {
      return;
    }
    const results = match(['C:\\TEST\\fixtures'], ['c:\\test\\fixtures']);
    assert(results.result.length === 1, 'matched ' + results.result.length);
  });
});

describe('validating files that cause restart', function () {
  it('should allow for relative paths outside of the cwd', function () {
    const cwd = process.cwd();
    const dir = cwd + '/test/fixtures/configs';
    process.chdir(dir);
    const filename = './watch-relative.json';
    let config = JSON.parse(fs.readFileSync(filename));
    const settings = merge(config, defaults);
    const script = path.resolve('../../../lib/__init__.py');

    settings.monitor = match.rulesToMonitor(settings.watch, settings.ignore, {
      dirs: [],
      system: { useFind: true },
    });

    const matched = match(
      [script],
      settings.monitor,
      settings.ext.replace(' ', ',')
    );
    process.chdir(cwd);

    assert(
      matched.result.length === 1,
      'relative file matched: ' + matched.results
    );
  });

  it('should allow *.js to match at the top level', function () {
    const filename = path.join('test', 'fixtures', 'configs', 'top-level.json');
    let config = JSON.parse(fs.readFileSync(filename));
    const settings = merge(config, defaults);
    const script = path.resolve('app.js');

    settings.monitor = match.rulesToMonitor(settings.watch, settings.ignore, {
      dirs: [],
      system: { useFind: true },
    });

    const matched = match(
      [script],
      settings.monitor,
      settings.ext.replace(' ', ',')
    );
    assert(matched.result.length === 1, 'found match ' + matched.results);
  });

  it('should allow for simple star rule: public/*', function () {
    const filename = path.join('test', 'fixtures', 'configs', 'public-star.json');
    const config = JSON.parse(fs.readFileSync(filename));
    const settings = merge(config, defaults);
    const script = 'public/js/chrome.save.js';

    settings.monitor = match.rulesToMonitor(settings.watch, settings.ignore, {
      dirs: [],
      system: { useFind: true },
    });

    const matched = match(
      [script],
      settings.monitor,
      settings.ext.replace(' ', ',')
    );
    assert(matched.result.length === 0, 'public/* ignored: ' + matched.results);
  });

  it('should allow for relative paths with extensions', function () {
    const cwd = process.cwd();
    const dir = cwd + '/test/fixtures/configs';
    process.chdir(dir);
    const filename = './watch-relative-filter.json';
    const config = JSON.parse(fs.readFileSync(filename));
    const settings = merge(config, defaults);
    const script = path.resolve('../jsbin/scripts.json');

    settings.monitor = match.rulesToMonitor(settings.watch, settings.ignore, {
      dirs: [],
      system: { useFind: true },
    });

    const matched = match(
      [script],
      settings.monitor,
      settings.ext.replace(' ', ',')
    );
    process.chdir(cwd);

    assert(
      matched.result.length === 1,
      'relative file matched: ' + matched.results
    );
  });
});

describe('match rule parser', function () {
  it('should support "--watch ."', function () {
    const config = { watch: '.' };
    const settings = merge(config, defaults);
    const script = 'index.js';

    settings.monitor = match.rulesToMonitor(settings.watch, [], {
      dirs: [],
      system: { useFind: true },
    });

    assert(
      settings.monitor[0] === '*.*',
      'path resolved: ' + settings.monitor[0]
    );
    const matched = match([script], settings.monitor, 'js');
    assert(matched.result.length === 1, 'no file matched');
  });

  it('should support "--watch .*"', function () {
    const config = { watch: '.*' };
    const settings = merge(config, defaults);
    const script = 'index.js';

    settings.monitor = match.rulesToMonitor(settings.watch, [], {
      dirs: [],
      system: { useFind: true },
    });

    assert(
      settings.monitor[0] === '*.*',
      'path resolved: ' + settings.monitor[0]
    );
    const matched = match([script], settings.monitor, 'js');
    assert(matched.result.length === 1, 'no file matched');
  });

  it('should support "--watch <single file>"', function () {
    const config = { watch: 'config.json' };
    const settings = merge(config, defaults);

    settings.monitor = match.rulesToMonitor(settings.watch, [], {
      dirs: [],
      system: { useFind: true },
    });

    const matched = match(['/some/path/to/config.json'], settings.monitor, 'js');
    assert(matched.result.length === 1, 'no file matched');
  });

  it('should support "--watch /some/path/*/config.json"', function () {
    const config = { watch: '/*/config.json' };
    const settings = merge(config, defaults);

    settings.monitor = match.rulesToMonitor(settings.watch, [], {
      dirs: [],
      system: { useFind: true },
    });

    const matched = match(['/some/path/to/config.json'], settings.monitor, 'js');
    assert(matched.result.length === 1, 'no file matched');
  });

  it('should support "--watch *.*"', function () {
    const config = { watch: '*.*' };
    const settings = merge(config, defaults);
    const script = 'index.js';

    settings.monitor = match.rulesToMonitor(settings.watch, [], {
      dirs: [],
      system: { useFind: true },
    });

    assert(
      settings.monitor[0] === '*.*',
      'path resolved: ' + settings.monitor[0]
    );
    const matched = match([script], settings.monitor, 'js');
    assert(matched.result.length === 1, 'no file matched');
  });

  it('should support "--watch .."', function () {
    // make sure we're in a deep enough directory
    const cwd = process.cwd();
    process.chdir('./test/fixtures/');
    const pwd = process.cwd();
    const config = { watch: '..' };
    const settings = merge(config, defaults);
    const script = pwd + 'index.js';

    settings.monitor = match.rulesToMonitor(settings.watch, [], {
      dirs: [],
      system: { useFind: true },
    });

    process.chdir(cwd);

    assert(
      settings.monitor[0] === path.resolve(pwd, '..') + '/**/*',
      'path resolved: ' + settings.monitor[0]
    );
    const matched = match([script], settings.monitor, 'js');
    assert(matched.result.length === 1, 'no file matched');
  });
});

describe('watcher', function () {
  afterEach(function (done) {
    config.reset();
    setTimeout(() => {
      watch.resetWatchers();
      done();
    }, 0);
  });

  it('should not crash if ignoreRoot is an empty array', function (done) {
    config.load(
      {
        watch: ['test/fixtures/app.js'],
        ignoreRoot: [],
      },
      function (config) {
        return watch
          .watch()
          .then(function () {
            done();
          })
          .catch(done);
      }
    );
  });

  it('should not match a dotfile unless explicitly asked to', function (done) {
    config.load(
      {
        watch: ['test/fixtures/*'],
      },
      function (config) {
        return watch
          .watch()
          .then(function (files) {
            const withDotfile = files.filter(function (file) {
              return /test\/fixtures\/\.dotfile$/.test(file);
            });
            assert.deepEqual(
              withDotfile.length,
              0,
              'should not contain .dotfile'
            );
            done();
          })
          .catch(done);
      }
    );
  });

  it('should match a dotfile if explicitly asked to', function (done) {
    config.load(
      {
        watch: ['test/fixtures/.dotfile'],
      },
      function (config) {
        return watch
          .watch()
          .then(function (files) {
            assert.deepEqual(
              files.filter((f) => f.endsWith('.dotfile')).length,
              1,
              'should contain .dotfile'
            );
            done();
          })
          .catch(done);
      }
    );
  });

  it('should match a dotfolder if explicitly asked to', function (done) {
    config.load(
      {
        watch: ['test/fixtures/.dotfolder'],
      },
      function (config) {
        return watch
          .watch()
          .then(function (files) {
            assert.deepEqual(
              files.length,
              3,
              'file lists should contain .dotfolder files'
            );
            done();
          })
          .catch(done);
      }
    );
  });

  it('should watch relative paths', function () {
    const monitor = match.rulesToMonitor(['./http.js'], [], {
      dirs: [],
    });

    const matched = match(['http.js'], monitor, 'js,mjs,json');
    assert(matched.result.length === 1, 'found match ' + matched.results);
  });

  it('should ignore relative directories', () => {
    const monitor = match.rulesToMonitor([], ['node_modules/*', '**/logs/*']);

    const matched = match(['logs/a'], monitor, 'js,mjs,json');

    assert(
      matched.ignored === 1 && matched.result.length === 0,
      JSON.stringify(matched)
    );
  });
});
