import { Link } from "react-router-dom";
import "../App.css";

export default function Header() {
  return (
    <header>
      <nav>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">About Me</Link></li>
          <li><Link to="/projects">Projects</Link></li>
          <li><button type="button" id="contact-btn">Contact</button></li>
        </ul>
      </nav>
    </header>
  );
}
