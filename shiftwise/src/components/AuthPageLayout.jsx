import { Link } from "react-router-dom";
import "./Login.css";

export default function AuthPageLayout({ children, backLabel = "Back to sign in", className = "" }) {
  return (
    <div className={`lg-page ${className}`.trim()}>
      <aside className="lg-side" aria-hidden="true">
        <span className="lg-ring" />
        <span className="lg-dot" />
        <Link className="lg-logo" to="/" tabIndex={-1}><i />ShiftWise</Link>
        <div className="lg-pitch">
          <h2>
            <span className="ln"><span>One Request</span></span>
            <span className="ln"><span>Away From</span></span>
            <span className="ln"><span><mark>Getting Started.</mark></span></span>
          </h2>
          <p>One place for your team, shifts and schedules.</p>
        </div>
        <small className="lg-tag">Where People and Plans Align</small>
      </aside>
      <main className="lg-main">
        <Link className="lg-back lg-ul" to="/login">← {backLabel}</Link>
        <div className="lg-box">{children}</div>
      </main>
    </div>
  );
}
