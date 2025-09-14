import React from 'react'
import { 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Building2, 
  Clock,
  Users,
  ExternalLink,
  ChevronRight,
  Sparkles
} from "lucide-react"
import { Rings, SideLines, BackgroundCircles } from "../components/design/Header"
import { gradient, grid, lines, stars } from "../assets"
import Section from "../components/Section"

const Contact = () => {
  const contactInfo = [
    {
      icon: Building2,
      title: "Institution",
      content: "University Institute of Engineering and Technology",
      color: "from-sky-400 to-blue-400"
    },
    {
      icon: MapPin,
      title: "Address",
      content: (
        <div>
          <div>Sector 25, South Campus</div>
          <div>Panjab University</div>
          <div>Chandigarh (Union Territory), INDIA</div>
          <div className="font-medium text-blue-300">PINCODE: 160014</div>
        </div>
      ),
      color: "from-purple-400 to-pink-400"
    },
    {
      icon: Phone,
      title: "Contact Number",
      content: (
        <a
          href="tel:+918173970847"
          className="text-sky-300 hover:text-sky-200 transition-colors duration-300 hover:underline"
        >
          +91 81739 70847
        </a>
      ),
      color: "from-green-400 to-emerald-400"
    },
    {
      icon: Mail,
      title: "Official Email",
      content: (
        <a
          href="mailto:eduspherepu@gmail.com"
          className="text-purple-300 hover:text-purple-200 transition-colors duration-300 hover:underline break-all"
        >
          eduspherepu@gmail.com
        </a>
      ),
      color: "from-orange-400 to-red-400"
    },
    {
      icon: Globe,
      title: "Website",
      content: (
        <a
          href="http://uiet.puchd.ac.in/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-300 hover:text-cyan-200 transition-colors duration-300 hover:underline flex items-center gap-1"
        >
          uiet.puchd.ac.in
          <ExternalLink className="w-3 h-3" />
        </a>
      ),
      color: "from-cyan-400 to-blue-400"
    }
  ]

  const quickActions = [
    {
      label: "Send Email",
      action: () => window.location.href = 'mailto:eduspherepu@gmail.com',
      primary: true
    },
    {
      label: "Call Now",
      action: () => window.location.href = 'tel:+918173970847',
      primary: false
    },
    {
      label: "Visit Website",
      action: () => window.open('http://uiet.puchd.ac.in/', '_blank'),
      primary: false
    }
  ]

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
                GET IN TOUCH
              </span>
            </div>
            
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white to-[#CCCCCC] leading-tight">
                Contact
              </span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#1E90FF] to-[#00BFFF] leading-tight">
                EduSphere
              </span>
            </h1>
            <p className="text-base md:text-lg text-n-3 max-w-2xl mx-auto leading-relaxed">
              Connect with the University Institute of Engineering and Technology.
              We're here to help you with your educational journey.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { number: "24/7", label: "Support Available", icon: Clock },
              { number: "500+", label: "Students Connected", icon: Users },
              { number: "50+", label: "Subjects Covered", icon: Building2 },
              { number: "2+", label: "Years Experience", icon: Sparkles }
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

      {/* Contact Information Grid */}
      <Section className="relative pb-0 z-10">
        <div className="container relative z-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
            {/* Contact Details Card */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-sky-400/20 via-purple-400/20 to-sky-400/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative p-8 bg-gradient-to-br from-n-7/90 via-n-6/80 to-n-7/90 border border-sky-400/30 rounded-3xl shadow-2xl backdrop-blur-xl">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-gradient-to-r from-sky-400/20 to-purple-400/20 rounded-xl">
                    <Building2 className="h-8 w-8 text-sky-300" />
                  </div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-sky-200 bg-clip-text text-transparent">
                    University Details
                  </h2>
                </div>

                <div className="space-y-6">
                  {contactInfo.map((item, index) => {
                    const IconComponent = item.icon
                    return (
                      <div key={index} className="flex items-start gap-4 p-4 rounded-lg border border-n-1/10 transition-all duration-300 hover:border-sky-400/30 hover:bg-n-6/20">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${item.color} bg-opacity-20`}>
                          <IconComponent className="w-6 h-6 text-sky-300" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-n-1 mb-1">{item.title}</h3>
                          <div className="text-n-3">{item.content}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Map Section */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 via-red-400/20 to-orange-400/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative p-8 bg-gradient-to-br from-n-7/90 via-n-6/80 to-n-7/90 border border-orange-400/30 rounded-3xl shadow-2xl backdrop-blur-xl">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-gradient-to-r from-orange-400/20 to-red-400/20 rounded-xl">
                    <MapPin className="h-8 w-8 text-orange-300" />
                  </div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                    Find Us
                  </h2>
                </div>

                <div className="relative h-96 rounded-xl overflow-hidden border border-n-1/10 mb-6">
                  <iframe
                    src="https://maps.google.com/maps?q=30.7493333,76.7544167&z=17&output=embed"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={true}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="rounded-xl"
                  ></iframe>
                  <div className="absolute inset-0 bg-gradient-to-t from-n-8/20 via-transparent to-transparent rounded-xl pointer-events-none"></div>

                  <a
                    href="https://www.google.com/maps/search/?api=1&query=30.7493333,76.7544167"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute right-4 bottom-4 z-10 bg-n-8/80 text-white px-3 py-2 rounded-lg border border-n-3/20 backdrop-blur hover:bg-n-8/90"
                  >
                    Open in Maps
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-orange-500/10 border border-orange-400/20 text-orange-300 hover:bg-orange-500/20 group flex items-center gap-3 px-4 py-3 rounded-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer">
                    <MapPin className="w-5 h-5" />
                    <div>
                      <div className="text-sm font-bold">Sector 25</div>
                      <div className="text-xs font-medium opacity-80">South Campus</div>
                    </div>
                  </div>
                  <div className="bg-red-500/10 border border-red-400/20 text-red-300 hover:bg-red-500/20 group flex items-center gap-3 px-4 py-3 rounded-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer">
                    <Phone className="w-5 h-5" />
                    <div>
                      <div className="text-sm font-bold">+91 81739 70847</div>
                      <div className="text-xs font-medium opacity-80">Direct Line</div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={action.action}
                      className={`relative group font-medium transition-all duration-300 transform hover:scale-105 cursor-pointer border rounded-lg overflow-hidden px-6 py-3 text-base ${
                        action.primary
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-transparent hover:shadow-lg hover:shadow-cyan-500/25 hover:-translate-y-0.5 active:translate-y-0 shadow-md shadow-cyan-500/15'
                          : 'bg-transparent text-n-3 border-n-1/20 hover:bg-n-1/5 hover:border-n-1/30 hover:text-n-1'
                      }`}
                    >
                      <span className="relative z-10">{action.label}</span>
                      {action.primary && (
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* More Important Contacts */}
      <Section className="relative py-12 z-10">
        <div className="container relative z-2">
          <div className="text-center">
            <button
              onClick={() => window.open('https://chat.whatsapp.com/GjMlu4QI4d83P4Tc9dwNMA?mode=ems_wa_t', '_blank')}
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-[#1E90FF] to-[#00BFFF] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[#1E90FF]/25 transition-all duration-300 transform hover:scale-105 group"
            >
              Join the community
              <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </Section>
    </div>
  )
}

export default Contact
