import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import NewGroupModal from "../components/NewGroupModal";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

export default function GroupsPage() {
  const { profile, signOut } = useAuth();
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchGroups();
    const intervalId = window.setInterval(() => {
      void fetchGroups({ background: true });
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, []);

  async function fetchGroups(options = {}) {
    if (!options.background) {
      setIsLoading(true);
    }
    setError("");

    const { data, error: queryError } = await supabase
      .from("groups")
      .select("id, name, description, created_at, owner_id")
      .order("created_at", { ascending: false });

    if (queryError) {
      setError(queryError.message);
      if (!options.background) {
        setIsLoading(false);
      }
      return;
    }

    setGroups(data || []);
    if (!options.background) {
      setIsLoading(false);
    }
  }

  async function handleCreateGroup({ name, description }) {
    if (!name) {
      setError("Group name is required.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const { data, error: insertError } = await supabase
      .from("groups")
      .insert({
        name,
        description,
        owner_id: profile.id,
      })
      .select("id")
      .single();

    if (insertError) {
      setError(insertError.message);
      setIsSubmitting(false);
      return;
    }

    const { error: memberError } = await supabase.from("group_members").insert({
      group_id: data.id,
      user_id: profile.id,
    });

    if (memberError) {
      setError(memberError.message);
      setIsSubmitting(false);
      return;
    }

    setShowNewGroup(false);
    setIsSubmitting(false);
    await fetchGroups();
  }

  return (
    <Layout
      actions={
        <>
          <span className="topbar-label">{profile?.display_name || profile?.email}</span>
          <button type="button" className="secondary-button" onClick={signOut}>
            Sign out
          </button>
        </>
      }
    >
      <section className="stack-lg">
        <div className="section-header">
          <div className="stack-xs">
            <p className="eyebrow">Dashboard</p>
            <h1>My Groups</h1>
          </div>
          <button type="button" className="primary-button" onClick={() => setShowNewGroup(true)}>
            New Group
          </button>
        </div>
        {error ? <p className="error-text">{error}</p> : null}
        {isLoading ? <p className="muted">Loading groups...</p> : null}
        {!isLoading && groups.length === 0 ? (
          <div className="empty-state">
            <h2>You currently have no groups.</h2>
            <p className="muted">To add a new group, click on &quot;New Group&quot;.</p>
          </div>
        ) : null}
        <div className="stack-md">
          {groups.map((group) => (
            <Link key={group.id} to={`/groups/${group.id}`} className="card group-card">
              <div className="stack-sm">
                <div className="group-card-header">
                  <h2>{group.name}</h2>
                  {group.owner_id === profile?.id ? <span className="pill">Owner</span> : null}
                </div>
                <p className="muted">{group.description || "No description yet."}</p>
              </div>
              <p className="subtle-text">{new Date(group.created_at).toLocaleDateString()}</p>
            </Link>
          ))}
        </div>
      </section>
      {showNewGroup ? (
        <NewGroupModal
          onClose={() => setShowNewGroup(false)}
          onCreate={handleCreateGroup}
          isSubmitting={isSubmitting}
        />
      ) : null}
    </Layout>
  );
}
