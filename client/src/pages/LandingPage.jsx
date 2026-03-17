import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";

const features = [
  {
    icon: "◫",
    title: "Create Groups",
    description: "Set up groups for your trips, dinners, apartment expenses.",
  },
  {
    icon: "◎",
    title: "Track Expenses",
    description: "Record all expenses with who paid and how costs were divided.",
  },
  {
    icon: "↔",
    title: "Settle Up",
    description: "Instantly see who owes money to whom and keep balances accurate.",
  },
];

export default function LandingPage() {
  const { profile, session, signOut } = useAuth();

  return (
    <Layout
      publicMode
      actions={
        session ? (
          <>
            <span className="topbar-label">{profile?.display_name || profile?.email}</span>
            <button type="button" className="secondary-button" onClick={signOut}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link to="/sign-in" className="secondary-button">
              Sign in
            </Link>
            <Link to="/sign-up" className="primary-button">
              Sign up
            </Link>
          </>
        )
      }
    >
      <section className="hero stack-lg">
        <div className="stack-sm">
          <p className="eyebrow">Shared expense tracking</p>
          <h1>Split expenses, effortlessly with friends</h1>
          <p className="hero-copy">
            Whether it&apos;s a weekend trip, shared apartment, or dinner with friends, Let&apos;s Split It makes it
            easy to track who paid what and settle up fairly.
          </p>
        </div>
        <div className="button-row">
          {session ? (
            <Link to="/groups" className="primary-button">
              My Groups
            </Link>
          ) : (
            <>
              <Link to="/sign-up" className="primary-button">
                Sign up
              </Link>
              <Link to="/sign-in" className="secondary-button">
                Sign in
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="feature-grid">
        {features.map((feature) => (
          <article key={feature.title} className="card feature-card">
            <div className="feature-icon">{feature.icon}</div>
            <div className="stack-sm">
              <h2>{feature.title}</h2>
              <p className="muted">{feature.description}</p>
            </div>
          </article>
        ))}
      </section>
    </Layout>
  );
}
