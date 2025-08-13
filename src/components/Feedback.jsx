import { useState } from 'react';
import Section from './Section';
import Button from './Button';
import ovel from "../assets/feedback/ovel.png";
import { BackgroundCircles } from './design/Hero';

const Feedback = () => {
  const [rating, setRating] = useState(0);
  const [feedbackData, setFeedbackData] = useState({
    name: '',
    email: '',
    feedback: '',
    rating: 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const emailBody = `
Name: ${feedbackData.name}
Email: ${feedbackData.email}
Rating: ${feedbackData.rating}/5
Feedback: ${feedbackData.feedback}
    `.trim();

    const encodedBody = encodeURIComponent(emailBody);
    const mailtoLink = `mailto:priyanshu82711@gmail.com?subject=Website Feedback&body=${encodedBody}`;
    window.location.href = mailtoLink;
    
    setFeedbackData({
      name: '',
      email: '',
      feedback: '',
      rating: 0
    });
    setRating(0);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFeedbackData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Section id="feedback" className="pt-[8rem]  -mt-[5.25rem]" crosses>
      <div className="container relative">
        <div className="flex flex-col-reverse lg:flex-row gap-12 items-center justify-between">
          {/* Form Section */}
          <div className="w-full lg:w-[45%] order-2 lg:order-1">
          <h1 className='h1 pb-6 flex justify-center'>
  Any{` `}<span className='text-sky-400'>Feedback?</span>
</h1>            <div className="relative p-6 sm:p-8 bg-n-8/90 backdrop-blur border border-n-1/10 rounded-2xl 
              transform hover:scale-[1.01] transition-all duration-300 
              hover:shadow-[0_0_30px_rgba(0,157,255,0.25)]">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-n-8/50 to-n-8/90 backdrop-blur-xl -z-10"/>
              <form onSubmit={handleSubmit} className="space-y-6 z=100">
                <div>
                  <label className="block text-n-1/50 mb-2 font-medium">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={feedbackData.name}
                    onChange={handleChange}
                    required
                    className="w-full bg-n-7 border border-n-1/10 rounded-xl px-4 py-3 text-n-1 
                      focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 
                      transition-all duration-300 hover:border-sky-400/50"
                  />
                </div>

                <div>
                  <label className="block text-n-1/50 mb-2 font-medium">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={feedbackData.email}
                    onChange={handleChange}
                    required
                    className="w-full bg-n-7 border border-n-1/10 rounded-xl px-4 py-3 text-n-1 
                      focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 
                      transition-all duration-300 hover:border-sky-400/50"
                  />
                </div>

                <div>
                  <label className="block text-n-1/50 mb-2 font-medium">Rating</label>
                  <div className="flex gap-2 bg-n-7 p-3 rounded-xl border border-n-1/10">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => {
                          setRating(star);
                          setFeedbackData(prev => ({ ...prev, rating: star }));
                        }}
                        className={`p-2 text-3xl transition-all duration-300 transform hover:scale-110
                          ${star <= rating ? 'text-yellow-400' : 'text-n-3'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-n-1/50 mb-2 font-medium">Your Feedback</label>
                  <textarea
                    name="feedback"
                    value={feedbackData.feedback}
                    onChange={handleChange}
                    required
                    rows="4"
                    className="w-full bg-n-7 border border-n-1/10 rounded-xl px-4 py-3 text-n-1 
                      focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 
                      transition-all duration-300 hover:border-sky-400/50"
                    placeholder="Share your experience..."
                  />
                </div>

                <Button 
                  type="submit"
                  className="w-full hover:scale-[1.02] transition-transform duration-300 
                    hover:shadow-[0_0_20px_rgba(0,157,255,0.4)]"
                >
                  Submit Feedback
                </Button>
              </form>
            </div>
          </div>

          {/* Content Section */}
          <div className="w-full lg:w-[45%] order-1 -z-2 lg:order-2 text-center lg:text-left">
            <div className="relative z-1 max-w-[35rem] mx-auto lg:mx-0">
              <h1 className="h1 mb-6">
                Your <span className="text-sky-400 inline-block relative group">
                  Feedback
                  <div className="absolute inset-0 rounded-2xl bg-sky-400/20 blur-lg transition-opacity duration-500 opacity-0 group-hover:opacity-100" />
                </span>{" "}
                Matters
              </h1>
              <p className="body-1 mb-10 text-n-2 max-w-[90%] mx-auto lg:mx-0">
                Help us improve your experience by sharing your thoughts. Your feedback shapes our future updates.
              </p>
              <div className="relative w-full group">
                <img 
                  src={ovel}
                  className="w-full max-w-[25rem] md:max-w-[30rem] h-auto object-contain mx-auto transition-all duration-500 ease-out transform group-hover:scale-110 group-hover:rotate-12 group-hover:brightness-125 animate-float"
                  alt="feedback illustration"
                />
              </div>
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
              <BackgroundCircles />
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default Feedback;