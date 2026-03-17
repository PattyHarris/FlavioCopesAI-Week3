import { useMemo, useState } from "react";
import Modal from "./Modal";
import { dollarsToCents } from "../lib/money";

export default function SettleUpModal({
  members,
  currentUserId,
  suggestedTransfers,
  onClose,
  onCreate,
  isSubmitting,
}) {
  const payableMembers = useMemo(
    () => members.filter((member) => member.user_id !== currentUserId),
    [currentUserId, members]
  );
  const defaultPayee = suggestedTransfers.find((transfer) => transfer.from.user_id === currentUserId)?.to.user_id;
  const [payeeId, setPayeeId] = useState(defaultPayee || payableMembers[0]?.user_id || "");
  const [amount, setAmount] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const amountCents = dollarsToCents(amount);
    if (amountCents <= 0) {
      return;
    }

    await onCreate({
      payee_id: payeeId,
      amount_cents: amountCents,
    });
  }

  return (
    <Modal title="Settle up" onClose={onClose}>
      <form className="form stack-md" onSubmit={handleSubmit}>
        <label className="field">
          <span>Pay to</span>
          <select value={payeeId} onChange={(event) => setPayeeId(event.target.value)} required>
            {payableMembers.map((member) => (
              <option key={member.user_id} value={member.user_id}>
                {member.profile?.display_name || member.profile?.email || "Member"}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Amount</span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0.00"
            required
          />
        </label>
        <button type="submit" className="primary-button" disabled={isSubmitting}>
          {isSubmitting ? "Recording..." : "Record entry"}
        </button>
      </form>
    </Modal>
  );
}
