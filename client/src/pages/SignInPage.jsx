import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import Layout from "../components/Layout";
import AuthForm from "../components/AuthForm";
import { useAuth } from "../context/AuthContext";

export default function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit({ email, password }) {
    setIsSubmitting(true);
    setError("");

    try {
      await signIn({ email, password });
      navigate(location.state?.from?.pathname || "/groups", { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Layout
      publicMode
      actions={
        <>
          <Link to="/sign-in" className="secondary-button current-link">
            Sign in
          </Link>
          <Link to="/sign-up" className="primary-button">
            Sign up
          </Link>
        </>
      }
    >
      <section className="auth-shell">
        <AuthForm
          mode="sign-in"
          title="Welcome back!"
          caption="Sign in to start sharing your expenses."
          submitLabel="Sign in"
          submitDisabled={isSubmitting}
          onSubmit={handleSubmit}
          footer={
            <span>
              Not a member?{" "}
              <Link to="/sign-up" className="text-link">
                Sign up to become a member of Let&apos;s Split It!
              </Link>
            </span>
          }
        />
        {error ? <p className="error-text centered-text">{error}</p> : null}
      </section>
    </Layout>
  );
}
