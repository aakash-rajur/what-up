import React from "react";
import "./loading.css";

function Loading({className}) {
  return <div className={`loading ${className || ""}`}>&nbsp;</div>;
}

export default Loading;
