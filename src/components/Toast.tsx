"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type?: "info" | "success" | "error";
  onClose: () => void;
}

export function Toast({ message, type = "info", onClose }: ToastProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setShow(true));
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onClose, 300);
    }, 2800);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}${show ? " show" : ""}`}>{message}</div>
  );
}

let toastHandler: ((msg: string, type?: "info" | "success" | "error") => void) | null = null;

export function ToastContainer() {
  const [toast, setToast] = useState<{ message: string; type: "info" | "success" | "error" } | null>(
    null,
  );

  useEffect(() => {
    toastHandler = (message, type = "info") => setToast({ message, type });
    return () => {
      toastHandler = null;
    };
  }, []);

  if (!toast) return null;

  return (
    <Toast
      message={toast.message}
      type={toast.type}
      onClose={() => setToast(null)}
    />
  );
}

export function showToast(message: string, type: "info" | "success" | "error" = "info") {
  toastHandler?.(message, type);
}
