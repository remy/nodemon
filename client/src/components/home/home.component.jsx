import { Link } from "react-router-dom";
import { ReactComponent as NodemonLogo } from "./../../assets/nodemon.svg";
import Button from "../button/button.component";
import Terminal from "../terminal/terminal.component";
import Footer from "../footer/footer.component";
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

        <div className="links">
          <a
            href="https://github.com/remy/nodemon"
            className="view-btn"
            target="_blank"
          >
            View on GitHub
          </a>
          <Link to="/documentation" className="view-btn">
            Documentation
          </Link>
        </div>
      </div>

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
      </section>
      <Footer />
    </div>
  );
};

export default Home;
