
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import Button from "./Button";
import eduIcon from "../assets/eduIcon.svg";
import { navigation } from "../constants";
import { disablePageScroll, enablePageScroll } from "scroll-lock";
import MenuSvg from "../assets/svg/MenuSvg";
import { HamburgerMenu } from "./design/Header";
import { useAuth } from "../context/AuthContext";
import ProfileDropdown from "./ProfileDropdown";
import { User, LogOut, KeyRound, LayoutDashboard } from "lucide-react";


const Header = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user, isStudent, upgradeToProfessor, logout } = useAuth();

    const pathname = useLocation();
    const [openNavigation, setOpenNavigation] = useState(false);

    // ── Desktop dropdown state ───────────────────────────────────────
    const [dropdownOpen, setDropdownOpen]           = useState(false);
    // ── Mobile profile expand state ──────────────────────────────────
    const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
    // Ref for outside-click detection
    const dropdownRef = useRef(null);

    // ── Outside-click + ESC handler ──────────────────────────────────
    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        const handleEsc = (e) => {
            if (e.key === 'Escape') setDropdownOpen(false);
        };
        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('keydown', handleEsc);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('keydown', handleEsc);
        };
    }, []);

    // ── Hamburger toggle ─────────────────────────────────────────────
    const toggleNavigation = () => {
        if (openNavigation) {
            setOpenNavigation(false);
            setMobileProfileOpen(false);
            enablePageScroll();
        } else {
            setOpenNavigation(true);
            disablePageScroll();
        }
    };

    // ── Smooth-scroll handler for hash links ─────────────────────────
    const handleClick = (e, url) => {
        e.preventDefault();
        if (url) {
            const targetId = url.replace('#', '');
            const target = document.getElementById(targetId);
            if (target) {
                const yOffset = 170;
                const y = target.getBoundingClientRect().top + window.pageYOffset + yOffset;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        }
        enablePageScroll();
        setOpenNavigation(false);
    };

    // ── Avatar initials helper ───────────────────────────────────────
    const avatarLetter = (
        user?.name?.[0] || user?.username?.[0] || 'U'
    ).toUpperCase();

    return (
        <div
            className={`fixed top-0 left-0 w-full z-50 border-b border-n-6 lg:bg-n-8/90 lg:backdrop-blur-sm ${
                openNavigation ? 'bg-n-8' : 'bg-n-8/90 backdrop-blur-sm'
            }`}
        >
            <div className="flex items-center px-5 lg:px-7.5 xl:px-10 max-lg:py-4">

                {/* ── Logo ─────────────────────────────────────────────── */}
                <a
                    className="flex items-center w-[12rem] xl:mr-8 cursor-pointer"
                    onClick={(e) => {
                        e.preventDefault();
                        navigate('/');
                        enablePageScroll();
                        setOpenNavigation(false);
                    }}
                    href="/"
                >
                    <img src={eduIcon} width={40} height={40} alt="Edusphere" />
                    <span className="text-2xl font-bold text-n-1 hidden sm:inline-block">EduSphere</span>
                </a>

                {/* ── Nav links (desktop ONLY now, mobile uses BottomBar) ────────────── */}
                <nav className="hidden lg:flex lg:mx-auto lg:bg-transparent relative z-2 items-center justify-center m-auto w-full">



                        {/* ── Nav link items ───────────────────────────── */}
                        {navigation.map((item) => {
                            const isHome     = item.title === 'HOME';
                            const isAbout    = item.title === 'ABOUT';
                            const isServices = item.title === 'Services';
                            const isContact  = item.title === 'contact';
                            const isEduAi    = item.title === 'Edu.ai';

                            // Skip auth-only placeholder items
                            if (item.auth) return null;

                            return (
                                <a
                                    key={item.id}
                                    href={
                                        isHome     ? '/'
                                        : isAbout    ? '/about'
                                        : isServices ? '/services'
                                        : isContact  ? '/contact'
                                        : isEduAi    ? '/ai'
                                        : item.url || '#'
                                    }
                                    onClick={(e) => {
                                        if (isHome) {
                                            e.preventDefault(); navigate('/');
                                            enablePageScroll(); setOpenNavigation(false);
                                        } else if (isAbout) {
                                            e.preventDefault(); navigate('/about');
                                            enablePageScroll(); setOpenNavigation(false);
                                        } else if (isServices) {
                                            e.preventDefault(); navigate('/services');
                                            enablePageScroll(); setOpenNavigation(false);
                                        } else if (isContact) {
                                            e.preventDefault(); navigate('/contact');
                                            enablePageScroll(); setOpenNavigation(false);
                                        } else if (isEduAi) {
                                            e.preventDefault(); navigate('/ai');
                                            enablePageScroll(); setOpenNavigation(false);
                                        } else {
                                            handleClick(e, item.url);
                                        }
                                    }}
                                    className={`block relative font-code text-2xl uppercase text-n-1 transition-colors hover:text-cyan-400 px-6 py-6 md:py-8 lg:mr-0.25 lg:text-xs lg:font-semibold ${
                                        item.url === pathname.pathname ? 'z-2 lg:text-n-1' : 'lg:text-n-1/50'
                                    } lg:leading-5 lg:hover:text-n-1 xl:px-12`}
                                >
                                    {item.title}
                                </a>
                            );
                        })}
                </nav>

                {/* ── Desktop right section ────────────────────────── */}
                <div className="hidden lg:flex items-center gap-3">
                    <Button onClick={() => navigate('/creators')}>
                        Creators
                    </Button>

                    {isAuthenticated ? (
                        /* Profile avatar + dropdown */
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
                        <Button onClick={() => navigate('/login')}>
                            Sign In
                        </Button>
                    )}
                </div>

                {/* ── Mobile right section ───────────────────────────── */}
                <div className="flex lg:hidden items-center ml-auto gap-2">
                    {isAuthenticated ? (
                        <>
                            <button className="p-2 -mr-2" onClick={toggleNavigation}>
                                <MenuSvg openNavigation={openNavigation} />
                            </button>
                            {openNavigation && (
                                <div className="absolute top-full left-0 right-0 bg-n-8/95 backdrop-blur-md border-b border-n-6 flex flex-col p-6 shadow-2xl animate-fade-in z-50">
                                    <div className="flex flex-col items-center justify-center gap-2 mb-6 pt-4">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-cyan-500/20">
                                            {avatarLetter}
                                        </div>
                                        <p className="text-n-1 font-bold text-lg mt-2">{user?.name || user?.username || 'Unknown User'}</p>
                                        <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono font-medium uppercase tracking-wider">
                                            {user?.role || 'user'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <button 
                                            onClick={() => { setOpenNavigation(false); navigate(`/dashboard/${user?.role || 'student'}`); }}
                                            className="flex items-center gap-3 w-full py-3 px-4 rounded-xl bg-n-7 hover:bg-n-6 transition-colors text-n-1 font-medium"
                                        >
                                            <LayoutDashboard size={20} className="text-cyan-400" />
                                            Dashboard
                                        </button>
                                        {(isStudent && user?.role !== 'professor') && (
                                            <button 
                                                onClick={() => { setOpenNavigation(false); navigate('/auth/pin'); }}
                                                className="flex items-center gap-3 w-full py-3 px-4 rounded-xl bg-n-7 hover:bg-n-6 transition-colors text-n-1 font-medium"
                                            >
                                                <KeyRound size={20} className="text-emerald-400" />
                                                Professor PIN
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => { setOpenNavigation(false); logout(); navigate('/'); }}
                                            className="flex items-center gap-3 w-full py-3 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors text-red-400 font-medium mt-2"
                                        >
                                            <LogOut size={20} />
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <Button className="ml-auto" px="px-4" onClick={() => navigate('/login')}>
                            Get Started
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Header;