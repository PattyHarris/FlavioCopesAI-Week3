import { Link } from "react-router-dom";

export default function Layout({ children, actions, publicMode = false }) {
  return (
    <div className="page">
      <header className="topbar">
        <Link to="/" className="brand">
          Let's Split It
        </Link>
        <div className="topbar-actions">{actions}</div>
      </header>
      <main className="shell">{children}</main>
    </div>
  );
}
