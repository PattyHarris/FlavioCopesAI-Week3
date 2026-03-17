import { useState } from "react";
import Modal from "./Modal";

export default function InviteMemberModal({ onClose, onInvite, isSubmitting }) {
  const [email, setEmail] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    await onInvite(email.trim());
  }

  return (
    <Modal title="Invite new member" onClose={onClose}>
      <form className="form stack-md" onSubmit={handleSubmit}>
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="friend@example.com"
            required
          />
        </label>
        <p className="muted">
          If the user already has an account, they will see the group the next time they sign in. Otherwise the invite
          stays pending for that email.
        </p>
        <button type="submit" className="primary-button" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send invite"}
        </button>
      </form>
    </Modal>
  );
}
