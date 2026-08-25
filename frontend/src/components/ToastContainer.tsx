import { useToast } from '../context/ToastContext'
import { Toast } from './Toast'

export const ToastContainer = () => {
  const { toasts, removeToast } = useToast()

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed right-4 top-4 z-[60] flex flex-col gap-2.5 sm:right-6 sm:top-6"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  )
}
