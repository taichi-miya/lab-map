import Link from 'next/link'

export default function LandingPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Noto+Sans+JP:wght@400;500;700&display=swap');

        :root {
          --brand: #5046E5;
          --brand-light: #7B72F0;
          --brand-dark: #3730C4;
          --brand-glow: rgba(80,70,229,0.35);
          --bg: #07090f;
          --surface: rgba(255,255,255,0.04);
          --border: rgba(255,255,255,0.08);
          --text: #eef0fb;
          --text-sub: #7c85a8;
          --text-muted: #3a4060;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Noto Sans JP', sans-serif;
          background: var(--bg);
          color: var(--text);
          overflow-x: hidden;
        }

        .hero {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 5rem 1.5rem 4rem;
          position: relative;
          overflow: hidden;
        }

        .hero-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 50% -10%, rgba(80,70,229,0.22) 0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 80% 80%, rgba(80,70,229,0.08) 0%, transparent 70%);
          z-index: 0;
        }

        .stars {
          position: absolute;
          inset: 0;
          z-index: 0;
          background-image:
            radial-gradient(1px 1px at  8% 12%, rgba(255,255,255,0.75) 0%, transparent 100%),
            radial-gradient(1px 1px at 22% 38%, rgba(255,255,255,0.45) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 61%  8%, rgba(255,255,255,0.85) 0%, transparent 100%),
            radial-gradient(1px 1px at 74% 52%, rgba(255,255,255,0.55) 0%, transparent 100%),
            radial-gradient(1px 1px at 41% 82%, rgba(255,255,255,0.65) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 89% 23%, rgba(255,255,255,0.75) 0%, transparent 100%),
            radial-gradient(1px 1px at 14% 68%, rgba(255,255,255,0.50) 0%, transparent 100%),
            radial-gradient(1px 1px at 53% 27%, rgba(255,255,255,0.60) 0%, transparent 100%),
            radial-gradient(1px 1px at 94% 77%, rgba(255,255,255,0.40) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 35% 58%, rgba(255,255,255,0.70) 0%, transparent 100%),
            radial-gradient(1px 1px at 68% 91%, rgba(255,255,255,0.50) 0%, transparent 100%),
            radial-gradient(1px 1px at  4% 47%, rgba(255,255,255,0.55) 0%, transparent 100%),
            radial-gradient(1px 1px at 47%  4%, rgba(255,255,255,0.60) 0%, transparent 100%),
            radial-gradient(1px 1px at 83% 44%, rgba(255,255,255,0.45) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 28% 20%, rgba(255,255,255,0.80) 0%, transparent 100%);
        }

        .hero-inner {
          position: relative;
          z-index: 1;
          max-width: 780px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(80,70,229,0.15);
          border: 1px solid rgba(80,70,229,0.4);
          border-radius: 100px;
          padding: 6px 18px;
          font-size: 0.78rem;
          color: #a09cf7;
          margin-bottom: 2rem;
          letter-spacing: 0.03em;
        }

        .badge-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--brand);
          animation: blink 2s ease-in-out infinite;
        }

        @keyframes blink {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.4; transform:scale(0.75); }
        }

        h1 {
          font-family: 'Sora', sans-serif;
          font-size: clamp(2.6rem, 6.5vw, 4.4rem);
          font-weight: 800;
          line-height: 1.12;
          letter-spacing: -0.025em;
          margin-bottom: 1.5rem;
          background: linear-gradient(140deg, #ffffff 0%, #c4c0fa 45%, var(--brand-light) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-sub {
          font-size: clamp(1rem, 2.4vw, 1.2rem);
          color: var(--text-sub);
          line-height: 1.8;
          margin-bottom: 2.8rem;
        }
        .hero-sub strong { color: var(--text); font-weight: 700; }

        .cta-row {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 4rem;
        }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--brand);
          color: #fff;
          text-decoration: none;
          padding: 14px 32px;
          border-radius: 12px;
          font-weight: 700; font-size: 1rem;
          font-family: 'Noto Sans JP', sans-serif;
          transition: all 0.2s;
          box-shadow: 0 4px 28px var(--brand-glow);
        }
        .btn-primary:hover { background: var(--brand-light); transform: translateY(-2px); box-shadow: 0 8px 36px var(--brand-glow); }

        .btn-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent;
          border: 1.5px solid rgba(255,255,255,0.15);
          color: var(--text);
          text-decoration: none;
          padding: 13px 28px;
          border-radius: 12px;
          font-weight: 500; font-size: 1rem;
          font-family: 'Noto Sans JP', sans-serif;
          transition: all 0.2s;
        }
        .btn-ghost:hover { border-color: var(--brand-light); color: #c4c0fa; transform: translateY(-2px); }

        .map-wrap {
          width: min(640px, 92vw);
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid rgba(80,70,229,0.3);
          box-shadow: 0 0 80px rgba(80,70,229,0.18), 0 24px 64px rgba(0,0,0,0.6);
          background: #0d1120;
        }

        .map-toolbar {
          display: flex; align-items: center; gap: 6px;
          padding: 10px 16px;
          background: rgba(255,255,255,0.03);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .toolbar-dot { width:10px; height:10px; border-radius:50%; }

        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(80,70,229,0.3), transparent);
          max-width: 700px;
          margin: 0 auto;
        }

        .section {
          padding: 5.5rem 1.5rem;
          max-width: 940px;
          margin: 0 auto;
        }

        .sec-eyebrow {
          text-align: center;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: var(--brand-light);
          text-transform: uppercase;
          margin-bottom: 0.75rem;
          font-family: 'Sora', sans-serif;
        }

        .sec-title {
          font-family: 'Sora', sans-serif;
          font-size: clamp(1.6rem, 4vw, 2.2rem);
          font-weight: 700;
          text-align: center;
          color: var(--text);
          margin-bottom: 0.75rem;
          line-height: 1.3;
        }

        .sec-sub {
          text-align: center;
          color: var(--text-sub);
          font-size: 0.95rem;
          line-height: 1.8;
          margin-bottom: 3.5rem;
        }

        #tab-ug, #tab-hs { display: none; }
        #tab-ug:checked ~ .uc-wrap .hs-only { display: none !important; }
        #tab-ug:checked ~ .uc-wrap .ug-only { display: grid !important; }
        #tab-hs:checked ~ .uc-wrap .ug-only { display: none !important; }
        #tab-hs:checked ~ .uc-wrap .hs-only { display: grid !important; }
        #tab-ug:checked ~ .usecase-tabs label[for="tab-ug"],
        #tab-hs:checked ~ .usecase-tabs label[for="tab-hs"] {
          background: rgba(80,70,229,0.18);
          border-color: var(--brand);
          color: #c4c0fa;
        }

        .usecase-tabs {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 2.5rem;
          flex-wrap: wrap;
        }

        .tab-btn {
          padding: 9px 24px;
          border-radius: 100px;
          border: 1.5px solid var(--border);
          background: transparent;
          color: var(--text-sub);
          font-size: 0.9rem;
          font-family: 'Noto Sans JP', sans-serif;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          user-select: none;
        }
        .tab-btn:hover {
          background: rgba(80,70,229,0.1);
          border-color: rgba(80,70,229,0.5);
          color: #c4c0fa;
        }

        .ug-only { display: grid; }
        .hs-only { display: none; }
        .scenarios { gap: 1.25rem; }

        .scenario-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 1.75rem 2rem;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 1rem;
          align-items: center;
          transition: border-color 0.2s, background 0.2s;
        }
        .scenario-card:hover {
          border-color: rgba(80,70,229,0.4);
          background: rgba(80,70,229,0.06);
        }

        .scenario-problem {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 1rem;
        }

        .scenario-icon { font-size: 1.5rem; flex-shrink: 0; margin-top: 2px; }

        .scenario-q { font-size: 0.93rem; color: var(--text-sub); line-height: 1.65; }
        .scenario-q strong {
          display: block;
          font-size: 1.05rem;
          color: var(--text);
          font-weight: 700;
          margin-bottom: 4px;
          line-height: 1.45;
        }

        .scenario-answer {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(80,70,229,0.14);
          border: 1px solid rgba(80,70,229,0.32);
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 0.875rem;
          color: #b0acf5;
          font-weight: 700;
          margin-left: 2.8rem;
        }
        .scenario-answer::before { content: '→'; margin-right: 4px; color: var(--brand-light); }

        .scenario-cta {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px; height: 42px;
          border-radius: 10px;
          background: rgba(80,70,229,0.12);
          border: 1px solid rgba(80,70,229,0.22);
          color: var(--brand-light);
          font-size: 1.1rem;
          flex-shrink: 0;
          text-decoration: none;
          transition: background 0.2s;
        }
        .scenario-cta:hover { background: rgba(80,70,229,0.28); }

        .steps {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 1.5rem;
        }

        .step-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 2rem 1.5rem;
          text-align: center;
          transition: border-color 0.2s;
        }
        .step-card:hover { border-color: rgba(80,70,229,0.4); }

        .step-num {
          width: 44px; height: 44px; border-radius: 50%;
          background: var(--brand);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Sora', sans-serif;
          font-weight: 800; font-size: 1.1rem; color: #fff;
          margin: 0 auto 1rem;
          box-shadow: 0 4px 18px var(--brand-glow);
        }

        .step-emoji { font-size: 1.8rem; margin-bottom: 0.6rem; }
        .step-title { font-weight: 700; font-size: 1rem; color: var(--text); margin-bottom: 0.5rem; }
        .step-desc { font-size: 0.875rem; color: var(--text-sub); line-height: 1.65; }

        .coverage-box {
          background: linear-gradient(135deg, rgba(80,70,229,0.14) 0%, rgba(80,70,229,0.04) 100%);
          border: 1px solid rgba(80,70,229,0.28);
          border-radius: 24px;
          padding: 3rem 2rem;
          text-align: center;
        }

        .coverage-num {
          font-family: 'Sora', sans-serif;
          font-size: 5rem; font-weight: 800; line-height: 1;
          color: var(--brand-light);
          text-shadow: 0 0 40px var(--brand-glow);
        }
        .coverage-unit { font-size: 0.95rem; color: var(--text-sub); margin-top: 0.4rem; margin-bottom: 2.5rem; }

        .roadmap {
          display: flex; justify-content: center; align-items: center;
          flex-wrap: wrap; gap: 6px;
        }

        .rm-item {
          font-size: 0.82rem; color: var(--text-muted);
          padding: 6px 16px;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 100px;
          font-family: 'Sora', sans-serif;
        }
        .rm-item.now {
          background: rgba(80,70,229,0.18);
          border-color: rgba(80,70,229,0.45);
          color: #a09cf7;
          font-weight: 700;
        }
        .rm-arrow { color: var(--text-muted); font-size: 0.85rem; }

        .final-cta {
          text-align: center;
          padding: 6rem 1.5rem;
          position: relative;
          overflow: hidden;
        }
        .final-cta::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 70% 60% at 50% 50%, rgba(80,70,229,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .final-cta h2 {
          font-family: 'Sora', sans-serif;
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 800;
          margin-bottom: 1rem;
          line-height: 1.2;
        }
        .final-cta p { color: var(--text-sub); margin-bottom: 2.5rem; font-size: 1rem; }

        .free-note { margin-top: 1.25rem; font-size: 0.8rem; color: var(--text-muted); }

        footer {
          border-top: 1px solid rgba(255,255,255,0.05);
          padding: 2rem;
          text-align: center;
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        @media (max-width: 600px) {
          .scenario-card { grid-template-columns: 1fr; }
          .scenario-cta { display: none; }
          .scenario-answer { margin-left: 0; }
        }
      `}</style>

      {/* ===== HERO ===== */}
      <header className="hero">
        <div className="hero-bg" />
        <div className="stars" />

        <div className="hero-inner">
          <div className="badge">
            <div className="badge-dot" />
            東北大学 238研究室を収録中
          </div>

          <h1>研究室選びを、<br />もっと直感的に。</h1>

          <p className="hero-sub">
            AIが研究内容を分析して、<strong>似た研究室を近くに配置</strong>した2Dマップ。<br />
            「なんとなく理系が好き」から、自分に合った研究室へ。
          </p>

          <div className="cta-row">
            <Link href="/map" className="btn-primary">🗺️ マップを見てみる</Link>
            <a href="#usecases" className="btn-ghost">使い方を見る →</a>
          </div>

          {/* Map preview */}
          <div className="map-wrap">
            <div className="map-toolbar">
              <div className="toolbar-dot" style={{background:'#ff5f56'}} />
              <div className="toolbar-dot" style={{background:'#febc2e'}} />
              <div className="toolbar-dot" style={{background:'#27c93f'}} />
              <span style={{marginLeft:'8px', fontSize:'0.7rem', color:'#3a4060', fontFamily:'Sora,sans-serif'}}>labonavi.com</span>
            </div>
            <svg viewBox="0 0 640 260" xmlns="http://www.w3.org/2000/svg" style={{display:'block', width:'100%'}}>
              <defs>
                <radialGradient id="g1" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#5046E5" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#5046E5" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="g2" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="g3" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="g4" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </radialGradient>
              </defs>
              <ellipse cx="148" cy="120" rx="95" ry="72" fill="url(#g1)" />
              <ellipse cx="390" cy="88" rx="105" ry="74" fill="url(#g2)" />
              <ellipse cx="475" cy="190" rx="80" ry="55" fill="url(#g3)" />
              <ellipse cx="258" cy="170" rx="72" ry="52" fill="url(#g4)" />
              {([[148,100,192,145],[148,100,112,158],[192,145,132,132],[362,72,415,98],[362,72,322,112],[415,98,392,135],[450,175,480,205],[450,175,425,208],[258,155,296,182],[258,155,222,188]] as [number,number,number,number][]).map(([x1,y1,x2,y2],i)=>(
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.07)" strokeWidth="1.5"/>
              ))}
              {([[148,100,14],[192,145,10],[112,158,10],[132,132,9],[162,175,9]] as [number,number,number][]).map(([cx,cy,r],i)=>(
                <g key={`a${i}`}>
                  <circle cx={cx} cy={cy} r={r} fill="#5046E5" opacity={i===0?0.92:0.62}/>
                  {i===0&&<circle cx={cx} cy={cy} r={22} fill="none" stroke="#5046E5" strokeWidth="1.5" opacity="0.3"/>}
                </g>
              ))}
              {([[362,72,13],[415,98,10],[322,112,9],[392,135,9],[350,148,9],[312,78,8]] as [number,number,number][]).map(([cx,cy,r],i)=>(
                <circle key={`b${i}`} cx={cx} cy={cy} r={r} fill="#10b981" opacity={i===0?0.88:0.60}/>
              ))}
              {([[450,175,12],[480,205,9],[425,208,9],[462,218,8]] as [number,number,number][]).map(([cx,cy,r],i)=>(
                <circle key={`c${i}`} cx={cx} cy={cy} r={r} fill="#f59e0b" opacity={i===0?0.88:0.60}/>
              ))}
              {([[258,155,12],[296,182,9],[222,188,9],[268,198,8]] as [number,number,number][]).map(([cx,cy,r],i)=>(
                <circle key={`d${i}`} cx={cx} cy={cy} r={r} fill="#ef4444" opacity={i===0?0.88:0.60}/>
              ))}
              <text x="148" y="70" textAnchor="middle" fontSize="9" fill="#a09cf7" fontFamily="sans-serif">プラズマ・核融合</text>
              <text x="372" y="50" textAnchor="middle" fontSize="9" fill="#6ee7b7" fontFamily="sans-serif">材料・照射工学</text>
              <text x="458" y="158" textAnchor="middle" fontSize="9" fill="#fcd34d" fontFamily="sans-serif">計測・医療</text>
              <text x="262" y="136" textAnchor="middle" fontSize="9" fill="#fca5a5" fontFamily="sans-serif">安全・システム</text>
            </svg>
          </div>
        </div>
      </header>

      <div className="divider" />

      {/* ===== USE CASES ===== */}
      <section className="section" id="usecases">
        <p className="sec-eyebrow">Use Cases</p>
        <p className="sec-title">あなたはどっち？</p>
        <p className="sec-sub">よくある「あるある」から、このアプリでできることを見てみよう。</p>

        <input type="radio" name="persona" id="tab-ug" defaultChecked />
        <input type="radio" name="persona" id="tab-hs" />

        <div className="usecase-tabs">
          <label htmlFor="tab-ug" className="tab-btn">🎓 学部1〜3年生</label>
          <label htmlFor="tab-hs" className="tab-btn">📚 高校生</label>
        </div>

        <div className="uc-wrap">
          <div className="ug-only scenarios">
            {([
              {
                icon: '🤔',
                title: '研究室配属でどこを選ぼう…\n自分の興味に合う研究室ってどこ？',
                body: '専攻内に何十もある研究室、全部調べるのは大変…',
                answer: 'コースで絞ってマップを見てみよう！',
              },
              {
                icon: '📧',
                title: '授業の先生にメールしたいけど\nアドレスが見つからない。',
                body: '研究室HPを一件ずつ探すのは時間がかかる…',
                answer: '先生の名前で研究室を検索してみよう！',
              },
            ]).map((s, i) => (
              <div key={i} className="scenario-card">
                <div>
                  <div className="scenario-problem">
                    <span className="scenario-icon">{s.icon}</span>
                    <p className="scenario-q">
                      <strong>{s.title.split('\n').map((l,j)=><span key={j}>{l}{j===0&&<br/>}</span>)}</strong>
                      {s.body}
                    </p>
                  </div>
                  <div className="scenario-answer">{s.answer}</div>
                </div>
                <Link href="/map" className="scenario-cta" aria-label="マップを見る">→</Link>
              </div>
            ))}
          </div>

          <div className="hs-only scenarios">
            {([
              {
                icon: '🔭',
                title: '自分がやりたいことができる\n学部・学科ってどこだろう？',
                body: 'パンフレットを読んでも違いがよくわからない…',
                answer: '全体マップでタグで絞ってみよう！',
              },
              {
                icon: '💡',
                title: '本当に興味がある分野って何だろう？\n高校の授業だけで決めていいのかな？',
                body: '研究室ってどんなことをしているのか、実はよく知らない。',
                answer: 'マップを眺めると新たな興味が見つかるかも！',
              },
            ]).map((s, i) => (
              <div key={i} className="scenario-card">
                <div>
                  <div className="scenario-problem">
                    <span className="scenario-icon">{s.icon}</span>
                    <p className="scenario-q">
                      <strong>{s.title.split('\n').map((l,j)=><span key={j}>{l}{j===0&&<br/>}</span>)}</strong>
                      {s.body}
                    </p>
                  </div>
                  <div className="scenario-answer">{s.answer}</div>
                </div>
                <Link href="/map" className="scenario-cta" aria-label="マップを見る">→</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ===== HOW IT WORKS ===== */}
      <section className="section" id="how">
        <p className="sec-eyebrow">How it works</p>
        <p className="sec-title">3ステップで研究室を探せる</p>
        <p className="sec-sub">むずかしい操作は一切なし。直感的に使えます。</p>

        <div className="steps">
          {([
            { n:'1', emoji:'🗺️', title:'マップを開く',        desc:'研究室がAIによって2Dに配置されたマップが表示。近い位置 ＝ 似た研究内容。' },
            { n:'2', emoji:'👆', title:'気になる点をクリック',  desc:'クリックすると研究室名・教員名・研究概要のカードが表示されます。' },
            { n:'3', emoji:'📄', title:'詳細ページで深掘り',   desc:'タグや研究概要の詳細を確認。公式HPへのリンクも掲載。' },
          ]).map(s => (
            <div key={s.n} className="step-card">
              <div className="step-num">{s.n}</div>
              <div className="step-emoji">{s.emoji}</div>
              <div className="step-title">{s.title}</div>
              <p className="step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="divider" />

      {/* ===== COVERAGE ===== */}
      <section className="section">
        <p className="sec-eyebrow">Coverage</p>
        <p className="sec-title">収録データ・拡張予定</p>
        <p className="sec-sub">まずは東北大学からスタート。順次拡大していきます。</p>

        <div className="coverage-box">
          <div className="coverage-num">238</div>
          <div className="coverage-unit">東北大学 工学部・工学研究科の研究室を収録</div>
          <div className="roadmap">
            <span className="rm-item now">✅ 東北大学 工学部・工学研究科</span>
            <span className="rm-arrow">→</span>
            <span className="rm-item">東北大 全学部</span>
            <span className="rm-arrow">→</span>
            <span className="rm-item">全国の大学</span>
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <div className="final-cta">
        <h2>さっそく使ってみよう。</h2>
        <p>登録不要・完全無料。今すぐ研究室マップを体験できます。</p>
        <div className="cta-row" style={{justifyContent:'center', marginBottom:0}}>
          <Link href="/map" className="btn-primary">🗺️ マップを見る（無料）</Link>
          <Link href="/cards" className="btn-ghost">☰ カード一覧を見る</Link>
        </div>
        <p className="free-note">登録不要 · 完全無料 · 東北大学 工学部・工学研究科 238件収録</p>
      </div>

      <footer>
        <p>© 2025 labonavi · 東北大学 工学部・工学研究科</p>
      </footer>
    </>
  )
}
