import { createContext, ReactNode, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

type Toast = { id: number; message: string; variant: "success" | "error" };
type ToastContextValue = { push: (message: string, variant?: Toast["variant"]) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, variant: Toast["variant"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex animate-slide-in-right items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-lg ring-1 ring-black/10 ${
              t.variant === "error" ? "bg-red-600" : "bg-gray-900"
            }`}
          >
            {t.variant === "error" ? (
              <XCircle className="h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
            )}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
