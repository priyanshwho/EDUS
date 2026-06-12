import { Component } from "./Infinite-menu"; // Import the TypeScript version
import Heading from "../Heading";
import Section from "../Section";

const DemoOne = () => {
  const items = [
    {
      image: "/priyanshu.png",
      link: "/creators",
      title: "Priyanshu Anand",
      description: "Team Lead"
    },
    {
      image: "/Neeraj.jpeg",
      link: "/creators",
      title: "Neeraj Verma", 
      description: "Team Lead"
    },
    {
      image: "/Anuj.jpeg",
      link: "/creators",
      title: "Anuj Kumar",
      description: "Team Member"
    },
    {
      image: "/Prashant.jpeg",
      link: "/creators",
      title: "Prashant Singh",
      description: "Team Member"
    },
  ];

  return (
    <Section className="bg-n-8" id="team">
      <div className="container">
        <Heading
          title={
            <span className="font-bold text-5xl md:text-6xl lg:text-7xl">
              <span className="text-white">Meet the </span>
              <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-400 bg-clip-text text-transparent">
                Team
              </span>
            </span>
          }
          text="The passionate minds behind EduSphere, dedicated to transforming education through innovation."
          className="text-center "
        />
        
        <div className="flex w-full justify-center items-center" style={{ transform: "translateY(-35px)" }}>
          <div 
            className="bg-gradient-to-br from-n-7 via-n-8 to-n-6 border border-n-6/20 rounded-3xl p-8 shadow-2xl backdrop-blur-lg" 
            style={{ height: "600px", width: "100%", maxWidth: "800px", position: "relative" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-color-1/5 via-transparent to-color-5/5 rounded-3xl"></div>
            <div className="relative z-10 h-full">
              <Component items={items} />
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export { DemoOne };