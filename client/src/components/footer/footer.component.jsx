import { ReactComponent as NodemonLogo } from "./../../assets/nodemon.svg";
import "./footer.styles.css";

const Footer = () => {
  return (
    <footer>
      <div className="footer-icon">
        <NodemonLogo className="footer-logo" />
        <p
          style={{
            marginLeft: "5px",
            lineHeight: "1",
            color: "rgb(139 139 139)",
          }}
        >
          Copyright © 2023 nodemon.
        </p>
      </div>
      <div className="footer-section">
        <h3 className="footer-title">DOCS</h3>
        <ul className="ul">
          <li>
            <a href="#installation">Installation</a>
          </li>
          <li>
            <a href="https://github.com/remy/nodemon/blob/master/faq.md">FAQ</a>
          </li>
          <li>
            <a href="https://rem.mit-license.org/">License</a>
          </li>
        </ul>
      </div>
      <div className="footer-section">
        <h3 className="footer-title">CHANNELS</h3>
        <ul className="ul">
          <li>
            <a href="https://github.com/remy/nodemon">Github</a>
          </li>
          <li>
            <a href="https://www.npmjs.com/package/nodemon">NPM</a>
          </li>
          <li>
            <a href="https://github.com/remy/nodemon/graphs/contributors">
              Community Resources
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
};

export default Footer;
