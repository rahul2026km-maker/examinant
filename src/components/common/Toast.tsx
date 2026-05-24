import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { createPortal } from 'react-dom';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
}

interface ToastItemProps {
    toast: ToastMessage;
    onDismiss: (id: string) => void;
}

const icons = {
    success: <CheckCircle className="text-green-500" size={20} />,
    error: <XCircle className="text-red-500" size={20} />,
    warning: <AlertTriangle className="text-amber-500" size={20} />,
    info: <Info className="text-blue-500" size={20} />,
};

const colors = {
    success: 'border-green-200 bg-green-50',
    error: 'border-red-200 bg-red-50',
    warning: 'border-amber-200 bg-amber-50',
    info: 'border-blue-200 bg-blue-50',
};

const ToastItem = ({ toast, onDismiss }: ToastItemProps) => {
    useEffect(() => {
        const timer = setTimeout(() => onDismiss(toast.id), 4000);
        return () => clearTimeout(timer);
    }, [toast.id, onDismiss]);

    return (
        <div className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg max-w-sm w-full ${colors[toast.type]}`}>
            <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-sm">{toast.title}</p>
                {toast.message && <p className="text-xs text-slate-600 mt-0.5">{toast.message}</p>}
            </div>
            <button onClick={() => onDismiss(toast.id)} className="flex-shrink-0 text-slate-400 hover:text-slate-600">
                <X size={16} />
            </button>
        </div>
    );
};

// Global toast state
type Listener = (toasts: ToastMessage[]) => void;
let listeners: Listener[] = [];
let toasts: ToastMessage[] = [];

const notify = (listeners: Listener[], toasts: ToastMessage[]) => {
    listeners.forEach(l => l([...toasts]));
};

export const toast = {
    success: (title: string, message?: string) => {
        const id = Math.random().toString(36).slice(2);
        toasts = [...toasts, { id, type: 'success', title, message }];
        notify(listeners, toasts);
    },
    error: (title: string, message?: string) => {
        const id = Math.random().toString(36).slice(2);
        toasts = [...toasts, { id, type: 'error', title, message }];
        notify(listeners, toasts);
    },
    warning: (title: string, message?: string) => {
        const id = Math.random().toString(36).slice(2);
        toasts = [...toasts, { id, type: 'warning', title, message }];
        notify(listeners, toasts);
    },
    info: (title: string, message?: string) => {
        const id = Math.random().toString(36).slice(2);
        toasts = [...toasts, { id, type: 'info', title, message }];
        notify(listeners, toasts);
    },
};

export const ToastContainer = () => {
    const [items, setItems] = useState<ToastMessage[]>([]);

    useEffect(() => {
        const listener: Listener = (t) => setItems(t);
        listeners.push(listener);
        return () => {
            listeners = listeners.filter(l => l !== listener);
        };
    }, []);

    const dismiss = (id: string) => {
        toasts = toasts.filter(t => t.id !== id);
        notify(listeners, toasts);
    };

    if (items.length === 0) return null;

    return createPortal(
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3">
            {items.map(t => (
                <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
            ))}
        </div>,
        document.body
    );
};
