import React from 'react'

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, type = 'danger' }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-sm p-6 transform animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 btn-outline"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className={`flex-1 ${type === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' : 'btn-dark'} py-2 rounded-xl text-sm font-medium transition-colors`}
          >
            {confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
