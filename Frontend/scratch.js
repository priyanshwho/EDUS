const fs = require('fs');

let content = fs.readFileSync('/Users/priyanshu/Desktop/EDUS/Frontend/src/components/ui/particle-hero.tsx', 'utf-8');

// 1. Add children to props
content = content.replace(
  'export function ParticleHero() {',
  'export function ParticleHero({ children }: { children?: React.ReactNode }) {'
);

// 2. Rename isGoldMode to isSkyMode
content = content.replace(/isGoldMode/g, 'isSkyMode');
content = content.replace(/setIsGoldMode/g, 'setIsSkyMode');
content = content.replace(/toggleGoldMode/g, 'toggleSkyMode');
content = content.replace(/gold-mode/g, 'sky-mode');

// 3. Update CSS colors in sky-mode
content = content.replace(
  `        .sky-mode .header h2,
        .sky-mode p,
        .sky-mode > * > * :not(.contact-btn) {
          filter: invert(1) brightness(4.7);
        }
        .sky-mode .header h2 a {
          filter: hue-rotate(0deg);
        }
        .sky-mode canvas {
          filter: drop-shadow(2em 4em 0px #d8bd10) drop-shadow(-8em -14em 0px #d8bd10);
        }
        .sky-mode .header .spotlight {
          filter: invert(1) brightness(4.7) opacity(0.5);
        }
        .sky-mode .mountains > div {
          box-shadow: 
            -1em -0.2em 0.4em -1.1em #c2ccff,
            inset 0em 0em 0em 2px #d8a910,
            inset 0.2em 0.3em 0.2em -0.2em #c2ccff,
            inset 10.2em 10.3em 2em -10em #d4e6ff2f;
        }
        .sky-mode .content-section,
        .sky-mode .content-section ::before,
        .sky-mode .content-section ::after {
          filter: invert(1) brightness(4.4) opacity(1);
        }
        .sky-mode .header > div.mid-spot {
          box-shadow: 0 0 1em 0 #d8bd10;
        }`,
  `        .sky-mode .header h2,
        .sky-mode p,
        .sky-mode > * > * :not(.contact-btn) {
          filter: brightness(1.2);
        }
        .sky-mode canvas {
          filter: drop-shadow(2em 4em 0px #38bdf8) drop-shadow(-8em -14em 0px #38bdf8);
        }
        .sky-mode .header .spotlight {
          filter: brightness(1.5) opacity(0.8);
        }
        .sky-mode .mountains > div {
          box-shadow: 
            -1em -0.2em 0.4em -1.1em #c2ccff,
            inset 0em 0em 0em 2px #38bdf8,
            inset 0.2em 0.3em 0.2em -0.2em #c2ccff,
            inset 10.2em 10.3em 2em -10em #d4e6ff2f;
        }
        .sky-mode .content-section,
        .sky-mode .content-section ::before,
        .sky-mode .content-section ::after {
          filter: brightness(1.2) opacity(1);
        }
        .sky-mode .header > div.mid-spot {
          box-shadow: 0 0 1em 0 #38bdf8;
        }`
);

// 4. Fix mid-spot hover
content = content.replace(
  `          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = isSkyMode
              ? "-0.3em 0.1em 0.2em 0 #98c0ef"
              : "-0.3em 0.1em 0.2em 0 #d8bd10"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = isSkyMode ? "0 0 1em 0 #d8bd10" : "0 0 1em 0 #98c0ef"
          }}`,
  `          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = isSkyMode
              ? "-0.3em 0.1em 0.2em 0 #0ea5e9"
              : "-0.3em 0.1em 0.2em 0 #38bdf8"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = isSkyMode ? "0 0 1em 0 #38bdf8" : "0 0 1em 0 #0ea5e9"
          }}`
);

// 5. Wrap Hero block with children check
// We need to find: {/* Hero */} and everything below it up to </div>
// Actually, let's just replace the exact block.

const heroStart = content.indexOf('{/* Hero */}');
const endOfFile = content.lastIndexOf('</div>');

const oldHeroBlock = content.substring(heroStart, endOfFile);

const newHeroBlock = \`{/* Content */}
      <div className="relative z-10 flex w-full flex-col items-center justify-center min-h-screen">
        {children ? (
          children
        ) : (
          <>
            <div
              className="hero mx-auto max-w-3xl flex justify-center mt-60 h-[300px] border-gray-800 border"
            >
              <div
                className="heroT"
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  margin: "auto",
                  height: "20em",
                  paddingTop: "2em",
                  transform: "translateY(-1.6em)",
                  opacity: 0,
                  animation: "load 2s ease-in-out 0.6s forwards",
                }}
              >
                <h2
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    margin: "auto",
                    width: "fit-content",
                    fontSize: "7em",
                    fontWeight: 600,
                    color: "#9dc3f7",
                    background: \`
                      radial-gradient(2em 2em at 50% 50%,
                        transparent calc(var(--p, 0%) - 2em),
                        #fff calc(var(--p, 0%) - 1em), 
                        #fff calc(var(--p, 0%) - 0.4em), 
                        transparent var(--p, 0%) 
                      ),
                      linear-gradient(0deg, #bad1f1 30%, #9dc3f7 100%)
                    \`,
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    textShadow: "0 2px 16px rgba(174,207,242,.24)",
                    transition: "--p 3s linear",
                    animation: "pulse 10s linear 1.2s infinite",
                  }}
                >
                 Sky Design  
                </h2>
                <h2
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    margin: "auto",
                    width: "fit-content",
                    fontSize: "7em",
                    fontWeight: 600,
                    background: \`
                      radial-gradient(2em 2em at 50% 50%,
                        transparent calc(var(--p, 0%) - 2em),
                        transparent calc(var(--p, 0%) - 1em),
                        #fff calc(var(--p, 0%) - 1em), 
                        #fff calc(var(--p, 0%) - 0.4em), 
                        transparent calc(var(--p, 0%) - 0.4em), 
                        transparent var(--p, 0%) 
                      )
                    \`,
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "blur(16px) opacity(0.4)",
                  }}
                >
                  Sky Design  
                </h2>
              </div>
            </div>
            <p
              className="heroP"
              style={{
                fontSize: "1.2em",
                position: "absolute",
                left: 0,
                right: 0,
                top: "20em",
                margin: "auto",
                height: "fit-content",
                width: "fit-content",
                textAlign: "center",
                opacity: 0,
                transform: "translateY(1em)",
                animation: "load 2s ease-out 2s forwards, up 1.4s ease-out 2s forwards",
                color: "#d8ecf8", 
                background: "linear-gradient(0deg, #d8ecf8 0, #98c0ef 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              The world's best platform for Designs, <br />
              powered by EduSphere
            </p>
          </>
        )}
      </div>
  `;

content = content.replace(oldHeroBlock, newHeroBlock);

// Remove the hardcoded h-[700px] from wrapper to allow min-h-screen
content = content.replace(
  /className=\{\`relative h-\[700px\] w-full overflow-hidden \$\{isSkyMode \? "sky-mode" : ""\}\`\}/,
  'className={`relative min-h-screen w-full overflow-hidden ${isSkyMode ? "sky-mode" : ""}`}'
);

fs.writeFileSync('/Users/priyanshu/Desktop/EDUS/Frontend/src/components/ui/particle-hero.tsx', content);
