import { ReactComponent as NodemonLogo } from "./../../assets/nodemon.svg";
import Terminal from "../terminal/terminal.component";

import Button from "../button/button.component";

import "./home.styles.css";

const Home = () => {
  return (
    <div className="container">
      <div className="header">
        <NodemonLogo className="logo" />
        <div className="icon-btn">
          <Button text="Start" logoImg="github" count="25k" />
          <Button text="Fork" logoImg="github" count="1.7k" />
          <Button text="Watch" logoImg="watch" count="263" />
        </div>

        <p className="title">Automatically Reload With nodemon</p>

        <a
          href="https://github.com/remy/nodemon"
          className="view-btn"
          target="_blank"
        >
          View on GitHub
        </a>
      </div>
      <div className="main-container">
        <main>
          <h1 className="name-title">nodemon</h1>
          <p className="text">
            nodemon is a tool that helps develop Node.js based applications by
            automatically restarting the node application when file changes in
            the directory are detected. nodemon does not require any additional
            changes to your code or method of development.
          </p>
          <p className="text">
            nodemon is a replacement wrapper for <strong>node</strong>. To use{" "}
            <strong>nodemon</strong>, replace the word <strong>node</strong> on
            the command line when executing your script.
          </p>

          <h1 className="name-title">Installation</h1>

          <p className="text">
            Either through cloning with git or by using npm (the recommended
            way):
          </p>
          <Terminal text="npm install -g nodemon" />
          <p className="text">
            And nodemon will be installed globally to your system path.
          </p>
          <p className="text">
            You can also install nodemon as a development dependency:
          </p>
          <Terminal text="npm install --save-dev nodemon" />
          <p className="text">
            With a local installation, nodemon will not be available in your
            system path or you can't use it directly from the command line.
            Instead, the local installation of nodemon can be run by calling it
            from within an npm script (such as <strong>npm start</strong>) or
            using <strong>npx nodemon</strong>.
          </p>

          <h1 className="name-text">Usage</h1>
          <p className="text">
            nodemon wraps your application, so you can pass all the arguments
            you would normally pass to your app:
          </p>
          <Terminal text="nodemon [your node app]" />
          <p className="text">
            For CLI options, use the <strong>-h</strong> (or{" "}
            <strong>--help</strong>) argument:
          </p>
          <Terminal text="nodemon -h" />
          <p className="text">
            Using nodemon is simple, if my application accepted a host and port
            as the arguments, I would start it as so:
          </p>
          <Terminal text="nodemon ./server.js localhost 8080" />
          <p className="text">
            Any output from this script is prefixed with{" "}
            <strong>[nodemon]</strong>, otherwise all output from your
            application, errors included, will be echoed out as expected.
          </p>

          <p className="text">
            You can also pass the <strong>inspect</strong> flag to node through
            the command line as you would normally:
          </p>
          <Terminal text="nodemon --inspect ./server.js 80" />

          <p className="text">
            If you have a <strong>package.json</strong> file for your app, you
            can omit the main script entirely and nodemon will read the{" "}
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
            application, instead of stopping and restart nodemon, you can type
            <strong> rs</strong> with a carriage return, and nodemon will
            restart your process.
          </p>
          <h1 className="name-title">Config files</h1>
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
            height={true}
          />
        </main>
      </div>
    </div>
  );
};

export default Home;
