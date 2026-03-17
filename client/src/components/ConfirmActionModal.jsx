import Modal from "./Modal";

export default function ConfirmActionModal({
  title,
  message,
  confirmLabel,
  onClose,
  onConfirm,
  isSubmitting = false,
  submittingLabel,
}) {
  return (
    <Modal title={title} onClose={onClose} className="modal-compact">
      <div className="stack-md confirm-modal">
        <p className="muted confirm-copy">{message}</p>
        <button type="button" className="danger-button confirm-button" onClick={onConfirm} disabled={isSubmitting}>
          {isSubmitting ? submittingLabel || `${confirmLabel}...` : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
