import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import AuthPageLayout from "./AuthPageLayout";

const emailOk = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function AccessRequest() {
  const [values, setValues] = useState({ fullName: "", email: "", requestedRole: "Employee", message: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (key, value) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
    setFormError("");
  };

  async function handleSubmit(event) {
    event.preventDefault();
    const next = {};
    const fullName = values.fullName.trim();
    const email = values.email.trim();
    if (fullName.length < 2 || fullName.length > 100) next.fullName = "Enter your full name (2–100 characters).";
    if (!emailOk(email) || email.length > 254) next.email = "Enter a valid work email.";
    if (values.message.length > 1000) next.message = "Message must be 1,000 characters or fewer.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setFormError("");
    try {
      await api.post("/access-requests", {
        fullName,
        email,
        requestedRole: values.requestedRole,
        message: values.message.trim(),
      });
      setSubmitted(true);
    } catch (error) {
      setFormError(error.response?.data?.message || "We couldn't submit your request. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPageLayout className="lg-access-page">
      <Link className="lg-logo lg-logo-m" to="/"><i />ShiftWise</Link>
      {submitted ? (
        <section className="lg-ok" role="status" aria-live="polite">
          <svg viewBox="0 0 52 52" aria-hidden="true">
            <circle cx="26" cy="26" r="24" />
            <path d="m15 27 7 7 15-16" />
          </svg>
          <b>Request received</b>
          <p>An administrator will review your request. If approved, you’ll receive an email invitation to set your password.</p>
          <Link className="lg-btn" to="/login">Return to sign in</Link>
        </section>
      ) : (
        <>
          <h1>Request access</h1>
          <p className="lg-sub">Tell us who you are and which ShiftWise role you need.</p>
          {formError && <div className="lg-err-box" role="alert">{formError}</div>}
          <form onSubmit={handleSubmit} noValidate>
            <div className="lg-access-field">
              <label htmlFor="access-name">Full Name</label>
              <input id="access-name" type="text" autoComplete="name" maxLength={100} value={values.fullName} onChange={(event) => update("fullName", event.target.value)} aria-invalid={!!errors.fullName} />
              {errors.fullName && <p className="lg-err" role="alert">{errors.fullName}</p>}
            </div>
            <div className="lg-access-field">
              <label htmlFor="access-email">Work Email</label>
              <input id="access-email" type="email" autoComplete="email" maxLength={254} value={values.email} onChange={(event) => update("email", event.target.value)} aria-invalid={!!errors.email} />
              {errors.email && <p className="lg-err" role="alert">{errors.email}</p>}
            </div>
            <div className="lg-access-field">
              <label htmlFor="access-role">Requested Role</label>
              <select id="access-role" value={values.requestedRole} onChange={(event) => update("requestedRole", event.target.value)}>
                <option value="Employee">Employee</option>
                <option value="Admin">Admin</option>
              </select>
              <small>Admin access also requires approval by an existing administrator.</small>
            </div>
            <div className="lg-access-field">
              <label htmlFor="access-message">Optional Message</label>
              <textarea id="access-message" rows={3} maxLength={1000} value={values.message} onChange={(event) => update("message", event.target.value)} aria-invalid={!!errors.message} />
              {errors.message && <p className="lg-err" role="alert">{errors.message}</p>}
            </div>
            <button className="lg-btn" type="submit" disabled={loading}>
              <span>{loading ? <i className="lg-spin" /> : "Submit request"}</span>
              {!loading && <em aria-hidden="true">→</em>}
            </button>
          </form>
          <p className="lg-foot">Already have access? <Link className="lg-ul" to="/login">Sign in</Link></p>
        </>
      )}
    </AuthPageLayout>
  );
}
