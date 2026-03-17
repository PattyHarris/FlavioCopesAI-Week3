import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import GroupsPage from "./pages/GroupsPage";
import GroupDetailsPage from "./pages/GroupDetailsPage";

function FullScreenLoader() {
  return (
    <div className="shell shell-centered">
      <div className="stack-sm">
        <p className="eyebrow">Loading</p>
        <h1>Preparing your workspace</h1>
      </div>
    </div>
  );
}

export default function App() {
  const { authError, isLoading, session } = useAuth();

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (authError) {
    return (
      <div className="shell shell-centered">
        <div className="stack-sm">
          <p className="eyebrow">Authentication error</p>
          <h1>Unable to prepare your workspace</h1>
          <p className="muted">{authError}</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/sign-in" element={session ? <Navigate to="/groups" replace /> : <SignInPage />} />
      <Route path="/sign-up" element={session ? <Navigate to="/groups" replace /> : <SignUpPage />} />
      <Route
        path="/groups"
        element={
          <ProtectedRoute>
            <GroupsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/groups/:groupId"
        element={
          <ProtectedRoute>
            <GroupDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={session ? "/groups" : "/"} replace />} />
    </Routes>
  );
}
