import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

const InProductionPage = () => {
  return (
    <div
      style={{ minHeight: '100vh', background: '#0E0C15', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
    >
      {/* Ambient glow */}
      <div aria-hidden style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '80vw', height: '50vh', pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(56,189,248,0.1) 0%, rgba(167,139,250,0.05) 40%, transparent 70%)',
        filter: 'blur(40px)',
      }}/>

      {/* Decorative rings */}
      <div aria-hidden style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 'min(700px, 90vw)', aspectRatio: '1',
        pointerEvents: 'none', zIndex: 0,
      }}>
        {[1, 0.72, 0.5, 0.32].map((scale, i) => (
          <div key={i} style={{
            position: 'absolute', top: '50%', left: '50%',
            width: `${scale * 100}%`, aspectRatio: '1',
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            border: `1px solid rgba(${i < 2 ? '56,189,248' : '167,139,250'}, ${0.06 + i * 0.02})`,
          }}/>
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '640px' }}>
        <div
          className="edus-card"
          style={{
            padding: '48px 40px',
            boxShadow: '0 0 0 1px rgba(56,189,248,0.06), 0 24px 60px rgba(0,0,0,0.5)',
          }}
        >
          {/* Floating icon */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
            <div
              className="edus-animate-float"
              style={{
                width: 72, height: 72, borderRadius: '22px',
                background: 'linear-gradient(135deg, #38bdf8 0%, #a78bfa 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(56,189,248,0.3)',
              }}
            >
              <Sparkles size={32} color="white" />
            </div>
          </div>

          {/* Eyebrow */}
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <span className="edus-badge-blue">Work in Progress</span>
          </div>

          <h1 style={{
            textAlign: 'center', margin: '0 0 12px',
            fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 700, letterSpacing: '-0.03em', color: '#fff',
          }}>
            This page is being{' '}
            <span style={{
              background: 'linear-gradient(135deg, #38bdf8, #a78bfa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>crafted</span>
          </h1>

          <p style={{ textAlign: 'center', color: '#757185', fontSize: '15px', margin: '0 0 36px', lineHeight: 1.7 }}>
            We're building something thoughtful and precise here. Carefully crafted content and features are on the way.
          </p>

          {/* Stat tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '32px' }}>
            {[
              { icon: '✦', label: 'Updates', text: 'New content weekly' },
              { icon: '⚡', label: 'Speed',   text: 'Optimised delivery' },
              { icon: '🔒', label: 'Security', text: 'End-to-end safe' },
            ].map(tile => (
              <div key={tile.label} style={{
                background: 'rgba(56,189,248,0.04)', border: '1px solid rgba(56,189,248,0.1)',
                borderRadius: '12px', padding: '14px 12px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '18px', marginBottom: '6px' }}>{tile.icon}</div>
                <div style={{ color: '#CAC6DD', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>{tile.label}</div>
                <div style={{ color: '#3F3A52', fontSize: '11px' }}>{tile.text}</div>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link to="/services" className="edus-btn" style={{ flex: 1, minWidth: '140px', justifyContent: 'center' }}>
              View Other Services <ArrowRight size={15} />
            </Link>
            <button onClick={() => window.history.back()} className="edus-btn-ghost" style={{ flex: 1, minWidth: '120px' }}>
              ← Go Back
            </button>
          </div>

          {/* Footer note */}
          <p style={{ textAlign: 'center', color: '#3F3A52', fontSize: '12px', marginTop: '24px' }}>
            Estimated availability — <span style={{ color: '#ADA8C3' }}>Coming soon</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default InProductionPage;
