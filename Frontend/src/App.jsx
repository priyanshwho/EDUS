import ButtonGradient from "./assets/svg/ButtonGradient";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
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
import MobileBottomBar from "./components/layout/MobileBottomBar";
import PageTransition from "./components/PageTransition";

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

/**
 * AnimatedRoutes
 * Uses the location key so AnimatePresence detects route changes and
 * mounts/unmounts the correct exit + enter animation.
 * Browser back/forward navigation also triggers the transition because
 * location.key changes on every history entry.
 */
const AnimatedRoutes = () => {
  const location = useLocation();
  const requireAuth = (element) => <ProtectedRoute>{element}</ProtectedRoute>;

  return (
    <AnimatePresence mode="wait" initial={false}>
      {/* key must be location.key (not pathname) so back/forward also animates */}
      <Routes location={location} key={location.key}>
        {/* ── Public ── */}
        <Route path="/" element={<PageTransition><Homepage /></PageTransition>} />
        <Route path="/about" element={<PageTransition>{requireAuth(<AboutPage />)}</PageTransition>} />
        <Route path="/services" element={<PageTransition>{requireAuth(<ServicesPage />)}</PageTransition>} />
        <Route path="/contact" element={<PageTransition>{requireAuth(<Contact />)}</PageTransition>} />
        <Route path="/demo" element={<PageTransition>{requireAuth(<DemoOne />)}</PageTransition>} />
        <Route path="/creators" element={<PageTransition>{requireAuth(<Makers />)}</PageTransition>} />
        <Route path="/ai/*" element={<PageTransition>{requireAuth(<Eduai />)}</PageTransition>} />
        <Route path="/techskills" element={<PageTransition>{requireAuth(<TechSkill_page />)}</PageTransition>} />
        <Route path="/extraskills" element={<PageTransition>{requireAuth(<ExtraSkills_page />)}</PageTransition>} />

        {/* ── Auth routes ── */}
        <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
        <Route path="/signup" element={<PageTransition><SignupPage /></PageTransition>} />
        <Route path="/auth/pin" element={<PageTransition><ProfessorPinPage /></PageTransition>} />
        <Route path="/auth/callback" element={<PageTransition><AuthCallbackPage /></PageTransition>} />

        {/* ── Protected dashboards ── */}
        <Route path="/dashboard/student" element={
          <PageTransition>
            <ProtectedRoute roles={['student', 'professor', 'admin']}>
              <StudentDashboard />
            </ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/dashboard/professor" element={
          <PageTransition>
            <ProtectedRoute roles={['professor', 'admin']}>
              <ProfessorDashboard />
            </ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/dashboard/admin" element={
          <PageTransition>
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          </PageTransition>
        } />

        {/* ── Professor discovery ── */}
        <Route path="/professors" element={<PageTransition>{requireAuth(<ProfessorsPage />)}</PageTransition>} />
        <Route path="/professors/:username" element={<PageTransition>{requireAuth(<ProfessorProfilePage />)}</PageTransition>} />
        <Route path="/professors/:username/:branch/:semester/:subject" element={<PageTransition>{requireAuth(<ProfessorProfilePage />)}</PageTransition>} />
        <Route path="/professors/:username/:branch/:semester/:subject/:resourceType/:slug" element={<PageTransition>{requireAuth(<ResourcePage />)}</PageTransition>} />

        {/* ── Resource detail ── */}
        <Route path="/resource/:slug" element={<PageTransition>{requireAuth(<ResourcePage />)}</PageTransition>} />
        <Route path="/resources/:slug" element={<PageTransition>{requireAuth(<ResourcePage />)}</PageTransition>} />

        {/* ── Study resources ── */}
        <Route path="/pyqs" element={<PageTransition>{requireAuth(<Pyqs_Page />)}</PageTransition>} />
        <Route path="/notes" element={<PageTransition>{requireAuth(<Notes_Page />)}</PageTransition>} />
        <Route path="/lectures" element={<PageTransition>{requireAuth(<LecturesPage />)}</PageTransition>} />
        <Route path="/webdev" element={<PageTransition>{requireAuth(<Webdev_page />)}</PageTransition>} />
        <Route path="/dsa" element={<PageTransition>{requireAuth(<Dsa_page />)}</PageTransition>} />
        <Route path="/aiml" element={<PageTransition>{requireAuth(<Aiml_page />)}</PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

/**
 * AppShell
 * Persistent layout elements (Header, MobileBottomBar, Footer) are rendered
 * OUTSIDE AnimatedRoutes so they never re-animate on route changes.
 * They are hidden on auth callback routes so the OAuth processing screen
 * renders cleanly without nav/footer bleeding through.
 */
const AppShell = () => {
  const location = useLocation();
  const isAuthCallback = location.pathname === '/auth/callback';
  const isAiSession = location.pathname.startsWith('/ai/ai/') || 
                      location.pathname.startsWith('/ai/flashcards/') || 
                      location.pathname.startsWith('/ai/mcq/') || 
                      location.pathname.startsWith('/ai/pyq/');
  const hideChrome = isAuthCallback || isAiSession;

  return (
    <>
      {!isAuthCallback && <Header />}
      <div className={isAuthCallback ? 'overflow-x-hidden' : 'pt-[4.75rem] lg:pt-[5.25rem] overflow-x-hidden'}>
        <AnimatedRoutes />
      </div>
      {!hideChrome && <MobileBottomBar />}
      {!hideChrome && <Footer />}
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
