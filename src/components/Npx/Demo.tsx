import { Component } from "./Infinite-menu"; // Import the TypeScript version

const DemoOne = () => {
  const items = [
    {
      image: "/Priyanshu.jpeg",
      link: "#",
      title: "Priyanshu Anand",
      description: "Team Lead"
    },
    {
      image: "/Neeraj.jpeg",
      link: "#",
      title: "Neeraj Verma", 
      description: "Team lead"
    },
    {
      image: "/Anuj.jpeg",
      link: "#",
      title: "Anuj Kumar",
      description: "Team Member"
    },
    {
      image: "/Prashant.jpeg",
      link: "#",
      title: "Prashant Singh",
      description: "Team Member"
    },
  ];

  return (
    <div className="flex w-full h-screen justify-center items-center bg-n-8" style={{ transform: "translateY(-35px)" }}>
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
  );
};

export { DemoOne };