import React from "react";

const ConfirmActionModal = ({
  open,
  onCancel,
  onConfirm,
  icon = "👋",
  title = "Are you sure?",
  message = "Please confirm this action.",
  cancelText = "Cancel",
  confirmText = "Confirm",
  confirmClassName = "bg-gradient-to-r from-red-500 to-red-600 text-white",
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center px-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-5xl mb-3">{icon}</div>
        <h5 className="font-bold text-slate-800 mb-2">{title}</h5>
        <p className="text-sm text-slate-500 mb-6">{message}</p>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-500 font-semibold hover:bg-slate-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-6 py-2.5 rounded-lg font-semibold shadow ${confirmClassName}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmActionModal;
