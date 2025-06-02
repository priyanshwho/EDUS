import { useState } from 'react';
import Section from './Section';
import { BackgroundCircles } from './design/Hero';

const Makers = () => {
  const makers = [
    {
      name: 'Priyanshu Anand',
      role: 'Full Stack Developer',
      github: 'https://github.com/priyanshu82711',
      linkedin: 'https://linkedin.com/in/priyanshu-anand',
      description: 'Lead Developer & UI/UX Designer',
      gradient: 'from-[#88E5BE] to-[#1A1A32]'
    },
    {
      name: 'Neeraj Verma',
      role: 'Backend Developer',
      github: 'https://github.com/neerajverma',
      linkedin: 'https://linkedin.com/in/neeraj-verma',
      description: 'Backend Architecture & Database Design',
      gradient: 'from-[#DD734F] to-[#1A1A32]'
    },
    
  ];

  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <Section id="makers" className="pt-[8rem] -z-2 -mt-[5.25rem]" crosses>
      <div className="container relative">
        <div className="text-center mb-12">
          <h1 className="h1 mb-4">
            Meet the <span className="text-sky-400 inline-block">Team</span>
          </h1>
          <p className="body-1 text-n-2 mb-8">
            The creative minds behind EduSphere
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {makers.map((maker, index) => (
            <div
              key={maker.name}
              className={`relative group p-8 bg-n-8/90 backdrop-blur border border-n-1/10 rounded-2xl 
                transform transition-all duration-500 
                hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(0,157,255,0.25)]
                ${hoveredIndex === index ? 'z-10' : 'z-0'}`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="relative z-2">
                {/* Profile circle with gradient */}
                <div className={`w-20 h-20 mb-8 rounded-full bg-gradient-to-b ${maker.gradient}
                  p-1 transform transition-transform duration-500 group-hover:scale-110`}>
                  <div className="w-full h-full rounded-full bg-n-8 flex items-center justify-center">
                    <span className="text-2xl">{maker.name[0]}</span>
                  </div>
                </div>

                <h3 className="h4 mb-4 transition-colors duration-200 group-hover:text-sky-400">
                  {maker.name}
                </h3>
                <p className="body-2 text-n-1/50 mb-4 font-semibold">
                  {maker.role}
                </p>
                <p className="body-2 text-n-3 mb-6">
                  {maker.description}
                </p>

                {/* Social links */}
                <div className="flex gap-4">
                  <a
                    href={maker.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-10 h-10 bg-n-7 rounded-xl 
                      transition-colors duration-200 hover:bg-sky-400/20"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.11.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/>
                    </svg>
                  </a>
                  <a
                    href={maker.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-10 h-10 bg-n-7 rounded-xl 
                      transition-colors duration-200 hover:bg-sky-400/20"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                </div>
              </div>

              {/* Background blur effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-sky-400/5 to-transparent 
                opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
            </div>
          ))}
        </div>

        <BackgroundCircles />
      </div>
    </Section>
  );
};

export default Makers;