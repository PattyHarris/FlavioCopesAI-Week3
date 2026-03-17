import { useMemo, useState } from "react";

function PasswordField({ label, value, onChange, autoComplete = "current-password" }) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="field">
      <span>{label}</span>
      <div className="password-field">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required
        />
        <button type="button" className="ghost-button" onClick={() => setVisible((state) => !state)}>
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </label>
  );
}

export default function AuthForm({
  mode,
  title,
  caption,
  submitLabel,
  submitDisabled,
  onSubmit,
  footer,
}) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState(mode === "sign-in" ? "alex@example.com" : "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const isSignUp = mode === "sign-up";
  const passwordMismatch = useMemo(
    () => isSignUp && confirmPassword && password !== confirmPassword,
    [confirmPassword, isSignUp, password]
  );

  async function handleSubmit(event) {
    event.preventDefault();
    if (passwordMismatch) {
      return;
    }

    await onSubmit({
      displayName,
      email,
      password,
      confirmPassword,
    });
  }

  return (
    <div className="auth-card">
      <div className="stack-sm">
        <p className="eyebrow">{isSignUp ? "Create account" : "Welcome back"}</p>
        <h1>{title}</h1>
        <p className="muted">{caption}</p>
      </div>
      <form className="form stack-md" onSubmit={handleSubmit}>
        {isSignUp ? (
          <label className="field">
            <span>Display name</span>
            <input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Jordan Lee"
              autoComplete="name"
              required
            />
          </label>
        ) : null}
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>
        <PasswordField
          label="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete={isSignUp ? "new-password" : "current-password"}
        />
        {isSignUp ? (
          <PasswordField
            label="Confirm password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
          />
        ) : null}
        {passwordMismatch ? <p className="error-text">Passwords do not match.</p> : null}
        <button type="submit" className="primary-button" disabled={submitDisabled || passwordMismatch}>
          {submitLabel}
        </button>
      </form>
      <div className="muted">{footer}</div>
    </div>
  );
}
