import { benefits } from "../constants";
import Heading from "./Heading";
import Section from "./Section";
import { GradientLight } from "./design/Benefits";
import ClipPath from "../assets/svg/ClipPath";

const About = () => {
  return (
    <Section id="features" className="relative scroll-mt-28 z-10">
      <div className="container relative z-2">
      <Heading
  className="flex justify-center md:max-w-md lg:max-w-2xl text-center mb-12"
  title={
    <>
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E90FF] to-[#00BFFF] flex justify-center uppercase mb-6 font-bold tracking-wider text-xl md:text-2xl">
        ABOUT US
      </span>
      <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white to-[#CCCCCC] bg-clip-text text-transparent leading-tight">
        What we provide?
      </h2>
    </>
  }
/>

        <div className="flex flex-wrap gap-10 mb-10">
        {benefits.map((item) => (
  <div
    className="block relative p-0.5 bg-no-repeat bg-[length:100%_100%] md:max-w-[24rem] 
    transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:-translate-y-2"
    style={{
      backgroundImage: `url(${item.backgroundUrl})`,
    }}
    key={item.id}
  >
    <div className="relative z-2 flex flex-col min-h-[22rem] p-[2.4rem] pointer-events-none 
      group transition-colors duration-200">
      <h5 className="h5 mb-5 transition-colors duration-200 group-hover:text-color-1">
        {item.title}
      </h5>
      <p className="body-2 mb-6 text-n-3 transition-colors duration-200 
        group-hover:text-n-1">
        {item.text}
      </p>
    </div>

    {item.light && <GradientLight />}

    <div
      className="absolute inset-0.5 bg-n-8"
      style={{ clipPath: "url(#benefits)" }}
    >
      <div className="absolute inset-0 opacity-0 transition-all duration-300 
        hover:opacity-20 group-hover:blur-sm">
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            width={380}
            height={362}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-300 
              group-hover:scale-110"
          />
        )}
      </div>
    </div>

    <ClipPath />
  </div>
))}
        </div>
      </div>
    </Section>
  );
};

export default About;
