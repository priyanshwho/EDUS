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

const AboutPage = () => {
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
      <Section className="relative pt-32 pb-16 z-10">
        <div className="container relative z-2">
          {/* Hero Content */}
          <div className="text-center mb-20">
            <div className="inline-block mb-8">
              <span className="inline-flex items-center px-6 py-2 text-sm font-semibold text-n-1 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-n-1/20 rounded-full backdrop-blur-sm">
                <Sparkles className="w-4 h-4 mr-2" />
                ABOUT EDUSPHERE
              </span>
            </div>
            
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white to-[#CCCCCC] leading-tight">
                Empowering
              </span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#1E90FF] to-[#00BFFF] leading-tight">
                Education
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-n-3 max-w-3xl mx-auto leading-relaxed">
              We believe in democratizing education by providing high-quality resources, 
              making learning accessible to everyone, everywhere.
            </p>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
            {[
              { number: "10K+", label: "Students Helped", icon: Users },
              { number: "500+", label: "Study Materials", icon: BookOpen },
              { number: "50+", label: "Subjects Covered", icon: Target },
              { number: "24/7", label: "Support Available", icon: Clock }
            ].map((stat, index) => (
              <div key={index} className="text-center p-6 bg-n-7/30 border border-n-1/10 rounded-2xl backdrop-blur-md hover:bg-n-7/50 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#1E90FF] to-[#00BFFF] rounded-xl flex items-center justify-center shadow-lg shadow-[#1E90FF]/25">
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#1E90FF] to-[#00BFFF] mb-2">
                  {stat.number}
                </div>
                <div className="text-n-3 text-xs md:text-sm font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Mission Section */}
      <Section className="relative py-20 z-10">
        <div className="container relative z-2">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E90FF] to-[#00BFFF]">
                    Our Mission
                  </span>
                </h2>
                <p className="text-base text-n-3 mb-4 leading-relaxed">
                  At EduSphere, we're on a mission to revolutionize education by breaking down barriers 
                  and creating a world where quality learning resources are accessible to every student, 
                  regardless of their background or location.
                </p>
                <p className="text-base text-n-3 mb-6 leading-relaxed">
                  We curate and provide comprehensive study materials, previous year questions, 
                  detailed notes, and relevant lectures to help students excel in their academic journey.
                </p>
                <div className="flex flex-wrap gap-4">
                  {["Innovation", "Quality", "Accessibility", "Excellence"].map((value, index) => (
                    <span key={index} className="px-4 py-2 bg-n-7/20 border border-n-1/10 rounded-full text-n-1 text-sm font-medium backdrop-blur-md hover:bg-n-7/40 transition-all duration-300">
                      {value}
                    </span>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square bg-n-7/20 border border-n-1/10 rounded-3xl backdrop-blur-md p-8 flex items-center justify-center hover:bg-n-7/30 transition-all duration-300">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-r from-[#1E90FF] to-[#00BFFF] rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg shadow-[#1E90FF]/25">
                      <CheckCircle className="w-12 h-12 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-n-1 mb-2">Quality Assured</h3>
                    <p className="text-n-3 text-sm">Every resource is carefully reviewed and curated by experts</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Services Section */}
      <Section className="relative py-20 z-10">
        <div className="container relative z-2">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#CCCCCC]">
                What We
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E90FF] to-[#00BFFF]">
                {" "}Provide
              </span>
            </h2>
            <p className="text-lg text-n-3 max-w-2xl mx-auto">
              Comprehensive educational resources designed to help you succeed in your academic journey
            </p>
          </div>

          <div className="flex flex-wrap gap-10 mb-16">
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
                  className="block relative p-0.5 bg-no-repeat bg-[length:100%_100%] md:max-w-[24rem] 
                  transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:-translate-y-2"
                  style={{
                    backgroundImage: `url(${item.backgroundUrl})`,
                  }}
                  key={item.id}
                >
                  <div className="relative z-2 flex flex-col min-h-[22rem] p-[2.4rem] pointer-events-none 
                    group transition-colors duration-200">
                    
                    <div className="flex items-center mb-5">
                      <div className="w-10 h-10 bg-gradient-to-r from-[#1E90FF] to-[#00BFFF] rounded-lg flex items-center justify-center mr-3 shadow-md shadow-[#1E90FF]/20">
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <h5 className="h5 transition-colors duration-200 group-hover:text-color-1">
                        {item.title}
                      </h5>
                    </div>
                    
                    <p className="body-2 mb-6 text-n-3 transition-colors duration-200 
                      group-hover:text-n-1">
                      {item.text}
                    </p>
                    
                    <div className="flex items-center text-[#1E90FF] text-sm font-medium group-hover:text-[#00BFFF] transition-colors duration-300 mt-auto">
                      <span className="mr-2">Learn More</span>
                      <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
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

      {/* Team Section */}
      <Section className="relative py-20 z-10">
        <div className="container relative z-2">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#CCCCCC]">
                Meet Our
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E90FF] to-[#00BFFF]">
                {" "}Team
              </span>
            </h2>
            <p className="text-lg text-n-3 max-w-2xl mx-auto">
              Passionate educators and developers working together to make education accessible
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Education Director",
                description: "10+ years in curriculum development"
              },
              {
                name: "Mike Chen",
                role: "Tech Lead",
                description: "Full-stack developer passionate about EdTech"
              },
              {
                name: "Emily Davis",
                role: "Content Curator",
                description: "Expert in academic content and quality assurance"
              }
            ].map((member, index) => (
              <div key={index} className="text-center group p-6 bg-n-7/30 border border-n-1/20 rounded-2xl hover:bg-n-7/40 transition-all duration-300 transform hover:scale-105">
                <div className="relative mb-4">
                  <div className="w-24 h-24 bg-n-7/40 border-2 border-n-1/30 rounded-full mx-auto flex items-center justify-center group-hover:border-[#1E90FF]/50 transition-all duration-300">
                    <div className="w-16 h-16 bg-gradient-to-r from-[#1E90FF] to-[#00BFFF] rounded-full flex items-center justify-center shadow-md shadow-[#1E90FF]/20">
                      <span className="text-lg font-bold text-white">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-n-1 mb-1 group-hover:text-[#1E90FF] transition-colors duration-300">
                  {member.name}
                </h3>
                <p className="text-[#1E90FF] font-medium mb-1 text-sm">{member.role}</p>
                <p className="text-n-3 text-xs">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* CTA Section */}
      <Section className="relative py-20 z-10">
        <div className="container relative z-2">
          <div className="text-center max-w-3xl mx-auto p-6 bg-n-7/30 border border-n-1/20 rounded-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#CCCCCC]">
                Ready to
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E90FF] to-[#00BFFF]">
                {" "}Excel?
              </span>
            </h2>
            <p className="text-lg text-n-3 mb-8">
              Join thousands of students who are already benefiting from our comprehensive study resources
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-[#1E90FF] to-[#00BFFF] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#1E90FF]/25 transition-all duration-300 transform hover:scale-105">
                Get Started Today
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
              <button className="inline-flex items-center justify-center px-8 py-4 border border-n-1/20 text-n-1 font-semibold rounded-xl hover:bg-n-1/10 transition-all duration-300 backdrop-blur-sm">
                <BookOpen className="w-5 h-5 mr-2" />
                Explore Resources
              </button>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
};

export default AboutPage;
