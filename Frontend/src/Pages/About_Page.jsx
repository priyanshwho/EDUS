import { benefits } from "../constants";
import Section from "../components/Section";
import { GradientLight } from "../components/design/Benefits";
import ClipPath from "../assets/svg/ClipPath";
import { Rings, SideLines, BackgroundCircles } from "../components/design/Header";
import { gradient, background, heroBackground, grid, lines, stars } from "../assets";
import service1 from "../assets/services/service-1.png";
import service2 from "../assets/services/service-2.png";
import service3 from "../assets/services/service-3.png";
import service11 from "../assets/services/service-11.png";
import service22 from "../assets/services/service-22.png";
import { 
  CheckCircle, 
  Users, 
  BookOpen, 
  Clock, 
  Lightbulb, 
  Target, 
  Award, 
  Star,
  ArrowRight,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AboutPage = () => {
  const { isAuthenticated: isSignedIn } = useAuth();
  const navigate = useNavigate();
  
  // Map each service card to its target route
  const routeMap = [
    "/pyqs",    // PYQ Papers
    "/notes",   // Class Notes
    "/lectures",// Relevant Lectures
    "/webdev",  // Web Development
    "/aiml",    // AI/ML Learning
    "/dsa"      // DSA Learning
  ];
  
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

      {/* Hero Section */}
      <Section className="relative pt-20 pb-8 z-10">
        <div className="container relative z-2">
          {/* Hero Content */}
          <div className="text-center mb-12">
            <div className="inline-block mb-4">
              <span className="inline-flex items-center px-4 py-1 text-sm font-semibold text-n-1 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-n-1/20 rounded-full backdrop-blur-sm">
                <Sparkles className="w-4 h-4 mr-2" />
                ABOUT EDUSPHERE
              </span>
            </div>
            
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white to-[#CCCCCC] leading-tight">
                Empowering
              </span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#1E90FF] to-[#00BFFF] leading-tight">
                Education
              </span>
            </h1>
            <p className="text-base md:text-lg text-n-3 max-w-2xl mx-auto leading-relaxed">
              We believe in democratizing education by providing high-quality resources, 
              making learning accessible to everyone, everywhere.
            </p>
            {/* View Content button (scrolls to Services) */}
            <div className="my-4">
              <button
                type="button"
                aria-label="View content"
                onClick={() => {
                  const el = document.getElementById("about-services");
                  if (!el) return;
                  const offset = 32; // adjust px to tune final position
                  const top = window.scrollY + el.getBoundingClientRect().top - offset;
                  window.scrollTo({ top, behavior: "smooth" });
                }}
                className="inline-flex  items-center px-5 py-2 bg-gradient-to-r from-[#1E90FF] to-[#00BFFF] text-white rounded-full font-medium hover:scale-105 transition-transform duration-200"
              >
                View Content
                <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            </div>

            {/* create view content button */}

            {/* <p className="text-base md:text-lg text-n-3 max-w-2xl mx-auto leading-relaxed">
              We believe in democratizing education by providing high-quality resources, 
              making learning accessible to everyone, everywhere.
            </p> */}
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { number: "10K+", label: "Students Helped", icon: Users },
              { number: "500+", label: "Study Materials", icon: BookOpen },
              { number: "50+", label: "Subjects Covered", icon: Target },
              { number: "24/7", label: "Support Available", icon: Clock }
            ].map((stat, index) => (
              <div key={index} className="text-center p-4 bg-n-7/30 border border-n-1/10 rounded-xl backdrop-blur-md hover:bg-n-7/50 transition-all duration-300 transform hover:scale-105">
                <div className="flex justify-center mb-2">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#1E90FF] to-[#00BFFF] rounded-lg flex items-center justify-center shadow-lg shadow-[#1E90FF]/25">
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#1E90FF] to-[#00BFFF] mb-1">
                  {stat.number}
                </div>
                <div className="text-n-3 text-xs font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Mission Section */}
      <Section className="relative pb-0 z-10">
        <div className="container relative z-2">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E90FF] to-[#00BFFF]">
                    Our Mission
                  </span>
                </h2>
                <p className="text-sm text-n-3 mb-3 leading-relaxed">
                  At EduSphere, we're on a mission to revolutionize education by breaking down barriers 
                  and creating a world where quality learning resources are accessible to every student, 
                  regardless of their background or location.
                </p>
                <p className="text-sm text-n-3 mb-4 leading-relaxed">
                  We curate and provide comprehensive study materials, previous year questions, 
                  detailed notes, and relevant lectures to help students excel in their academic journey.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Innovation", "Quality", "Accessibility", "Excellence"].map((value, index) => (
                    <span key={index} className="px-3 py-1 bg-n-7/20 border border-n-1/10 rounded-full text-n-1 text-xs font-medium backdrop-blur-md hover:bg-n-7/40 transition-all duration-300">
                      {value}
                    </span>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square bg-n-7/20 border border-n-1/10 rounded-2xl backdrop-blur-md p-6 flex items-center justify-center hover:bg-n-7/30 transition-all duration-300">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-[#1E90FF] to-[#00BFFF] rounded-xl flex items-center justify-center mb-4 mx-auto shadow-lg shadow-[#1E90FF]/25">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-n-1 mb-2">Quality Assured</h3>
                    <p className="text-n-3 text-xs">Every resource is carefully reviewed and curated by experts</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Services Section */}
      <Section id="about-services" className="relative pb-12 z-10">
        <div className="container relative z-2">
          <div className="text-center mb-4">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#CCCCCC]">
                What We
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E90FF] to-[#00BFFF]">
                {" "}Provide
              </span>
            </h2>
            <p className="text-base text-n-3 max-w-xl mx-auto">
              Comprehensive educational resources designed to help you succeed in your academic journey
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mb-10">
            {benefits.map((item, index) => {
              // Map different icons for each benefit
              const IconComponent = [BookOpen, Star, Target, Lightbulb, Award, Sparkles][index] || BookOpen;
              
              // Custom background images for each service
              const customBackgrounds = [
                service1,   // PYQ Papers
                service2,   // Class Notes  
                service3,   // Relevant Lectures
                service11,  // Web Development
                service22,  // AI/ML Learning
                service1,   // DSA Learning
              ];
              
              return (
                <div
                  className="block relative p-0.5 bg-no-repeat bg-[length:100%_100%] md:max-w-[20rem] 
                  transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  style={{
                    backgroundImage: `url(${item.backgroundUrl})`,
                  }}
                  key={item.id}
                >
                  <div className="relative z-2 flex flex-col min-h-[18rem] p-4 group transition-colors duration-200">
                    
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-[#1E90FF] to-[#00BFFF] rounded-lg flex items-center justify-center mr-3 shadow-md shadow-[#1E90FF]/20">
                        <IconComponent className="w-4 h-4 text-white" />
                      </div>
                      <h5 className="text-lg font-semibold transition-colors duration-200 group-hover:text-color-1">
                        {item.title}
                      </h5>
                    </div>
                    
                    <p className="text-sm mb- text-n-3 transition-colors duration-200 
                      group-hover:text-n-1">
                      {item.text}
                    </p>
                    
                    <button
                      type="button"
                      onClick={() => {
                        const route = routeMap[index] || "/services";
                        navigate(route);
                      }}
                      className="inline-flex items-center text-[#1E90FF] text-xs font-medium group-hover:text-[#00BFFF] transition-colors duration-300 mt-auto"
                    >
                      <span className="mr-2">View Page</span>
                      <ChevronRight className="w-3 h-3 transform group-hover:translate-x-1 transition-transform duration-300" />
                    </button>
                  </div>

                  {item.light && <GradientLight />}

                  <div
                    className="absolute inset-0.5 bg-n-8"
                    style={{ clipPath: "url(#benefits)" }}
                  >
                    <div className="absolute inset-0 opacity-0 transition-all duration-300 
                      hover:opacity-15 group-hover:opacity-20">
                      <img
                        src={customBackgrounds[index]}
                        width={380}
                        height={362}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-300 
                          group-hover:scale-110"
                      />
                    </div>
                  </div>

                  <ClipPath />
                </div>
              );
            })}
          </div>
        </div>
      </Section>

     
      {/* CTA Section - Only show when user is not signed in */}
      {!isSignedIn && (
        <Section className="relative py-0 z-10">
          <div className="container relative z-2">
            <div className="text-center max-w-2xl mx-auto p-4 bg-n-7/30 border border-n-1/20 rounded-xl">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#CCCCCC]">
                  Ready to
                </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E90FF] to-[#00BFFF]">
                  {" "}Excel?
                </span>
              </h2>
              <p className="text-base text-n-3 mb-6">
                Join thousands of students who are already benefiting from our comprehensive study resources
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={() => navigate('/sign-in')} className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-[#1E90FF] to-[#00BFFF] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[#1E90FF]/25 transition-all duration-300 transform hover:scale-105">
                  Get Started Today
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/services')}
                  className="inline-flex items-center justify-center px-6 py-3 border border-n-1/20 text-n-1 font-semibold rounded-lg hover:bg-n-1/10 transition-all duration-300 backdrop-blur-sm"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Explore Resources
                </button>
               </div>
            </div>
          </div>
        </Section>
      )}
    </div>
  );
};

export default AboutPage;
