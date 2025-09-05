import { useEffect } from "react";
import "../App.css";

export default function avatar() {
  useEffect(() => {
    // load your avatar.js code here
    import("../avatar.js").then((module) => {
      if (module.default) module.default();
    });
  }, []);

  return (
    <section id="home">
      <div id="avatar-container">
        <div id="avatar-loading"></div>
      </div>
      <h1>
        I'm <span className="gradient-text">Derek Gallagher</span>
      </h1>
      <p>This is my website, I will think of something to write here later</p>
    </section>
  );
}
