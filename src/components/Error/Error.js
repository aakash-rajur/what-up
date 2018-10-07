import PropTypes from "prop-types";
import React from "react";
import ERROR_ICON from "../../assets/alert.svg";
import "./error.css";

function Error({text, className}) {
  return (
    <div className={`error-container ${className || ""}`}>
      <img src={ERROR_ICON} alt={text} />
      <pre>{text}</pre>
    </div>
  );
}

Error.propTypes = {
  text: PropTypes.string,
  className: PropTypes.string
};

Error.defaultProps = {
  text: "Something Went Wrong"
};

export default Error;
