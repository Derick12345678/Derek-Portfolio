import Header from "../components/Header";
import AboutMe from "../components/aboutme";
import Education from "../components/education";
import Hobbies from "../components/hobbies";

export default function About() {
  return (
    <section>
      <Header />
      <h1>About me</h1>
      <AboutMe />
      <h2>Education</h2>
      <Education />
      <h2>Hobbies</h2>
      <Hobbies />
    </section>
  );
}
