"use client";

import { useState } from "react";
import { useAuth } from "~/hooks/useAuth";
import { useHeroes } from "~/context/HeroContext";
import { showToast } from "~/components/Toast";
import { LoginButton } from "~/components/LoginButton";
import { api } from "~/trpc/react";

const REVIEW_LABELS = {
  pending: { text: "审核中", className: "status-pending" },
  approved: { text: "已通过", className: "status-approved" },
  rejected: { text: "已拒绝", className: "status-rejected" },
} as const;

export function SubmitHeroView() {
  const { isLoggedIn } = useAuth();
  const { refetch } = useHeroes();
  const [form, setForm] = useState({
    name: "",
    realName: "",
    emoji: "💀",
    tagline: "",
    epitaph: "",
    color: "#00ffcc",
    greeting: "",
    persona: "",
    fallbacksText: "",
  });

  const submit = api.hero.submit.useMutation();
  const { data: mySubmissions, refetch: refetchMine } = api.hero.mySubmissions.useQuery(undefined, {
    enabled: isLoggedIn,
  });

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      showToast("请先微信登录再提交英雄", "error");
      return;
    }
    if (form.persona.trim().length < 10) {
      showToast("人设描述至少 10 个字", "error");
      return;
    }

    try {
      await submit.mutateAsync(form);
      showToast("提交成功！等待管理员审核", "success");
      setForm({
        name: "",
        realName: "",
        emoji: "💀",
        tagline: "",
        epitaph: "",
        color: "#00ffcc",
        greeting: "",
        persona: "",
        fallbacksText: "",
      });
      void refetchMine();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "提交失败";
      showToast(msg, "error");
    }
  };

  return (
    <>
      <section className="page-header">
        <h2>⚰️ 造英雄</h2>
        <p>上传你的赛博冥界人物，管理员审核通过后上线</p>
      </section>

      {!isLoggedIn ? (
        <section className="section hint-box login-required-box">
          <p>提交英雄需要先微信登录</p>
          <LoginButton />
        </section>
      ) : (
        <section className="section create-skin">
          <form className="skin-form hero-submit-form" onSubmit={(e) => void handleSubmit(e)}>
            <div className="form-row-grid">
              <div className="form-row">
                <label>英雄名称 *</label>
                <input
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="例：赛博龙哥"
                  maxLength={30}
                  required
                />
              </div>
              <div className="form-row">
                <label>真实身份/梗来源</label>
                <input
                  value={form.realName}
                  onChange={(e) => handleChange("realName", e.target.value)}
                  placeholder="例：网络梗化人物"
                  maxLength={50}
                />
              </div>
            </div>

            <div className="form-row-grid">
              <div className="form-row">
                <label>表情图标</label>
                <input
                  value={form.emoji}
                  onChange={(e) => handleChange("emoji", e.target.value)}
                  maxLength={4}
                />
              </div>
              <div className="form-row">
                <label>主题色</label>
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => handleChange("color", e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <label>标语</label>
              <input
                value={form.tagline}
                onChange={(e) => handleChange("tagline", e.target.value)}
                placeholder="一行概括这个梗"
                maxLength={100}
              />
            </div>

            <div className="form-row">
              <label>墓志铭</label>
              <input
                value={form.epitaph}
                onChange={(e) => handleChange("epitaph", e.target.value)}
                placeholder="墓碑上刻的那句话"
                maxLength={200}
              />
            </div>

            <div className="form-row">
              <label>开场白</label>
              <input
                value={form.greeting}
                onChange={(e) => handleChange("greeting", e.target.value)}
                placeholder="用户打开对话时的第一句话"
                maxLength={200}
              />
            </div>

            <div className="form-row">
              <label>人设描述 *（供 AI 对话，至少 10 字）</label>
              <textarea
                value={form.persona}
                onChange={(e) => handleChange("persona", e.target.value)}
                placeholder="描述人物身份、语气、常用梗、说话风格……"
                rows={6}
                maxLength={8000}
                required
              />
            </div>

            <div className="form-row">
              <label>兜底回复（每行一条，可选）</label>
              <textarea
                value={form.fallbacksText}
                onChange={(e) => handleChange("fallbacksText", e.target.value)}
                placeholder="AI 接不住时的备用回复，每行一条"
                rows={4}
                maxLength={2000}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={submit.isPending}>
              {submit.isPending ? "提交中…" : "提交审核"}
            </button>
          </form>
        </section>
      )}

      {isLoggedIn && (mySubmissions?.length ?? 0) > 0 && (
        <section className="section">
          <h3 className="section-subtitle">我的提交</h3>
          <div className="submission-list">
            {mySubmissions!.map((item) => {
              const status = REVIEW_LABELS[item.reviewStatus as keyof typeof REVIEW_LABELS] ?? REVIEW_LABELS.pending;
              return (
                <div key={item.id} className="submission-card">
                  <span className="submission-emoji">{item.emoji}</span>
                  <div className="submission-info">
                    <strong>{item.name}</strong>
                    <p>{item.tagline}</p>
                    {item.reviewNote && item.reviewStatus === "rejected" && (
                      <small className="review-note">拒绝原因：{item.reviewNote}</small>
                    )}
                  </div>
                  <span className={`review-badge ${status.className}`}>{status.text}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="section hint-box">
        <p>
          💡 用户上传的英雄需经管理员审核。审核通过后将出现在复活赛和对话列表中。
          {isLoggedIn && " 已通过的英雄会自动刷新到首页。"}
        </p>
      </section>
    </>
  );
}
