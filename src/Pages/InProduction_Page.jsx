import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

const InProductionPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-n-8 to-n-9 p-6">
      {/* inline keyframes for subtle animations */}
      <style>{`
        @keyframes float { 0% { transform: translateY(0); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0); } }
        @keyframes tilt { 0% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } 100% { transform: rotate(-2deg); } }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-tilt { animation: tilt 8s ease-in-out infinite; }
      `}</style>

      <div className="relative max-w-3xl w-full px-4 sm:px-0">
        {/* decorative glow - hidden on very small screens to save space */}
        <div className="hidden sm:block absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#1E90FF]/8 via-[#00BFFF]/6 to-[#7C4DFF]/6 blur-3xl opacity-60 animate-tilt" aria-hidden="true" />

        <div className="relative bg-n-7/30 border border-n-1/20 rounded-2xl p-5 sm:p-8 md:p-10 backdrop-blur-md shadow-xl">
          <div className="flex flex-col md:flex-row md:items-start items-center gap-6">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-gradient-to-tr from-[#1E90FF] to-[#00BFFF] flex items-center justify-center shadow-2xl transform-gpu animate-float">
                <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2">Page in Production</h1>
              <p className="text-sm text-n-3 mb-4 leading-relaxed">We're building something great here — carefully crafted content and features are on the way. For now, explore other services or check back soon.</p>

              <div className="flex flex-col sm:flex-row gap-3 items-center sm:items-center justify-center md:justify-start">
                <Link to="/services" className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-[#1E90FF] to-[#00BFFF] text-white rounded-lg font-medium hover:scale-105 transition-transform duration-200">
                  View other services
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>

                <button onClick={() => window.history.back()} className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-n-1/10 rounded-lg text-n-1 hover:bg-n-7/20 transition-colors duration-200">
                  Go back
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { title: "Updates", text: "New materials & features" },
                  { title: "Performance", text: "Optimized for speed" },
                  { title: "Access", text: "Secure & reliable" }
                ].map((tile, i) => (
                  <div key={i} className="p-3 rounded-lg bg-n-8/30 border border-n-1/10 backdrop-blur-sm hover:scale-105 transform transition duration-200 text-center">
                    <div className="text-xs text-n-3 font-semibold mb-1">{tile.title}</div>
                    <div className="text-[13px] text-n-4">{tile.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 text-right text-xs text-n-4">Estimated ready in: <span className="font-medium text-n-1">Coming soon</span></div>
        </div>
      </div>
    </div>
  );
};

export default InProductionPage;
