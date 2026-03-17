import { useEffect, useMemo, useState } from "react";
import Modal from "./Modal";
import { dollarsToCents, centsToInputValue } from "../lib/money";
import { allocateEvenly, createSplits } from "../lib/balances";

export default function AddExpenseModal({ members, currentUserId, onClose, onCreate, isSubmitting }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(currentUserId);
  const [splitType, setSplitType] = useState("equal");
  const [selectedUserIds, setSelectedUserIds] = useState(members.map((member) => member.user_id));
  const [exactAmountsByUser, setExactAmountsByUser] = useState(
    Object.fromEntries(members.map((member) => [member.user_id, 0]))
  );
  const [error, setError] = useState("");

  const totalCents = useMemo(() => dollarsToCents(amount), [amount]);
  const equalShareCents = selectedUserIds.length > 0 ? Math.floor(totalCents / selectedUserIds.length) : 0;
  const equalShareRemainder = selectedUserIds.length > 0 ? totalCents % selectedUserIds.length : 0;

  useEffect(() => {
    if (splitType !== "exact" || totalCents <= 0 || selectedUserIds.length === 0) {
      return;
    }

    const equalized = Object.fromEntries(
      allocateEvenly(totalCents, selectedUserIds).map((split) => [split.user_id, split.amount_cents])
    );

    setExactAmountsByUser((current) => ({
      ...Object.fromEntries(members.map((member) => [member.user_id, 0])),
      ...current,
      ...equalized,
    }));
  }, [members, selectedUserIds, splitType, totalCents]);

  function toggleMember(userId) {
    setSelectedUserIds((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      if (totalCents <= 0) {
        throw new Error("Enter an amount greater than zero.");
      }

      const splits = createSplits({
        splitType,
        totalCents,
        selectedUserIds,
        exactAmountsByUser,
      });

      await onCreate({
        description: description.trim(),
        amount_cents: totalCents,
        paid_by: paidBy,
        split_type: splitType,
        splits,
      });
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  return (
    <Modal title="Add expense" onClose={onClose}>
      <form className="form stack-md" onSubmit={handleSubmit}>
        <label className="field">
          <span>Expense description</span>
          <input
            type="text"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Groceries"
            required
          />
        </label>
        <label className="field">
          <span>Amount paid</span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0.00"
            required
          />
        </label>
        <label className="field">
          <span>Paid by</span>
          <select value={paidBy} onChange={(event) => setPaidBy(event.target.value)}>
            {members.map((member) => (
              <option key={member.user_id} value={member.user_id}>
                {member.profile?.display_name || member.profile?.email || "Member"}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Split type</span>
          <select value={splitType} onChange={(event) => setSplitType(event.target.value)}>
            <option value="equal">Equal</option>
            <option value="exact">Exact amounts</option>
          </select>
        </label>
        <div className="field">
          <span>Members who owe part of this expense</span>
          <div className="check-grid">
            {members.map((member) => {
              const checked = selectedUserIds.includes(member.user_id);
              return (
                <label key={member.user_id} className="checkbox-row">
                  <input type="checkbox" checked={checked} onChange={() => toggleMember(member.user_id)} />
                  <span>{member.profile?.display_name || member.profile?.email || "Member"}</span>
                  {splitType === "exact" && checked ? (
                    <input
                      type="text"
                      inputMode="decimal"
                      value={centsToInputValue(exactAmountsByUser[member.user_id])}
                      onChange={(event) =>
                        setExactAmountsByUser((current) => ({
                          ...current,
                          [member.user_id]: dollarsToCents(event.target.value),
                        }))
                      }
                      className="inline-amount"
                    />
                  ) : null}
                  {splitType === "equal" && checked ? (
                    <span className="split-preview">
                      {(equalShareCents / 100).toFixed(2)}
                      {equalShareRemainder > 0 ? "+" : ""}
                    </span>
                  ) : null}
                </label>
              );
            })}
          </div>
        </div>
        {splitType === "equal" ? (
          <p className="muted">
            The selected members will each owe an equal share of the total. Any leftover cents are distributed one cent
            at a time across the selected members.
          </p>
        ) : null}
        {splitType === "exact" ? (
          <p className="muted">
            Paid by is who covered the bill. Enter the exact amount owed by each checked member below. These amounts
            must total {(totalCents / 100).toFixed(2)}.
          </p>
        ) : null}
        {error ? <p className="error-text">{error}</p> : null}
        <button type="submit" className="primary-button" disabled={isSubmitting}>
          {isSubmitting ? "Adding..." : "Add expense"}
        </button>
      </form>
    </Modal>
  );
}
