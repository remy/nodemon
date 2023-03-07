import Terminal from "../terminal/terminal.component";
import "./section.styles.css";

const Section = () => {
  return (
    <div className="section-container">
      <section id="section">
        <h1 className="name-title">nodemon</h1>
        <p className="text">
          nodemon is a tool that helps develop Node.js based applications by
          automatically restarting the node application when file changes in the
          directory are detected. nodemon does not require any additional
          changes to your code or method of development.
        </p>
        <p className="text">
          nodemon is a replacement wrapper for <strong>node</strong>. To use{" "}
          <strong>nodemon</strong>, replace the word <strong>node</strong> on
          the command line when executing your script.
        </p>

        <h1 className="name-title">Installation</h1>

        <p className="text">
          Either through cloning with git or by using npm (the recommended way):
        </p>
        <Terminal text="npm install -g nodemon" height={70} />
        <p className="text">
          And nodemon will be installed globally to your system path.
        </p>
        <p className="text">
          You can also install nodemon as a development dependency:
        </p>
        <Terminal text="npm install --save-dev nodemon" height={70} />
        <p className="text">
          With a local installation, nodemon will not be available in your
          system path or you can't use it directly from the command line.
          Instead, the local installation of nodemon can be run by calling it
          from within an npm script (such as <strong>npm start</strong>) or
          using <strong>npx nodemon</strong>.
        </p>

        <h1 className="name-text">Usage</h1>
        <p className="text">
          nodemon wraps your application, so you can pass all the arguments you
          would normally pass to your app:
        </p>
        <Terminal text="nodemon [your node app]" height={70} />
        <p className="text">
          For CLI options, use the <strong>-h</strong> (or{" "}
          <strong>--help</strong>) argument:
        </p>
        <Terminal text="nodemon -h" height={70} />
        <p className="text">
          Using nodemon is simple, if my application accepted a host and port as
          the arguments, I would start it as so:
        </p>
        <Terminal text="nodemon ./server.js localhost 8080" height={70} />
        <p className="text">
          Any output from this script is prefixed with{" "}
          <strong>[nodemon]</strong>, otherwise all output from your
          application, errors included, will be echoed out as expected.
        </p>

        <p className="text">
          You can also pass the <strong>inspect</strong> flag to node through
          the command line as you would normally:
        </p>
        <Terminal text="nodemon --inspect ./server.js 80" height={70} />

        <p className="text">
          If you have a <strong>package.json</strong> file for your app, you can
          omit the main script entirely and nodemon will read the{" "}
          <strong>package.json</strong> for the <strong>main</strong> property
          and use that value as the app (
          <a href="https://github.com/remy/nodemon/issues/14">ref</a>).
        </p>
        <p className="text">
          nodemon will also search for the <strong>script.start</strong>{" "}
          property in <strong>package.json</strong> (as of nodemon 1.1.x).
        </p>

        <p className="text">
          Also check out the{" "}
          <a href="https://github.com/remy/nodemon/blob/master/faq.md">FAQ</a>{" "}
          or <a href="https://github.com/remy/nodemon/issues">issues</a> for
          nodemon.
        </p>
        <h1 className="name-title">Automatic re-running</h1>
        <p className="text">
          nodemon was originally written to restart hanging processes such as
          web servers, but now supports apps that cleanly exit. If your script
          exits cleanly, nodemon will continue to monitor the directory (or
          directories) and restart the script if there are any changes.
        </p>
        <h1>Manual restarting</h1>
        <p className="text">
          Whilst nodemon is running, if you need to manually restart your
          application, instead of stopping and restart nodemon, you can type{" "}
          <strong>rs</strong> with a carriage return, and nodemon will restart
          your process.
        </p>
        <h1 className="name-title" id="nodemonconfig">
          Config files
        </h1>
        <p className="text">
          nodemon supports local and global configuration files. These are
          usually named nodemon.json and can be located in the current working
          directory or in your home directory. An alternative local
          configuration file can be specified with the{" "}
          <strong>--config file</strong> option.
        </p>
        <p className="text">
          The specificity is as follows, so that a command line argument will
          always override the config file settings:
        </p>
        <ul>
          <li className="text">
            <span>command line arguments</span>
          </li>
          <li className="text">
            <span>local config</span>
          </li>
          <li className="text">
            <span>global config</span>
          </li>
        </ul>
        <p className="text">
          A config file can take any of the command line arguments as JSON key
          values, for example:
        </p>
        <Terminal
          text={`{\n  "verbose": true,\n  "ignore": ["*.test.js", "**/fixtures/**"],\n  "execMap": { \n    "rb": "ruby",\n    "pde": "processing --sketch={{pwd}} --run" \n  }\n}`}
          height={190}
        />
        <p className="text">
          The above nodemon.json file might be my global config so that I have
          support for ruby files and processing files, and I can run nodemon
          demo.pde and nodemon will automatically know how to run the script
          even though out of the box support for processing scripts.
        </p>
        <p className="text">
          A further example of options can be seen in{" "}
          <a href="https://github.com/remy/nodemon/blob/master/doc/sample-nodemon.md">
            sample-nodemon.md
          </a>
        </p>
        <h1 className="name-title">package.json</h1>
        <p className="text">
          If you want to keep all your package configurations in one place,
          nodemon supports using <strong>package.json</strong> for
          configuration. Specify the config in the same format as you would for
          a config file but under <strong>nodemonConfig</strong> in the{" "}
          <strong>package.json</strong> file, for example, take the following{" "}
          <strong>package.json</strong>:
        </p>
        <Terminal
          text={`{\n   "name": "nodemon",\n   "homepage": "http://nodemon.io",\n   "...": "... other standard package.json values",\n   "nodemonConfig": {\n     "ignore": ["**/test/**", "**/docs/**"],\n     "delay": 2500\n   }\n}`}
          height={210}
        />
        <p className="text">
          Note that if you specify a <strong>--config</strong> file or provide a
          local <strong>nodemon.json</strong> any <strong>package.json</strong>{" "}
          config is ignored.
        </p>

        <p className="text">
          This section needs better documentation, but for now you can also see{" "}
          <strong>nodemon --help config</strong> (
          <a href="https://github.com/remy/nodemon/blob/master/doc/cli/config.txt">
            also here
          </a>
          ).
        </p>
        <h1 className="name-title">Nodemon as a required module</h1>
        <p className="text">
          Nodemon (as of 1.0.0) also works as a required module. At present, you
          can only require nodemon in to your project once (as there are static
          config variables), but you can re-run with new settings for a
          different application to monitor.
        </p>
        <p className="text">
          By requiring nodemon, you can extend it's functionality. Below is a
          simple example of using nodemon in your project:
        </p>
        <Terminal
          text={
            "const nodemon = require('nodemon');\n\nnodemon({\n  script: 'app.js',\n  ext: 'js json'\n});\n\nnodemon.on('start', function () {\n  console.log('App has started');\n}).on('quit', function () {\n  console.log('App has quit');\n  process.exit(); \n}).on('restart', function (files) {\n   console.log('App restarted due to: ', files);\n});"
          }
          height={340}
        />
        <p className="text">
          Nodemon will emit a number of events by default, and when in verbose
          mode will also emit a log{" "}
          <a href="https://github.com/remy/nodemon/blob/master/doc/events.md">
            event
          </a>{" "}
          (which matches what the <strong>nodemon</strong> cli tool echos).
        </p>
        <h1 className="name-title">Arguments</h1>
        <p className="text">
          The <strong>nodemon</strong> function takes either an object (that
          matches the <a href="#nodemonconfig">nodemon config</a>) or can take a
          string that matches the arguments that would be used on the command
          line:
        </p>
        <Terminal
          text={`const nodemon = require('nodemon');\n\nnodemon('-e "js json" app.js');`}
          height={100}
        />
        <h1 className="name-title">Methods & Properties</h1>
        <p className="text">
          The <strong>nodemon</strong> object also has a few methods and
          properties. Some are exposed to help with tests, but have been listed
          here for completeness:
        </p>
        <h2 className="name-title">Event handling</h2>
        <p className="text">
          This is the event emitter bus that exists inside nodemon exposed at
          the top level module (ie. it's the <strong>events</strong> api):
        </p>
        <ul>
          <li>
            <strong className="text">nodemon.on(event, fn)</strong>
          </li>
          <li>
            <strong className="text">nodemon.addListener(event, fn)</strong>
          </li>
          <li>
            <strong className="text">nodemon.once(event, fn)</strong>
          </li>
          <li>
            <strong className="text">nodemon.emit(event)</strong>
          </li>
          <li>
            <strong className="text">
              nodemon.removeAllListeners([event])
            </strong>
          </li>
        </ul>
        <p className="text">
          Note: there's no <strong>removeListener</strong> (happy to take a pull
          request if it's needed).
        </p>
        <h3 className="name-title">Test utilities</h3>
        <ul>
          <li>
            <strong className="text">nodemon.reset()</strong>{" "}
            <p className="text">
              - reverts nodemon's internal state to a clean slate
            </p>
          </li>
          <li>
            <strong className="text">nodemon.config</strong>{" "}
            <p className="text">
              - a reference to the internal config nodemon uses
            </p>
          </li>
        </ul>
        <h1 className="name-title">Using nodemon as child process</h1>
        <p className="text">
          Please see{" "}
          <a href="https://github.com/remy/nodemon/blob/main/doc/events.md#Using_nodemon_as_child_process">
            doc/events.md
          </a>
        </p>
        <h1 className="name-title">Running non-node scripts</h1>
        <p className="text">
          nodemon can also be used to execute and monitor other programs.
          nodemon will read the file extension of the script being run and
          monitor that extension instead of <strong>.js</strong> if there's no
          <strong>nodemon.json</strong>:
        </p>
        <Terminal text={`nodemon --exec "python -v" ./app.py`} height={70} />
        <p className="text">
          Now nodemon will run <strong>app.py</strong> with python in verbose
          mode (note that if you're not passing args to the exec program, you
          don't need the quotes), and look for new or modified files with the{" "}
          <strong>.py</strong> extension.
        </p>
        <h3 className="name-title">Default executables</h3>
        <p className="text">
          Using the <strong>nodemon.json</strong> config file, you can define
          your own default executables using the <strong>execMap</strong>{" "}
          property. This is particularly useful if you're working with a
          language that isn't supported by default by nodemon.
        </p>
        <p className="text">
          To add support for nodemon to know about the <strong>.pl</strong>{" "}
          extension (for Perl), the <strong>nodemon.json</strong> file would
          add:
        </p>
        <Terminal
          text={`{\n  "execMap": {\n  "pl": "perl"\n  }\n}`}
          height={140}
        />
        <p className="text">
          Now running the following, nodemon will know to use{" "}
          <strong>perl</strong> as the executable:
        </p>
        <Terminal text="nodemon script.pl" height={70} />
        <p className="text">
          It's generally recommended to use the global{" "}
          <strong>nodemon.json</strong> to add your own <strong>execMap</strong>{" "}
          options. However, if there's a common default that's missing, this can
          be merged in to the project so that nodemon supports it by default, by
          changing{" "}
          <a href="https://github.com/remy/nodemon/blob/master/lib/config/defaults.js">
            default.js
          </a>{" "}
          and sending a pull request.
        </p>
        <h1 className="name-title">Monitoring multiple directories</h1>
        <p className="text">
          By default nodemon monitors the current working directory. If you want
          to take control of that option, use the <strong>--watch</strong>{" "}
          option to add specific paths:
        </p>
        <Terminal
          text="nodemon --watch app --watch libs app/server.js"
          height={70}
        />
        <p className="text">
          Now nodemon will only restart if there are changes in the{" "}
          <strong>./app</strong> or
          <strong>./libs</strong> directory. By default nodemon will traverse
          sub-directories, so there's no need in explicitly including
          sub-directories.
        </p>
        <p className="text">
          Nodemon also supports unix globbing, e.g{" "}
          <strong>--watch './lib/*'</strong>. The globbing pattern must be
          quoted.
        </p>
        <h1 className="name-title">Specifying extension watch list</h1>
        <p className="text">
          By default, nodemon looks for files with the <strong>.js</strong>,{" "}
          <strong>.mjs</strong>, <strong>.coffee</strong>,{" "}
          <strong>.litcoffee</strong>, and <strong>.json</strong> extensions. If
          you use the <strong>--exec</strong> option and monitor{" "}
          <strong>app.py</strong> nodemon will monitor files with the extension
          of <strong>.py</strong>. However, you can specify your own list with
          the <strong>-e</strong> (or <strong>--ext</strong>) switch like so:
        </p>
        <Terminal text="nodemon -e js,pug" height={70} />
        <p className="text">
          Now nodemon will restart on any changes to files in the directory (or
          subdirectories) with the extensions <strong>.js</strong>,{" "}
          <strong>.pug</strong>.
        </p>
        <h1 className="name-title">Ignoring files</h1>
        <p className="text">
          By default, nodemon will only restart when a <strong>.js</strong>{" "}
          JavaScript file changes. In some cases you will want to ignore some
          specific files, directories or file patterns, to prevent nodemon from
          prematurely restarting your application.
        </p>
        <p className="text">This can be done via the command line:</p>
        <Terminal text="nodemon --ignore lib/ --ignore tests/" height={70} />
        <p className="text">Or specific files can be ignored:</p>
        <Terminal text="nodemon --ignore lib/app.js" height={70} />
        <p className="text">
          Patterns can also be ignored (but be sure to quote the arguments):
        </p>
        <Terminal text="nodemon --ignore 'lib/*.js'" height={70} />
        <p className="text">
          Important the ignore rules are patterns matched to the full absolute
          path, and this determines how many files are monitored. If using a
          wild card glob pattern, it needs to be used as <strong>**</strong> or
          omitted entirely. For example,{" "}
          <strong>nodemon --ignore '**/test/**'</strong> will work, whereas{" "}
          <strong>--ignore '*/test/*'</strong> will not.
        </p>
        <p className="text">
          Note that by default, nodemon will ignore the <strong>.git</strong>,{" "}
          <strong>node_modules</strong>, <strong>bower_components</strong>,{" "}
          <strong>.nyc_output</strong>, coverage and{" "}
          <strong>.sass-cache</strong> directories and add your ignored patterns
          to the list. If you want to indeed watch a directory like
          <strong>node_modules</strong>, you need to{" "}
          <a href="https://github.com/remy/nodemon/blob/master/faq.md#overriding-the-underlying-default-ignore-rules">
            override the underlying default ignore rules.
          </a>
        </p>
        <h1 className="name-title">Application isn't restarting</h1>
        <p className="text">
          In some networked environments (such as a container running nodemon
          reading across a mounted drive), you will need to use the{" "}
          <strong>legacyWatch: true</strong> which enables Chokidar's polling.
        </p>

        <p className="text">
          Via the CLI, use either <strong>--legacy-watch</strong> or{" "}
          <strong>-L</strong> for short:
        </p>
        <Terminal text="nodemon -L" height={70} />
        <p className="text">
          Though this should be a last resort as it will poll every file it can
          find.
        </p>
        <h1 className="name-title">Delaying restarting</h1>
        <p className="text">
          In some situations, you may want to wait until a number of files have
          changed. The timeout before checking for new file changes is 1 second.
          If you're uploading a number of files and it's taking some number of
          seconds, this could cause your app to restart multiple times
          unnecessarily.
        </p>

        <p className="text">
          To add an extra throttle, or delay restarting, use the{" "}
          <strong>--delay</strong>
          command:
        </p>

        <Terminal text="nodemon --delay 10 server.js" height={70} />
        <p className="text">
          For more precision, milliseconds can be specified. Either as a float:
        </p>
        <Terminal text="nodemon --delay 2.5 server.js" height={70} />
        <p className="text">Or using the time specifier (ms):</p>
        <Terminal text="nodemon --delay 2500ms server.js" height={70} />
        <p className="text">
          The delay figure is number of seconds (or milliseconds, if specified)
          to delay before restarting. So nodemon will only restart your app the
          given number of seconds after the last file change.
        </p>

        <p className="text">
          If you are setting this value in <strong>nodemon.json</strong>, the
          value will always be interpreted in milliseconds. E.g., the following
          are equivalent:
        </p>
        <Terminal
          text={`nodemon --delay 2.5\n\n{\n  "delay": 2500\n}`}
          height={140}
        />
        <h1 className="name-title">Gracefully reloading down your script</h1>
        <p className="text">
          It is possible to have nodemon send any signal that you specify to
          your application.
        </p>
        <Terminal text="nodemon --signal SIGHUP server.js" height={70} />
        <p className="text">
          Your application can handle the signal as follows.
        </p>
        <Terminal
          text={`process.once("SIGHUP", function () {\n  reloadSomeConfiguration();\n})`}
          height={100}
        />
        <p className="text">
          Please note that nodemon will send this signal to every process in the
          process tree.
        </p>
        <p className="text">
          If you are using <strong>cluster</strong>, then each workers (as well
          as the master) will receive the signal. If you wish to terminate all
          workers on receiving a <strong>SIGHUP</strong>, a common pattern is to
          catch the <strong>SIGHUP</strong> in the master, and forward{" "}
          <strong>SIGTERM</strong> to all workers, while ensuring that all
          workers ignore <strong>SIGHUP</strong>.
        </p>
        <Terminal
          text={`if (cluster.isMaster) {\n  process.on("SIGHUP", function () {\n     for (const worker of Object.values(cluster.workers)) {\n        worker.process.kill("SIGTERM");\n      }\n    });\n } else {\n   process.on("SIGHUP", function() {})\n }`}
          height={240}
        />
        <h1 className="name-title">Controlling shutdown of your script</h1>
        <p className="text">
          nodemon sends a kill signal to your application when it sees a file
          update. If you need to clean up on shutdown inside your script you can
          capture the kill signal and handle it yourself.
        </p>
        <p className="text">
          The following example will listen once for the{" "}
          <strong>SIGUSR2</strong> signal (used by nodemon to restart), run the
          clean up process and then kill itself for nodemon to continue control:
        </p>
        <Terminal
          text={`process.once('SIGUSR2', function () {\n    gracefulShutdown(function () {\n     process.kill(process.pid, 'SIGUSR2');\n  });\n});`}
          height={140}
        />
        <p className="text">
          Note that the <strong>process.kill</strong> is only called once your
          shutdown jobs are complete. Hat tip to{" "}
          <a href="http://www.benjiegillam.com/2011/08/node-js-clean-restart-and-faster-development-with-nodemon/">
            Benjie Gillam
          </a>{" "}
          for writing this technique up.
        </p>
        <h1 className="name-title">
          Triggering events when nodemon state changes
        </h1>
        <p className="text">
          If you want growl like notifications when nodemon restarts or to
          trigger an action when an event happens, then you can either{" "}
          <strong>require</strong>
          nodemon or add event actions to your <strong>
            nodemon.json
          </strong>{" "}
          file.
        </p>
        <p className="text">
          For example, to trigger a notification on a Mac when nodemon restarts,
          <strong>nodemon.json</strong> looks like this:
        </p>
        <Terminal
          text={`{\n  "events": {\n   "restart": "osascript -e 'display notification \"app restarted\" with title \"nodemon\"'"\n  }\n}`}
          height={130}
        />
        <p className="text">
          A full list of available events is listed on the{" "}
          <a href="https://github.com/remy/nodemon/wiki/Events#states">
            event states wiki
          </a>
          . Note that you can bind to both states and messages.
        </p>
        <h1 className="name-title">Pipe output to somewhere else</h1>
        <Terminal
          text={`nodemon({\n  script: ...,\n  stdout: false \n}).on('readable', function() {\n  this.stdout.pipe(fs.createWriteStream('output.txt'));\n  this.stderr.pipe(fs.createWriteStream('err.txt'));\n});`}
          height={180}
        />
        <p className="text">
          <strong>stdout: false</strong> important: this tells nodemon not to
          output to console
        </p>
        <p className="text">
          <strong>nodemon.on('readable', fn)</strong> the `readable` event
          indicates that data is ready to pick up
        </p>
        <h1 className="name-title">Using nodemon in your gulp workflow</h1>
        <p className="text">
          Check out the{" "}
          <a href="https://github.com/ChrisWren/grunt-nodemon">grunt-nodemon</a>{" "}
          plugin to integrate nodemon with the rest of your project's gulp
          workflow.
        </p>
        <h1 className="name-title">Using nodemon in your Grunt workflow</h1>
        <p className="text">
          Check out the{" "}
          <a href="https://github.com/ChrisWren/grunt-nodemon">grunt-nodemon</a>{" "}
          plugin to integrate nodemon with the rest of your project's grunt
          workflow.
        </p>
        <h1 className="name-title">Pronunciation</h1>
        <p>
          nodemon, is it pronounced: node-mon, no-demon or node-e-mon (like
          pokémon)?
        </p>
        <p className="text">
          Well...I've been asked this many times before. I like that I've been
          asked this before. There's been bets as to which one it actually is.
        </p>
        <p className="text">
          The answer is simple, but possibly frustrating. I'm not saying (how I
          pronounce it). It's up to you to call it as you like. All answers are
          correct :)
        </p>
        <h1 className="name-title">Design principles</h1>
        <ul>
          <li className="text">Fewer flags is better</li>
          <li className="text">Works across all platforms</li>
          <li className="text">Fewer features</li>
          <li className="text">Let individuals build on top of nodemon</li>
          <li className="text">Offer all CLI functionality as an API</li>
          <li className="text">Contributions must have and pass tests</li>
        </ul>
        <p className="text">
          Nodemon is not perfect, and CLI arguments has sprawled beyond where
          I'm completely happy, but perhaps it can be reduced a little one day.
        </p>
        <h1 className="name-title">FAQ</h1>
        <p className="text">
          See the{" "}
          <a href="https://github.com/remy/nodemon/blob/master/faq.md">FAQ</a>{" "}
          and please add your own questions if you think they would help others.
        </p>
        <h1 className="name-title">License</h1>
        <p className="text">
          By contributing to nodemon, you agree that your contributions will be
          licensed under its MIT license.
        </p>
        <p className="text">
          MIT{" "}
          <a href="http://rem.mit-license.org">http://rem.mit-license.org</a>
        </p>
      </section>
    </div>
  );
};

export default Section;
