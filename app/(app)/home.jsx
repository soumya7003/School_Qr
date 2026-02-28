import { useState, useEffect } from "react";

export default function Home() {
  const [active, setActive] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      background: "#050810",
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Serif+Display&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --red:          #FF3131;
          --red-soft:     rgba(255,49,49,0.10);
          --red-border:   rgba(255,49,49,0.20);
          --red-glow:     rgba(255,49,49,0.35);
          --bg:           #050810;
          --s1:           #0C1120;
          --s2:           #111827;
          --border:       rgba(255,255,255,0.07);
          --border-hi:    rgba(255,255,255,0.12);
          --t1:           #EEF2FF;
          --t2:           #8892B0;
          --t3:           #3D4A6B;
          --green:        #00DC6E;
          --amber:        #FFA827;
          --blue:         #4D8EFF;
        }

        .phone {
          width: 393px;
          background: var(--bg);
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
        }

        /* top ambient glow */
        .phone::before {
          content: '';
          position: absolute;
          top: -60px; left: 50%; transform: translateX(-50%);
          width: 320px; height: 320px;
          background: radial-gradient(circle, rgba(255,49,49,0.06) 0%, transparent 65%);
          pointer-events: none;
          z-index: 0;
        }

        .scroll {
          position: relative;
          z-index: 1;
          overflow-y: auto;
          padding-bottom: 110px;
          scrollbar-width: none;
        }
        .scroll::-webkit-scrollbar { display: none; }

        /* ─── fade-up entrance ─── */
        .fu {
          opacity: 0;
          transform: translateY(18px);
          transition: opacity 0.55s cubic-bezier(0.22,1,0.36,1),
                      transform 0.55s cubic-bezier(0.22,1,0.36,1);
        }
        .fu.in { opacity: 1; transform: none; }
        .d0 { transition-delay: 0.00s; }
        .d1 { transition-delay: 0.08s; }
        .d2 { transition-delay: 0.16s; }
        .d3 { transition-delay: 0.24s; }

        /* ─── PROFILE ─── */
        .profile {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 52px 24px 24px;
          gap: 0;
        }

        /* spinning gradient ring — properly masked */
        .ring-wrap {
          position: relative;
          width: 100px;
          height: 100px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ring-canvas {
          position: absolute;
          inset: 0;
          border-radius: 30px;
          background: conic-gradient(
            from 0deg,
            rgba(255,49,49,0)   0%,
            rgba(255,49,49,0.9) 30%,
            rgba(255,49,49,0)   55%,
            rgba(255,49,49,0)   100%
          );
          animation: ring-spin 4s linear infinite;
          /* mask: keep only the outer ring */
          -webkit-mask: radial-gradient(
            farthest-side,
            transparent calc(100% - 2.5px),
            #000 calc(100% - 2.5px)
          );
          mask: radial-gradient(
            farthest-side,
            transparent calc(100% - 2.5px),
            #000 calc(100% - 2.5px)
          );
        }

        @keyframes ring-spin {
          to { transform: rotate(360deg); }
        }

        .avatar {
          width: 88px;
          height: 88px;
          border-radius: 26px;
          background: linear-gradient(155deg, #18223A 0%, #0D1525 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 1;
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow:
            0 0 0 1px rgba(255,49,49,0.08),
            0 12px 40px rgba(0,0,0,0.7),
            inset 0 1px 0 rgba(255,255,255,0.06);
        }

        .avatar-letter {
          font-family: 'DM Serif Display', serif;
          color: var(--red);
          font-size: 36px;
          line-height: 1;
          user-select: none;
        }

        .verified {
          position: absolute;
          bottom: -5px;
          right: -5px;
          width: 21px;
          height: 21px;
          border-radius: 7px;
          background: var(--green);
          border: 2.5px solid var(--bg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 10px rgba(0,220,110,0.45);
          z-index: 2;
        }

        .pname {
          font-family: 'DM Serif Display', serif;
          color: var(--t1);
          font-size: 25px;
          letter-spacing: -0.3px;
          margin-bottom: 10px;
        }

        .chip-row { display: flex; gap: 7px; flex-wrap: wrap; justify-content: center; }

        .chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 11.5px;
          font-weight: 500;
          border: 1px solid;
          letter-spacing: 0.01em;
        }
        .chip-blue {
          background: rgba(77,142,255,0.08);
          border-color: rgba(77,142,255,0.22);
          color: #7AAFFF;
        }
        .chip-amber {
          background: rgba(255,168,39,0.08);
          border-color: rgba(255,168,39,0.22);
          color: var(--amber);
        }

        /* ─── SECTIONS ─── */
        .pad { padding: 0 15px; margin-bottom: 10px; }

        .card {
          background: var(--s1);
          border-radius: 18px;
          border: 1px solid var(--border);
          overflow: hidden;
          position: relative;
        }
        /* top highlight line */
        .card::before {
          content: '';
          position: absolute;
          top: 0; left: 16px; right: 16px; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.09), transparent);
        }

        /* ─── CARD STATUS ─── */
        .cs-body {
          padding: 18px 20px 20px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .cs-eyebrow {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--t3);
          margin-bottom: 5px;
        }

        .cs-num {
          font-family: 'DM Serif Display', serif;
          color: var(--t1);
          font-size: 21px;
          letter-spacing: 0.02em;
          margin-bottom: 10px;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 9px;
          border-radius: 7px;
          background: rgba(255,168,39,0.08);
          border: 1px solid rgba(255,168,39,0.22);
        }

        .pulse-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--amber);
          flex-shrink: 0;
          animation: pdot 2.2s ease-in-out infinite;
        }
        @keyframes pdot {
          0%,100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.5; transform: scale(0.75); }
        }

        .status-txt {
          font-size: 11.5px;
          font-weight: 500;
          color: var(--amber);
        }

        .toggle-side {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
          flex-shrink: 0;
        }

        .toggle-eyebrow {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--t3);
        }

        .tog {
          position: relative;
          width: 50px;
          height: 28px;
          border-radius: 14px;
          border: none;
          outline: none;
          cursor: pointer;
          transition: background 0.3s;
          flex-shrink: 0;
        }
        .tog-knob {
          position: absolute;
          top: 3px;
          width: 22px; height: 22px;
          border-radius: 11px;
          background: #fff;
          transition: left 0.3s cubic-bezier(0.34,1.4,0.64,1);
        }

        /* ─── SECTION HEADER ─── */
        .sh {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px 12px;
          border-bottom: 1px solid var(--border);
        }

        .sh-title {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--t3);
        }

        .icon-btn {
          width: 27px; height: 27px;
          border-radius: 8px;
          background: var(--s2);
          border: 1px solid var(--border-hi);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--t2);
          transition: background 0.15s, color 0.15s, border-color 0.15s;
        }
        .icon-btn:hover { background: var(--red-soft); color: var(--red); border-color: var(--red-border); }

        /* ─── BLOOD ROW ─── */
        .blood-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          border-bottom: 1px solid var(--border);
        }

        .blood-icon {
          width: 36px; height: 36px;
          border-radius: 11px;
          background: var(--red-soft);
          border: 1px solid var(--red-border);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .blood-meta { display: flex; flex-direction: column; gap: 1px; }

        .blood-eye {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--t3);
        }

        .blood-val {
          font-family: 'DM Serif Display', serif;
          font-size: 24px;
          color: var(--red);
          line-height: 1.1;
        }

        /* ─── INFO GRID ─── */
        .igrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }

        .gcell {
          padding: 13px 18px;
          border-bottom: 1px solid var(--border);
        }
        .gcell:nth-child(odd) { border-right: 1px solid var(--border); }
        .gcell:nth-last-child(-n+2) { border-bottom: none; }

        .gc-eye {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--t3);
          margin-bottom: 4px;
        }

        .gc-val {
          font-size: 14px;
          font-weight: 600;
          color: var(--t1);
          letter-spacing: -0.1px;
        }
        .gc-val-red { color: var(--red); }

        /* ─── CONTACTS ─── */
        .citem {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 13px 18px;
          border-bottom: 1px solid var(--border);
          transition: background 0.12s;
          cursor: default;
        }
        .citem:last-child { border-bottom: none; }
        .citem:active { background: rgba(255,255,255,0.015); }

        .cleft { display: flex; align-items: center; gap: 11px; }

        .cavi {
          width: 40px; height: 40px;
          border-radius: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Serif Display', serif;
          font-size: 17px;
          flex-shrink: 0;
          border: 1px solid;
        }
        .cavi-red { background: var(--red-soft); border-color: var(--red-border); color: var(--red); }
        .cavi-blue { background: rgba(77,142,255,0.08); border-color: rgba(77,142,255,0.2); color: #7AAFFF; }

        .cname {
          font-size: 14px;
          font-weight: 600;
          color: var(--t1);
          letter-spacing: -0.1px;
          margin-bottom: 3px;
        }

        .cmeta { display: flex; align-items: center; gap: 6px; }

        .crel {
          font-size: 12px;
          color: var(--t2);
          font-weight: 400;
        }

        .prim-tag {
          padding: 2px 5px;
          border-radius: 4px;
          background: rgba(0,220,110,0.09);
          border: 1px solid rgba(0,220,110,0.2);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--green);
        }

        .call-btn {
          width: 35px; height: 35px;
          border-radius: 11px;
          background: var(--red-soft);
          border: 1px solid var(--red-border);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--red);
          flex-shrink: 0;
          transition: background 0.15s, box-shadow 0.15s, transform 0.1s;
        }
        .call-btn:hover { background: rgba(255,49,49,0.16); box-shadow: 0 0 16px rgba(255,49,49,0.22); }
        .call-btn:active { transform: scale(0.91); }

        /* ─── TAB BAR ─── */
        .tabbar {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 393px;
          display: flex;
          justify-content: space-around;
          align-items: center;
          padding: 10px 12px 28px;
          background: rgba(5,8,16,0.92);
          backdrop-filter: blur(32px) saturate(200%);
          -webkit-backdrop-filter: blur(32px) saturate(200%);
          border-top: 1px solid rgba(255,255,255,0.07);
          z-index: 50;
        }

        .titem {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 10px;
          border-radius: 10px;
          color: var(--t3);
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          font-family: 'DM Sans', sans-serif;
          transition: color 0.2s;
          min-width: 48px;
        }
        .titem.on { color: var(--red); }

        .tfab {
          width: 56px; height: 56px;
          border-radius: 18px;
          background: var(--red);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
          top: -8px;
          flex-shrink: 0;
          box-shadow:
            0 4px 20px rgba(255,49,49,0.50),
            0 1px 0 rgba(255,255,255,0.18) inset,
            0 0 0 1px rgba(255,49,49,0.25);
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .tfab:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(255,49,49,0.55), 0 1px 0 rgba(255,255,255,0.18) inset; }
        .tfab:active { transform: scale(0.93) translateY(0); }
      `}</style>

      <div className="phone">
        <div className="scroll">

          {/* ── PROFILE ── */}
          <div className={`profile fu d0 ${mounted ? "in" : ""}`}>
            <div className="ring-wrap">
              <div className="ring-canvas" />
              <div className="avatar">
                <span className="avatar-letter">A</span>
                <div className="verified">
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="#050810" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            <h1 className="pname">Arjun Sharma</h1>

            <div className="chip-row">
              <span className="chip chip-blue">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
                Delhi Public School
              </span>
              <span className="chip chip-amber">Class 6-B</span>
            </div>
          </div>

          {/* ── CARD STATUS ── */}
          <div className={`pad fu d1 ${mounted ? "in" : ""}`}>
            <div className="card">
              <div className="cs-body">
                <div>
                  <div className="cs-eyebrow">Student Card</div>
                  <div className="cs-num">SQ-2024-004891</div>
                  <div className="status-pill">
                    <div className="pulse-dot" />
                    <span className="status-txt">Awaiting Activation</span>
                  </div>
                </div>

                <div className="toggle-side">
                  <span className="toggle-eyebrow">Activate</span>
                  <button
                    className="tog"
                    style={{ background: active ? "#FF3131" : "#1C2540" }}
                    onClick={() => setActive(v => !v)}
                    aria-label="Toggle card"
                  >
                    <div
                      className="tog-knob"
                      style={{
                        left: active ? "25px" : "3px",
                        boxShadow: active
                          ? "0 2px 10px rgba(255,49,49,0.5)"
                          : "0 2px 8px rgba(0,0,0,0.45)",
                      }}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── EMERGENCY INFO ── */}
          <div className={`pad fu d2 ${mounted ? "in" : ""}`}>
            <div className="card">
              <div className="sh">
                <span className="sh-title">Emergency Info</span>
                <button className="icon-btn">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.83 2.83 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                  </svg>
                </button>
              </div>

              <div className="blood-row">
                <div className="blood-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24">
                    <path d="M12 2C12 2 4.5 10.5 4.5 15.5a7.5 7.5 0 0 0 15 0C19.5 10.5 12 2 12 2z" fill="#FF3131"/>
                  </svg>
                </div>
                <div className="blood-meta">
                  <span className="blood-eye">Blood Group</span>
                  <span className="blood-val">B+</span>
                </div>
              </div>

              <div className="igrid">
                {[
                  { label: "Allergies",    value: "Peanuts",     red: false },
                  { label: "Conditions",   value: "Mild Asthma", red: false },
                  { label: "Doctor",       value: "Dr. Mehta",   red: false },
                  { label: "Doctor Phone", value: "+91 9876...", red: true  },
                ].map(({ label, value, red }) => (
                  <div className="gcell" key={label}>
                    <div className="gc-eye">{label}</div>
                    <div className={`gc-val ${red ? "gc-val-red" : ""}`}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── EMERGENCY CONTACTS ── */}
          <div className={`pad fu d3 ${mounted ? "in" : ""}`}>
            <div className="card">
              <div className="sh">
                <span className="sh-title">Emergency Contacts</span>
                <button className="icon-btn">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </button>
              </div>

              {[
                { initials: "P", name: "Priya Sharma",  rel: "Mother", primary: true,  avi: "cavi-red"  },
                { initials: "R", name: "Rajesh Sharma", rel: "Father", primary: false, avi: "cavi-blue" },
              ].map(({ initials, name, rel, primary, avi }) => (
                <div className="citem" key={name}>
                  <div className="cleft">
                    <div className={`cavi ${avi}`}>{initials}</div>
                    <div>
                      <div className="cname">{name}</div>
                      <div className="cmeta">
                        <span className="crel">{rel}</span>
                        {primary && <span className="prim-tag">Primary</span>}
                      </div>
                    </div>
                  </div>
                  <button className="call-btn">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.13.67.32 1.33.57 1.97a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6.1 6.1l1.27-1.27a2 2 0 0 1 2.11-.45c.64.25 1.3.44 1.97.57A2 2 0 0 1 22 16.92z"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── TAB BAR ── */}
        <nav className="tabbar">
          <button className="titem on">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            Home
          </button>

          <button className="titem">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="7" height="7" rx="1.5"/>
              <rect x="14" y="3" width="7" height="7" rx="1.5"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5"/>
              <rect x="14" y="14" width="7" height="7" rx="1.5"/>
            </svg>
            QR
          </button>

          <div className="tfab">
            <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
              <rect x="9" y="9" width="6" height="6" rx="1"/>
            </svg>
          </div>

          <button className="titem">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Update
          </button>

          <button className="titem">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Settings
          </button>
        </nav>
      </div>
    </div>
  );
}