import Header from "../components/header";
import Avatar from "../components/avatar";

export default function Home() {
  return (
    <section>
      <Header />
      <br></br>
      <h1>
        I’m <span className="gradient-text">Derek Gallagher</span>
      </h1>
      <p>This is my website, feel free to take a look!</p>
            <Avatar />
    </section>
  );
}

