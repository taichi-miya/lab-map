import Link from 'next/link'

export default function LandingPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Noto+Sans+JP:wght@400;500;700&display=swap');

        :root {
          --brand: #5FAFC6;
          --brand-dark: #3E95AE;
          --brand-light: #DDF3F8;
          --brand-soft: #F3FBFD;
          --accent: #8FD3E0;
          --bg: #ffffff;
          --bg-sub: #f8fcfd;
          --surface: #ffffff;
          --surface-soft: #f6fbfd;
          --border: #dce8ee;
          --text: #1f2d3d;
          --text-sub: #5b6b79;
          --text-muted: #8fa1ae;
          --success: #1f9d74;
          --shadow: 0 16px 40px rgba(41, 88, 107, 0.08);
          --radius-lg: 24px;
          --radius-md: 18px;
          --radius-sm: 12px;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          font-family: 'Noto Sans JP', sans-serif;
          background: linear-gradient(180deg, #ffffff 0%, #fbfeff 100%);
          color: var(--text);
          overflow-x: hidden;
        }
        a { color: inherit; }

        .container {
          width: min(1120px, calc(100% - 32px));
          margin: 0 auto;
        }

        .hero {
          position: relative;
          padding: 28px 0 88px;
          overflow: hidden;
          background:
            radial-gradient(circle at top center, rgba(143, 211, 224, 0.28) 0%, transparent 34%),
            linear-gradient(180deg, #f6fcfe 0%, #ffffff 48%, #ffffff 100%);
        }

        .hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 12% 20%, rgba(95, 175, 198, 0.10) 0%, transparent 22%),
            radial-gradient(circle at 88% 12%, rgba(143, 211, 224, 0.16) 0%, transparent 24%);
          pointer-events: none;
        }

        .nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 8px 0 24px;
          position: relative;
          z-index: 2;
        }

        .brand-lockup {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
        }

        .brand-mark {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          background: linear-gradient(135deg, var(--brand) 0%, #8fd3e0 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-family: 'Sora', sans-serif;
          font-weight: 800;
          box-shadow: 0 10px 24px rgba(95, 175, 198, 0.25);
        }

        .brand-name {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .brand-title {
          font-family: 'Sora', sans-serif;
          font-weight: 800;
          letter-spacing: -0.02em;
          font-size: 1.05rem;
          color: var(--text);
        }

        .brand-sub {
          font-size: 0.78rem;
          color: var(--text-sub);
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
          color: var(--text-sub);
          font-size: 0.92rem;
        }

        .nav-links a {
          text-decoration: none;
        }

        .nav-links a:hover {
          color: var(--text);
        }

        .hero-grid {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 40px;
          align-items: center;
          padding-top: 28px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(95, 175, 198, 0.12);
          color: var(--brand-dark);
          border: 1px solid rgba(95, 175, 198, 0.24);
          font-size: 0.82rem;
          font-weight: 700;
          margin-bottom: 18px;
        }

        .badge-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--success);
        }

        h1 {
          font-family: 'Sora', sans-serif;
          font-size: clamp(2.5rem, 5vw, 4.3rem);
          line-height: 1.08;
          letter-spacing: -0.04em;
          color: var(--text);
          margin-bottom: 18px;
        }

        .hero-copy {
          font-size: 1.04rem;
          line-height: 1.9;
          color: var(--text-sub);
          margin-bottom: 28px;
        }

        .hero-copy strong {
          color: var(--text);
        }

        .cta-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
          margin-bottom: 18px;
        }

        .btn-primary,
        .btn-secondary,
        .btn-ghost {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-decoration: none;
          border-radius: 14px;
          font-weight: 700;
          transition: 0.2s ease;
          white-space: nowrap;
        }

        .btn-primary {
          background: var(--brand);
          color: #fff;
          padding: 14px 24px;
          box-shadow: 0 12px 30px rgba(95, 175, 198, 0.22);
        }

        .btn-primary:hover {
          background: var(--brand-dark);
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: #fff;
          color: var(--text);
          border: 1px solid var(--border);
          padding: 14px 22px;
        }

        .btn-secondary:hover,
        .btn-ghost:hover {
          border-color: var(--brand);
          color: var(--brand-dark);
          transform: translateY(-1px);
        }

        .btn-ghost {
          background: transparent;
          color: var(--text-sub);
          border: 1px solid var(--border);
          padding: 13px 20px;
        }

        .hero-note {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          color: var(--text-sub);
          font-size: 0.88rem;
        }

        .hero-note span::before {
          content: '✓';
          color: var(--success);
          font-weight: 700;
          margin-right: 6px;
        }

        .hero-card {
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(220, 232, 238, 0.85);
          border-radius: 28px;
          box-shadow: var(--shadow);
          overflow: hidden;
        }

        .map-toolbar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 18px;
          background: linear-gradient(180deg, #ffffff 0%, #f8fbfd 100%);
          border-bottom: 1px solid var(--border);
        }

        .toolbar-dot { width: 10px; height: 10px; border-radius: 50%; }

        .toolbar-title {
          margin-left: 8px;
          font-size: 0.78rem;
          color: var(--text-muted);
          font-family: 'Sora', sans-serif;
        }

        .map-meta {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          padding: 16px 18px 18px;
          background: #fff;
          border-top: 1px solid var(--border);
        }

        .map-meta-card {
          background: var(--surface-soft);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 14px;
        }

        .map-meta-label {
          font-size: 0.74rem;
          color: var(--text-muted);
          margin-bottom: 6px;
        }

        .map-meta-value {
          font-family: 'Sora', sans-serif;
          font-size: 1.02rem;
          font-weight: 700;
          color: var(--text);
        }

        .section {
          padding: 84px 0;
        }

        .section.alt {
          background: linear-gradient(180deg, #fbfeff 0%, #f7fbfd 100%);
          border-top: 1px solid rgba(220, 232, 238, 0.7);
          border-bottom: 1px solid rgba(220, 232, 238, 0.7);
        }

        .section-head {
          max-width: 760px;
          margin: 0 auto 42px;
          text-align: center;
        }

        .eyebrow {
          display: inline-block;
          font-family: 'Sora', sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--brand-dark);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .section-title {
          font-family: 'Sora', sans-serif;
          font-size: clamp(1.8rem, 3vw, 2.6rem);
          line-height: 1.25;
          letter-spacing: -0.03em;
          margin-bottom: 14px;
          color: var(--text);
        }

        .section-sub {
          font-size: 0.98rem;
          line-height: 1.85;
          color: var(--text-sub);
        }

        .problem-grid,
        .feature-grid,
        .proof-grid,
        .steps,
        .usecase-grid {
          display: grid;
          gap: 18px;
        }

        .problem-grid {
          grid-template-columns: repeat(3, 1fr);
        }

        .problem-card,
        .feature-card,
        .proof-card,
        .step-card,
        .usecase-card,
        .coverage-box,
        .final-panel {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow);
        }

        .problem-card {
          padding: 26px 22px;
        }

        .problem-icon,
        .feature-icon,
        .proof-icon,
        .step-icon {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--brand-light);
          font-size: 1.3rem;
          margin-bottom: 14px;
        }

        .card-title {
          font-weight: 700;
          font-size: 1.06rem;
          line-height: 1.5;
          color: var(--text);
          margin-bottom: 8px;
        }

        .card-text {
          color: var(--text-sub);
          font-size: 0.93rem;
          line-height: 1.8;
        }

        .solution-band {
          background: linear-gradient(135deg, #ffffff 0%, #f0fafc 100%);
          border: 1px solid var(--border);
          border-radius: 28px;
          padding: 36px;
          box-shadow: var(--shadow);
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 28px;
          align-items: center;
        }

        .solution-copy h3 {
          font-family: 'Sora', sans-serif;
          font-size: 1.8rem;
          line-height: 1.3;
          letter-spacing: -0.03em;
          margin-bottom: 14px;
        }

        .solution-copy p {
          color: var(--text-sub);
          line-height: 1.9;
          margin-bottom: 18px;
        }

        .solution-list {
          display: grid;
          gap: 12px;
        }

        .solution-item {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          color: var(--text);
          line-height: 1.7;
          font-size: 0.95rem;
        }

        .solution-item::before {
          content: '✓';
          color: var(--success);
          font-weight: 800;
          margin-top: 1px;
        }

        .mini-panel {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 22px;
          padding: 24px;
        }

        .mini-panel h4 {
          font-size: 0.96rem;
          color: var(--text-muted);
          margin-bottom: 14px;
          font-weight: 700;
        }

        .mini-panel-list {
          display: grid;
          gap: 12px;
        }

        .mini-row {
          display: grid;
          grid-template-columns: 92px 1fr;
          gap: 12px;
          align-items: start;
        }

        .mini-label {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--brand-dark);
          background: var(--brand-soft);
          border-radius: 999px;
          padding: 6px 10px;
          text-align: center;
        }

        .mini-value {
          font-size: 0.92rem;
          color: var(--text-sub);
          line-height: 1.7;
        }

        .feature-grid {
          grid-template-columns: repeat(3, 1fr);
        }

        .feature-card {
          padding: 26px 22px;
        }

        .feature-card ul {
          margin-top: 12px;
          display: grid;
          gap: 8px;
          padding-left: 18px;
          color: var(--text-sub);
          font-size: 0.9rem;
          line-height: 1.7;
        }

        .proof-grid {
          grid-template-columns: 1.15fr 0.85fr;
        }

        .proof-card {
          padding: 28px;
        }

        .proof-list {
          display: grid;
          gap: 16px;
        }

        .proof-item {
          padding: 18px;
          border: 1px solid var(--border);
          border-radius: 16px;
          background: var(--surface-soft);
        }

        .proof-item strong {
          display: block;
          margin-bottom: 6px;
          color: var(--text);
          line-height: 1.5;
        }

        .proof-item span {
          color: var(--text-sub);
          font-size: 0.92rem;
          line-height: 1.8;
        }

        .proof-stat {
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .proof-number {
          font-family: 'Sora', sans-serif;
          font-size: clamp(3rem, 6vw, 5rem);
          line-height: 1;
          font-weight: 800;
          color: var(--brand-dark);
          margin-bottom: 10px;
        }

        .proof-caption {
          color: var(--text-sub);
          line-height: 1.8;
          max-width: 320px;
        }

        .proof-tags {
          display: flex;
          justify-content: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 18px;
        }

        .proof-tag {
          padding: 8px 12px;
          border-radius: 999px;
          background: var(--brand-soft);
          color: var(--brand-dark);
          font-size: 0.84rem;
          font-weight: 700;
          border: 1px solid rgba(95, 175, 198, 0.15);
        }

        .usecase-toggle {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        #tab-ug, #tab-hs { display: none; }
        #tab-ug:checked ~ .usecase-toggle label[for='tab-ug'],
        #tab-hs:checked ~ .usecase-toggle label[for='tab-hs'] {
          background: var(--brand);
          color: #fff;
          border-color: var(--brand);
        }
        #tab-ug:checked ~ .usecase-content .hs-only { display: none; }
        #tab-ug:checked ~ .usecase-content .ug-only { display: grid; }
        #tab-hs:checked ~ .usecase-content .ug-only { display: none; }
        #tab-hs:checked ~ .usecase-content .hs-only { display: grid; }

        .tab-btn {
          padding: 10px 18px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: #fff;
          color: var(--text-sub);
          cursor: pointer;
          font-size: 0.92rem;
          font-weight: 700;
          transition: 0.2s ease;
          user-select: none;
        }

        .usecase-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .usecase-card {
          padding: 24px;
          display: grid;
          gap: 14px;
        }

        .usecase-top {
          display: flex;
          gap: 14px;
          align-items: flex-start;
        }

        .usecase-emoji {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          background: var(--brand-light);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          flex-shrink: 0;
        }

        .usecase-answer {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          width: fit-content;
          background: var(--brand-soft);
          border: 1px solid rgba(95, 175, 198, 0.2);
          color: var(--brand-dark);
          border-radius: 999px;
          padding: 8px 14px;
          font-size: 0.88rem;
          font-weight: 700;
        }

        .usecase-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .steps {
          grid-template-columns: repeat(3, 1fr);
        }

        .step-card {
          padding: 28px 24px;
          text-align: left;
        }

        .step-num {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--brand);
          color: #fff;
          font-family: 'Sora', sans-serif;
          font-weight: 800;
          margin-bottom: 16px;
        }

        .coverage-box {
          padding: 34px;
          text-align: center;
          background: linear-gradient(135deg, #ffffff 0%, #f4fbfd 100%);
        }

        .coverage-number {
          font-family: 'Sora', sans-serif;
          font-size: clamp(3rem, 7vw, 5.5rem);
          line-height: 1;
          font-weight: 800;
          color: var(--brand-dark);
          margin-bottom: 10px;
        }

        .coverage-desc {
          color: var(--text-sub);
          line-height: 1.8;
          margin-bottom: 24px;
        }

        .roadmap {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .roadmap span {
          border-radius: 999px;
          padding: 8px 14px;
          font-size: 0.85rem;
          border: 1px solid var(--border);
          background: #fff;
          color: var(--text-sub);
        }

        .roadmap .now {
          background: var(--brand-soft);
          color: var(--brand-dark);
          border-color: rgba(95, 175, 198, 0.24);
          font-weight: 700;
        }

        .roadmap .arrow {
          border: none;
          background: transparent;
          padding: 0 2px;
          color: var(--text-muted);
        }

        .final-cta {
          padding: 0 0 88px;
        }

        .final-panel {
          padding: 42px 28px;
          text-align: center;
          background: linear-gradient(135deg, #ffffff 0%, #f2fafc 100%);
        }

        .final-panel h2 {
          font-family: 'Sora', sans-serif;
          font-size: clamp(2rem, 4vw, 3rem);
          line-height: 1.2;
          letter-spacing: -0.03em;
          margin-bottom: 14px;
        }

        .final-panel p {
          color: var(--text-sub);
          line-height: 1.85;
          margin-bottom: 24px;
        }

        .free-note {
          color: var(--text-muted);
          font-size: 0.84rem;
          margin-top: 14px;
        }

        footer {
          border-top: 1px solid rgba(220, 232, 238, 0.8);
          padding: 24px 0 40px;
          color: var(--text-muted);
          font-size: 0.84rem;
          text-align: center;
        }

        @media (max-width: 980px) {
          .hero-grid,
          .solution-band,
          .proof-grid {
            grid-template-columns: 1fr;
          }

          .problem-grid,
          .feature-grid,
          .steps,
          .usecase-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 720px) {
          .nav {
            flex-direction: column;
            align-items: flex-start;
          }

          .nav-links {
            gap: 14px;
          }

          .problem-grid,
          .feature-grid,
          .steps,
          .usecase-grid,
          .map-meta {
            grid-template-columns: 1fr;
          }

          .section {
            padding: 68px 0;
          }

          .solution-band,
          .problem-card,
          .feature-card,
          .proof-card,
          .step-card,
          .usecase-card,
          .coverage-box,
          .final-panel {
            padding-left: 20px;
            padding-right: 20px;
          }

          h1 {
            font-size: 2.4rem;
          }
        }
      `}</style>

      <header className="hero">
        <div className="container">
          <nav className="nav">
            <a href="#top" className="brand-lockup">
              <div className="brand-mark">L</div>
              <div className="brand-name">
                <span className="brand-title">Labo Navi</span>
                <span className="brand-sub">東北大学の研究室選びを、もっとわかりやすく。</span>
              </div>
            </a>

            <div className="nav-links">
              <a href="#problems">課題</a>
              <a href="#features">できること</a>
              <a href="#usecases">使い方</a>
              <a href="#coverage">収録範囲</a>
              <Link href="/map" className="btn-secondary">マップを見る</Link>
            </div>
          </nav>

          <div className="hero-grid" id="top">
            <div>
              <div className="badge">
                <span className="badge-dot" />
                東北大学 工学部・工学研究科 238研究室を収録中
              </div>

              <h1>
                研究室選びを、<br />
                もっと直感的に。
              </h1>

              <p className="hero-copy">
                AIが研究内容を分析して、<strong>似た研究室を近くに配置</strong>した2Dマップ。<br />
                学部生の配属先選びも、高校生の進学先理解も、<strong>「なんとなく興味がある」</strong>から始められます。
              </p>

              <div className="cta-row">
                <Link href="/map" className="btn-primary">🗺️ 無料でマップを見る</Link>
                <a href="#problems" className="btn-ghost">どう役立つか見る</a>
              </div>

              <div className="hero-note">
                <span>登録不要</span>
                <span>完全無料</span>
                <span>公式HPリンクあり</span>
              </div>
            </div>

            <div className="hero-card">
              <div className="map-toolbar">
                <div className="toolbar-dot" style={{ background: '#ff5f56' }} />
                <div className="toolbar-dot" style={{ background: '#febc2e' }} />
                <div className="toolbar-dot" style={{ background: '#27c93f' }} />
                <span className="toolbar-title">labonavi.com</span>
              </div>

              <svg viewBox="0 0 640 320" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%', background: 'linear-gradient(180deg, #fafdff 0%, #ffffff 100%)' }}>
                <defs>
                  <radialGradient id="g1" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#5FAFC6" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#5FAFC6" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="g2" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#8FD3E0" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#8FD3E0" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="g3" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#9ed9b6" stopOpacity="0.24" />
                    <stop offset="100%" stopColor="#9ed9b6" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="g4" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#b6d8ff" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#b6d8ff" stopOpacity="0" />
                  </radialGradient>
                </defs>

                <ellipse cx="160" cy="118" rx="106" ry="78" fill="url(#g1)" />
                <ellipse cx="420" cy="96" rx="112" ry="80" fill="url(#g2)" />
                <ellipse cx="470" cy="222" rx="92" ry="62" fill="url(#g3)" />
                <ellipse cx="252" cy="210" rx="86" ry="58" fill="url(#g4)" />

                {([
                  [160, 110, 204, 150],
                  [160, 110, 118, 160],
                  [204, 150, 138, 138],
                  [390, 84, 438, 104],
                  [390, 84, 344, 116],
                  [438, 104, 410, 142],
                  [462, 206, 492, 232],
                  [462, 206, 432, 234],
                  [252, 194, 294, 220],
                  [252, 194, 214, 226],
                ] as [number, number, number, number][]).map(([x1, y1, x2, y2], i) => (
                  <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(31,45,61,0.08)" strokeWidth="1.5" />
                ))}

                {([
                  [160, 110, 15],
                  [204, 150, 11],
                  [118, 160, 11],
                  [138, 138, 10],
                  [170, 178, 10],
                ] as [number, number, number][]).map(([cx, cy, r], i) => (
                  <g key={`a${i}`}>
                    <circle cx={cx} cy={cy} r={r} fill="#5FAFC6" opacity={i === 0 ? 0.95 : 0.68} />
                    {i === 0 && <circle cx={cx} cy={cy} r={24} fill="none" stroke="#5FAFC6" strokeWidth="1.5" opacity="0.28" />}
                  </g>
                ))}

                {([
                  [390, 84, 14],
                  [438, 104, 11],
                  [344, 116, 10],
                  [410, 142, 10],
                  [370, 150, 9],
                  [332, 84, 9],
                ] as [number, number, number][]).map(([cx, cy, r], i) => (
                  <circle key={`b${i}`} cx={cx} cy={cy} r={r} fill="#8FD3E0" opacity={i === 0 ? 0.92 : 0.72} />
                ))}

                {([
                  [462, 206, 13],
                  [492, 232, 10],
                  [432, 234, 10],
                  [474, 248, 9],
                ] as [number, number, number][]).map(([cx, cy, r], i) => (
                  <circle key={`c${i}`} cx={cx} cy={cy} r={r} fill="#67c095" opacity={i === 0 ? 0.9 : 0.7} />
                ))}

                {([
                  [252, 194, 13],
                  [294, 220, 10],
                  [214, 226, 10],
                  [266, 238, 9],
                ] as [number, number, number][]).map(([cx, cy, r], i) => (
                  <circle key={`d${i}`} cx={cx} cy={cy} r={r} fill="#8bbcff" opacity={i === 0 ? 0.9 : 0.68} />
                ))}

                <text x="160" y="72" textAnchor="middle" fontSize="12" fill="#3E95AE" fontFamily="sans-serif">プラズマ・核融合</text>
                <text x="392" y="54" textAnchor="middle" fontSize="12" fill="#4c91a4" fontFamily="sans-serif">材料・照射工学</text>
                <text x="472" y="184" textAnchor="middle" fontSize="12" fill="#3b9f76" fontFamily="sans-serif">計測・医療</text>
                <text x="256" y="174" textAnchor="middle" fontSize="12" fill="#5f8bd1" fontFamily="sans-serif">安全・システム</text>
              </svg>

              <div className="map-meta">
                <div className="map-meta-card">
                  <div className="map-meta-label">収録研究室</div>
                  <div className="map-meta-value">238 Labs</div>
                </div>
                <div className="map-meta-card">
                  <div className="map-meta-label">対象</div>
                  <div className="map-meta-value">学部生・高校生</div>
                </div>
                <div className="map-meta-card">
                  <div className="map-meta-label">利用料金</div>
                  <div className="map-meta-value">Free</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="section" id="problems">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Problems</span>
            <h2 className="section-title">研究室選びが難しいのは、あなたのせいではありません。</h2>
            <p className="section-sub">
              情報が散らばっていて、比べにくくて、全体像が見えにくい。Labo Navi はその不便さを、見える形に整理します。
            </p>
          </div>

          <div className="problem-grid">
            <div className="problem-card">
              <div className="problem-icon">🧩</div>
              <h3 className="card-title">情報がバラバラで比較しづらい</h3>
              <p className="card-text">
                研究室ごとのHPは見つけても、横並びでは見にくい。結局、どこがどう違うのかがつかみにくい。
              </p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">🌀</div>
              <h3 className="card-title">興味がぼんやりしていても探しにくい</h3>
              <p className="card-text">
                「材料系が気になる」「医療応用に興味がある」くらいの段階だと、検索ワードすら決めづらい。
              </p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">🗺️</div>
              <h3 className="card-title">全体像が見えないから選びづらい</h3>
              <p className="card-text">
                似た研究室が近いのか遠いのか、分野の広がりがどうなっているのか、普通の一覧ではわかりにくい。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section alt" id="solution">
        <div className="container">
          <div className="solution-band">
            <div className="solution-copy">
              <span className="eyebrow">Solution</span>
              <h3>研究室情報を、<br />「選べる形」に整理する。</h3>
              <p>
                Labo Navi では、AIが研究内容をもとに研究室同士の近さを解析し、2Dマップ上に配置します。だから、一覧を読み込む前に、まず全体の地図から見渡せます。
              </p>
              <div className="solution-list">
                <div className="solution-item">似た研究室が近くにまとまるから、分野の雰囲気が直感的にわかる</div>
                <div className="solution-item">気になる点をクリックすると、研究室名・教員名・概要をすぐ確認できる</div>
                <div className="solution-item">詳細ページから公式HPへ進めるので、深掘りもスムーズ</div>
              </div>
            </div>

            <div className="mini-panel">
              <h4>Labo Navi でできること</h4>
              <div className="mini-panel-list">
                <div className="mini-row">
                  <div className="mini-label">探す</div>
                  <div className="mini-value">分野感覚でマップを眺めながら、興味の近い研究室を見つける</div>
                </div>
                <div className="mini-row">
                  <div className="mini-label">比べる</div>
                  <div className="mini-value">似た研究室を近い場所で比較し、違いを把握しやすくする</div>
                </div>
                <div className="mini-row">
                  <div className="mini-label">深掘る</div>
                  <div className="mini-value">研究概要・タグ・教員名から公式情報へ自然につなげる</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Features</span>
            <h2 className="section-title">Labo Navi の主要機能</h2>
            <p className="section-sub">
              Supiful系のLPで強いのは、「何ができるか」をやさしく分解して見せること。ここでも機能を単なる羅列ではなく、使う意味ごとに見せます。
            </p>
          </div>

          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">🗺️</div>
              <h3 className="card-title">研究室マップ</h3>
              <p className="card-text">AIが研究内容を分析し、近い研究室ほど近くに配置。分野のまとまりが一目で見えます。</p>
              <ul>
                <li>一覧では見えない全体像がつかめる</li>
                <li>近い研究内容を横断して見られる</li>
                <li>直感的に眺めるだけでも発見がある</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔎</div>
              <h3 className="card-title">研究室・教員検索</h3>
              <p className="card-text">先生の名前や研究室名からも探せるので、興味起点でも、人起点でも使えます。</p>
              <ul>
                <li>配属候補の教員をすぐ見つけられる</li>
                <li>メール先や所属研究室の確認にも便利</li>
                <li>既に知っている研究室から周辺も見られる</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📄</div>
              <h3 className="card-title">詳細ページ・公式導線</h3>
              <p className="card-text">概要だけで終わらず、さらに知りたいときは公式HPへ自然につながります。</p>
              <ul>
                <li>研究概要をざっくり把握できる</li>
                <li>タグで研究の雰囲気を理解しやすい</li>
                <li>公式サイトで最終確認しやすい</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section alt" id="proof">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Why trust this</span>
            <h2 className="section-title">「見やすい」だけでなく、選ぶ行動につながる設計</h2>
            <p className="section-sub">
              参考にしたLPの良さは、安心感を先に作ること。Labo Navi でも、無料・公式導線・対象の明確さを先に示して、使い始める心理的ハードルを下げます。
            </p>
          </div>

          <div className="proof-grid">
            <div className="proof-card">
              <div className="proof-list">
                <div className="proof-item">
                  <strong>登録不要・完全無料</strong>
                  <span>まずは気軽に試せるので、配属検討の初期段階でも触りやすい設計です。</span>
                </div>
                <div className="proof-item">
                  <strong>東北大学向けに絞ってスタート</strong>
                  <span>最初から広げすぎず、対象を絞ることで、東北大生にとって実用的な体験を優先しています。</span>
                </div>
                <div className="proof-item">
                  <strong>探索から公式情報確認までつながる</strong>
                  <span>マップで興味を持ち、詳細を見て、最後は公式HPへ進む。情報の流れが途切れません。</span>
                </div>
              </div>
            </div>

            <div className="proof-card proof-stat">
              <div className="proof-number">238</div>
              <p className="proof-caption">
                東北大学 工学部・工学研究科の研究室を収録。まずは「工学系の研究室選び」に特化してスタートします。
              </p>
              <div className="proof-tags">
                <span className="proof-tag">東北大特化</span>
                <span className="proof-tag">無料公開</span>
                <span className="proof-tag">公式HP導線</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="usecases">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Use Cases</span>
            <h2 className="section-title">あなたはどっち？</h2>
            <p className="section-sub">
              今のLPで良かった「学部生」「高校生」の分岐はそのまま残しつつ、カードの見せ方をやわらかく整理しました。
            </p>
          </div>

          <input type="radio" name="persona" id="tab-ug" defaultChecked />
          <input type="radio" name="persona" id="tab-hs" />

          <div className="usecase-toggle">
            <label htmlFor="tab-ug" className="tab-btn">🎓 学部1〜3年生</label>
            <label htmlFor="tab-hs" className="tab-btn">📚 高校生</label>
          </div>

          <div className="usecase-content">
            <div className="usecase-grid ug-only">
              {[
                {
                  icon: '🤔',
                  title: '研究室配属でどこを選ぼう… 自分の興味に合う研究室ってどこ？',
                  body: '専攻内に何十もある研究室を一つずつ調べるのは大変。まずは分野の近さから眺めたい。',
                  answer: 'コースで絞ってマップを見てみよう',
                },
                {
                  icon: '📧',
                  title: '授業の先生にメールしたいけど、アドレスや所属研究室がすぐ見つからない。',
                  body: '研究室HPを何件も開く前に、先生名から研究室を引けるとかなり楽になります。',
                  answer: '先生の名前で研究室を検索してみよう',
                },
              ].map((item, i) => (
                <div key={i} className="usecase-card">
                  <div className="usecase-top">
                    <div className="usecase-emoji">{item.icon}</div>
                    <div>
                      <h3 className="card-title">{item.title}</h3>
                      <p className="card-text">{item.body}</p>
                    </div>
                  </div>
                  <div className="usecase-answer">→ {item.answer}</div>
                  <div className="usecase-actions">
                    <Link href="/map" className="btn-secondary">マップを見る</Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="usecase-grid hs-only">
              {[
                {
                  icon: '🔭',
                  title: '自分がやりたいことができる学部・学科ってどこだろう？',
                  body: '学科名だけでは違いがつかみにくいとき、研究室から逆に見ると見え方が変わります。',
                  answer: '全体マップでタグや分野感を見てみよう',
                },
                {
                  icon: '💡',
                  title: '本当に興味がある分野って何だろう？ 高校の授業だけで決めていいのかな？',
                  body: '研究室を眺めると、まだ知らなかったテーマや、意外に惹かれる領域が見つかることがあります。',
                  answer: 'まずはマップを眺めて新しい興味を探そう',
                },
              ].map((item, i) => (
                <div key={i} className="usecase-card">
                  <div className="usecase-top">
                    <div className="usecase-emoji">{item.icon}</div>
                    <div>
                      <h3 className="card-title">{item.title}</h3>
                      <p className="card-text">{item.body}</p>
                    </div>
                  </div>
                  <div className="usecase-answer">→ {item.answer}</div>
                  <div className="usecase-actions">
                    <Link href="/map" className="btn-secondary">マップを見る</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section alt" id="how">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">How it works</span>
            <h2 className="section-title">3ステップで研究室を探せる</h2>
            <p className="section-sub">
              ここは今のLPのわかりやすさをそのまま継承。はじめてでも迷わない操作フローです。
            </p>
          </div>

          <div className="steps">
            {[
              {
                n: '1',
                icon: '🗺️',
                title: 'マップを開く',
                desc: '研究室がAIによって2Dに配置されたマップが表示。近い位置ほど研究内容が近いと考えられます。',
              },
              {
                n: '2',
                icon: '👆',
                title: '気になる点をクリック',
                desc: '研究室名・教員名・研究概要のカードが表示されるので、気になるラボをすぐ比較できます。',
              },
              {
                n: '3',
                icon: '📄',
                title: '詳細ページで深掘り',
                desc: 'タグや研究概要を確認し、必要に応じて公式HPへ進んで詳細を確認できます。',
              },
            ].map((step) => (
              <div key={step.n} className="step-card">
                <div className="step-num">{step.n}</div>
                <div className="step-icon">{step.icon}</div>
                <h3 className="card-title">{step.title}</h3>
                <p className="card-text">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="coverage">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Coverage</span>
            <h2 className="section-title">まずは東北大学から、順次拡大。</h2>
            <p className="section-sub">
              初期は東北大学 工学部・工学研究科に集中し、見やすさと使いやすさを高めます。その後、全学部・他大学へ広げる想定です。
            </p>
          </div>

          <div className="coverage-box">
            <div className="coverage-number">238</div>
            <p className="coverage-desc">東北大学 工学部・工学研究科の研究室を収録。研究室選びの最初の入口として、十分に使えるボリュームを目指しています。</p>
            <div className="roadmap">
              <span className="now">✅ 東北大学 工学部・工学研究科</span>
              <span className="arrow">→</span>
              <span>東北大 全学部</span>
              <span className="arrow">→</span>
              <span>全国の大学</span>
            </div>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="container">
          <div className="final-panel">
            <h2>さっそく、研究室マップを見てみよう。</h2>
            <p>
              登録不要・完全無料。<br />
              「まだ分野が定まっていない」段階でも、Labo Navi なら研究室選びを前に進められます。
            </p>
            <div className="cta-row" style={{ justifyContent: 'center', marginBottom: 0 }}>
              <Link href="/map" className="btn-primary">🗺️ マップを見る（無料）</Link>
              <Link href="/cards" className="btn-secondary">☰ カード一覧を見る</Link>
            </div>
            <p className="free-note">登録不要 · 完全無料 · 東北大学 工学部・工学研究科 238件収録</p>
          </div>
        </div>
      </section>

      <footer>
        <div className="container">© 2026 Labo Navi · labonavi.com</div>
      </footer>
    </>
  )
}
