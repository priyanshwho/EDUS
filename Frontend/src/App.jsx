import { lazy, Suspense } from "react";
import ButtonGradient from "./assets/svg/ButtonGradient";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Header from "./components/Header";
import ScrollToTop from "./components/ScrollToTop";
import Homepage from "./components/Homepage";
import Footer from "./components/Footer";
import MobileBottomBar from "./components/layout/MobileBottomBar";
import PageTransition from "./components/PageTransition";

// ── Auth & Dashboard ────────────────────────────────────────────────
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

// ── Lazy-loaded pages ────────────────────────────────────────────────
const LecturesPage = lazy(() => import("./Pages/Lectures_Page"));
const AboutPage = lazy(() => import("./Pages/About_Page"));
const ServicesPage = lazy(() => import("./Pages/Services_Page"));
const Pyqs_Page = lazy(() => import("./Pages/Pyqs_Page"));
const Notes_Page = lazy(() => import("./Pages/Notes_Page"));
const Aiml_page = lazy(() => import("./Pages/Aiml_page"));
const TechSkill_page = lazy(() => import("./Pages/TechSkill_page"));
const ExtraSkills_page = lazy(() => import("./Pages/ExtraSkills_page"));
const Webdev_page = lazy(() => import("./Pages/Webdev_page"));
const Dsa_page = lazy(() => import("./Pages/Dsa_page"));
const Contact = lazy(() => import("./Pages/Contact"));
const Eduai = lazy(() => import("./Pages/Eduai"));
const DemoOne = lazy(() => import("./components/Npx/Demo").then(m => ({ default: m.DemoOne })));
const Makers = lazy(() => import("./components/Makers"));

const LoginPage = lazy(() => import("./Pages/Login"));
const SignupPage = lazy(() => import("./Pages/Signup"));
const ProfessorPinPage = lazy(() => import("./Pages/ProfessorPin"));
const AuthCallbackPage = lazy(() => import("./Pages/AuthCallback"));
const StudentDashboard = lazy(() => import("./dashboard/StudentDashboard"));
const ProfessorDashboard = lazy(() => import("./dashboard/ProfessorDashboard"));
const AdminDashboard = lazy(() => import("./dashboard/AdminDashboard"));
const ResourcePage = lazy(() => import("./Pages/ResourcePage"));
const ProfessorsPage = lazy(() => import("./Pages/Professors_Page"));
const ProfessorProfilePage = lazy(() => import("./Pages/ProfessorProfile_Page"));
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
        <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" /></div>}>
          <AnimatedRoutes />
        </Suspense>
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
