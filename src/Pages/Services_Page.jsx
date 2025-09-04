import Section from "../components/Section";
import Heading from "../components/Heading";
import { Link } from "react-router-dom";
import { service1, service2, service3, check } from "../assets";
import { brainwaveServices, brainwaveServicesIcons } from "../constants";
import {
  PhotoChatMessage,
  Gradient,
  VideoBar,
  VideoChatMessage,
} from "../components/design/Services";
import { Rings, SideLines, BackgroundCircles } from "../components/design/Header";
import { gradient, grid, lines, stars } from "../assets";
import Generating from "../components/Generating";

const ServicesPage = () => {
  return (
    <div className="min-h-screen bg-n-8 relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Main gradient background */}
        <div className="absolute inset-0 opacity-30">
          <img
            src={gradient}
            className="absolute top-1/2 left-1/2 w-[100rem] h-[100rem] -translate-x-1/2 -translate-y-1/2 object-cover"
            alt="Background gradient"
          />
        </div>
        
        {/* Secondary background pattern */}
        <div className="absolute inset-0 opacity-5">
          <img
            src={grid}
            className="w-full h-full object-cover"
            alt="Grid pattern"
          />
        </div>

        {/* Animated background elements */}
        <Rings />
        <SideLines />
        <BackgroundCircles />
        
        {/* Additional decorative elements */}
        <div className="absolute top-20 left-10 opacity-20">
          <img src={stars} width={200} height={200} alt="Stars" />
        </div>
        <div className="absolute bottom-20 right-10 opacity-20 rotate-180">
          <img src={lines} width={300} height={300} alt="Lines" />
        </div>
      </div>

      <Section id="Services" className="relative scroll-mt-28 z-10 pt-32">
        <div className="container">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <div className="inline-block mb-6">
              <span className="inline-flex items-center px-4 py-2 text-sm font-medium text-n-1 bg-n-7/30 border border-n-1/20 rounded-full backdrop-blur-sm">
                Our Services
              </span>
              

            </div>
            
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="block text-n-1 mb-2">
                Courses We
              </span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
                Provide
              </span>
            </h1>
            
            <p className="text-base md:text-lg text-n-3 max-w-2xl mx-auto leading-relaxed">
              We offer high-quality resources for both technical and non-technical sectors.
            </p>
          </div>

          <div className="relative">
            <div className="relative z-1 flex items-center h-[39rem] mb-5 p-8 border border-n-1/10 rounded-3xl overflow-hidden lg:p-20 xl:h-[46rem]
            hover:border-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 transform hover:scale-[1.02]">
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none md:w-3/5 xl:w-auto">
                <img
                  className="w-full h-full object-cover md:object-right"
                  width={800}
                  alt="courses"
                  height={730}
                  src={service1}
                />
              </div>

              <div className="relative z-1 max-w-[17rem] ml-auto group">
                <h4 className="h4 text-4xl mb-4 group-hover:text-purple-300 transition-colors duration-300">B.E Courses</h4>
                <p className="body-2 mb-[1.5rem] text-n-3 group-hover:text-purple-200 transition-colors duration-300">
                  Edusphere unlocks the potential within you
                </p>
                <ul className="body-2">
                  {brainwaveServices.map((item, index) => {
                    // Define route paths for each service
                    const routes = ["/pyqs", "/notes", "/lectures"];
                    return (
                      <li
                        key={index}
                        className="flex items-start py-4 border-t border-n-6 hover:border-purple-500/30 
                        transition-all duration-300 group/item"
                      >
                        <img width={24} height={24} src={check} className="py-2 group-hover/item:filter group-hover/item:brightness-125 group-hover/item:hue-rotate-180 transition-all duration-300" />
                        <Link
                          to={routes[index]}
                          className="ml-4 bg-black/40 backdrop-blur px-4 py-2 rounded-lg text-white 
                          hover:bg-gradient-to-r hover:from-purple-600 hover:to-purple-400 
                          hover:shadow-lg hover:shadow-purple-500/25 hover:scale-105
                          transition-all duration-300 transform
                          border border-transparent hover:border-purple-400/30"
                          style={{ display: "inline-block" }}
                        >
                          {item}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <Generating className="absolute left-4 right-4 bottom-4 border-n-1/10 border lg:left-1/2 lg-right-auto lg:bottom-8 lg:-translate-x-1/2 
              hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300" />
            </div>

            <div className="relative z-1 grid pb-5 gap-5 lg:grid-cols-2">
              <div className="relative min-h-[39rem] border border-n-1/10 rounded-3xl overflow-hidden 
              hover:border-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/10 
              transition-all duration-500 transform hover:scale-[1.02] group">
                {/* full-card link overlay to make entire card clickable */}
                <Link to="/techskills" aria-label="Tech Skills" className="absolute inset-0 z-10 rounded-3xl" />

                <div className="absolute inset-0">
                  <img
                    src={service2}
                    className="h-full w-full object-cover"
                    width={630}
                    height={750}
                    alt="robot"
                  />
                </div>

                <div className="absolute inset-0 flex flex-col justify-end p-8 bg-gradient-to-b from-n-8/0 to-n-8/90 lg:p-15
                group-hover:bg-gradient-to-b group-hover:from-purple-900/20 group-hover:to-purple-900/70 transition-all duration-500">
                  <h4 className="h4 mb-4 group-hover:text-purple-300 transition-colors duration-300">Tech SKILLS</h4>
                  <p className="body-2 mb-[3rem] text-n-3 group-hover:text-purple-200 transition-colors duration-300">
                    Want to learn the latest tech skills? We have got you covered.
                  </p>
                </div>

                <PhotoChatMessage />
              </div>

              <div className="relative p-4 bg-n-7 rounded-3xl overflow-hidden lg:min-h-[46rem] 
              hover:bg-gradient-to-br hover:from-purple-900/30 hover:to-purple-800/20 
              hover:shadow-2xl hover:shadow-purple-500/10 hover:border hover:border-purple-500/20
              transition-all duration-500 transform hover:scale-[1.02] group">
                {/* overlay link for the Extra Skills card */}
                <Link to="/extraskills" aria-label="Extra Skills" className="absolute inset-0 z-10 rounded-3xl" />
                 <div className="py-12 px-4 xl:px-8">
                   <h4 className="h4 mb-4 group-hover:text-purple-300 transition-colors duration-300">Extra Skills</h4>
                   <p className="body-2 mb-[2rem] text-n-3 group-hover:text-purple-200 transition-colors duration-300">
                     Want to explore about the video editing, or something else like trading skills? We have got you covered.
                   </p>

                   <ul className="flex items-center justify-between">
                     {brainwaveServicesIcons.map((item, index) => (
                       <li
                         key={index}
                         className={`rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110  ${
                           index === 2
                             ? "w-[3rem] h-[3rem] p-0.25 bg-conic-gradient md:w-[4.5rem] md:h-[4.5rem] hover:shadow-lg hover:shadow-purple-500/30"
                             : "flex w-10 h-10 bg-n-6 md:w-15 md:h-15 hover:bg-gradient-to-br hover:from-purple-600 hover:to-purple-400 hover:shadow-lg hover:shadow-purple-500/25"
                         }`}
                       >
                         <div
                           className={
                             index === 2
                               ? "flex items-center justify-center w-full h-full bg-n-7 rounded-[1rem] group-hover:bg-gradient-to-br group-hover:from-purple-800 group-hover:to-purple-600 transition-all duration-300"
                               : ""
                           }
                         >
                           <img src={item} width={24} height={24} alt={item} />
                         </div>
                       </li>
                     ))}
                   </ul>
                 </div>

                 <div className="relative h-[20rem] bg-n-8 rounded-xl overflow-hidden md:h-[25rem]
                 group-hover:bg-gradient-to-br group-hover:from-purple-900/40 group-hover:to-purple-800/20 
                 transition-all duration-500 hover:shadow-inner hover:shadow-purple-500/20">
                   <img
                     src={service3}
                     className="w-full h-full object-cover"
                     width={520}
                     height={400}
                     alt="Scary robot"
                   />

                   <VideoChatMessage />
                   <VideoBar />
                 </div>
               </div>
            </div>

            <Gradient />
          </div>
        </div>
      </Section>
    </div>
  );
};

export default ServicesPage;
