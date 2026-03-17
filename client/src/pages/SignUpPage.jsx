import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import Layout from "../components/Layout";
import AuthForm from "../components/AuthForm";
import { useAuth } from "../context/AuthContext";

export default function SignUpPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit({ displayName, email, password }) {
    setIsSubmitting(true);
    setError("");

    try {
      const result = await signUp({ displayName, email, password });
      if (result.session) {
        navigate("/groups", { replace: true });
      } else {
        navigate("/sign-in", { replace: true });
      }
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
          <Link to="/sign-in" className="secondary-button">
            Sign in
          </Link>
          <Link to="/sign-up" className="primary-button current-link">
            Sign up
          </Link>
        </>
      }
    >
      <section className="auth-shell">
        <AuthForm
          mode="sign-up"
          title="Sign up"
          caption="Make sharing expenses even easier."
          submitLabel="Sign up"
          submitDisabled={isSubmitting}
          onSubmit={handleSubmit}
          footer={
            <span>
              Already have an account?{" "}
              <Link to="/sign-in" className="text-link">
                Sign in!
              </Link>
            </span>
          }
        />
        {error ? <p className="error-text centered-text">{error}</p> : null}
      </section>
    </Layout>
  );
}
