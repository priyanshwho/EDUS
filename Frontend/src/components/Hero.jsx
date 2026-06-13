import { curve, heroBackground, robot } from "../assets";
import Button from "./Button";
import Section from "./Section";
import { BackgroundCircles, BottomLine, Gradient } from "./design/Hero";
import { heroIcons } from "../constants";
import { ScrollParallax } from "react-just-parallax";
import { useRef } from "react";
import Generating from "./Generating";
import Creators from "./Creators";
import Below_Hero from "./Below_Hero";
// import Notification from "./Notification";
// import CompanyLogos from "./CompanyLogos";

const Hero = () => {
    const parallaxRef = useRef(null);
return (
    <Section className="pt-[12rem] -mt-[5.25rem] relative"
    crosses
    crossesOffset="lg:translate-y-[5.25rem]"
    customPaddings
    id="hero"
  >
    <div className='container relative' ref={parallaxRef}>
        
    <div className='relative z-1 max-w-[62rem] mx-auto text-center mb-[4rem] md:mb-20 lg:mb-[6rem]'>
            <h1 className='h1 mb-6'>
                Making <span className="text-sky-400">Your</span> Academic Life Easier 
                {" "}
                <span className='inline-block relative'>{" "}EDUSPHERE{" "}
                    <img 
                    src={curve} className='absolute top-full left-0 w-full xl:-mt-2' width={624}
                    height={28}
                    alt=""
                    aria-hidden="true"
                    /> 
                    </span>
            </h1>
            <p className='body-1 max-w-3xl mx-auto mb-6 text-n-2 lg:mb-8'>
            Everything you need to survive college—notes, tips, tools, and real support every day.
            </p>
            {/* <Button className={`text-sky-400`} href="#Services" white> */}
            <Button
              className={`text-sky-400`}
              white
              onClick={e => {
                e.preventDefault();
                const section = document.querySelector('#Services');
                if (section) {
                  const rect = section.getBoundingClientRect();
                  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                  // Scroll to section top + 80px offset
                  window.scrollTo({
                    top: rect.top + scrollTop + 80,
                    behavior: 'smooth'
                  });
                }
              }}
            >
              Get Started
            </Button>
    </div>
    <div className='relative max-w-[23rem] mx-auto md:max-w-5xl xl:mb-24'>
        <div className='relative z-1 p-0.5 rounded-2xl bg-conic-gradient'>
            <div className='relative bg-n-8 rounded-[1rem]'>
                <div className='h-[1.4rem] bg-n-10 rounded-t-[0.9rem]'/>

                <div className='aspect-[33/40] rounded-b-[0.9rem] overflow-hidden md:aspect-[688/490] lg:aspect-[1024/490]'>
                    <img 
                    src={robot}
                    className='w-full scale-[1.7] translate-y-[8%] md:scale-[1] md:-translate-y-[10%] lg:-translate-y-[23%]'
                    width={1024}
                    height={490}
                    alt="EduSphere AI dashboard preview"
                    loading="eager"
                    fetchpriority="high"
                    />
                    

                    <Generating className='absolute left-4 right-4 bottom-5 md:left-1/2 md:right-auto md:w-[31rem] md:bottom-8 md:-translate-x-1/2'/>


{/*                     <ScrollParallax isAbsolutelyPositioned>
                        <ul className='hidden absolute -left-[5.5rem] bottom-[7.5rem] px-1 py-1 bg-n-9/40 backdrop-blur border border-n-1/10 rounded-2xl xl:flex'>
                            {heroIcons.map((icon, index) => (
                                <li className='p-5 'key={index}>

                                

                                    <img 
                                    src={icon}
                              
                                    width={24}
                                    height={25}
                                    alt={icon}
                                    />
                                </li>
                            ))}
                        </ul>
                    </ScrollParallax> */}


                    <ScrollParallax isAbsolutelyPositioned>
    <ul className='hidden absolute -left-[5.5rem] bottom-[7.5rem] px-1 py-1 bg-n-9/40 backdrop-blur border border-n-1/10 rounded-2xl xl:flex'>
        {heroIcons.map((item, index) => (
            <li className='p-5' key={index}>
                <a 
                    href={item.url}
                    onClick={(e) => {
                        e.preventDefault();
                        // Add console.log to debug
                        console.log('Clicking:', item.title, 'Target:', item.url);
                        const section = document.querySelector(item.url);
                        // Check if section exists
                        if (section) {
                            console.log('Found section:', section);
                            section.scrollIntoView({ 
                                behavior: 'smooth',
                                block: 'start',
                                inline: 'nearest'
                            });
                        } else {
                            console.log('Section not found for:', item.url);
                        }
                    }}
                    className="cursor-pointer block"
                >
                    <img 
                        src={item.icon}
                        width={24}
                        height={25}
                        alt={item.title}
                        className="transition-transform duration-300 hover:scale-110"
                    />
                </a>
            </li>
        ))}
    </ul>
</ScrollParallax>

                    <ScrollParallax isAbsolutelyPositioned>
                    <div 
    onClick={() => {
      const makersSection = document.querySelector('#makers');
      if (makersSection) {
        makersSection.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }}
    className="cursor-pointer" // Add cursor pointer to indicate clickable
  >
                            <Creators className=" hidden absolute -right-[5.5rem] bottom-[14rem] w-[18rem] xl:flex" 
                            title="Creators"/>
                            </div>
                    </ScrollParallax> 


                </div>
            </div>


            <Gradient />
        </div>
         <div
            className='absolute -top-[80%] left-1/2 w-[234%] -translate-x-1/2 md:-top-[46%] md:w-[138%] lg:-top-[104%]'
            style={{
              backgroundImage: `url(${heroBackground})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              width: '234%',
              height: '100%',
            }}
            aria-hidden="true"
          />
            <BackgroundCircles/>
    </div>
    <Below_Hero className="hidden relative z-10 mt-20 lg:block"/>
</div>
 <BottomLine/>
  </Section>
  )
}

export default Hero 