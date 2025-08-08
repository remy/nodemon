const repl = require('repl');

// Start Express or something, when it's up, startup the REPL
const rpl = repl.start('REPL> ');

rpl.commands['.hello'] = {
  help: 'Hello world command.',
  action: function() {
    console.log('Hello world.');
  }
};