import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  fadeDelay: number
  fadeStart: number
  fadingOut: boolean
  hue: number
  reset: () => void
  update: () => void
  draw: (ctx: CanvasRenderingContext2D) => void
}

export function ParticleHero({ children }: { children?: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  
  const animationRef = useRef<number>()

  const createParticle = (canvas: HTMLCanvasElement): Particle => {
    const particle = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 0,
      opacity: 1,
      fadeDelay: 0,
      fadeStart: 0,
      fadingOut: false,
      hue: 0,
      reset() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        // Slow drift — mostly upward with slight horizontal wander
        this.vy = -(Math.random() * 0.4 + 0.1)
        this.vx = (Math.random() - 0.5) * 0.15
        this.size = Math.random() * 1.5 + 0.3
        this.opacity = Math.random() * 0.7 + 0.3
        this.fadeDelay = Math.random() * 3000 + 1000
        this.fadeStart = Date.now() + this.fadeDelay
        this.fadingOut = false
        // Purple → violet → blue hues to match EduSphere palette
        this.hue = Math.random() * 80 + 240 // 240–320: blue→purple→violet
      },
      update() {
        this.x += this.vx
        this.y += this.vy
        if (this.y < -10) this.reset()
        if (this.x < -10) this.x = canvas.width + 5
        if (this.x > canvas.width + 10) this.x = -5

        if (!this.fadingOut && Date.now() > this.fadeStart) {
          this.fadingOut = true
        }
        if (this.fadingOut) {
          this.opacity -= 0.004
          if (this.opacity <= 0) this.reset()
        }
      },
      draw(ctx: CanvasRenderingContext2D) {
        const sat = 80 + Math.random() * 20
        const lit = 65 + Math.random() * 20
        ctx.fillStyle = `hsla(${this.hue}, ${sat}%, ${lit}%, ${this.opacity})`
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      },
    }
    particle.reset()
    particle.y = Math.random() * canvas.height
    return particle
  }

  const calculateParticleCount = (canvas: HTMLCanvasElement) => {
    return Math.floor((canvas.width * canvas.height) / 8000)
  }

  const initParticles = (canvas: HTMLCanvasElement) => {
    const count = calculateParticleCount(canvas)
    particlesRef.current = []
    for (let i = 0; i < count; i++) {
      particlesRef.current.push(createParticle(canvas))
    }
  }

  const animate = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    particlesRef.current.forEach((p) => {
      p.update()
      p.draw(ctx)
    })
    animationRef.current = requestAnimationFrame(() => animate(canvas, ctx))
  }

  const handleResize = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    initParticles(canvas)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    initParticles(canvas)
    animate(canvas, ctx)

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [])

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{ background: "#0E0C15" }}
    >
      {/* Ambient glow blobs — match EduSphere's purple/violet accent */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        {/* Top-center purple glow */}
        <div
          style={{
            position: "absolute",
            top: "-10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "60vw",
            height: "55vh",
            background:
              "radial-gradient(ellipse at center, rgba(172,106,255,0.18) 0%, rgba(172,106,255,0.06) 45%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        {/* Bottom-left violet glow */}
        <div
          style={{
            position: "absolute",
            bottom: "-5%",
            left: "-10%",
            width: "45vw",
            height: "45vh",
            background:
              "radial-gradient(ellipse at center, rgba(133,141,255,0.12) 0%, transparent 65%)",
            filter: "blur(50px)",
          }}
        />
        {/* Bottom-right pink-violet glow */}
        <div
          style={{
            position: "absolute",
            bottom: "5%",
            right: "-10%",
            width: "40vw",
            height: "40vh",
            background:
              "radial-gradient(ellipse at center, rgba(255,152,226,0.08) 0%, transparent 65%)",
            filter: "blur(50px)",
          }}
        />
      </div>

      {/* Spotlight beams from top-center */}
      <div
        aria-hidden
        style={{
          pointerEvents: "none",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          margin: "0 auto",
          height: "100%",
          width: "100%",
          overflow: "hidden",
          zIndex: 0,
        }}
      >
        {[
          { rotate: "rotate(18deg)", duration: "17s" },
          { rotate: "rotate(-18deg)", duration: "14s" },
          { rotate: "rotate(0deg)", duration: "21s", reverse: true },
        ].map((beam, i) => (
          <div
            key={i}
            style={{
              borderRadius: "0 0 50% 50%",
              position: "absolute",
              left: 0,
              right: 0,
              margin: "0 auto",
              top: 0,
              width: "28em",
              height: "55vh",
              backgroundImage:
                "conic-gradient(from 0deg at 50% -5%, transparent 44%, rgba(172,106,255,0.2) 49%, rgba(172,106,255,0.35) 50%, rgba(172,106,255,0.2) 51%, transparent 56%)",
              transformOrigin: "50% 0",
              filter: "blur(18px) opacity(0.5)",
              transform: beam.rotate,
              animation: `edus-spotlight ${beam.duration} ease-in-out infinite ${beam.reverse ? "reverse" : ""}`,
              fontSize: "max(calc(min(600px, 80vh) * 0.03), 10px)",
            }}
          />
        ))}
      </div>

      {/* Subtle horizontal grid lines */}
      <div
        aria-hidden
        style={{ pointerEvents: "none", position: "absolute", inset: 0, zIndex: 0 }}
      >
        {[15, 30, 50, 70, 85].map((pct, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: `${pct}%`,
              left: 0,
              right: 0,
              height: "1px",
              background:
                "linear-gradient(90deg, transparent 0%, rgba(172,106,255,0.12) 30%, rgba(172,106,255,0.22) 50%, rgba(172,106,255,0.12) 70%, transparent 100%)",
            }}
          />
        ))}
      </div>

      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        id="particleCanvas"
        style={{
          position: "absolute",
          pointerEvents: "none",
          zIndex: 1,
          width: "100%",
          height: "100%",
          opacity: 0.85,
        }}
      />

      {/* Content layer */}
      <div
        className="relative flex w-full flex-col items-center justify-center min-h-screen"
        style={{ zIndex: 2 }}
      >
        {children ?? (
          <p style={{ color: "#AC6AFF", fontFamily: "sans-serif" }}>EduSphere</p>
        )}
      </div>

      <style>{`
        @keyframes edus-spotlight {
          0%   { transform: rotate(0deg) scale(1);   filter: blur(18px) opacity(0.5); }
          20%  { transform: rotate(-1deg) scale(1.2); filter: blur(20px) opacity(0.6); }
          40%  { transform: rotate(2deg) scale(1.3);  filter: blur(16px) opacity(0.4); }
          60%  { transform: rotate(-2deg) scale(1.2); filter: blur(18px) opacity(0.6); }
          80%  { transform: rotate(1deg) scale(1.1);  filter: blur(15px) opacity(0.4); }
          100% { transform: rotate(0deg) scale(1);   filter: blur(18px) opacity(0.5); }
        }
      `}</style>
    </div>
  )
}
