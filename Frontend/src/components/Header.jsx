
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
                    <span className="text-2xl font-bold text-n-1">EduSphere</span>
                </a>

                {/* ── Nav links (desktop + mobile overlay) ────────────── */}
                <nav
                    className={`${
                        openNavigation ? 'flex' : 'hidden'
                    } fixed top-[5rem] left-0 right-0 bottom-0 bg-n-8 lg:static lg:flex lg:mx-auto lg:bg-transparent`}
                >
                    <div className="relative z-2 flex flex-col items-center justify-center m-auto lg:flex-row w-full">

                        {/* ── Mobile: profile block at top of menu ─────── */}
                        {isAuthenticated && (
                            <div className="w-full border-b border-n-6 mb-2 lg:hidden">
                                {/* Avatar row — tap to toggle */}
                                <button
                                    onClick={() => setMobileProfileOpen((prev) => !prev)}
                                    className="flex items-center gap-3 w-full px-6 py-5 text-left"
                                >
                                    {/* Gradient initials avatar */}
                                    <div
                                        className="w-10 h-10 rounded-full bg-gradient-to-br from-color-1 to-color-2
                                                   flex items-center justify-center font-bold text-white text-sm shrink-0"
                                    >
                                        {avatarLetter}
                                    </div>
                                    <div>
                                        <p className="text-n-1 font-semibold text-sm">
                                            {user?.name || user?.username || 'Unknown User'}
                                        </p>
                                        <p className="text-n-3 text-xs capitalize">
                                            {user?.role || 'user'}
                                        </p>
                                    </div>
                                    <ChevronDown
                                        size={16}
                                        className={`ml-auto text-n-3 transition-transform duration-200 ${
                                            mobileProfileOpen ? 'rotate-180' : ''
                                        }`}
                                    />
                                </button>

                                {/* Inline dropdown content (mobile) */}
                                {mobileProfileOpen && (
                                    <ProfileDropdown
                                        user={user}
                                        isStudent={isStudent}
                                        upgradeToProfessor={upgradeToProfessor}
                                        logout={logout}
                                        onClose={() => {
                                            setMobileProfileOpen(false);
                                            enablePageScroll();
                                            setOpenNavigation(false);
                                        }}
                                        mobile
                                    />
                                )}
                            </div>
                        )}

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
                                    className={`block relative font-code text-2xl uppercase text-n-1 transition-colors hover:text-color-1 ${
                                        item.onlyMobile ? 'lg:hidden' : ''
                                    } px-6 py-6 md:py-8 lg:mr-0.25 lg:text-xs lg:font-semibold ${
                                        item.url === pathname.pathname ? 'z-2 lg:text-n-1' : 'lg:text-n-1/50'
                                    } lg:leading-5 lg:hover:text-n-1 xl:px-12`}
                                >
                                    {item.title}
                                </a>
                            );
                        })}
                    </div>

                    <HamburgerMenu />
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

                {/* ── Hamburger button (mobile only) ───────────────── */}
                <Button className="ml-auto lg:hidden" px="px-3" onClick={toggleNavigation}>
                    <MenuSvg openNavigation={openNavigation} />
                </Button>

            </div>
        </div>
    );
};

export default Header;