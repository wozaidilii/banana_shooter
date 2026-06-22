"use client";

import { useState } from "react";
import { setAdminToken } from "~/lib/admin-auth";
import { showToast } from "~/components/Toast";
import { api } from "~/trpc/react";

interface AdminLoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminLoginModal({ open, onClose, onSuccess }: AdminLoginModalProps) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const login = api.admin.login.useMutation();

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await login.mutateAsync({ username, password });
      setAdminToken(result.token);
      showToast("管理员登录成功", "success");
      onSuccess();
      onClose();
    } catch {
      showToast("账号或密码错误", "error");
    }
  };

  return (
    <div className="login-modal-overlay" onClick={onClose} role="presentation">
      <div className="login-modal admin-login-modal" onClick={(e) => e.stopPropagation()} role="dialog">
        <button className="login-modal-close" onClick={onClose} aria-label="关闭">
          ✕
        </button>
        <div className="login-modal-header">
          <span className="wechat-icon">🔐</span>
          <h2>管理员登录</h2>
          <p>进入冥界后台管理系统</p>
        </div>
        <form className="skin-form" onSubmit={(e) => void handleSubmit(e)}>
          <div className="form-row">
            <label>账号</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="form-row">
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={login.isPending}>
            {login.isPending ? "登录中…" : "登录管理后台"}
          </button>
        </form>
      </div>
    </div>
  );
}
