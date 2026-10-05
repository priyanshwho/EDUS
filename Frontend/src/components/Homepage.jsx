import { lazy, Suspense } from "react";
import Hero from "./Hero";
import About from "./About";
import Services from "./Services";
import Contact from "./Contact";
import Feedback from "./Feedback";

const DemoOne = lazy(() => import("./Npx/Demo").then(m => ({ default: m.DemoOne })));

const Homepage = () => {
  return (
    <>
      <Hero />
      <About />
      <Services />
      <Contact />
      <Feedback />
      <Suspense fallback={<div className="min-h-[300px]" />}>
        <DemoOne />
      </Suspense>
    </>
  );
};

export default Homepage;