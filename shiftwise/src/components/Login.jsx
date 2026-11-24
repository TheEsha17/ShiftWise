import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./Login.css";

const ROLES = [
  ["admin", "Admin"],
  ["employee", "Employee"],
];

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const d = (s) => ({ "--d": s });

export default function Login() {
  const [role, setRole] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [tick, setTick] = useState(0); // re-triggers the shake animation
  const pageRef = useRef(null);

  // soft parallax for the decorative shapes
  function onMove(e) {
    const el = pageRef.current;
    if (!el) return;
    el.style.setProperty("--mx", (e.clientX / window.innerWidth - 0.5).toFixed(3));
    el.style.setProperty("--my", (e.clientY / window.innerHeight - 0.5).toFixed(3));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const next = {};
    if (!email.trim()) next.email = "Enter your work email.";
    else if (!emailOk(email.trim())) next.email = "That doesn't look like a valid email.";
    if (!password) next.password = "Enter your password.";
    else if (password.length < 6) next.password = "Password must be at least 6 characters.";

    setErrors(next);
    setFormError("");
    if (Object.keys(next).length) {
      setTick((t) => t + 1);
      return;
    }

    setLoading(true);
    try {
      // ─────────────────────────────────────────────────────────────
      // TODO: connect your backend here. Example with axios:
      //
      //   import axios from "axios";
      //   const { data } = await axios.post("/api/auth/login", {
      //     email: email.trim(), password, role, remember,
      //   });
      //   localStorage.setItem("token", data.token);
      //   navigate("/dashboard");   // useNavigate() from react-router-dom
      //
      // Until then this is a demo: any valid email + password works.
      // ─────────────────────────────────────────────────────────────
      await new Promise((r) => setTimeout(r, 900));
      setDone(true);
    } catch (err) {
      setFormError(err?.response?.data?.message || "Couldn't sign you in. Please try again.");
      setTick((t) => t + 1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="lg-page" ref={pageRef} onMouseMove={onMove}>
      {/* ── Brand panel ── */}
      <aside className="lg-side" aria-hidden="true">
        <span className="lg-ring" />
        <span className="lg-dot" />
        <Link className="lg-logo" to="/" tabIndex={-1}>
          <i />ShiftWise
        </Link>

        <div className="lg-pitch">
          <h2>
            <span className="ln"><span>Welcome back</span></span>
            <span className="ln"><span>to a <em>clearer</em></span></span>
            <span className="ln"><span><mark>week.</mark></span></span>
          </h2>
          <p className="lg-in" style={d(".7s")}>Plans, people and shift requests, all in one place.</p>
        </div>

        <div className="lg-card lg-in" style={d(".9s")}>
          <div className="lg-bar"><i /><i /><i /><span>Today · 24 on shift</span><u /></div>
          <div className="lg-rows">
            <div style={{ "--i": 0 }}><b style={{ background: "var(--chart)" }}>AK</b>Aisha K.<span style={{ background: "var(--chart)" }}>Early 7–3</span></div>
            <div style={{ "--i": 1 }}><b style={{ background: "var(--lav)" }}>OT</b>Omar T.<span style={{ background: "var(--lav)" }}>Late 3–11</span></div>
            <div style={{ "--i": 2 }}><b style={{ background: "var(--pers)" }}>MR</b>Maya R.<span style={{ background: "var(--pers)" }}>Mid 11–7</span></div>
          </div>
        </div>

        <small className="lg-tag lg-in" style={d("1.1s")}>Where People and Plans Align</small>
      </aside>

      {/* ── Form panel ── */}
      <main className="lg-main">
        <Link className="lg-back lg-ul" to="/">← Back to home</Link>

        <div className="lg-box">
          <Link className="lg-logo lg-logo-m" to="/"><i />ShiftWise</Link>

          <h1 className="lg-in" style={d(".1s")}>Sign in</h1>
          <p className="lg-sub lg-in" style={d(".2s")}>Log in to manage shifts, schedules and requests.</p>

          <div className="lg-roles lg-in" style={d(".3s")} role="radiogroup" aria-label="Sign in as">
            <span className="lg-slider" style={{ transform: role === "admin" ? "translateX(0)" : "translateX(100%)" }} />
            {ROLES.map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={role === key}
                className={role === key ? "on" : ""}
                onClick={() => setRole(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {done ? (
            <div className="lg-ok" role="status">
              <svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24" /><path d="M14 27l8 8 16-17" /></svg>
              <b>Signed in as {role === "admin" ? "Admin" : "Employee"}.</b>
              <span>{email.trim()}</span>
              <p>Demo mode: connect your backend in <code>Login.jsx</code> to make this real.</p>
              <button className="lg-btn" type="button" onClick={() => { setDone(false); setPassword(""); }}>
                <span>Sign out</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {formError && <div key={"fe" + tick} className="lg-err-box" role="alert">{formError}</div>}

              <div className="lg-in" style={d(".4s")}>
                <label htmlFor="lg-email">Work email</label>
                <div key={"e" + tick} className={"lg-f" + (errors.email ? " bad" : "")}>
                  <input
                    id="lg-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "lg-email-err" : undefined}
                  />
                </div>
                {errors.email && <p className="lg-err" id="lg-email-err" role="alert">{errors.email}</p>}
              </div>

              <div className="lg-in" style={d(".5s")}>
                <div className="lg-lab-row">
                  <label htmlFor="lg-pass">Password</label>
                  <a className="lg-ul" href="mailto:hello@shiftwise.example?subject=Password%20reset">Forgot password?</a>
                </div>
                <div key={"p" + tick} className={"lg-f lg-pass" + (errors.password ? " bad" : "")}>
                  <input
                    id="lg-pass"
                    type={show ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "lg-pass-err" : undefined}
                  />
                  <button type="button" onClick={() => setShow((s) => !s)} aria-pressed={show}>
                    {show ? "Hide" : "Show"}
                  </button>
                </div>
                {errors.password && <p className="lg-err" id="lg-pass-err" role="alert">{errors.password}</p>}
              </div>

              <label className="lg-check lg-in" style={d(".6s")}>
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                Keep me signed in
              </label>

              <button className="lg-btn lg-in" style={d(".7s")} type="submit" disabled={loading}>
                <span>{loading ? <i className="lg-spin" /> : "Sign in"}</span>
                {!loading && <em aria-hidden="true">→</em>}
              </button>
            </form>
          )}

          <p className="lg-foot lg-in" style={d(".8s")}>
            New to ShiftWise? <a className="lg-ul" href="mailto:hello@shiftwise.example">Ask your admin for access</a>
          </p>
        </div>
      </main>
    </div>
  );
}
