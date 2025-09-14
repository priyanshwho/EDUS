// import ButtonGradient from "./assets/svg/ButtonGradient"
// import About from "./components/About";
// import Contact from "./components/Contact";
// import Feedback from "./components/Feedback";
// import Header from "./components/Header";
// import Hero from "./components/Hero";
// import Makers from "./components/Makers";
// import Services from "./components/Services";

// // Update App.jsx to include the Login route
// // import Login from './components/Auth/Login';

// // In your routes:

// const App=()=> {

//   return (

//     <>
     
//     <div className="pt-[4.75rem] lg:pt-[5.25rem] overflow-hidden" >
    
//     <Header/>
//     <Hero/>
//     <About/>
//     <Services/>
//     <Contact/>
//     <Feedback/>
//     <Makers/>
    
// {/* <Route path="/login" element={<Login />} /> */}
//     </div>
//     <ButtonGradient/>
//     </>
    
//   )
// }

// export default App

import ButtonGradient from "./assets/svg/ButtonGradient"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import ScrollToTop from "./components/ScrollToTop";
import LecturesPage from "./Pages/Lectures_Page";
import AboutPage from "./Pages/About_Page";
import ServicesPage from "./Pages/Services_Page";
import Homepage from "./components/Homepage";
import { RedirectToSignIn, SignedIn, SignedOut } from "@clerk/clerk-react";
import Pyqs_Page from "./Pages/Pyqs_Page";
import Notes_Page from "./Pages/Notes_Page";
import Aiml_page from "./Pages/Aiml_page";
import TechSkill_page from "./Pages/TechSkill_page";
import ExtraSkills_page from "./Pages/ExtraSkills_page";
import Webdev_page from "./Pages/Webdev_page";
import Dsa_page from "./Pages/Dsa_page";
import Contact from "./Pages/Contact";
import Eduai from "./Pages/Eduai";
import Footer from "./components/Footer";

const App = () => {
  return (
    <>
      <ScrollToTop />
      <div className="pt-[4.75rem] lg:pt-[5.25rem] overflow-hidden">
        <Header />
         <>
    <Routes>
    <Route path="/" element={<Homepage/> } />
    <Route path="/about" element={<AboutPage />} />
    <Route path="/services" element={<ServicesPage />} />
    <Route path="/contact" element={<Contact />} />
    <Route path="/ai" element={<Eduai />} />
    <Route path="/techskills" element={<TechSkill_page />} />
    <Route path="/extraskills" element={<ExtraSkills_page />} />

    <Route path="/pyqs" element={
      <>
      <SignedIn>

      <Pyqs_Page/>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn/>
      </SignedOut>
      </>
  } />
    <Route path="/notes" element={
      <>
      <SignedIn>

      <Notes_Page />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn/>
      </SignedOut>
      </>
      
      } />
      <Route path="/lectures" element={
      <>
      <SignedIn>

      <LecturesPage />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn/>
      </SignedOut>
      </>
      
      } />

      <Route path="/webdev" element={
      <>
      <SignedIn>

      <Webdev_page />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn/>
      </SignedOut>
      </>
      
      } />

<Route path="/notes" element={
      <>
      <SignedIn>

      <Notes_Page />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn/>
      </SignedOut>
      </>
      
      } />

<Route path="/dsa" element={
      <>
      <SignedIn>

      <Dsa_page />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn/>
      </SignedOut>
      </>
      
      } />

    <Route path="/aiml" element={
      <>
      <SignedIn>
      <Aiml_page />

      </SignedIn>
      <SignedOut>
        <RedirectToSignIn/>
      </SignedOut>
      </>} />
    {/* ...other routes */}
  </Routes>
</>
   </div>
      <Footer />
      <ButtonGradient />
    </>
  );
};

export default App;