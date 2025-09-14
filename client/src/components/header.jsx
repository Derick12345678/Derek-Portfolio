import "../App.css";

export default function Header() {
  return (
    <header>
      <nav>
        <ul>
          <li><button type="button" id="home-btn">Home</button></li>
          <li><button type="button" id="aboutme-btn">About Me</button></li>
          <li><button type="button" id="projects-btn">Projects</button></li>
          <li><button type="button" id="contact-btn">Contact</button></li>
        </ul>
      </nav>
    </header>
  );
}
