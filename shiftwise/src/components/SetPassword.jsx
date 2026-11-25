import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import AuthPageLayout from "./AuthPageLayout";

export default function SetPassword() {
  const [token] = useState(() => new URLSearchParams(window.location.search).get("token") || "");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) window.history.replaceState(window.history.state, "", window.location.pathname);
  }, [token]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!token) {
      setError("This invitation link is missing its secure token. Open the link from your invitation email.");
      return;
    }
    if (password.length < 12 || password.length > 128) {
      setError("Choose a password between 12 and 128 characters.");
      return;
    }
    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await api.post("/access-requests/invitation/complete", { token, password });
      setComplete(true);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "We couldn't set your password. Request a new invitation from your administrator.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPageLayout>
      <Link className="lg-logo lg-logo-m" to="/"><i />ShiftWise</Link>
      {complete ? (
        <section className="lg-ok" role="status" aria-live="polite">
          <svg viewBox="0 0 52 52" aria-hidden="true">
            <circle cx="26" cy="26" r="24" />
            <path d="m15 27 7 7 15-16" />
          </svg>
          <b>Your account is ready</b>
          <p>Your password is set. Sign in to continue to your ShiftWise dashboard.</p>
          <Link className="lg-btn" to="/login">Go to sign in</Link>
        </section>
      ) : (
        <>
          <h1>Set your password</h1>
          <p className="lg-sub">Choose a password to activate your ShiftWise account.</p>
          {error && <div className="lg-err-box" role="alert">{error}</div>}
          <form onSubmit={handleSubmit} noValidate>
            <div className="lg-access-field">
              <label htmlFor="new-password">New Password</label>
              <input id="new-password" type="password" autoComplete="new-password" minLength={12} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} />
              <small>Use at least 12 characters.</small>
            </div>
            <div className="lg-access-field">
              <label htmlFor="confirm-password">Confirm Password</label>
              <input id="confirm-password" type="password" autoComplete="new-password" maxLength={128} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
            </div>
            <button className="lg-btn" type="submit" disabled={loading}>
              <span>{loading ? <i className="lg-spin" /> : "Set password"}</span>
              {!loading && <em aria-hidden="true">→</em>}
            </button>
          </form>
        </>
      )}
    </AuthPageLayout>
  );
}
