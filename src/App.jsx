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
import HomePage from "./components/HomePage";
import PyqsPage from "./Pages/Pyqs_Page";
import NotesPage from "./Pages/Notes_Page";
import LecturesPage from "./Pages/Lectures_Page";

const App = () => {
  return (
    <>
      <div className="pt-[4.75rem] lg:pt-[5.25rem] overflow-hidden">
        <Header />
         <>
    <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/pyqs" element={<PyqsPage />} />
    <Route path="/notes" element={<NotesPage />} />
    <Route path="/lectures" element={<LecturesPage />} />
    {/* ...other routes */}
  </Routes>
</>
   </div>
      <ButtonGradient />
    </>
  );
};

export default App;