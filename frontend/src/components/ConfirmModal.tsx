'use client';

interface Props {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ message, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
        <p className="text-gray-800 font-medium mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm font-semibold">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
