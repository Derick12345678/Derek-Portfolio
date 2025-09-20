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
          <li><a href="/Gallagher_Derek_CV.pdf" download="Gallagher_Derek_CV.pdf"><button>CV</button></a></li>
        </ul>
      </nav>
    </header>
  );
}
