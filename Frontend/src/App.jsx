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
import { DemoOne } from "./components/Npx/Demo";
import Makers from "./components/Makers";

// ── Auth & Dashboard ────────────────────────────────────────────────
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LoginPage from "./Pages/Login";
import SignupPage from "./Pages/Signup";
import ProfessorPinPage from "./Pages/ProfessorPin";
import AuthCallbackPage from "./Pages/AuthCallback";
import StudentDashboard from "./dashboard/StudentDashboard";
import ProfessorDashboard from "./dashboard/ProfessorDashboard";
import AdminDashboard from "./dashboard/AdminDashboard";
import ResourcePage from "./Pages/ResourcePage";
import ProfessorsPage from "./Pages/Professors_Page";
import ProfessorProfilePage from "./Pages/ProfessorProfile_Page";
// ───────────────────────────────────────────────────────────────────

const AppShell = () => {
  const requireAuth = (element) => <ProtectedRoute>{element}</ProtectedRoute>;

  return (
    <>
      <Header />
      <div className="pt-[4.75rem] lg:pt-[5.25rem] overflow-hidden">
        <>
          <Routes>
    <Route path="/" element={<Homepage/> } />
    <Route path="/about" element={requireAuth(<AboutPage />)} />
    <Route path="/services" element={requireAuth(<ServicesPage />)} />
    <Route path="/contact" element={requireAuth(<Contact />)} />
    <Route path="/demo" element={requireAuth(<DemoOne />)} />
    <Route path="/creators" element={requireAuth(<Makers />)} />
    <Route path="/ai/*" element={requireAuth(<Eduai />)} />
    <Route path="/techskills" element={requireAuth(<TechSkill_page />)} />
    <Route path="/extraskills" element={requireAuth(<ExtraSkills_page />)} />

    {/* ── Auth routes ── */}
    <Route path="/login"          element={<LoginPage />} />
    <Route path="/signup"         element={<SignupPage />} />
    <Route path="/auth/pin"       element={<ProfessorPinPage />} />
    <Route path="/auth/callback"  element={<AuthCallbackPage />} />

    {/* ── Protected dashboards ── */}
    <Route path="/dashboard/student" element={
      <ProtectedRoute roles={['student','professor','admin']}>
        <StudentDashboard />
      </ProtectedRoute>
    } />
    <Route path="/dashboard/professor" element={
      <ProtectedRoute roles={['professor','admin']}>
        <ProfessorDashboard />
      </ProtectedRoute>
    } />
    <Route path="/dashboard/admin" element={
      <ProtectedRoute roles={['admin']}>
        <AdminDashboard />
      </ProtectedRoute>
    } />

    {/* ── Public professor discovery routes ── */}
    <Route path="/professors" element={requireAuth(<ProfessorsPage />)} />
    <Route path="/professors/:username" element={requireAuth(<ProfessorProfilePage />)} />
    <Route path="/professors/:username/:branch/:semester/:subject" element={requireAuth(<ProfessorProfilePage />)} />
    <Route path="/professors/:username/:branch/:semester/:subject/:resourceType/:slug" element={requireAuth(<ResourcePage />)} />

    {/* ── Public resource detail (shareable) ── */}
    <Route path="/resource/:slug" element={requireAuth(<ResourcePage />)} />

    <Route path="/pyqs" element={requireAuth(<Pyqs_Page />)} />
    {/* <Route path="/pyqs" element={
      <>
      <SignedIn>
      <Pyqs_Page/>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn/>
      </SignedOut>
      </>
  } /> */}
    <Route path="/notes" element={requireAuth(<Notes_Page />)} />
    {/* <Route path="/notes" element={
      <>
      <SignedIn>
      <Notes_Page />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn/>
      </SignedOut>
      </>
      } /> */}
      <Route path="/lectures" element={requireAuth(<LecturesPage />)} />
      {/* <Route path="/lectures" element={
      <>
      <SignedIn>
      <LecturesPage />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn/>
      </SignedOut>
      </>
      } /> */}
      <Route path="/webdev" element={requireAuth(<Webdev_page />)} />
      {/* <Route path="/webdev" element={
      <>
      <SignedIn>
      <Webdev_page />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn/>
      </SignedOut>
      </>
      } /> */}
      <Route path="/dsa" element={requireAuth(<Dsa_page />)} />
      {/* <Route path="/dsa" element={
      <>
      <SignedIn>
      <Dsa_page />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn/>
      </SignedOut>
      </>
      } /> */}
    <Route path="/aiml" element={requireAuth(<Aiml_page />)} />
    {/* <Route path="/aiml" element={
      <>
      <SignedIn>
      <Aiml_page />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn/>
      </SignedOut>
      </>} /> */}
    {/* ...other routes */}
          </Routes>
        </>
      </div>
      <Footer />
      <ButtonGradient />
    </>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <ScrollToTop />
        <AppShell />
      </AuthProvider>
    </Router>
  );
};

export default App;
