import React from 'react'
import Hero from "./Hero";
import About from "./About";
import Services from "./Services";
import Contact from "./Contact";
import Feedback from "./Feedback";
import Makers from "./Makers";

const Homepage = () => {
  return (
       <>
      <Hero />
      <About />
      <Services />
      <Contact />
      <Feedback />
      <Makers />
    </>
  )
}

export default Homepage