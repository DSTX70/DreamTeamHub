import { useEffect, useState } from "react";

type ToastProps = {
  message: string;
  duration?: number;
  onClose?: () => void;
};

export default function Toast({ message, duration = 3000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-4 right-4 bg-popover text-popover-foreground border shadow-lg rounded-md px-4 py-3 flex items-center gap-2 z-50 animate-in slide-in-from-bottom-2"
      data-testid="toast-notification"
    >
      <span className="text-sm">{message}</span>
    </div>
  );
}
