import { useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';
import './Toast.css';

export type ToastType = 'success' | 'error';

export interface ToastData {
    type: ToastType;
    title: string;
    message: string;
}

interface ToastProps extends ToastData {
    onClose: () => void;
    duration?: number; // ms — default 7000
}

export function Toast({ type, title, message, onClose, duration = 7000 }: ToastProps) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        timerRef.current = setTimeout(onClose, duration);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [onClose, duration]);

    return (
        <div className={`toast toast--${type}`} role="alert" aria-live="assertive">
            {/* Barra de progresso animada */}
            <div
                className="toast__progress"
                style={{ animationDuration: `${duration}ms` }}
            />

            <div className="toast__icon">
                {type === 'success'
                    ? <CheckCircle2 size={20} strokeWidth={2} />
                    : <XCircle size={20} strokeWidth={2} />}
            </div>

            <div className="toast__body">
                <p className="toast__title">{title}</p>
                <p className="toast__message">{message}</p>
            </div>

            <button className="toast__close" onClick={onClose} aria-label="Fechar">
                <X size={16} strokeWidth={2.5} />
            </button>
        </div>
    );
}