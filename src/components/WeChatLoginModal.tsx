"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loginWithWechat } from "~/lib/auth";
import { showToast } from "~/components/Toast";
import { api } from "~/trpc/react";

interface WeChatLoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const POLL_INTERVAL_MS = 2000;

export function WeChatLoginModal({ open, onClose, onSuccess }: WeChatLoginModalProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [mode, setMode] = useState<"wechat" | "demo">("demo");
  const [status, setStatus] = useState<"loading" | "waiting" | "scanned" | "expired">("loading");
  const [expiresAt, setExpiresAt] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const createSession = api.auth.createLoginSession.useMutation();
  const simulateLogin = api.auth.simulateLogin.useMutation();

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const handleLoginSuccess = useCallback(
    (user: { openId: string; nickname: string; avatar: string }) => {
      loginWithWechat(user);
      showToast(`欢迎回来，${user.nickname}`, "success");
      stopPolling();
      onSuccess();
      onClose();
    },
    [onClose, onSuccess, stopPolling],
  );

  const initSession = useCallback(async () => {
    setStatus("loading");
    setQrDataUrl("");
    setSessionId(null);
    stopPolling();

    try {
      const result = await createSession.mutateAsync();
      setSessionId(result.sessionId);
      setQrDataUrl(result.qrDataUrl);
      setMode(result.mode);
      setExpiresAt(result.expiresAt);
      setStatus("waiting");
    } catch {
      showToast("二维码加载失败，请重试", "error");
      setStatus("expired");
    }
  }, [createSession, stopPolling]);

  // 打开弹窗时创建会话
  useEffect(() => {
    if (open) {
      void initSession();
    } else {
      stopPolling();
    }
    return stopPolling;
  }, [open, initSession, stopPolling]);

  // 轮询登录状态
  const statusQuery = api.auth.getSessionStatus.useQuery(
    { sessionId: sessionId ?? "" },
    {
      enabled: open && Boolean(sessionId) && status !== "expired",
      refetchInterval: POLL_INTERVAL_MS,
    },
  );

  useEffect(() => {
    const data = statusQuery.data;
    if (!data) return;

    if (data.status === "expired") {
      setStatus("expired");
      stopPolling();
      return;
    }

    if (data.status === "scanned") {
      setStatus("scanned");
    }

    if (data.status === "confirmed" && data.user) {
      handleLoginSuccess(data.user);
    }
  }, [statusQuery.data, handleLoginSuccess, stopPolling]);

  // 检查二维码是否过期
  useEffect(() => {
    if (!open || !expiresAt) return;
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) {
      setStatus("expired");
      return;
    }
    const timer = setTimeout(() => setStatus("expired"), remaining);
    return () => clearTimeout(timer);
  }, [open, expiresAt]);

  const handleSimulate = async () => {
    if (!sessionId || mode !== "demo") return;
    try {
      const result = await simulateLogin.mutateAsync({ sessionId });
      if (result.ok && result.user) {
        handleLoginSuccess(result.user);
      } else {
        showToast("模拟登录失败", "error");
      }
    } catch {
      showToast("模拟登录失败", "error");
    }
  };

  if (!open) return null;

  return (
    <div className="login-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="login-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="wechat-login-title"
        aria-modal="true"
      >
        <button className="login-modal-close" onClick={onClose} aria-label="关闭">
          ✕
        </button>

        <div className="login-modal-header">
          <span className="wechat-icon">💬</span>
          <h2 id="wechat-login-title">微信扫码登录</h2>
          <p>打开微信扫一扫，进入赛博冥界</p>
        </div>

        <div className="login-qr-wrap">
          {status === "loading" && (
            <div className="login-qr-placeholder">
              <span className="login-qr-spinner" />
              <p>正在生成二维码…</p>
            </div>
          )}

          {status !== "loading" && status !== "expired" && qrDataUrl && (
            <div className="login-qr-box">
              <img src={qrDataUrl} alt="微信登录二维码" width={220} height={220} />
              {status === "scanned" && (
                <div className="login-qr-scanned">
                  <span>已扫码，请在手机上确认</span>
                </div>
              )}
            </div>
          )}

          {status === "expired" && (
            <div className="login-qr-placeholder expired">
              <span>⏱️</span>
              <p>二维码已过期</p>
              <button className="btn btn-primary" onClick={() => void initSession()}>
                刷新二维码
              </button>
            </div>
          )}
        </div>

        <div className="login-modal-footer">
          <p className="login-hint">
            {mode === "wechat"
              ? "请使用微信扫描二维码登录"
              : "演示模式：可用微信扫码，或点击下方按钮模拟"}
          </p>
          {mode === "demo" && status === "waiting" && (
            <button
              className="btn btn-ghost login-simulate-btn"
              onClick={() => void handleSimulate()}
              disabled={simulateLogin.isPending}
            >
              {simulateLogin.isPending ? "登录中…" : "模拟扫码登录（开发）"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
