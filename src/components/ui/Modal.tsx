import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: ModalSize;
  children: ReactNode;
  footer?: ReactNode;
  closeOnOverlay?: boolean;
};

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  children,
  footer,
  closeOnOverlay = true,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4"
      onClick={(e) => {
        if (closeOnOverlay && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full ${SIZE_CLASS[size]} max-h-[min(100vh-2rem,720px)] flex flex-col overflow-hidden rounded-md border border-neutral-200 bg-white shadow-xl`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-neutral-200 px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-xs text-neutral-500">{description}</p>
            ) : null}
          </div>
          <IconButton onClick={onClose} aria-label="閉じる">
            <X size={16} />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-neutral-200 px-5 py-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ModalFooter({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
