import Link from 'next/link'
import Image from 'next/image'

export default function LandingPage() {
  const feedbackUrl = '/contact'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Noto+Sans+JP:wght@400;500;700&display=swap');

        :root {
          --brand: #5046E5;
          --brand-light: #7B72F0;
          --brand-dark: #3730C4;
          --brand-glow: rgba(80, 70, 229, 0.18);
          --brand-soft: rgba(80, 70, 229, 0.08);

          --accent: #06B6D4;
          --accent-soft: rgba(6, 182, 212, 0.12);

          --bg: #F8FAFC;
          --surface: #FFFFFF;
          --surface-soft: #F8FBFF;
          --text: #0F172A;
          --text-sub: #475569;
          --text-muted: #64748B;
          --border: rgba(148, 163, 184, 0.22);

          --radius-xl: 28px;
          --radius-lg: 22px;
          --radius-md: 16px;

          --shadow: 0 22px 70px rgba(15, 23, 42, 0.08);
          --shadow-soft: 0 12px 32px rgba(15, 23, 42, 0.06);

          --container: 1180px;
        }

        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          font-family: 'Noto Sans JP', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background:
            radial-gradient(circle at top left, rgba(80, 70, 229, 0.06), transparent 30%),
            linear-gradient(180deg, #FCFEFF 0%, #F8FAFC 100%);
          color: var(--text);
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        img {
          max-width: 100%;
          display: block;
        }

        .container {
          width: min(calc(100% - 40px), var(--container));
          margin: 0 auto;
        }

        .section {
          padding: 88px 0;
        }

        .section.alt {
          background: linear-gradient(180deg, rgba(255,255,255,0.74) 0%, rgba(244,248,255,0.92) 100%);
          border-top: 1px solid rgba(226, 232, 240, 0.7);
          border-bottom: 1px solid rgba(226, 232, 240, 0.7);
        }

        .hero {
          padding: 24px 0 72px;
        }

        .nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 42px;
        }

        .brand-lockup {
          display: inline-flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }

        .brand-mark {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          font-family: 'Sora', sans-serif;
          font-weight: 800;
          font-size: 1.2rem;
          color: #fff;
          background: linear-gradient(135deg, var(--brand) 0%, var(--brand-light) 100%);
          box-shadow: 0 14px 30px rgba(80, 70, 229, 0.25);
          flex-shrink: 0;
        }

        .brand-name {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .brand-title {
          font-family: 'Sora', sans-serif;
          font-weight: 800;
          font-size: 1.02rem;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }

        .brand-sub {
          color: var(--text-muted);
          font-size: 0.84rem;
          margin-top: 4px;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .nav-links a:not(.btn-primary):not(.btn-secondary):not(.btn-ghost) {
          color: var(--text-sub);
          font-size: 0.95rem;
          font-weight: 500;
        }

        .nav-links a:not(.btn-primary):not(.btn-secondary):not(.btn-ghost):hover {
          color: var(--text);
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1.08fr 0.92fr;
          gap: 34px;
          align-items: center;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 999px;
          border: 1px solid rgba(80, 70, 229, 0.14);
          background: rgba(255, 255, 255, 0.86);
          color: var(--brand-dark);
          font-size: 0.9rem;
          font-weight: 700;
          box-shadow: var(--shadow-soft);
          margin-bottom: 22px;
        }

        .badge-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: linear-gradient(135deg, #22C55E 0%, #14B8A6 100%);
          box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.12);
          flex-shrink: 0;
        }

        h1 {
          font-family: 'Sora', sans-serif;
          font-size: clamp(1.6rem, 3.5vw, 2.6rem);
          line-height: 1.02;
          letter-spacing: -0.045em;
          margin: 0 0 22px;
        }

        .hero-copy {
          margin: 0 0 26px;
          font-size: 1.08rem;
          line-height: 1.95;
          color: var(--text-sub);
          max-width: 680px;
        }

        .hero-copy strong {
          color: var(--text);
        }

        .cta-row {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }

        .btn-primary,
        .btn-secondary,
        .btn-ghost {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 50px;
          padding: 0 20px;
          border-radius: 999px;
          font-size: 0.96rem;
          font-weight: 700;
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease;
          white-space: nowrap;
        }

        .btn-primary:hover,
        .btn-secondary:hover,
        .btn-ghost:hover {
          transform: translateY(-1px);
        }

        .btn-primary {
          color: #fff;
          background: linear-gradient(135deg, var(--brand) 0%, var(--brand-light) 100%);
          box-shadow: 0 16px 34px rgba(80, 70, 229, 0.24);
        }

        .btn-secondary {
          color: var(--text);
          background: #fff;
          border: 1px solid var(--border);
          box-shadow: var(--shadow-soft);
        }

        .btn-ghost {
          color: var(--brand-dark);
          background: rgba(80, 70, 229, 0.06);
          border: 1px solid rgba(80, 70, 229, 0.12);
        }

        .hero-note {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          color: var(--text-muted);
          font-size: 0.87rem;
        }

        .hero-note span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .hero-note span::before {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(100, 116, 139, 0.55);
          display: inline-block;
        }

        .hero-card,
        .problem-card,
        .feature-card,
        .proof-card,
        .usecase-card,
        .step-card,
        .coverage-box,
        .developer-card,
        .final-panel {
          border-radius: var(--radius-xl);
          background: rgba(255,255,255,0.94);
          border: 1px solid rgba(226, 232, 240, 0.92);
          box-shadow: var(--shadow);
          backdrop-filter: blur(14px);
        }

        .hero-card {
          overflow: hidden;
          position: relative;
        }

        .map-toolbar {
          height: 54px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 18px;
          border-bottom: 1px solid rgba(226, 232, 240, 0.9);
          background: linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(245,248,255,0.9) 100%);
        }

        .toolbar-dot {
          width: 11px;
          height: 11px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .toolbar-title {
          margin-left: 6px;
          font-size: 0.88rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .map-panel {
          padding: 0;
        }

        .map-meta {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          padding: 16px 18px 18px;
          border-top: 1px solid rgba(226, 232, 240, 0.8);
          background: linear-gradient(180deg, rgba(248,250,255,0.7) 0%, rgba(255,255,255,0.95) 100%);
        }

        .meta-chip {
          border-radius: 16px;
          border: 1px solid rgba(226, 232, 240, 0.92);
          background: #fff;
          padding: 14px;
        }

        .meta-label {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-bottom: 6px;
        }

        .meta-value {
          font-size: 0.96rem;
          font-weight: 700;
          color: var(--text);
          line-height: 1.5;
        }

        .mini-panel {
          margin-top: 18px;
          padding: 22px 22px 20px;
          border-radius: var(--radius-lg);
          border: 1px solid rgba(226, 232, 240, 0.9);
          background: linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(245,249,255,0.92) 100%);
          box-shadow: var(--shadow-soft);
        }

        .mini-panel h4 {
          margin: 0 0 14px;
          font-family: 'Sora', sans-serif;
          font-size: 1rem;
          letter-spacing: -0.02em;
        }

        .mini-panel-list {
          display: grid;
          gap: 12px;
        }

        .mini-row {
          display: grid;
          grid-template-columns: 78px 1fr;
          gap: 12px;
          align-items: start;
        }

        .mini-label {
          font-size: 0.84rem;
          color: var(--brand-dark);
          font-weight: 800;
          background: rgba(80, 70, 229, 0.08);
          border-radius: 999px;
          padding: 7px 10px;
          text-align: center;
        }

        .mini-value {
          color: var(--text-sub);
          line-height: 1.75;
          font-size: 0.94rem;
        }

        .section-head {
          max-width: 820px;
          margin: 0 auto 34px;
          text-align: center;
        }

        .eyebrow {
          display: inline-block;
          margin-bottom: 14px;
          color: var(--brand-dark);
          font-size: 0.84rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .section-title {
          font-family: 'Sora', sans-serif;
          font-size: clamp(2rem, 4.5vw, 3.4rem);
          line-height: 1.15;
          letter-spacing: -0.04em;
          margin: 0 0 14px;
        }

        .section-sub {
          margin: 0 auto;
          color: var(--text-sub);
          line-height: 1.9;
          font-size: 1rem;
          max-width: 780px;
        }

        .problem-grid,
        .feature-grid,
        .usecase-grid,
        .steps {
          display: grid;
          gap: 20px;
        }

        .problem-grid {
          grid-template-columns: repeat(3, 1fr);
        }

        .problem-card,
        .feature-card,
        .usecase-card,
        .step-card {
          padding: 30px 24px;
        }

        .problem-icon,
        .feature-icon,
        .usecase-icon {
          width: 54px;
          height: 54px;
          display: grid;
          place-items: center;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(80, 70, 229, 0.12) 0%, rgba(6, 182, 212, 0.12) 100%);
          font-size: 1.45rem;
          margin-bottom: 18px;
        }

        .card-title {
          font-family: 'Sora', sans-serif;
          font-size: 1.22rem;
          letter-spacing: -0.02em;
          margin: 0 0 12px;
        }

        .card-text {
          color: var(--text-sub);
          line-height: 1.85;
          margin: 0;
        }

        .feature-grid {
          grid-template-columns: repeat(3, 1fr);
        }

        .feature-card ul {
          margin: 16px 0 0;
          padding-left: 1.2rem;
          color: var(--text-sub);
          line-height: 1.85;
        }

        .feature-card li + li {
          margin-top: 8px;
        }

        .proof-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 20px;
        }

        .proof-card {
          padding: 32px 28px;
        }

        .proof-list {
          display: grid;
          gap: 18px;
        }

        .proof-item {
          padding-bottom: 18px;
          border-bottom: 1px solid rgba(226, 232, 240, 0.82);
        }

        .proof-item:last-child {
          padding-bottom: 0;
          border-bottom: none;
        }

        .proof-item strong {
          display: block;
          font-size: 1.02rem;
          margin-bottom: 7px;
          color: var(--text);
        }

        .proof-item span {
          color: var(--text-sub);
          line-height: 1.85;
          display: block;
        }

        .proof-stat {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          background:
            radial-gradient(circle at top, rgba(80, 70, 229, 0.11), transparent 50%),
            linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(246,247,255,0.98) 100%);
        }

        .proof-number {
          font-family: 'Sora', sans-serif;
          font-size: clamp(1.6rem, 3.5vw, 2.6rem);
          line-height: 1;
          font-weight: 800;
          color: var(--brand-dark);
          margin-bottom: 14px;
        }

        .proof-caption {
          color: var(--text-sub);
          line-height: 1.8;
          margin: 0 0 16px;
        }

        .proof-tags {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .proof-tag {
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 0.84rem;
          font-weight: 700;
          color: var(--brand-dark);
          background: rgba(80, 70, 229, 0.08);
          border: 1px solid rgba(80, 70, 229, 0.12);
        }

        .solution-band {
          display: grid;
          grid-template-columns: 0.9fr 1.1fr;
          gap: 24px;
          align-items: center;
          padding: 34px 28px;
        }

        .solution-visual {
          position: relative;
          min-height: 300px;
          border-radius: 24px;
          overflow: hidden;
          background:
            radial-gradient(circle at 20% 30%, rgba(80,70,229,0.18), transparent 20%),
            radial-gradient(circle at 70% 25%, rgba(6,182,212,0.18), transparent 18%),
            radial-gradient(circle at 55% 78%, rgba(139,92,246,0.18), transparent 22%),
            linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
          border: 1px solid rgba(226, 232, 240, 0.9);
        }

        .node {
          position: absolute;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 104px;
          height: 42px;
          padding: 0 14px;
          border-radius: 999px;
          background: rgba(255,255,255,0.96);
          border: 1px solid rgba(226, 232, 240, 0.95);
          box-shadow: var(--shadow-soft);
          font-size: 0.86rem;
          font-weight: 700;
          color: var(--text);
        }

        .node.n1 { top: 18%; left: 14%; }
        .node.n2 { top: 12%; right: 15%; }
        .node.n3 { top: 42%; left: 28%; }
        .node.n4 { top: 56%; right: 20%; }
        .node.n5 { bottom: 12%; left: 18%; }
        .node.n6 { bottom: 18%; right: 10%; }

        .solution-copy h3 {
          font-family: 'Sora', sans-serif;
          font-size: clamp(1.7rem, 3vw, 2.4rem);
          line-height: 1.2;
          letter-spacing: -0.03em;
          margin: 0 0 14px;
        }

        .solution-copy p {
          color: var(--text-sub);
          line-height: 1.92;
          margin: 0 0 14px;
        }

        .solution-points {
          margin-top: 18px;
          display: grid;
          gap: 10px;
        }

        .solution-point {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          color: var(--text-sub);
          line-height: 1.8;
        }

        .solution-point::before {
          content: '✓';
          display: inline-block;
          margin-top: 2px;
          color: var(--brand-dark);
          font-weight: 800;
        }

        .usecase-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .usecase-card h3 {
          font-family: 'Sora', sans-serif;
          font-size: 1.28rem;
          letter-spacing: -0.02em;
          margin: 0 0 12px;
        }

        .usecase-card p {
          color: var(--text-sub);
          line-height: 1.85;
          margin: 0 0 16px;
        }

        .usecase-card ul {
          margin: 0;
          padding-left: 1.2rem;
          color: var(--text-sub);
          line-height: 1.85;
        }

        .steps {
          grid-template-columns: repeat(3, 1fr);
        }

        .step-num {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 999px;
          background: linear-gradient(135deg, var(--brand) 0%, var(--brand-light) 100%);
          color: #fff;
          font-family: 'Sora', sans-serif;
          font-weight: 800;
          margin-bottom: 16px;
        }

        .step-card h3 {
          font-family: 'Sora', sans-serif;
          font-size: 1.18rem;
          letter-spacing: -0.02em;
          margin: 0 0 10px;
        }

        .step-card p {
          color: var(--text-sub);
          line-height: 1.85;
          margin: 0;
        }

        .coverage-box {
          padding: 38px 32px;
          text-align: center;
          background: linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(244,251,253,0.98) 100%);
        }

        .coverage-number {
          font-family: 'Sora', sans-serif;
          font-size: clamp(2.2rem, 4.5vw, 3.6rem);
          line-height: 1;
          font-weight: 800;
          color: var(--brand-dark);
          margin-bottom: 10px;
        }

        .coverage-desc {
          color: var(--text-sub);
          line-height: 1.85;
          margin: 0 auto 24px;
          max-width: 760px;
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
          background: rgba(80, 70, 229, 0.08);
          color: var(--brand-dark);
          border-color: rgba(80, 70, 229, 0.12);
          font-weight: 700;
        }

        .roadmap .arrow {
          border: none;
          background: transparent;
          padding: 0 2px;
          color: var(--text-muted);
        }

        .developer-card {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 30px;
          align-items: center;
          padding: 30px;
        }

        .developer-photo-wrap {
          display: flex;
          justify-content: center;
        }

        .developer-photo {
          width: 100%;
          max-width: 280px;
          aspect-ratio: 1 / 1;
          object-fit: cover;
          border-radius: 24px;
          border: 1px solid rgba(226, 232, 240, 0.94);
          box-shadow: var(--shadow-soft);
          overflow: hidden;
          background: #fff;
        }

        .developer-copy h3 {
          font-family: 'Sora', sans-serif;
          font-size: 1.8rem;
          letter-spacing: -0.03em;
          margin: 0 0 8px;
        }

        .developer-role {
          color: var(--brand-dark);
          font-weight: 800;
          margin: 0 0 18px;
        }

        .developer-copy p {
          color: var(--text-sub);
          line-height: 1.95;
          margin: 0 0 14px;
        }

        .final-cta {
          padding: 0 0 88px;
        }

        .final-panel {
          padding: 44px 28px;
          text-align: center;
          background:
            radial-gradient(circle at top, rgba(80,70,229,0.1), transparent 45%),
            linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(242,250,252,0.98) 100%);
        }

        .final-panel h2 {
          font-family: 'Sora', sans-serif;
          font-size: clamp(2rem, 4vw, 3rem);
          line-height: 1.2;
          letter-spacing: -0.03em;
          margin: 0 0 14px;
        }

        .final-panel p {
          color: var(--text-sub);
          line-height: 1.9;
          margin: 0 auto 24px;
          max-width: 860px;
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

        @media (max-width: 1100px) {
          .hero-grid,
          .solution-band,
          .proof-grid,
          .developer-card {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 980px) {
          .problem-grid,
          .feature-grid,
          .steps,
          .usecase-grid,
          .map-meta {
            grid-template-columns: 1fr 1fr;
          }
        }

        /* ────────────────────────────────
           スマホ対応（720px 以下）
        ──────────────────────────────── */
        @media (max-width: 720px) {

          /* コンテナ余白を少し狭く */
          .container {
            width: calc(100% - 28px);
          }

          /* セクション縦余白を詰める */
          .section {
            padding: 56px 0;
          }

          /* ── ヒーロー ── */
          .hero {
            padding: 16px 0 48px;
          }

          /* ── ナビ：縦積みで左揃え ── */
          .nav {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 28px;
          }

          .brand-sub {
            font-size: 0.76rem;
          }

          /* ナビリンクを横スクロール可能な1行に */
          .nav-links {
            display: flex;
            flex-wrap: nowrap;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            gap: 8px;
            padding-bottom: 4px;
            width: 100%;
            scrollbar-width: none;
          }
          .nav-links::-webkit-scrollbar { display: none; }
          .nav-links a:not(.btn-primary):not(.btn-secondary):not(.btn-ghost) {
            font-size: 0.84rem;
            white-space: nowrap;
          }
          .nav-links .btn-secondary {
            flex-shrink: 0;
            min-height: 40px;
            padding: 0 16px;
            font-size: 0.88rem;
          }

          /* ── ヒーローグリッド → 縦積み ── */
          .hero-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          /* ── h1 ── */
          h1 {
            font-size: clamp(1.8rem, 8vw, 2.6rem);
            margin-bottom: 16px;
            line-height: 1.1;
          }

          /* ── ヒーローコピー ── */
          .hero-copy {
            font-size: 0.96rem;
            line-height: 1.85;
            margin-bottom: 20px;
          }

          /* ── バッジ ── */
          .badge {
            font-size: 0.8rem;
            padding: 8px 12px;
            margin-bottom: 16px;
          }

          /* ── CTAボタン行：縦積み全幅 ── */
          .cta-row {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
            margin-bottom: 14px;
          }

          .btn-primary,
          .btn-secondary,
          .btn-ghost {
            width: 100%;
            min-height: 52px;
            font-size: 0.96rem;
          }

          /* ── ヒーローノート ── */
          .hero-note {
            gap: 8px;
            font-size: 0.82rem;
          }

          /* ── ミニパネル ── */
          .mini-panel {
            padding: 18px 16px;
          }

          .mini-row {
            grid-template-columns: 1fr;
            gap: 6px;
          }

          .mini-label {
            width: fit-content;
          }

          /* ── カード類：左右余白を詰める ── */
          .hero-card,
          .problem-card,
          .feature-card,
          .proof-card,
          .usecase-card,
          .step-card,
          .coverage-box,
          .developer-card,
          .final-panel,
          .solution-band {
            padding-left: 18px;
            padding-right: 18px;
          }

          /* ── グリッド → 1列 ── */
          .problem-grid,
          .feature-grid,
          .steps,
          .usecase-grid,
          .map-meta {
            grid-template-columns: 1fr;
          }

          /* ── セクション見出し ── */
          .section-title {
            font-size: clamp(1.5rem, 6vw, 2.2rem);
            letter-spacing: -0.03em;
          }

          .section-sub {
            font-size: 0.93rem;
            line-height: 1.8;
          }

          /* ── proof グリッド → 1列 ── */
          .proof-grid {
            grid-template-columns: 1fr;
          }

          .proof-stat {
            padding: 28px 18px;
          }

          /* ── solution バンド → 縦積み ── */
          .solution-band {
            grid-template-columns: 1fr;
            padding: 22px 18px;
          }

          .solution-visual {
            min-height: 220px;
          }

          .solution-copy h3 {
            font-size: clamp(1.3rem, 5vw, 1.8rem);
          }

          /* ── developer カード → 縦積み・写真小さく ── */
          .developer-card {
            grid-template-columns: 1fr;
            padding: 22px 18px;
            gap: 20px;
          }

          .developer-photo {
            max-width: 160px;
            margin: 0 auto;
          }

          .developer-copy h3 {
            font-size: 1.4rem;
          }

          /* ── coverage ── */
          .coverage-box {
            padding: 28px 18px;
          }

          .roadmap {
            flex-direction: column;
            gap: 6px;
            align-items: center;
          }

          .roadmap .arrow {
            transform: rotate(90deg);
            padding: 0;
          }

          /* ── final CTA ── */
          .final-panel {
            padding: 36px 18px;
          }

          .final-panel h2 {
            font-size: clamp(1.4rem, 6vw, 2rem);
            letter-spacing: -0.02em;
          }

          .final-panel p {
            font-size: 0.93rem;
          }

          /* ── map toolbar・meta ── */
          .map-toolbar {
            height: 44px;
            padding: 0 14px;
          }

          /* ── step-card 縦余白調整 ── */
          .step-card {
            padding: 22px 18px;
          }
        }

        /* ────────────────────────────────
           極小スマホ（400px 以下）
        ──────────────────────────────── */
        @media (max-width: 400px) {
          h1 {
            font-size: 1.7rem;
          }

          .badge {
            font-size: 0.73rem;
          }

          .section-title {
            font-size: 1.4rem;
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
              <a href="#beta">βについて</a>
              <a href="#features">できること</a>
              <a href="#coverage">収録範囲</a>
              <a href="#developer">開発者</a>
              <Link href="/map" className="btn-secondary">β版を試す</Link>
            </div>
          </nav>

          <div className="hero-grid" id="top">
            <div>
              <div className="badge">
                <span className="badge-dot" />
                東北大学 工学部・工学研究科 238研究室を収録中 / β公開中
              </div>

              <h1>
                研究室選びを、<br />
                もっとわかりやすく。<br />
                いまはβ版として改善中。
              </h1>

              <p className="hero-copy">
                Labo Navi は、東北大生向けの研究室探索サービスです。<br />
                現在は <strong>情報修正</strong> と <strong>使いやすさ改善</strong> のためにβ公開しています。
                使ってみて、<strong>「違う」「足りない」「わかりにくい」</strong> を教えてください。
              </p>

              <div className="cta-row">
                <Link href="/map" className="btn-primary">🗺️ β版を試す</Link>
                <a href={feedbackUrl} target="_blank" rel="noreferrer" className="btn-secondary">
                  ✍️ 情報修正・要望を送る
                </a>
                <a href="https://discord.gg/bdYtcjg9pm" target="_blank" rel="noreferrer" className="btn-ghost">
                  💬 Discordで参加
                </a>
              </div>

              <div className="hero-note">
                <span>登録不要</span>
                <span>完全無料</span>
                <span>β改善中</span>
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

            <div className="hero-card">
              <div className="map-toolbar">
                <div className="toolbar-dot" style={{ background: '#ff5f56' }} />
                <div className="toolbar-dot" style={{ background: '#febc2e' }} />
                <div className="toolbar-dot" style={{ background: '#27c93f' }} />
                <span className="toolbar-title">labonavi.com</span>
              </div>

              <div className="map-panel">
                <svg
                  viewBox="0 0 640 320"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{
                    display: 'block',
                    width: '100%',
                    background: 'linear-gradient(180deg, #fafdff 0%, #ffffff 100%)',
                  }}
                >
                  <defs>
                    <radialGradient id="g1" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#5046E5" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#5046E5" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="g2" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.24" />
                      <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="g3" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  <rect x="0" y="0" width="640" height="320" fill="#fff" />
                  <circle cx="160" cy="78" r="92" fill="url(#g1)" />
                  <circle cx="452" cy="102" r="108" fill="url(#g2)" />
                  <circle cx="346" cy="240" r="112" fill="url(#g3)" />

                  <line x1="166" y1="82" x2="264" y2="126" stroke="#cbd5e1" strokeWidth="2" />
                  <line x1="264" y1="126" x2="366" y2="92" stroke="#cbd5e1" strokeWidth="2" />
                  <line x1="366" y1="92" x2="472" y2="122" stroke="#cbd5e1" strokeWidth="2" />
                  <line x1="264" y1="126" x2="230" y2="224" stroke="#cbd5e1" strokeWidth="2" />
                  <line x1="230" y1="224" x2="360" y2="224" stroke="#cbd5e1" strokeWidth="2" />
                  <line x1="360" y1="224" x2="500" y2="214" stroke="#cbd5e1" strokeWidth="2" />

                  <g>
                    <circle cx="166" cy="82" r="13" fill="#5046E5" />
                    <circle cx="264" cy="126" r="13" fill="#06B6D4" />
                    <circle cx="366" cy="92" r="13" fill="#5046E5" />
                    <circle cx="472" cy="122" r="13" fill="#8B5CF6" />
                    <circle cx="230" cy="224" r="13" fill="#06B6D4" />
                    <circle cx="360" cy="224" r="13" fill="#5046E5" />
                    <circle cx="500" cy="214" r="13" fill="#8B5CF6" />
                  </g>

                  <g fontFamily="Noto Sans JP, sans-serif" fontSize="12" fill="#334155" fontWeight="700">
                    <rect x="121" y="45" rx="12" ry="12" width="90" height="28" fill="#ffffff" stroke="#e2e8f0" />
                    <text x="166" y="63" textAnchor="middle">材料系</text>

                    <rect x="221" y="138" rx="12" ry="12" width="86" height="28" fill="#ffffff" stroke="#e2e8f0" />
                    <text x="264" y="156" textAnchor="middle">化学系</text>

                    <rect x="324" y="54" rx="12" ry="12" width="84" height="28" fill="#ffffff" stroke="#e2e8f0" />
                    <text x="366" y="72" textAnchor="middle">機械系</text>

                    <rect x="431" y="136" rx="12" ry="12" width="82" height="28" fill="#ffffff" stroke="#e2e8f0" />
                    <text x="472" y="154" textAnchor="middle">情報系</text>

                    <rect x="188" y="238" rx="12" ry="12" width="84" height="28" fill="#ffffff" stroke="#e2e8f0" />
                    <text x="230" y="256" textAnchor="middle">電気系</text>

                    <rect x="317" y="238" rx="12" ry="12" width="86" height="28" fill="#ffffff" stroke="#e2e8f0" />
                    <text x="360" y="256" textAnchor="middle">応物系</text>

                    <rect x="458" y="228" rx="12" ry="12" width="84" height="28" fill="#ffffff" stroke="#e2e8f0" />
                    <text x="500" y="246" textAnchor="middle">建築系</text>
                  </g>
                </svg>

                <div className="map-meta">
                  <div className="meta-chip">
                    <div className="meta-label">収録範囲</div>
                    <div className="meta-value">東北大学 工学部・工学研究科</div>
                  </div>
                  <div className="meta-chip">
                    <div className="meta-label">現在の目的</div>
                    <div className="meta-value">情報修正・UI改善・要望収集</div>
                  </div>
                  <div className="meta-chip">
                    <div className="meta-label">参加方法</div>
                    <div className="meta-value">閲覧 / フォーム / Discord</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="section alt" id="beta">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Beta</span>
            <h2 className="section-title">今は、東北大生と一緒に改善している段階です。</h2>
            <p className="section-sub">
              Labo Navi は現在β版です。今は完成度を誇る段階ではなく、
              情報修正・使いやすさ改善・必要機能の把握のために公開しています。
            </p>
          </div>

          <div className="proof-grid">
            <div className="proof-card">
              <div className="proof-list">
                <div className="proof-item">
                  <strong>情報の誤り・抜けを直したい</strong>
                  <span>
                    研究室情報は正確さが重要です。間違い、抜け、更新漏れを実際の利用者から集めて改善したいと考えています。
                  </span>
                </div>
                <div className="proof-item">
                  <strong>実際の使われ方を見ながら改善したい</strong>
                  <span>
                    どこで迷うか、どこが見づらいか、何が足りないかは、実際に使ってもらわないとわかりません。
                  </span>
                </div>
                <div className="proof-item">
                  <strong>本当に必要な機能を知りたい</strong>
                  <span>
                    開発者の想像だけで決めるのではなく、東北大生の声をもとに優先順位を決めたいと考えています。
                  </span>
                </div>
              </div>
            </div>

            <div className="proof-card proof-stat">
              <div className="proof-number">3</div>
              <p className="proof-caption">
                このβ版で特に集めたいこと。<br />
                「情報修正」「使いづらさ」「機能要望」
              </p>
              <div className="proof-tags">
                <span className="proof-tag">情報修正</span>
                <span className="proof-tag">UI改善</span>
                <span className="proof-tag">要望歓迎</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="problems">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Problems</span>
            <h2 className="section-title">研究室選びが難しいのは、あなたのせいではありません。</h2>
            <p className="section-sub">
              情報が散らばっていて、比較しづらく、全体像もつかみにくい。
              興味があっても、どこから見ればいいかわからない。Labo Navi は、まずその入口を整えるためのサービスです。
            </p>
          </div>

          <div className="problem-grid">
            <div className="problem-card">
              <div className="problem-icon">🧭</div>
              <h3 className="card-title">全体像が見えない</h3>
              <p className="card-text">
                研究室の一覧はあっても、分野同士の近さや違いは見えにくく、「どこから見始めるか」で迷いやすいです。
              </p>
            </div>

            <div className="problem-card">
              <div className="problem-icon">📚</div>
              <h3 className="card-title">比較に時間がかかる</h3>
              <p className="card-text">
                研究室ごとに書き方や情報量が違うため、複数の研究室を横並びで理解するのに手間がかかります。
              </p>
            </div>

            <div className="problem-card">
              <div className="problem-icon">🧩</div>
              <h3 className="card-title">興味の近い候補が広がりにくい</h3>
              <p className="card-text">
                1つ知っている研究室から、その周辺にある近い研究テーマへ自然に広げる導線が弱い状態です。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section alt" id="solution">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Solution</span>
            <h2 className="section-title">AIで研究内容を整理し、研究室を“地図として”見られるようにする。</h2>
            <p className="section-sub">
              一覧表ではわかりにくい研究室同士の近さを、2Dマップ上で直感的に見られるようにしています。
            </p>
          </div>

          <div className="solution-band hero-card">
            <div className="solution-visual">
              <div className="node n1">材料</div>
              <div className="node n2">情報</div>
              <div className="node n3">化学</div>
              <div className="node n4">建築</div>
              <div className="node n5">電気</div>
              <div className="node n6">機械</div>
            </div>

            <div className="solution-copy">
              <h3>「興味が近い研究室が、近くにある」状態をつくる。</h3>
              <p>
                Labo Navi では、研究室情報をもとに AI が研究内容の近さを分析し、
                近い研究室ほど近くに配置した 2D マップとして表示します。
              </p>
              <p>
                そのため、「完全には知らないけれど、少し気になる」領域からでも探索を始めやすくなります。
              </p>

              <div className="solution-points">
                <div className="solution-point">一覧では見えない分野のまとまりがつかみやすい</div>
                <div className="solution-point">興味の近い研究室を横断して比較しやすい</div>
                <div className="solution-point">マップから詳細、そして公式情報へ自然につながる</div>
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
              研究室を探し、比べ、深掘りするための主要機能をまとめています。
            </p>
          </div>

          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">🗺️</div>
              <h3 className="card-title">研究室マップ</h3>
              <p className="card-text">
                AI が研究内容を分析し、近い研究室ほど近くに配置。分野のまとまりが一目で見えます。
              </p>
              <ul>
                <li>一覧では見えない全体像がつかめる</li>
                <li>近い研究内容を横断して見られる</li>
                <li>直感的に眺めるだけでも発見がある</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔎</div>
              <h3 className="card-title">研究室・教員検索</h3>
              <p className="card-text">
                先生の名前や研究室名からも探せるので、興味起点でも、人起点でも使えます。
              </p>
              <ul>
                <li>配属候補の教員をすぐ見つけられる</li>
                <li>既に知っている研究室から周辺も見られる</li>
                <li>名前から研究室を確認したい時にも便利</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📄</div>
              <h3 className="card-title">詳細カードと公式導線</h3>
              <p className="card-text">
                研究概要やタグを見て理解を深め、そのまま公式サイトへ移動できます。
              </p>
              <ul>
                <li>短時間で概要をつかめる</li>
                <li>タグから研究室の特徴を比較しやすい</li>
                <li>最終的には公式情報へ自然につながる</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section alt" id="usecases">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Use cases</span>
            <h2 className="section-title">こんな人に使ってほしい</h2>
            <p className="section-sub">
              配属前の学部生にも、東北大を志望する高校生にも、まずは研究室を探しやすくする入口として使ってほしいと考えています。
            </p>
          </div>

          <div className="usecase-grid">
            <div className="usecase-card">
              <div className="usecase-icon">🎓</div>
              <h3>東北大の学部生</h3>
              <p>
                配属先や進学先を考えるときに、研究室の比較を始めやすくするための入口として使えます。
              </p>
              <ul>
                <li>興味がある分野の周辺研究室をざっくり把握する</li>
                <li>似た研究室同士の違いを比較する</li>
                <li>候補を絞ってから公式 HP を見に行く</li>
              </ul>
            </div>

            <div className="usecase-card">
              <div className="usecase-icon">🏫</div>
              <h3>東北大を考える高校生</h3>
              <p>
                学科名だけでは見えにくい「その先の研究室」をイメージする入口として使えます。
              </p>
              <ul>
                <li>工学部の中でどんな研究があるかを広く知る</li>
                <li>学部・学科の先にある研究テーマをイメージする</li>
                <li>興味のある研究室から進学先の理解を深める</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="how">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">How it works</span>
            <h2 className="section-title">使い方はシンプルです</h2>
            <p className="section-sub">
              まずは広く眺め、気になる研究室を見つけ、詳細や公式情報へ進む。Labo Navi はその最初の導線を整えます。
            </p>
          </div>

          <div className="steps">
            <div className="step-card">
              <div className="step-num">1</div>
              <h3>マップを眺める</h3>
              <p>
                研究室がどんなまとまりで分布しているかを見ながら、気になる領域や近い研究室を探します。
              </p>
            </div>

            <div className="step-card">
              <div className="step-num">2</div>
              <h3>詳細カードを見る</h3>
              <p>
                研究概要、タグ、教員名などを見て、その研究室が自分の興味に合うかをざっくり判断します。
              </p>
            </div>

            <div className="step-card">
              <div className="step-num">3</div>
              <h3>公式情報へ進む</h3>
              <p>
                気になる研究室が見つかったら、公式 HP や研究室ページへ進んで、より正確な情報を確認します。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section alt" id="coverage">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Coverage</span>
            <h2 className="section-title">まずは東北大学 工学部・工学研究科から。</h2>
            <p className="section-sub">
              初期は東北大学 工学部・工学研究科に集中し、情報精度と使いやすさを高めます。β期間中は、まずこの範囲の改善を優先します。
            </p>
          </div>

          <div className="coverage-box">
            <div className="coverage-number">238</div>
            <p className="coverage-desc">
              現在、東北大学 工学部・工学研究科の 238 研究室を収録しています。
              今後は改善を進めながら、対象範囲の拡張も検討していきます。
            </p>

            <div className="roadmap">
              <span className="now">東北大 工学部・工学研究科</span>
              <span className="arrow">→</span>
              <span>他学部へ拡張</span>
              <span className="arrow">→</span>
              <span>他大学へ展開</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="developer">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Developer</span>
            <h2 className="section-title">このサービスを作っている人</h2>
            <p className="section-sub">
              Labo Navi は、東北大学で研究をしながら個人で開発しています。
            </p>
          </div>

          <div className="developer-card">
            <div className="developer-photo-wrap">
              <div className="developer-photo">
                <Image
                  src="/images/taichi.jpg"
                  alt="宮岸太一"
                  width={560}
                  height={560}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  priority
                />
              </div>
            </div>

            <div className="developer-copy">
              <h3>宮岸 太一</h3>
              <p className="developer-role">東北大学 博士学生（工学研究科）/ Labo Navi 開発</p>

              <p>
                東北大学で研究をしながら、研究室選びをもっとわかりやすくするために Labo Navi を開発しています。
              </p>
              <p>
                研究室選びは大学生活やその後の進路に大きく関わる一方で、情報が散らばっていて比較しづらいと感じていました。
                そこで、まずは研究室を探しやすくする入口を作りたいと思い、このサービスを立ち上げました。
              </p>
              <p>
                現在の Labo Navi はβ版です。今は完成度を誇る段階ではなく、実際に使ってもらいながら、
                情報修正や使いやすさの改善を進めている段階です。使ってみて気づいたことがあれば、ぜひ率直に教えてください。
              </p>

              <div className="cta-row" style={{ marginBottom: 0 }}>
                <a
                  href="https://www.instagram.com/__radmycerx/"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                >
                  Instagramを見る
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

<section className="section" id="contribute">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Contribute</span>
            <h2 className="section-title">あなたの情報で、マップをもっとよくする</h2>
            <p className="section-sub">
              Labo Navi は、使ってくれるみなさんの情報提供で育つサービスです。
              SNSや動画を見つけたら、ぜひ教えてください。
            </p>
          </div>

          <div className="feature-grid" style={{ marginBottom: '3rem' }}>
            {[
              {
                icon: '📷',
                title: 'SNSアカウント',
                desc: '研究室・教員の公式／非公式のInstagram・X（Twitter）。日々の活動や雰囲気が伝わります。',
              },
              {
                icon: '▶️',
                title: 'YouTube動画',
                desc: '研究室紹介や研究解説の動画。公式チャンネルだけでなく、非公式の紹介動画もOKです。',
              },
              {
                icon: '🔬',
                title: 'researchmap URL',
                desc: '教員の研究業績が一覧できるページ。論文・著書の確認に役立ちます。',
              },
            ].map((item, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon">{item.icon}</div>
                <h3 className="card-title">{item.title}</h3>
                <p className="card-text">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="section-head" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)', letterSpacing: '-0.02em', margin: 0 }}>
              提供の流れ（1〜2分）
            </h3>
          </div>

          <div className="steps" style={{ marginBottom: '2.5rem' }}>
            {[
              {
                n: '1',
                title: '研究室を検索',
                desc: '研究室名・教員名・専攻名で絞り込んで選択。238件の中からすぐに見つかります。',
              },
              {
                n: '2',
                title: '情報の種類を選ぶ',
                desc: 'SNS・動画・HPなど、提供したい情報の種類をプルダウンで選ぶだけ。',
              },
              {
                n: '3',
                title: 'URLを貼って送信',
                desc: 'URLをコピペして送信するだけ。アカウント登録不要・匿名でもOK。',
              },
            ].map((step, i) => (
              <div key={i} className="step-card">
                <div className="step-num">{step.n}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>

          <div style={{
            background: 'rgba(80,70,229,0.05)',
            border: '1px solid rgba(80,70,229,0.14)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem 2rem',
            marginBottom: '2.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
          }}>
            <span style={{ fontSize: '1.4rem', flexShrink: 0, marginTop: '2px' }}>💡</span>
            <div>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 0.4rem', fontFamily: "'Noto Sans JP', sans-serif" }}>
                提供した情報はどうなるの？
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-sub)', margin: 0, lineHeight: 1.85, fontFamily: "'Noto Sans JP', sans-serif" }}>
                送信された情報は管理者が内容を確認した後、研究室の詳細ページやマップに反映されます。個人情報は収集しません。公開されている情報のみご提供ください。
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <Link href="/contribute" className="btn-primary" style={{ fontSize: '1rem', padding: '0 2rem', minHeight: '52px' }}>
              📬 情報を提供する
            </Link>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem', fontFamily: "'Noto Sans JP', sans-serif" }}>
              アカウント登録不要・匿名でもOK
            </p>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="container">
          <div className="final-panel">
            <h2>今ほしいのは、登録数より改善の声です。</h2>
            <p>
              Labo Navi は現在β版です。<br />
              今は、情報の誤りや抜けの修正、使いやすさの改善、本当に必要な機能の把握を進めるために公開しています。
              まずは使ってみて、気づいたことを教えてください。
            </p>

            <div className="cta-row" style={{ justifyContent: 'center', marginBottom: 0 }}>
              <Link href="/map" className="btn-primary">🗺️ β版を試す</Link>
              <a href={feedbackUrl} target="_blank" rel="noreferrer" className="btn-secondary">
                ✍️ 情報修正・要望を送る
              </a>
              <a
                href="https://discord.gg/bdYtcjg9pm"
                target="_blank"
                rel="noreferrer"
                className="btn-ghost"
              >
                💬 Discordでβ開発に参加する
              </a>
            </div>

            <p className="free-note">
              単発の報告はフォームから、継続的に関わりたい方は Discord へ。
            </p>
          </div>
        </div>
      </section>

      <footer>
        <div className="container">
          © {new Date().getFullYear()} Labo Navi. 東北大学の研究室選びを、もっとわかりやすく。
        </div>
      </footer>
    </>
  )
}