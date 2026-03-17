import { useState } from "react";
import Modal from "./Modal";

export default function NewGroupModal({ onClose, onCreate, isSubmitting }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    await onCreate({ name: name.trim(), description: description.trim() });
  }

  return (
    <Modal title="New group" onClose={onClose}>
      <form className="form stack-md" onSubmit={handleSubmit}>
        <label className="field">
          <span>Group name</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Weekend in Portland"
            required
          />
        </label>
        <label className="field">
          <span>Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Trip expenses for the cabin weekend."
            rows="3"
          />
        </label>
        <button type="submit" className="primary-button" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create group"}
        </button>
      </form>
    </Modal>
  );
}
