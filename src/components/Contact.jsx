import { useState } from 'react';
import { BackgroundCircles } from './design/Hero';
import { smallSphere } from '../assets';
import Button from './Button';
import Section from './Section';

const Contact = () => {
  const [isImageAnimating, setIsImageAnimating] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleImageClick = () => {
    setIsImageAnimating(true);
    setTimeout(() => setIsImageAnimating(false), 1000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const emailBody = `
Dear Team,

A new contact form submission has been received:

Name: ${formData.firstName} ${formData.lastName}
Email: ${formData.email}
Phone: ${formData.phone}
Message:
${formData.message}

Best regards,
${formData.firstName} ${formData.lastName}
    `.trim();

    const encodedBody = encodeURIComponent(emailBody);
    const mailtoLink = `mailto:priyanshu82711@gmail.com?subject=New Contact Form Submission&body=${encodedBody}`;
    window.location.href = mailtoLink;
    
    // Reset form after submission
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      message: ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  return (
    <Section id="contact" className="pt-[8rem] -mt-[5.25rem]" crosses>
      <div className="container relative">
        <div className="flex flex-col lg:flex-row gap-12 items-start justify-between">
          {/* Left Side - Image and Heading */}
          <div className="w-full lg:w-5/12 -z-2 lg:sticky lg:top-20">
            <h1 className="h1 mb-8">
              Contact <span className="text-sky-400">Us</span>
            </h1>
            <p className="body-1 mb-8 text-n-2">
              We'd love to hear from you. Please fill out the form.
            </p>
            <div 
              className="relative mx-auto lg:mx-0 cursor-pointer group"
              onClick={handleImageClick}
            >
              <div className="absolute inset-0 rounded-full blur-2xl bg-sky-400/20 group-hover:bg-sky-400/30 
                transition-colors duration-300" />
              <img 
                src={smallSphere}
                className={`relative w-[25rem] h-[25rem] object-contain transition-all duration-500
                  ${isImageAnimating ? 'scale-110 rotate-12' : 'scale-100 rotate-0'}
                  group-hover:opacity-100 group-hover:shadow-[0_0_40px_rgba(0,157,255,0.3)] animate-float`}
                alt="sphere"
              />
      <style>{`
        @keyframes float {
          0% { transform: translateY(0); }
          50% { transform: translateY(-18px); }
          100% { transform: translateY(0); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
            </div>
        <BackgroundCircles />

          </div>

          {/* Right Side - Form */}
          <div className="w-full lg:w-6/12">
            <div className="relative p-8 bg-n-8/90 backdrop-blur border border-n-1/10 rounded-2xl 
              transform hover:scale-[1.01] transition-all duration-300 
              hover:shadow-[0_0_30px_rgba(0,157,255,0.25)]">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-n-1/50 mb-2">First Name</label>
                    <input
                      id="firstName"
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="w-full bg-n-7 border border-n-1/10 rounded-xl px-4 py-3 text-n-1 
                        focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 
                        transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-n-1/50 mb-2">Last Name</label>
                    <input
                      id="lastName"
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="w-full bg-n-7 border border-n-1/10 rounded-xl px-4 py-3 text-n-1 
                        focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 
                        transition-all duration-300"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-n-1/50 mb-2">Email</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full bg-n-7 border border-n-1/10 rounded-xl px-4 py-3 text-n-1 
                      focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 
                      transition-all duration-300"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-n-1/50 mb-2">Phone Number</label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full bg-n-7 border border-n-1/10 rounded-xl px-4 py-3 text-n-1 
                      focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 
                      transition-all duration-300"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-n-1/50 mb-2">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="4"
                    className="w-full bg-n-7 border border-n-1/10 rounded-xl px-4 py-3 text-n-1 
                      focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 
                      transition-all duration-300"
                    placeholder="Your message..."
                  />
                </div>

                <Button 
                  type="submit"
                  className="w-full
                   hover:scale-[1.02] transition-transform duration-300 
                    hover:shadow-[0_0_20px_rgba(0,157,255,0.4)]"
                >
                  Proceed
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* <BackgroundCircles /> */}
      </div>
    </Section>
  );
};

export default Contact;