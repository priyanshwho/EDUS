import React from 'react'
import Section from './Section'
import { BackgroundCircles } from './design/Hero'
import { Users, Github, Linkedin, Mail } from 'lucide-react'

const Makers = () => {
  const teamMembers = [
    {
      name: 'Priyanshu Anand',
      role: 'Lead Full Stack Developer',
      description: 'Leading the technical vision and architecting scalable full-stack solutions with expertise in modern frameworks.',
      avatar: '/Priyanshu.jpeg',
      github: 'https://github.com/priyans11',
      linkedin: 'https://linkedin.com/in/priyans11',
      email: 'priyanshu82711@gmail.com',
      gradient: 'from-purple-500 to-blue-500'
    },
    {
      name: 'Neeraj Kumar Verma',
      role: 'MERN Stack Developer',
      description: 'Specialized in MongoDB, Express.js, React, and Node.js for building dynamic web applications.',
      avatar: '/Neeraj.jpeg',
      github: 'https://github.com/coder174-ops',
      linkedin: 'https://www.linkedin.com/in/neeraj-kumar-verma-9813b6261',
      email: 'neerajjnv2015@gmail.com',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Anuj Kumar',
      role: 'Web Developer',
      description: 'Creating responsive and interactive web experiences with modern technologies and best practices.',
      avatar: '/Anuj.jpeg',
      github: 'https://github.com/anujarya1435',
      linkedin: 'https://www.linkedin.com/in/nitesh-kumar-1b9b0a362',
      email: 'nraj21284@gmail.com',
      gradient: 'from-cyan-500 to-green-500'
    },
    {
      name: 'Prashant Kumar Singh',
      role: 'Cybersecurity Expert',
      description: 'Ensuring platform security and data protection through advanced cybersecurity practices and protocols.',
      avatar: '/Prashant.jpeg',
      github: 'https://github.com/lifeaboutsily',
      linkedin: 'https://www.linkedin.com/in/prashant-kumar-singh-b612442b5',
      email: 'curiousprashantks@gmail.com',
      gradient: 'from-green-500 to-purple-500'
    }
  ]

  return (
    <Section id="makers" className="pt-[8rem] -mt-[5.25rem] relative overflow-hidden" crosses>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-n-8 via-n-7/50 to-n-8"></div>
      
      <div className="container relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-n-7/30 border border-n-1/10 rounded-full mb-6 backdrop-blur-sm">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-semibold text-n-1 uppercase tracking-wider">Our Team</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="block bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent">
              Meet the
            </span>
            <span className="block bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Makers
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-n-3 max-w-3xl mx-auto leading-relaxed">
            Get to know the talented individuals behind EduSphere. Our diverse team of developers, 
            designers, and innovators work together to create exceptional educational experiences.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {teamMembers.map((member, index) => (
            <div
              key={member.name}
              className="group relative z-20 bg-n-7/20 backdrop-blur-xl border border-n-1/10 rounded-2xl p-6 hover:bg-n-7/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/5"
            >
              {/* Avatar */}
              <div className="relative mb-6">
                <div className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-br ${member.gradient} p-1 shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                  <div className="w-full h-full rounded-full overflow-hidden bg-n-8">
                    <img 
                      src={member.avatar} 
                      alt={member.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="w-full h-full bg-n-7 items-center justify-center text-2xl font-bold text-n-1 hidden">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  </div>
                </div>
                <div className={`absolute inset-0 w-24 h-24 mx-auto rounded-full bg-gradient-to-br ${member.gradient} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300`}></div>
              </div>

              {/* Content */}
              <div className="text-center">
                <h3 className="text-xl font-bold text-n-1 mb-1 group-hover:text-purple-300 transition-colors duration-300">
                  {member.name}
                </h3>
                <p className="text-purple-400 font-medium text-sm mb-3 uppercase tracking-wide">
                  {member.role}
                </p>
                <p className="text-n-3 text-sm leading-relaxed mb-6">
                  {member.description}
                </p>

                {/* Social Links */}
                <div className="flex justify-center gap-3">
                  <a
                    href={member.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 bg-n-6/50 border border-n-1/10 rounded-lg flex items-center justify-center hover:bg-purple-500/20 hover:border-purple-500/50 transition-all duration-300 group/icon cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(member.github, '_blank');
                    }}
                  >
                    <Github className="w-4 h-4 text-n-2 group-hover/icon:text-purple-300" />
                  </a>
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 bg-n-6/50 border border-n-1/10 rounded-lg flex items-center justify-center hover:bg-blue-500/20 hover:border-blue-500/50 transition-all duration-300 group/icon cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(member.linkedin, '_blank');
                    }}
                  >
                    <Linkedin className="w-4 h-4 text-n-2 group-hover/icon:text-blue-300" />
                  </a>
                  <a
                    href={`mailto:${member.email}`}
                    className="w-8 h-8 bg-n-6/50 border border-n-1/10 rounded-lg flex items-center justify-center hover:bg-green-500/20 hover:border-green-500/50 transition-all duration-300 group/icon cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`mailto:${member.email}`, '_self');
                    }}
                  >
                    <Mail className="w-4 h-4 text-n-2 group-hover/icon:text-green-300" />
                  </a>
                </div>
              </div>

              {/* Decorative elements */}
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${member.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl`}></div>
            </div>
          ))}
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {[
            { number: "4", label: "Team Members" },
            { number: "50+", label: "Projects Delivered" },
            { number: "2+", label: "Years Experience" },
            { number: "100%", label: "Dedication" }
          ].map((stat, index) => (
            <div key={index} className="text-center p-6 bg-n-7/20 border border-n-1/10 rounded-xl backdrop-blur-sm hover:bg-n-7/30 transition-all duration-300">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
                {stat.number}
              </div>
              <div className="text-n-3 text-sm font-medium uppercase tracking-wide">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 border border-n-1/10 rounded-2xl p-8 backdrop-blur-sm">
            <h3 className="text-2xl md:text-3xl font-bold text-n-1 mb-4">
              Want to Join Our Team?
            </h3>
            <p className="text-lg text-n-3 leading-relaxed mb-6">
              We're always looking for passionate individuals who share our vision of 
              transforming education through technology.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a 
                href="https://chat.whatsapp.com/GjMlu4QI4d83P4Tc9dwNMA" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.787"/>
                </svg>
                Join Us
              </a>
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-n-7/50 border border-n-1/20 text-n-1 font-semibold rounded-lg hover:bg-n-7/70 hover:border-n-1/30 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Go Back
              </button>
            </div>
          </div>
        </div>

        <BackgroundCircles />
      </div>
    </Section>
  )
}

export default Makers