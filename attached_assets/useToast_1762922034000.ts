
import * as React from 'react';

type ToastFn = (msg: { title?: string; description?: string }) => void;

export function useToast(): { toast: ToastFn } {
  // If shadcn/ui toast is wired, you can re-export it here.
  // For a soft fallback, use alert() for dev to avoid hard dependency.
  const toast: ToastFn = ({ title, description }) => {
    if (typeof window !== 'undefined' && (window as any).__toast) {
      (window as any).__toast({ title, description });
    } else {
      const msg = [title, description].filter(Boolean).join('\n');
      if (msg) alert(msg);
    }
  };
  return { toast };
}
