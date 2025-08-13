
import React from 'react';
import { useLocation , useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Button from "./Button";
import eduIcon from "../assets/eduIcon.svg"
import {navigation} from "../constants"
import {disablePageScroll,enablePageScroll} from "scroll-lock";
import MenuSvg from "../assets/svg/MenuSvg";
import {HamburgerMenu} from "./design/Header";
import { SignInButton, useClerk , UserButton, useUser } from '@clerk/clerk-react'



const Header = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const {user} =useUser()
    const { openSignIn } = useClerk()

    // Helper: open sign-in and store intended route for redirect
    const handleAuthRedirect = (redirectPath) => {
        if (redirectPath) {
            localStorage.setItem("redirectAfterLogin", redirectPath)
        }
        openSignIn()
    }

    // On mount, check if just logged in and redirect if needed
    React.useEffect(() => {
        const redirectPath = localStorage.getItem("redirectAfterLogin")
        // Only redirect if user is authenticated and path is set
        if (redirectPath && user) {
            navigate(redirectPath)
            localStorage.removeItem("redirectAfterLogin")
        }
    }, [user, navigate])


    const pathname= useLocation();
    const [openNavigation, setOpenNavigation] = useState(false);
    
    const toggleNavigation=()=>{
        if(openNavigation) {
            setOpenNavigation(false);
            enablePageScroll();
        }
        else {
            setOpenNavigation(true);
            disablePageScroll();
        }
    };

    // Custom scroll handler for navbar links with offset
    // Custom scroll handler for navbar links with offset and Clerk auth
    const handleClick = (e, url, item) => {
        e.preventDefault();
        if (item && item.auth) {
            // Store intended route for redirect after login
            handleAuthRedirect(item.to || "/pyqs")
        } else if (url) {
            const targetId = url.replace('#', '');
            const target = document.getElementById(targetId);
            if (target) {
                const yOffset = 170; // Adjust this value for your header height
                const y = target.getBoundingClientRect().top + window.pageYOffset + yOffset;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        }
        enablePageScroll();
        setOpenNavigation(false);
    }
return (
    <div  className={`fixed top-0 left-0 w-full z-50  border-b border-n-6 lg:bg-n-8/90 lg:backdrop-blur-sm ${openNavigation ? "bg-n-8" : "bg-n-8/90 backdrop-blur-sm"} `}>
            <div className="flex items-center px-5 lg:px-7.5 xl:px-10 max-lg:py-4">
                    <a
                        className="flex items-center w-[12rem] xl:mr-8 cursor-pointer"
                        onClick={(e) => {
                            e.preventDefault();
                            navigate("/");
                            enablePageScroll();
                            setOpenNavigation(false);
                        }}
                        href="/"
                    >
                        <img src={eduIcon} width={40} height={40} alt="Eusphere" />
                        <span className="text-2xl font-bold text-n-1">EduSphere</span>
                    </a>
                    <nav className={` ${openNavigation ? "flex": "hidden"} fixed top-[5rem] left-0 right-0 bottom-0 bg-n-8 lg:static lg:flex lg:mx-auto lg:bg-transparent`}>
                            <div className="relative z-2 flex flex-col items-center justify-center m-auto lg:flex-row">
                                    {navigation.map((item) => {
                                        // Redirect Home and About to '/'
                                        const isHomeOrAbout = ["HOME"].includes(item.title);
                                        return (
                                            <a
                                                key={item.id}
                                                href={isHomeOrAbout ? "/" : item.url || "#"}
                                                onClick={(e) => {
                                                    if (isHomeOrAbout) {
                                                        e.preventDefault();
                                                        navigate("/");
                                                        enablePageScroll();
                                                        setOpenNavigation(false);
                                                    } else {
                                                        handleClick(e, item.url, item);
                                                    }
                                                }}
                                                className={`block relative font-code text-2xl uppercase text-n-1 transition-colors hover:text-color-1 ${item.onlyMobile ? "lg:hidden" : ""} px-6 py-6 md:py-8 lg:mr-0.25 lg:text-xs lg:font-semibold ${item.url===pathname.hash ? 'z-2 lg:text-n-1':"lg:text-n-1/50"} lg:leading-5 lg:hover:text-n-1 xl:px-12`}
                                            >
                                                {item.title}
                                            </a>
                                        );
                                    })}
                                    {/* Clerk auth in hamburger menu using existing button */}
                                    {/*  */}
                            </div>
                            <HamburgerMenu/>
                    </nav>
                    {
                        user ? <UserButton/> : (

        <Button onClick={() => handleAuthRedirect("/")} className="hidden lg:flex" >
                                    Get Started
                    </Button>
                        )
                    }

                                    <Button className="ml-auto lg:hidden" px="px-3" onClick={toggleNavigation}>
                                        <MenuSvg openNavigation={openNavigation}/>
                                    </Button>

            </div>
    </div>
)
}

export default Header