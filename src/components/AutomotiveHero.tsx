import signalImage from '../assets/datacore-signal.svg';
import './AutomotiveHero.css';

const navItems = ['Architecture', 'Platform', 'Solutions', 'Developers', 'Docs', 'Company'];

function CoreResponseMark() {
  return (
    <svg
      aria-hidden="true"
      className="dc-mark-svg"
      viewBox="0 0 64 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M17.2 31.7c8.7 0 15.7-6.9 15.7-15.4S25.9.9 17.2.9 1.5 7.8 1.5 16.3s7 15.4 15.7 15.4Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M16.8 8.2h5.8c4.5 0 7.5 2.8 7.5 7.2 0 3.9-2.6 6.5-6.6 7.1l4.7 7.2h-6.4l-4-6.7h-1.4v6.7H11V8.2h5.8Z"
        fill="currentColor"
      />
      <path d="M16.5 13v4.8h4.3c2 0 3.2-1 3.2-2.4s-1.2-2.4-3.2-2.4h-4.3Z" fill="#020202" />
      <path d="M26.9 30.1 39.8 8.5h5.4L32.1 30.1h-5.2Z" fill="currentColor" />
    </svg>
  );
}

export default function AutomotiveHero() {
  return (
    <section className="dc-page" aria-label="Data intelligence hero preview">
      <div className="dc-frame">
        <header className="dc-nav-row">
          <a className="dc-mark" href="#" aria-label="Core Response">
            <CoreResponseMark />
          </a>

          <div className="dc-nav-scroll">
            <nav className="dc-nav-links" aria-label="Primary">
              {navItems.map((item) => (
                <a key={item} href="#" className="dc-nav-link">
                  {item}
                </a>
              ))}
            </nav>
          </div>

          <button type="button" className="dc-contact">
            Contact us
          </button>
        </header>

        <div className="dc-stripe-band" aria-hidden="true" />

        <div className="dc-copy-wrap">
          <h1 className="dc-headline" aria-label="The Intelligence layer for your data">
            <span className="dc-headline-line">The Intelligence layer</span>
            <span className="dc-headline-line">for your data</span>
          </h1>

          <p className="dc-subcopy">
            Our AI aggregates signals, removes noise, and delivers only what&apos;s actionable at
            <br />
            scale and in real time.
          </p>

          <div className="dc-cta-row">
            <button type="button" className="dc-btn dc-btn-primary">
              Get started
            </button>
            <button type="button" className="dc-btn dc-btn-secondary">
              Learn more
            </button>
          </div>
        </div>

        <div className="dc-mid-divider" aria-hidden="true" />

        <div className="dc-signal-panel" aria-hidden="true">
          <img src={signalImage} alt="" className="dc-signal-image" />
          <div className="dc-signal-overlay" />
        </div>
      </div>
    </section>
  );
}
