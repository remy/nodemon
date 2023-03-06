import { ReactComponent as Github } from "./../../assets/github.svg";
import { ReactComponent as Watch } from "./../../assets/watch.svg";
import "./button.styles.css";

const Button = ({ text, logoImg, count }) => {
  return (
    <div className="widget widget-lg">
      <a
        className="btn"
        href="https://github.com/remy/nodemon"
        rel="noopener"
        target="_blank"
      >
        {logoImg === "github" ? <Github /> : <Watch />}
        &nbsp;<span>{text}</span>
      </a>
      <a
        className="social-count"
        href="https://github.com/remy/nodemon/stargazers"
        rel="noopener"
        target="_blank"
      >
        {count}
      </a>
    </div>
  );
};

export default Button;
