import React from 'react'
import Section from './Section'
import { BackgroundCircles } from './design/Hero'
import { Users, Github, Linkedin, Mail } from 'lucide-react'

const Makers = () => {
  const teamMembers = [
    {
      name: 'Priyanshu Anand',
      role: 'Lead Full Stack Developer',
      description: 'Passionate about creating seamless user experiences and robust backend systems.',
      avatar: '/Priyanshu.jpeg',
      github: 'https://github.com/priyanshu82711',
      linkedin: 'https://linkedin.com/in/priyanshu-anand',
      email: 'priyanshu@edusphere.com',
      gradient: 'from-purple-500 to-blue-500'
    },
    {
      name: 'Neeraj Verma',
      role: 'Backend Developer',
      description: 'Expert in database design and server architecture for scalable applications.',
      avatar: '/Neeraj.jpeg',
      github: 'https://github.com/neerajverma',
      linkedin: 'https://linkedin.com/in/neeraj-verma',
      email: 'neeraj@edusphere.com',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Anuj Kumar',
      role: 'Frontend Developer',
      description: 'UI/UX enthusiast crafting beautiful and intuitive user interfaces.',
      avatar: '/Anuj.jpeg',
      github: 'https://github.com/anujkumar',
      linkedin: 'https://linkedin.com/in/anuj-kumar',
      email: 'anuj@edusphere.com',
      gradient: 'from-cyan-500 to-green-500'
    },
    {
      name: 'Prashant Singh',
      role: 'DevOps Engineer',
      description: 'Ensuring smooth deployments and maintaining reliable infrastructure.',
      avatar: '/Prashant.jpeg',
      github: 'https://github.com/prashantsingh',
      linkedin: 'https://linkedin.com/in/prashant-singh',
      email: 'prashant@edusphere.com',
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
              className="group relative bg-n-7/20 backdrop-blur-xl border border-n-1/10 rounded-2xl p-6 hover:bg-n-7/30 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/10"
            >
              {/* Avatar */}
              <div className="relative mb-6">
                <div className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-br ${member.gradient} p-1 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
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
                    className="w-8 h-8 bg-n-6/50 border border-n-1/10 rounded-lg flex items-center justify-center hover:bg-purple-500/20 hover:border-purple-500/50 transition-all duration-300 group/icon"
                  >
                    <Github className="w-4 h-4 text-n-2 group-hover/icon:text-purple-300" />
                  </a>
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 bg-n-6/50 border border-n-1/10 rounded-lg flex items-center justify-center hover:bg-blue-500/20 hover:border-blue-500/50 transition-all duration-300 group/icon"
                  >
                    <Linkedin className="w-4 h-4 text-n-2 group-hover/icon:text-blue-300" />
                  </a>
                  <a
                    href={`mailto:${member.email}`}
                    className="w-8 h-8 bg-n-6/50 border border-n-1/10 rounded-lg flex items-center justify-center hover:bg-green-500/20 hover:border-green-500/50 transition-all duration-300 group/icon"
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
            <a 
              href="mailto:eduspherepu@gmail.com" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
            >
              <Mail className="w-4 h-4" />
              Get in Touch
            </a>
          </div>
        </div>

        <BackgroundCircles />
      </div>
    </Section>
  )
}

export default Makers