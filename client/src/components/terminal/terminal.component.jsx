import { useState } from "react";
import { ReactComponent as CopyIcon } from "./../../assets/copy.svg";
import { ReactComponent as TrueIcon } from "./../../assets/trueIcon.svg";
import "./terminal.styles.css";

const Terminal = ({ text, small, large, exlarge, height }) => {
  const [icon, setIcon] = useState(false);

  const hanlderCopyText = () => {
    setIcon(true);
    setTimeout(() => {
      setIcon(false);
    }, 2000);
    navigator.clipboard.writeText(text);
  };

  return (
    <pre
      // className={`box ${small ? "small" : ""} ${large ? "large" : ""} ${
      //   exlarge ? "ex-large" : ""
      // }`}
      className="box"
      style={{ height: `${height}px` }}
    >
      <code className="code">{text}</code>
      {icon ? (
        <TrueIcon className="true-icon" />
      ) : (
        <CopyIcon className="copy-icon" onClick={hanlderCopyText} />
      )}
    </pre>
  );
};

export default Terminal;
