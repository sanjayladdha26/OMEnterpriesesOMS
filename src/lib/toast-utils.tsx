import toast from "react-hot-toast";

export const confirmToast = (message: string, onConfirm: () => void) => {
  toast((t) => (
    <div className="flex flex-col gap-3 w-full">
      <p className="text-sm font-medium text-text-primary">{message}</p>
      <div className="flex gap-2 justify-end">
        <button 
          onClick={() => toast.dismiss(t.id)} 
          className="px-3 py-1.5 text-xs font-medium text-text-muted hover:bg-surface-hover rounded-md transition-colors"
        >
          Cancel
        </button>
        <button 
          onClick={() => {
            toast.dismiss(t.id);
            onConfirm();
          }} 
          className="px-3 py-1.5 text-xs font-medium bg-red text-white hover:bg-red-dark rounded-md transition-colors"
        >
          Confirm
        </button>
      </div>
    </div>
  ), { duration: Infinity, id: 'confirm-toast' });
};
