import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Twitter, 
  Linkedin, 
  MessageCircle, 
  Clock,
  ChevronUp
} from 'lucide-react'
import { discord } from '../assets'
import { navigation } from '../constants'

const Footer = () => {
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Format time
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    })
  }

  // Scroll to top functionality
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  // Navigation items for footer menu
  const footerNavigation = navigation.filter(item => !item.auth && !item.onlyMobile)

  // Social links
  const socialLinks = [
    {
      id: "0",
      title: "Twitter",
      icon: Twitter,
      url: "https://twitter.com",
      color: "hover:text-sky-400"
    },
    {
      id: "1", 
      title: "LinkedIn",
      icon: Linkedin,
      url: "https://linkedin.com",
      color: "hover:text-blue-500"
    },
    {
      id: "2",
      title: "WhatsApp", 
      icon: MessageCircle,
      url: "https://chat.whatsapp.com/GjMlu4QI4d83P4Tc9dwNMA",
      color: "hover:text-green-500"
    },
    {
      id: "3",
      title: "Discord",
      icon: discord,
      url: "https://discord.com",
      color: "hover:text-purple-500"
    }
  ]

  const handleNavigation = (item) => {
    const isHome = item.title === "HOME"
    const isAbout = item.title === "ABOUT" 
    const isServices = item.title === "Services"
    const isContact = item.title === "contact"
    const isEduAi = item.title === "Edu.ai"

    if (isHome) {
      navigate("/")
    } else if (isAbout) {
      navigate("/about")
    } else if (isServices) {
      navigate("/services") 
    } else if (isContact) {
      navigate("/contact")
    } else if (isEduAi) {
      navigate("/ai")
    }
  }

  return (
    <footer className="relative bg-n-8 border-t border-n-6 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-n-8 via-n-8/98 to-n-8/95" />
      
      <div className="relative container mx-auto px-5 lg:px-7.5 xl:px-10 py-20">
        
        {/* Top Section - Let's Connect and Email in same line */}
        <div className="mb-20">
          <a 
            href="mailto:eduspherepu@gmail.com"
            className="block group cursor-pointer"
          >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-8 mb-6 group-hover:text-color-1 transition-colors duration-300">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-normal text-n-1">
                Let's Connect
              </h2>
              <span className="text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-light text-n-1">
                eduspherepu@gmail.com
              </span>
            </div>
          </a>
          <div className="w-full h-px bg-n-6"></div>
        </div>

        {/* Middle Section - Menu, Socials, and Time in columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16 mb-24">
          
          {/* Menu Section */}
          <div>
            <h3 className="text-n-4 text-lg font-semibold uppercase tracking-wider mb-8">
              Menu
            </h3>
            <div className="space-y-5">
              {footerNavigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item)}
                  className="block text-n-1 text-xl lg:text-2xl hover:text-color-1 transition-all duration-300 group cursor-pointer"
                >
                  <span className="inline-block transform group-hover:-translate-y-1 transition-transform duration-300">
                    {item.title}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Socials Section */}
          <div>
            <h3 className="text-n-4 text-lg font-semibold uppercase tracking-wider mb-8">
              Socials
            </h3>
            <div className="space-y-5">
              {socialLinks.map((social) => (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block text-n-1 text-xl lg:text-2xl transition-all duration-300 group cursor-pointer ${social.color}`}
                >
                  <span className="inline-block transform group-hover:-translate-y-1 transition-transform duration-300">
                    {social.title}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Local Time */}
          <div>
            <h3 className="text-n-4 text-lg font-semibold uppercase tracking-wider mb-8">
              Local Time
            </h3>
            <div className="flex items-center gap-4">
              <Clock className="w-6 h-6 text-color-1" />
              <span className="text-n-1 text-xl lg:text-2xl font-mono">
                {formatTime(currentTime)}
              </span>
            </div>
          </div>
        </div>

        {/* Giant EduSphere Branding */}
        <div className="text-center mb-24 px-4">
          <h1 className="text-[3rem] xs:text-[4rem] sm:text-[6rem] md:text-[8rem] lg:text-[10rem] xl:text-[12rem] 2xl:text-[14rem] font-bold leading-none tracking-tight">
            <span className="text-n-1">Edu</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-purple-600">
              Sphere
            </span>
            <span className="text-n-4 text-sm xs:text-base sm:text-xl md:text-2xl lg:text-4xl xl:text-5xl 2xl:text-6xl align-top ml-1 sm:ml-2">
              ™
            </span>
          </h1>
        </div>

        
        {/* Sleek Line */}
        <div className="w-full h-px bg-n-6 mb-8"></div>

        {/* Bottom Copyright with EduSphere branding */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          <p className="text-n-4 text-lg">
            © EduSphere 2025
          </p>
          <div className="flex justify-end mb-12">
          <button
            onClick={scrollToTop}
            className="group flex items-center gap-3 text-n-3 hover:text-n-1 transition-all duration-300"
          >
            <span className="text-lg font-medium transform group-hover:-translate-y-1 transition-transform duration-300">
              Back to top
            </span>
            <div className="w-10 h-10 bg-transparent rounded-full flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1">
              <ChevronUp className="w-5 h-5" />
            </div>
          </button>
        </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
