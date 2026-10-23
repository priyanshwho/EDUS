
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Check,
  X,
  LogOut,
  LayoutDashboard,
  GraduationCap,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from "./Button";
import eduIcon from "../assets/eduIcon.svg";
import { navigation } from "../constants";
import { disablePageScroll, enablePageScroll } from "scroll-lock";
import MenuSvg from "../assets/svg/MenuSvg";
import { useAuth } from "../context/AuthContext";
import ProfileDropdown from "./ProfileDropdown";

const Header = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user, isStudent, upgradeToProfessor, logout, renameUsername } = useAuth();
    const pathname = useLocation();

    // ── Desktop dropdown state ───────────────────────────────────────
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // ── Mobile drawer state ──────────────────────────────────────────
    const [openNavigation, setOpenNavigation] = useState(false);

    // ── Username edit state for mobile ──────────────────────────────
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [newUsername,       setNewUsername]       = useState('');
    const [usernameError,     setUsernameError]     = useState('');
    const [savingUsername,    setSavingUsername]    = useState(false);
    const [usernameSuccess,   setUsernameSuccess]   = useState(false);

    // ── Mobile professor PIN state ──────────────────────────────────
    const [pinExpanded, setPinExpanded] = useState(false);
    const [pin,         setPin]         = useState('');
    const [pinError,    setPinError]    = useState('');
    const [pinLoading,  setPinLoading]  = useState(false);
    const [pinSuccess,  setPinSuccess]  = useState(false);

    // ── Touch swipe refs for mobile drawer ──────────────────────────
    const touchStartX = useRef(0);
    const touchCurrentX = useRef(0);
    const isTouching = useRef(false);

    const closeNavigation = () => {
        setOpenNavigation(false);
        setIsEditingUsername(false);
        setUsernameError('');
        setPinExpanded(false);
        enablePageScroll();
    };

    const toggleNavigation = () => {
        if (openNavigation) {
            closeNavigation();
        } else {
            setOpenNavigation(true);
            disablePageScroll();
        }
    };

    // ── Outside-click + ESC handler ──────────────────────────────────
    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                setDropdownOpen(false);
                closeNavigation();
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('keydown', handleEsc);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('keydown', handleEsc);
        };
    }, []);

    // ── Reset on route change ─────────────────────────────────────────
    useEffect(() => {
        closeNavigation();
    }, [pathname.pathname]);

    // ── Touch swipe handlers (swipe right to close) ──────────────────
    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
        touchCurrentX.current = e.touches[0].clientX;
        isTouching.current = true;
    };

    const handleTouchMove = (e) => {
        if (!isTouching.current) return;
        touchCurrentX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (!isTouching.current) return;
        isTouching.current = false;
        const deltaX = touchCurrentX.current - touchStartX.current;
        // Swiping right towards the right edge by > 60px closes the drawer
        if (deltaX > 60) {
            closeNavigation();
        }
    };

    // ── Username edit handlers ────────────────────────────────────────
    const handleStartEditUsername = () => {
        setNewUsername(user?.username || '');
        setUsernameError('');
        setUsernameSuccess(false);
        setIsEditingUsername(true);
    };

    const handleSaveUsername = async (e) => {
        e?.preventDefault();
        const cleaned = newUsername.toLowerCase().trim().replace(/[^a-z0-9_]/g, '').slice(0, 24);
        if (cleaned.length < 3) {
            setUsernameError('Min 3 chars (letters, numbers, _)');
            return;
        }
        if (cleaned === user?.username) {
            setIsEditingUsername(false);
            return;
        }

        setSavingUsername(true);
        setUsernameError('');
        try {
            await renameUsername(cleaned);
            setUsernameSuccess(true);
            setTimeout(() => {
                setUsernameSuccess(false);
                setIsEditingUsername(false);
            }, 1000);
        } catch (err) {
            setUsernameError(err?.response?.data?.message || err?.message || 'Failed to update username');
        } finally {
            setSavingUsername(false);
        }
    };

    // ── Mobile PIN upgrade handler ────────────────────────────────────
    const handleUpgradeMobile = async (e) => {
        e.preventDefault();
        setPinError('');
        setPinLoading(true);
        try {
            await upgradeToProfessor(pin);
            setPinSuccess(true);
            setTimeout(() => {
                closeNavigation();
                navigate('/dashboard/professor');
            }, 1200);
        } catch (err) {
            setPinError(err?.response?.data?.message || 'Invalid PIN. Try again.');
        } finally {
            setPinLoading(false);
        }
    };

    // ── Navigation Link Click Helper ─────────────────────────────────
    const handleNavLink = (e, item) => {
        const isHome     = item.title === 'HOME';
        const isAbout    = item.title === 'ABOUT';
        const isServices = item.title === 'Services';
        const isContact  = item.title === 'contact';
        const isEduAi    = item.title === 'Edu.ai';

        if (isHome) {
            e.preventDefault(); navigate('/'); closeNavigation();
        } else if (isAbout) {
            e.preventDefault(); navigate('/about'); closeNavigation();
        } else if (isServices) {
            e.preventDefault(); navigate('/services'); closeNavigation();
        } else if (isContact) {
            e.preventDefault(); navigate('/contact'); closeNavigation();
        } else if (isEduAi) {
            e.preventDefault(); navigate('/ai'); closeNavigation();
        } else {
            e.preventDefault();
            if (item.url) {
                const targetId = item.url.replace('#', '');
                const target = document.getElementById(targetId);
                if (target) {
                    const yOffset = 170;
                    const y = target.getBoundingClientRect().top + window.pageYOffset + yOffset;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                }
            }
            closeNavigation();
        }
    };

    // ── User display helpers ──────────────────────────────────────────
    const avatarLetter = (
        user?.name?.[0] || user?.username?.[0] || 'U'
    ).toUpperCase();
    const displayName     = user?.name || user?.username || 'Unknown User';
    const displayEmail    = user?.email || 'No email provided';
    const displayUsername = user?.username ? `@${user.username}` : '—';
    const displayRole     = user?.role || 'user';

    const dashboardPath =
        user?.role === 'admin'
            ? '/dashboard/admin'
            : user?.role === 'professor'
            ? '/dashboard/professor'
            : '/dashboard/student';

    return (
        <header
            role="banner"
            className="fixed top-0 left-0 w-full z-50 border-b border-n-6 bg-n-8/90 backdrop-blur-sm"
        >
            <div className="flex items-center px-5 lg:px-7.5 xl:px-10 max-lg:py-4">

                {/* ── Logo ─────────────────────────────────────────────── */}
                <a
                    className="flex items-center w-[12rem] xl:mr-8 cursor-pointer"
                    onClick={(e) => {
                        e.preventDefault();
                        navigate('/');
                        closeNavigation();
                    }}
                    href="/"
                >
                    <img src={eduIcon} width={40} height={40} alt="Edusphere" />
                    <span className="text-xl md:text-2xl font-bold text-n-1 ml-2">EduSphere</span>
                </a>

                {/* ── Nav links (desktop) ────────────────────────────── */}
                <nav className="hidden lg:flex lg:mx-auto lg:bg-transparent relative z-2 items-center justify-center m-auto w-full">
                    {navigation.map((item) => {
                        if (item.auth) return null;
                        return (
                            <a
                                key={item.id}
                                href={item.url || '#'}
                                onClick={(e) => handleNavLink(e, item)}
                                className={`block relative font-code text-2xl uppercase text-n-1 transition-colors hover:text-cyan-400 px-6 py-6 md:py-8 lg:mr-0.25 lg:text-xs lg:font-semibold ${
                                    item.url === pathname.pathname ? 'z-2 lg:text-n-1' : 'lg:text-n-2'
                                } lg:leading-5 lg:hover:text-n-1 xl:px-12`}
                            >
                                {item.title}
                            </a>
                        );
                    })}
                </nav>

                {/* ── Desktop right section ────────────────────────── */}
                <div className="hidden lg:flex items-center gap-3">
                    {isAuthenticated ? (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen((prev) => !prev)}
                                onMouseEnter={() => setDropdownOpen(true)}
                                className="w-9 h-9 rounded-full bg-gradient-to-br from-color-1 to-color-2
                                           flex items-center justify-center text-sm font-bold text-white
                                           ring-2 ring-white/10 hover:ring-color-1/60
                                           transition-all duration-200 cursor-pointer select-none"
                                aria-label="Open profile menu"
                                aria-haspopup="true"
                                aria-expanded={dropdownOpen}
                            >
                                {avatarLetter}
                            </button>

                            {dropdownOpen && (
                                <ProfileDropdown
                                    user={user}
                                    isStudent={isStudent}
                                    upgradeToProfessor={upgradeToProfessor}
                                    logout={logout}
                                    onClose={() => setDropdownOpen(false)}
                                />
                            )}
                        </div>
                    ) : (
                        <Button className="whitespace-nowrap" onClick={() => navigate('/login')}>
                            Sign In
                        </Button>
                    )}
                </div>

                {/* ── Mobile right toggle button ─────────────────────── */}
                <div className="flex lg:hidden items-center ml-auto gap-2">
                    {!isAuthenticated && (
                        <Button className="text-xs py-2 px-3.5" onClick={() => navigate('/login')}>
                            Sign In
                        </Button>
                    )}
                    <button
                        className="p-2 -mr-2 text-n-1 cursor-pointer focus:outline-none"
                        onClick={toggleNavigation}
                        aria-label="Toggle navigation menu"
                    >
                        <MenuSvg openNavigation={openNavigation} />
                    </button>
                </div>
            </div>

            {/* ── Mobile Right-Side Drawer (with Swipe Gestures & Edit Username) ── */}
            <AnimatePresence>
                {openNavigation && (
                    <>
                        {/* Backdrop overlay */}
                        <motion.div
                            key="drawer-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={closeNavigation}
                            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 lg:hidden"
                        />

                        {/* Right-side Sliding Drawer */}
                        <motion.aside
                            key="drawer-sidebar"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 27, stiffness: 280 }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={{ left: 0.05, right: 0.7 }}
                            onDragEnd={(e, { offset, velocity }) => {
                                if (offset.x > 70 || velocity.x > 250) {
                                    closeNavigation();
                                }
                            }}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            className="fixed top-0 right-0 bottom-0 z-50 w-[86vw] max-w-[360px] h-[100dvh] bg-n-8/95 backdrop-blur-2xl border-l border-n-6 shadow-[-15px_0_35px_rgba(0,0,0,0.85)] flex flex-col justify-between overflow-y-auto lg:hidden"
                        >
                            {/* Drawer Header with Swipe Hint & Close Button */}
                            <div className="sticky top-0 bg-n-8/90 backdrop-blur-md px-5 pt-3 pb-3 border-b border-n-6 z-10 shrink-0">
                                <div className="w-12 h-1 bg-n-5/70 rounded-full mx-auto mb-3" />
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <img src={eduIcon} width={28} height={28} alt="Edusphere" />
                                        <span className="font-bold text-n-1 text-base">EduSphere</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] text-n-4 font-mono select-none">
                                            Swipe right →
                                        </span>
                                        <button
                                            type="button"
                                            onClick={closeNavigation}
                                            className="p-1.5 rounded-lg text-n-4 hover:text-n-1 hover:bg-n-7 transition cursor-pointer"
                                            aria-label="Close menu"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Drawer Body */}
                            <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
                                {isAuthenticated ? (
                                    <>
                                        {/* User Info Card with Edit Username (matching screenshot 3) */}
                                        <div className="p-4 rounded-2xl bg-n-7/80 border border-n-6 shadow-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-color-1 to-color-2 flex items-center justify-center text-lg font-bold text-white shadow-md shadow-color-1/25 shrink-0">
                                                    {avatarLetter}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-n-1 font-bold text-base truncate">{displayName}</p>
                                                    <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-semibold bg-color-1/20 text-color-1 rounded-full capitalize">
                                                        {displayRole}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Username Edit Row */}
                                            <div className="mt-3 pt-3 border-t border-n-6/60">
                                                {!isEditingUsername ? (
                                                    <div className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-n-8/60 border border-n-6/50">
                                                        <span className="text-n-3 text-xs font-mono truncate">{displayUsername}</span>
                                                        <button
                                                            type="button"
                                                            onClick={handleStartEditUsername}
                                                            className="inline-flex items-center gap-1 text-[11px] text-n-4 hover:text-blue-400 p-1 -mr-1 rounded hover:bg-n-7 transition-colors cursor-pointer"
                                                            title="Change your username"
                                                        >
                                                            <Pencil size={12} />
                                                            <span className="text-[11px] font-medium">Edit</span>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <form onSubmit={handleSaveUsername} className="space-y-1.5">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="relative flex-1">
                                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-n-4 text-xs font-mono select-none">
                                                                    @
                                                                </span>
                                                                <input
                                                                    type="text"
                                                                    value={newUsername}
                                                                    onChange={(e) => {
                                                                        setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24));
                                                                        setUsernameError('');
                                                                    }}
                                                                    placeholder="username"
                                                                    autoFocus
                                                                    disabled={savingUsername}
                                                                    className="w-full pl-6 pr-2 py-1.5 rounded-lg bg-n-8 border border-blue-500/60 text-xs text-n-1 font-mono focus:outline-none focus:border-blue-400"
                                                                />
                                                            </div>
                                                            <button
                                                                type="submit"
                                                                disabled={savingUsername || !newUsername.trim() || newUsername === user?.username}
                                                                title="Save username"
                                                                className="p-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 transition flex items-center justify-center shrink-0 shadow-sm cursor-pointer"
                                                            >
                                                                <Check size={14} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setIsEditingUsername(false);
                                                                    setUsernameError('');
                                                                }}
                                                                disabled={savingUsername}
                                                                title="Cancel"
                                                                className="p-1.5 rounded-lg text-n-4 hover:text-n-1 hover:bg-n-7 transition flex items-center justify-center shrink-0 cursor-pointer"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                        {usernameError && (
                                                            <p className="text-[11px] text-red-400 leading-tight">{usernameError}</p>
                                                        )}
                                                        {usernameSuccess && (
                                                            <p className="text-[11px] text-green-400 leading-tight flex items-center gap-1">
                                                                <Check size={12} className="inline text-green-400" /> Username updated!
                                                            </p>
                                                        )}
                                                    </form>
                                                )}

                                                <p className="text-n-4 text-xs mt-2 truncate px-1">{displayEmail}</p>
                                            </div>
                                        </div>

                                        {/* Action Links */}
                                        <div className="space-y-2">
                                            {/* Role-based dashboard options */}
                                            {user?.role === 'admin' ? (
                                                <div className="space-y-1.5">
                                                    <p className="text-[11px] font-semibold text-n-4 uppercase tracking-wider px-1">Switch Dashboard</p>
                                                    
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            closeNavigation();
                                                            navigate('/dashboard/admin');
                                                        }}
                                                        className={`flex items-center gap-3 w-full py-2.5 px-3.5 rounded-xl transition-colors text-sm font-medium cursor-pointer ${
                                                            pathname.pathname === '/dashboard/admin'
                                                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                                                : 'bg-n-7 hover:bg-n-6 text-n-1'
                                                        }`}
                                                    >
                                                        <ShieldCheck size={18} className="text-rose-400 shrink-0" />
                                                        <div className="flex-1 text-left">
                                                            <div className="leading-tight">Admin Dashboard</div>
                                                            <div className="text-[10px] text-n-4">System, analytics & users</div>
                                                        </div>
                                                        {pathname.pathname === '/dashboard/admin' ? (
                                                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-500/30 text-rose-300 font-mono">Current</span>
                                                        ) : (
                                                            <ChevronRight size={15} className="text-n-4" />
                                                        )}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            closeNavigation();
                                                            navigate('/dashboard/professor');
                                                        }}
                                                        className={`flex items-center gap-3 w-full py-2.5 px-3.5 rounded-xl transition-colors text-sm font-medium cursor-pointer ${
                                                            pathname.pathname === '/dashboard/professor'
                                                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                                                : 'bg-n-7 hover:bg-n-6 text-n-1'
                                                        }`}
                                                    >
                                                        <GraduationCap size={18} className="text-color-2 shrink-0" />
                                                        <div className="flex-1 text-left">
                                                            <div className="leading-tight">Professor Dashboard</div>
                                                            <div className="text-[10px] text-n-4">Uploads & subjects</div>
                                                        </div>
                                                        {pathname.pathname === '/dashboard/professor' ? (
                                                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/30 text-purple-300 font-mono">Current</span>
                                                        ) : (
                                                            <ChevronRight size={15} className="text-n-4" />
                                                        )}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            closeNavigation();
                                                            navigate('/dashboard/student');
                                                        }}
                                                        className={`flex items-center gap-3 w-full py-2.5 px-3.5 rounded-xl transition-colors text-sm font-medium cursor-pointer ${
                                                            pathname.pathname === '/dashboard/student'
                                                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                                                : 'bg-n-7 hover:bg-n-6 text-n-1'
                                                        }`}
                                                    >
                                                        <BookOpen size={18} className="text-cyan-400 shrink-0" />
                                                        <div className="flex-1 text-left">
                                                            <div className="leading-tight">Student Dashboard</div>
                                                            <div className="text-[10px] text-n-4">Study materials & AI tests</div>
                                                        </div>
                                                        {pathname.pathname === '/dashboard/student' ? (
                                                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/30 text-cyan-300 font-mono">Current</span>
                                                        ) : (
                                                            <ChevronRight size={15} className="text-n-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            ) : user?.role === 'professor' ? (
                                                <div className="space-y-1.5">
                                                    <p className="text-[11px] font-semibold text-n-4 uppercase tracking-wider px-1">Switch Dashboard</p>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            closeNavigation();
                                                            navigate('/dashboard/professor');
                                                        }}
                                                        className={`flex items-center gap-3 w-full py-2.5 px-3.5 rounded-xl transition-colors text-sm font-medium cursor-pointer ${
                                                            pathname.pathname === '/dashboard/professor'
                                                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                                                : 'bg-n-7 hover:bg-n-6 text-n-1'
                                                        }`}
                                                    >
                                                        <GraduationCap size={18} className="text-color-2 shrink-0" />
                                                        <div className="flex-1 text-left">
                                                            <div className="leading-tight">Professor Dashboard</div>
                                                            <div className="text-[10px] text-n-4">My uploads & materials</div>
                                                        </div>
                                                        {pathname.pathname === '/dashboard/professor' ? (
                                                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/30 text-purple-300 font-mono">Current</span>
                                                        ) : (
                                                            <ChevronRight size={15} className="text-n-4" />
                                                        )}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            closeNavigation();
                                                            navigate('/dashboard/student');
                                                        }}
                                                        className={`flex items-center gap-3 w-full py-2.5 px-3.5 rounded-xl transition-colors text-sm font-medium cursor-pointer ${
                                                            pathname.pathname === '/dashboard/student'
                                                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                                                : 'bg-n-7 hover:bg-n-6 text-n-1'
                                                        }`}
                                                    >
                                                        <BookOpen size={18} className="text-cyan-400 shrink-0" />
                                                        <div className="flex-1 text-left">
                                                            <div className="leading-tight">Student Dashboard</div>
                                                            <div className="text-[10px] text-n-4">Browse resources as student</div>
                                                        </div>
                                                        {pathname.pathname === '/dashboard/student' ? (
                                                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/30 text-cyan-300 font-mono">Current</span>
                                                        ) : (
                                                            <ChevronRight size={15} className="text-n-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        closeNavigation();
                                                        navigate(dashboardPath);
                                                    }}
                                                    className={`flex items-center gap-3 w-full py-3 px-4 rounded-xl transition-colors text-n-1 font-medium text-sm cursor-pointer ${
                                                        pathname.pathname === dashboardPath
                                                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                                            : 'bg-n-7 hover:bg-n-6'
                                                    }`}
                                                >
                                                    <LayoutDashboard size={18} className="text-cyan-400 shrink-0" />
                                                    <span>Dashboard</span>
                                                    <ChevronRight size={15} className="ml-auto text-n-4" />
                                                </button>
                                            )}

                                            {/* Become a Professor (students only) */}
                                            {isStudent && (
                                                <div className="rounded-xl bg-n-7 overflow-hidden border border-n-6/50">
                                                    <button
                                                        onClick={() => setPinExpanded((prev) => !prev)}
                                                        className="flex items-center gap-3 w-full py-3 px-4 text-n-1 hover:bg-n-6 transition-colors text-sm font-medium text-left cursor-pointer"
                                                    >
                                                        <GraduationCap size={18} className="text-color-2 shrink-0" />
                                                        <span>Become a Professor</span>
                                                        <ChevronDown
                                                            size={15}
                                                            className={`ml-auto text-n-4 transition-transform duration-200 ${
                                                                pinExpanded ? 'rotate-180' : ''
                                                            }`}
                                                        />
                                                    </button>

                                                    {pinExpanded && !pinSuccess && (
                                                        <form onSubmit={handleUpgradeMobile} className="px-4 pb-4 pt-1 flex flex-col gap-2">
                                                            <input
                                                                type="text"
                                                                value={pin}
                                                                onChange={(e) => setPin(e.target.value)}
                                                                placeholder="Enter professor PIN"
                                                                maxLength={8}
                                                                className="w-full bg-n-8 border border-n-5 rounded-lg px-3 py-2 text-sm text-n-1 placeholder-n-4 focus:outline-none focus:border-color-1 transition-colors"
                                                            />
                                                            {pinError && <p className="text-red-400 text-xs">{pinError}</p>}
                                                            <button
                                                                type="submit"
                                                                disabled={pinLoading || !pin.trim()}
                                                                className="bg-color-1 text-white rounded-lg px-3 py-2 text-sm font-semibold hover:bg-color-1/80 disabled:opacity-50 transition-all cursor-pointer"
                                                            >
                                                                {pinLoading ? 'Verifying…' : 'Submit PIN'}
                                                            </button>
                                                        </form>
                                                    )}

                                                    {pinSuccess && (
                                                        <p className="px-4 pb-4 text-xs text-green-400">
                                                            ✓ Upgraded! Redirecting to professor dashboard…
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="p-4 rounded-2xl bg-n-7/70 border border-n-6 text-center">
                                        <p className="text-n-1 font-bold text-base">Welcome to EduSphere</p>
                                        <p className="text-xs text-n-4 mt-1">Sign in to access study materials, AI tutor, quizzes, and your dashboard.</p>
                                        <Button className="w-full mt-3 text-xs py-2.5" onClick={() => { closeNavigation(); navigate('/login'); }}>
                                            Sign In / Register
                                        </Button>
                                    </div>
                                )}

                                {/* Navigation Links Section */}
                                <div className="pt-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-n-4 px-2 mb-2">
                                        Navigation
                                    </p>
                                    <div className="space-y-1">
                                        {navigation.map((item) => {
                                            if (item.auth) return null;
                                            const isActive = item.url === pathname.pathname;
                                            return (
                                                <a
                                                    key={item.id}
                                                    href={item.url || '#'}
                                                    onClick={(e) => handleNavLink(e, item)}
                                                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                                        isActive
                                                            ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                                            : 'text-n-2 hover:text-n-1 hover:bg-n-7/70'
                                                    }`}
                                                >
                                                    <span>{item.title}</span>
                                                    <ChevronRight size={14} className={isActive ? 'text-blue-400' : 'text-n-5'} />
                                                </a>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Drawer Footer with Sign Out */}
                            {isAuthenticated && (
                                <div className="sticky bottom-0 bg-n-8/95 backdrop-blur-md p-4 border-t border-n-6 shrink-0">
                                    <button
                                        onClick={() => {
                                            closeNavigation();
                                            logout();
                                            navigate('/');
                                        }}
                                        className="flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 font-medium text-sm transition-colors cursor-pointer"
                                    >
                                        <LogOut size={16} />
                                        <span>Sign Out</span>
                                    </button>
                                </div>
                            )}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Header;