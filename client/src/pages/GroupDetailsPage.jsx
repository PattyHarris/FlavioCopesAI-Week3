import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import AddExpenseModal from "../components/AddExpenseModal";
import ConfirmActionModal from "../components/ConfirmActionModal";
import InviteMemberModal from "../components/InviteMemberModal";
import SettleUpModal from "../components/SettleUpModal";
import { useAuth } from "../context/AuthContext";
import { calculateMemberBalances, simplifyBalances } from "../lib/balances";
import { formatCurrencyFromCents } from "../lib/money";
import { supabase } from "../lib/supabase";

export default function GroupDetailsPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [splits, setSplits] = useState([]);
  const [messages, setMessages] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [pendingMessage, setPendingMessage] = useState("");
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [invitationToDelete, setInvitationToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submittingAction, setSubmittingAction] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setNotice("");
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  useEffect(() => {
    fetchGroupData();
    const intervalId = window.setInterval(() => {
      void fetchGroupData({ background: true });
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [groupId]);

  const memberBalances = useMemo(
    () => calculateMemberBalances(members, expenses, splits, settlements),
    [members, expenses, settlements, splits]
  );
  const suggestedTransfers = useMemo(() => simplifyBalances(memberBalances), [memberBalances]);

  async function fetchGroupData(options = {}) {
    if (!options.background) {
      setIsLoading(true);
    }
    setError("");

    const groupQuery = supabase
      .from("groups")
      .select("id, name, description, created_at, owner_id")
      .eq("id", groupId)
      .single();

    const membersQuery = supabase
      .from("group_members")
      .select("id, user_id, joined_at, profile:profiles!group_members_user_id_fkey(id, display_name, email)")
      .eq("group_id", groupId)
      .order("joined_at", { ascending: true });

    const expensesQuery = supabase
      .from("expenses")
      .select("id, description, amount_cents, split_type, paid_by, created_at, payer:profiles!expenses_paid_by_fkey(id, display_name, email)")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });

    const invitationsQuery = supabase
      .from("group_invitations")
      .select(
        "id, email, invited_by, created_at, accepted_at, inviter:profiles!group_invitations_invited_by_fkey(id, display_name, email)"
      )
      .eq("group_id", groupId)
      .is("accepted_at", null)
      .order("created_at", { ascending: false });

    const splitsQuery = supabase
      .from("expense_splits")
      .select("id, expense_id, user_id, amount_cents")
      .eq("group_id", groupId);

    const messagesQuery = supabase
      .from("group_messages")
      .select("id, body, created_at, author_id, author:profiles!group_messages_author_id_fkey(id, display_name, email)")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true });

    const settlementsQuery = supabase
      .from("settlements")
      .select(
        "id, payer_id, payee_id, amount_cents, created_at, payer:profiles!settlements_payer_id_fkey(id, display_name), payee:profiles!settlements_payee_id_fkey(id, display_name)"
      )
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });

    const [groupResult, membersResult, expensesResult, invitationsResult, splitsResult, messagesResult, settlementsResult] =
      await Promise.all([
        groupQuery,
        membersQuery,
        expensesQuery,
        invitationsQuery,
        splitsQuery,
        messagesQuery,
        settlementsQuery,
      ]);

    const queryError =
      groupResult.error ||
      membersResult.error ||
      expensesResult.error ||
      invitationsResult.error ||
      splitsResult.error ||
      messagesResult.error ||
      settlementsResult.error;

    if (queryError) {
      setError(queryError.message);
      if (!options.background) {
        setIsLoading(false);
      }
      return;
    }

    setGroup(groupResult.data);
    setMembers(membersResult.data || []);
    setExpenses(expensesResult.data || []);
    setPendingInvitations(invitationsResult.data || []);
    setSplits(splitsResult.data || []);
    setMessages(messagesResult.data || []);
    setSettlements(settlementsResult.data || []);
    if (!options.background) {
      setIsLoading(false);
    }
  }

  async function handleDeleteGroup() {
    const confirmed = window.confirm("Delete this group and all of its expenses?");
    if (!confirmed) {
      return;
    }

    const { error: deleteError } = await supabase.from("groups").delete().eq("id", groupId);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    navigate("/groups");
  }

  async function handleDeleteExpense(expenseId) {
    setSubmittingAction("delete-expense");
    setError("");
    setNotice("");

    const { error: deleteError } = await supabase.from("expenses").delete().eq("id", expenseId);

    if (deleteError) {
      setError(deleteError.message);
      setSubmittingAction(null);
      return;
    }

    setExpenseToDelete(null);
    setNotice("Expense deleted.");
    setSubmittingAction(null);
    await fetchGroupData();
  }

  async function handleDeleteInvitation(invitationId) {
    setSubmittingAction("delete-invite");
    setError("");
    setNotice("");

    const { error: deleteError } = await supabase.from("group_invitations").delete().eq("id", invitationId);

    if (deleteError) {
      setError(deleteError.message);
      setSubmittingAction(null);
      return;
    }

    setInvitationToDelete(null);
    setNotice("Invitation revoked.");
    setSubmittingAction(null);
    await fetchGroupData();
  }

  async function handleAddExpense(payload) {
    if (!payload.description) {
      setError("Expense description is required.");
      return;
    }

    setSubmittingAction("expense");
    setError("");
    setNotice("");

    try {
      const { data: expense, error: expenseError } = await supabase
        .from("expenses")
        .insert({
          group_id: groupId,
          description: payload.description,
          amount_cents: payload.amount_cents,
          paid_by: payload.paid_by,
          split_type: payload.split_type,
        })
        .select("id")
        .single();

      if (expenseError) {
        throw expenseError;
      }

      const { error: splitError } = await supabase.from("expense_splits").insert(
        payload.splits.map((split) => ({
          group_id: groupId,
          expense_id: expense.id,
          user_id: split.user_id,
          amount_cents: split.amount_cents,
        }))
      );

      if (splitError) {
        throw splitError;
      }

      setShowExpenseModal(false);
      setNotice("Expense added.");
      await fetchGroupData();
    } catch (submitError) {
      setError(submitError.message || "Unable to add expense.");
    } finally {
      setSubmittingAction(null);
    }
  }

  async function handleInvite(email) {
    if (!email) {
      setError("Email is required.");
      return;
    }

    setSubmittingAction("invite");
    setError("");
    setNotice("");

    try {
      const { error: inviteError } = await supabase.from("group_invitations").insert({
        group_id: groupId,
        email: email.toLowerCase().trim(),
        invited_by: profile.id,
      });

      if (inviteError) {
        throw inviteError;
      }

      setShowInviteModal(false);
      setNotice("Invitation saved. The member will be added when they sign in with that email.");
      await fetchGroupData();
    } catch (submitError) {
      if (submitError.code === "23505") {
        setError("That email has already been invited to this group.");
      } else {
        setError(submitError.message || "Unable to send invite.");
      }
    } finally {
      setSubmittingAction(null);
    }
  }

  async function handleSettlement(payload) {
    if (!payload.payee_id || payload.amount_cents <= 0) {
      setError("Choose a member and enter an amount greater than zero.");
      return;
    }

    setSubmittingAction("settlement");
    setError("");
    setNotice("");

    try {
      const { error: settlementError } = await supabase.from("settlements").insert({
        group_id: groupId,
        payer_id: profile.id,
        payee_id: payload.payee_id,
        amount_cents: payload.amount_cents,
      });

      if (settlementError) {
        throw settlementError;
      }

      setShowSettleModal(false);
      setNotice("Settlement recorded.");
      await fetchGroupData();
    } catch (submitError) {
      setError(submitError.message || "Unable to record settlement.");
    } finally {
      setSubmittingAction(null);
    }
  }

  async function handlePostMessage(event) {
    event.preventDefault();
    if (!pendingMessage.trim()) {
      return;
    }

    setSubmittingAction("message");
    setError("");
    setNotice("");

    try {
      const { error: messageError } = await supabase.from("group_messages").insert({
        group_id: groupId,
        author_id: profile.id,
        body: pendingMessage.trim(),
      });

      if (messageError) {
        throw messageError;
      }

      setPendingMessage("");
      setNotice("Message posted.");
      await fetchGroupData();
    } catch (submitError) {
      setError(submitError.message || "Unable to post message.");
    } finally {
      setSubmittingAction(null);
    }
  }

  const youOweTransfers = suggestedTransfers.filter((transfer) => transfer.from.user_id === profile?.id);

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
      {isLoading ? <p className="muted">Loading group...</p> : null}
      {error ? <div className="banner banner-error">{error}</div> : null}
      {notice ? <div className="banner banner-success">{notice}</div> : null}
      {group ? (
        <section className="stack-lg">
          <div className="section-header">
            <Link to="/groups" className="text-link">
              &larr; My Groups
            </Link>
            {group.owner_id === profile?.id ? (
              <button type="button" className="danger-button" onClick={handleDeleteGroup}>
                Delete group
              </button>
            ) : null}
          </div>

          <div className="stack-sm">
            <p className="eyebrow">Group</p>
            <h1>{group.name}</h1>
            <p className="muted">{group.description || "No description yet."}</p>
          </div>

          <div className="details-grid">
            <div className="stack-md">
              <article className="card stack-md">
                <div className="section-header">
                  <h2>Expenses</h2>
                  <button type="button" className="primary-button" onClick={() => setShowExpenseModal(true)}>
                    Add expense
                  </button>
                </div>
                {expenses.length === 0 ? <p className="muted">No expenses yet.</p> : null}
                <div className="stack-sm">
                  {expenses.map((expense) => (
                    <div key={expense.id} className="expense-row">
                      <div className="list-row expense-row-main">
                        <div className="stack-xs">
                          <strong>{expense.description}</strong>
                          <span className="muted">
                            Paid by {expense.payer?.display_name || expense.payer?.email || "Member"} on{" "}
                            {new Date(expense.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <strong>{formatCurrencyFromCents(expense.amount_cents)}</strong>
                      </div>
                      {expense.paid_by === profile?.id || group.owner_id === profile?.id ? (
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={`Delete ${expense.description}`}
                          onClick={() => setExpenseToDelete(expense)}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true" className="icon-svg">
                            <path
                              d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 7h2v7h-2v-7Zm4 0h2v7h-2v-7ZM7 10h2v7H7v-7Zm1 10h8a2 2 0 0 0 2-2V8H6v10a2 2 0 0 0 2 2Z"
                              fill="currentColor"
                            />
                          </svg>
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </article>

              <article className="card stack-md">
                <h2>Messages</h2>
                <div className="message-list">
                  {messages.length === 0 ? <p className="muted">No messages yet.</p> : null}
                  {messages.map((message) => (
                    <div key={message.id} className="message-item">
                      <strong>{message.author?.display_name || message.author?.email || "Member"}</strong>
                      <p>{message.body}</p>
                    </div>
                  ))}
                </div>
                <form className="stack-sm" onSubmit={handlePostMessage}>
                  <textarea
                    rows="3"
                    value={pendingMessage}
                    onChange={(event) => setPendingMessage(event.target.value)}
                    placeholder="Add a message for the group"
                  />
                  <button type="submit" className="secondary-button" disabled={submittingAction === "message"}>
                    Post message
                  </button>
                </form>
              </article>
            </div>

            <div className="stack-md">
              <article className="card stack-md">
                <div className="section-header">
                  <h2>Balances</h2>
                  <button type="button" className="secondary-button" onClick={() => setShowSettleModal(true)}>
                    Settle up
                  </button>
                </div>
                <div className="stack-sm">
                  {memberBalances.map((member) => (
                    <div key={member.user_id} className="list-row">
                      <span>{member.profile?.display_name || member.profile?.email || "Member"}</span>
                      <strong
                        className={
                          member.balance_cents > 0
                            ? "balance-positive"
                            : member.balance_cents < 0
                              ? "balance-negative"
                              : ""
                        }
                      >
                        {member.balance_cents > 0
                          ? `is owed ${formatCurrencyFromCents(member.balance_cents)}`
                          : member.balance_cents < 0
                            ? `owes ${formatCurrencyFromCents(Math.abs(member.balance_cents))}`
                            : "settled up"}
                      </strong>
                    </div>
                  ))}
                </div>
                <div className="stack-sm">
                  <h3>Suggested payments</h3>
                  {suggestedTransfers.length === 0 ? <p className="muted">Everyone is square.</p> : null}
                  {suggestedTransfers.map((transfer, index) => (
                    <p key={`${transfer.from.user_id}-${transfer.to.user_id}-${index}`} className="muted">
                      {transfer.from.profile?.display_name || transfer.from.profile?.email} pays{" "}
                      {transfer.to.profile?.display_name || transfer.to.profile?.email}{" "}
                      {formatCurrencyFromCents(transfer.amount_cents)}
                    </p>
                  ))}
                  {youOweTransfers.length > 0 ? (
                    <p className="subtle-text">
                      You can settle your share directly from the button above.
                    </p>
                  ) : null}
                </div>
              </article>

              <article className="card stack-md">
                <div className="section-header">
                  <h2>Members</h2>
                  <button type="button" className="secondary-button" onClick={() => setShowInviteModal(true)}>
                    Invite
                  </button>
                </div>
                <div className="stack-sm">
                  {members.map((member) => (
                    <div key={member.user_id} className="list-row">
                      <span>{member.profile?.display_name || member.profile?.email || "Member"}</span>
                      {member.user_id === group.owner_id ? <span className="pill">Owner</span> : <span />}
                    </div>
                  ))}
                </div>
                <div className="stack-sm">
                  <h3>Pending invites</h3>
                  {pendingInvitations.length === 0 ? <p className="muted">No pending invites.</p> : null}
                  {pendingInvitations.map((invitation) => (
                    <div key={invitation.id} className="invite-row">
                      <div className="stack-xs">
                        <strong>{invitation.email}</strong>
                        <span className="muted">
                          Invited by {invitation.inviter?.display_name || invitation.inviter?.email || "Member"} on{" "}
                          {new Date(invitation.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="text-link invite-action"
                        onClick={() => setInvitationToDelete(invitation)}
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              </article>

              <article className="card stack-md">
                <h2>Settlements</h2>
                {settlements.length === 0 ? <p className="muted">No settlement entries yet.</p> : null}
                <div className="stack-sm">
                  {settlements.map((settlement) => (
                    <div key={settlement.id} className="list-row">
                      <span>
                        {settlement.payer?.display_name || "Member"} paid {settlement.payee?.display_name || "Member"}
                      </span>
                      <strong>{formatCurrencyFromCents(settlement.amount_cents)}</strong>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </section>
      ) : null}
      {showExpenseModal ? (
        <AddExpenseModal
          members={members}
          currentUserId={profile.id}
          onClose={() => {
            setShowExpenseModal(false);
            if (submittingAction === "expense") {
              setSubmittingAction(null);
            }
          }}
          onCreate={handleAddExpense}
          isSubmitting={submittingAction === "expense"}
        />
      ) : null}
      {showInviteModal ? (
        <InviteMemberModal
          onClose={() => {
            setShowInviteModal(false);
            if (submittingAction === "invite") {
              setSubmittingAction(null);
            }
          }}
          onInvite={handleInvite}
          isSubmitting={submittingAction === "invite"}
        />
      ) : null}
      {showSettleModal ? (
        <SettleUpModal
          members={members}
          currentUserId={profile.id}
          suggestedTransfers={suggestedTransfers}
          onClose={() => {
            setShowSettleModal(false);
            if (submittingAction === "settlement") {
              setSubmittingAction(null);
            }
          }}
          onCreate={handleSettlement}
          isSubmitting={submittingAction === "settlement"}
        />
      ) : null}
      {expenseToDelete ? (
        <ConfirmActionModal
          title="Remove Expense?"
          message="This action can not be undone. Click the Delete to continue."
          confirmLabel="Delete"
          onClose={() => {
            if (submittingAction !== "delete-expense") {
              setExpenseToDelete(null);
            }
          }}
          onConfirm={() => handleDeleteExpense(expenseToDelete.id)}
          isSubmitting={submittingAction === "delete-expense"}
          submittingLabel="Deleting..."
        />
      ) : null}
      {invitationToDelete ? (
        <ConfirmActionModal
          title="Revoke Invite?"
          message="This pending invitation will be removed. Click Revoke to continue."
          confirmLabel="Revoke"
          onClose={() => {
            if (submittingAction !== "delete-invite") {
              setInvitationToDelete(null);
            }
          }}
          onConfirm={() => handleDeleteInvitation(invitationToDelete.id)}
          isSubmitting={submittingAction === "delete-invite"}
          submittingLabel="Revoking..."
        />
      ) : null}
    </Layout>
  );
}
