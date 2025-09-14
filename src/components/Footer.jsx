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
      
      <div className="relative container mx-auto px-5 lg:px-7.5 xl:px-10 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          
          {/* Left Section - Let's Connect */}
          <div className="space-y-12">
            <div>
              <a 
                href="mailto:hello@edusphere.design"
                className="block group cursor-pointer"
              >
                <h2 className="text-5xl lg:text-6xl font-bold text-n-1 mb-4 group-hover:text-color-1 transition-colors duration-300">
                  Let's Connect
                </h2>
                <div className="w-full h-px bg-n-6 mb-4"></div>
                <p className="text-n-3 text-xl group-hover:text-n-1 transition-colors duration-300">
                  hello@edusphere.design
                </p>
              </a>
            </div>

            {/* Menu, Socials, and Time - Horizontal Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Menu Section */}
              <div>
                <h3 className="text-n-4 text-sm font-semibold uppercase tracking-wider mb-6">
                  Menu
                </h3>
                <div className="space-y-4">
                  {footerNavigation.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item)}
                      className="block text-n-1 text-lg hover:text-color-1 transition-all duration-300 group cursor-pointer"
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
                <h3 className="text-n-4 text-sm font-semibold uppercase tracking-wider mb-6">
                  Socials
                </h3>
                <div className="space-y-4">
                  {socialLinks.map((social) => (
                    <a
                      key={social.id}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center text-n-1 text-lg transition-all duration-300 group cursor-pointer ${social.color}`}
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
                <h3 className="text-n-4 text-sm font-semibold uppercase tracking-wider mb-4">
                  Local Time
                </h3>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-color-1" />
                  <span className="text-n-1 text-lg font-mono">
                    {formatTime(currentTime)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Back to Top Button */}
          <div className="flex flex-col justify-end">
            {/* Back to Top Button */}
            <div className="flex justify-end">
              <button
                onClick={scrollToTop}
                className="group flex items-center gap-2 text-n-3 hover:text-n-1 transition-all duration-300"
              >
                <span className="text-sm font-medium transform group-hover:-translate-y-1 transition-transform duration-300">
                  Back to top
                </span>
                <div className="w-8 h-8 bg-n-6 hover:bg-color-1 rounded-full flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1">
                  <ChevronUp className="w-4 h-4" />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="mt-16 pt-8 border-t border-n-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-n-4 text-sm">
              © EduSphere 2025
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-n-4 hover:text-n-1 text-sm transition-colors duration-300">
                Privacy Policy
              </a>
              <a href="#" className="text-n-4 hover:text-n-1 text-sm transition-colors duration-300">
                Terms of Service
              </a>
              {/* EduSphere Branding - Bottom Right */}
              <div className="text-right">
                <h1 className="text-6xl lg:text-7xl xl:text-8xl font-bold leading-none tracking-tight">
                  <span className="text-n-1">Edu</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-purple-600">
                    Sphere
                  </span>
                  <span className="text-n-4 text-2xl lg:text-3xl xl:text-4xl align-top ml-1">
                    ™
                  </span>
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
