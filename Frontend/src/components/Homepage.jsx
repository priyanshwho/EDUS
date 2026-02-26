import Hero from "./Hero";
import About from "./About";
import Services from "./Services";
import Contact from "./Contact";
import Feedback from "./Feedback";
// import Makers from "./Makers";
import { DemoOne } from "./Npx/Demo";

const Homepage = () => {
  return (
       <>
      <Hero />
      <About />
      <Services />
      <Contact />
      <Feedback />
      <DemoOne/>
      {/* <Makers /> */}
    </>
  )
}

export default Homepage