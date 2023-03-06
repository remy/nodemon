import { useState } from "react";
import { ReactComponent as CopyIcon } from "./../../assets/copy.svg";
import { ReactComponent as TrueIcon } from "./../../assets/trueIcon.svg";

const Terminal = ({ text, height }) => {
  const [icon, setIcon] = useState(false);

  const hanlderCopyText = () => {
    setIcon(true);
    setTimeout(() => {
      setIcon(false);
    }, 2000);
    navigator.clipboard.writeText(text);
  };

  return (
    <pre className={`box ${height ? "height" : ""}`}>
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
