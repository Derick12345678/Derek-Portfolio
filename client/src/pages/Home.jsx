import Header from "../components/header";
import Avatar from "../components/avatar";

export default function Home() {
  return (
    <section>
      <Header />
      <Avatar />
      <h1>
        I’m <span className="gradient-text">Derek Gallagher</span>
      </h1>
      <p>This is my website, I will think of something to write here later</p>
    </section>
  );
}

