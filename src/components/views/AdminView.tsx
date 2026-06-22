"use client";

import { useState } from "react";
import { AdminLoginModal } from "~/components/AdminLoginModal";
import { showToast } from "~/components/Toast";
import { useHeroes } from "~/context/HeroContext";
import { useAdminAuth } from "~/hooks/useAdminAuth";
import type { HeroRecord } from "~/server/db/types";
import { api } from "~/trpc/react";

type AdminTab = "pending" | "heroes" | "create";

const EMPTY_FORM = {
  name: "",
  realName: "",
  emoji: "💀",
  tagline: "",
  epitaph: "",
  color: "#00ffcc",
  greeting: "",
  persona: "",
  fallbacksText: "",
  status: "candidate" as "candidate" | "resurrected",
};

export function AdminView() {
  const { isAdmin, logout } = useAdminAuth();
  const { refetch: refetchPublic } = useHeroes();
  const [loginOpen, setLoginOpen] = useState(false);
  const [tab, setTab] = useState<AdminTab>("pending");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  const utils = api.useUtils();
  const { data: allHeroes, refetch: refetchAll } = api.admin.listAll.useQuery(undefined, {
    enabled: isAdmin,
  });
  const { data: pendingHeroes, refetch: refetchPending } = api.admin.listPending.useQuery(undefined, {
    enabled: isAdmin,
  });

  const createHero = api.admin.create.useMutation();
  const updateHero = api.admin.update.useMutation();
  const deleteHero = api.admin.delete.useMutation();
  const reviewHero = api.admin.review.useMutation();

  const refreshAll = () => {
    void refetchAll();
    void refetchPending();
    void refetchPublic();
    void utils.hero.listApproved.invalidate();
  };

  if (!isAdmin) {
    return (
      <>
        <section className="page-header">
          <h2>🔐 管理后台</h2>
          <p>管理员登录后可管理英雄与审核用户提交</p>
        </section>
        <section className="section hint-box admin-gate">
          <p>此区域需要管理员权限</p>
          <button className="btn btn-primary" onClick={() => setLoginOpen(true)}>
            管理员登录
          </button>
        </section>
        <AdminLoginModal
          open={loginOpen}
          onClose={() => setLoginOpen(false)}
          onSuccess={() => setLoginOpen(false)}
        />
      </>
    );
  }

  const handleReview = async (id: string, decision: "approved" | "rejected") => {
    let reviewNote: string | undefined;
    if (decision === "rejected") {
      reviewNote = window.prompt("拒绝原因（可选）") ?? undefined;
    }
    try {
      await reviewHero.mutateAsync({ id, decision, reviewNote });
      showToast(decision === "approved" ? "已通过审核" : "已拒绝", "success");
      refreshAll();
    } catch {
      showToast("操作失败", "error");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`确定删除「${name}」？官方英雄不可删除。`)) return;
    try {
      await deleteHero.mutateAsync({ id });
      showToast("已删除", "success");
      refreshAll();
    } catch {
      showToast("删除失败（可能是官方英雄）", "error");
    }
  };

  const startEdit = (hero: HeroRecord) => {
    setEditingId(hero.id);
    setTab("create");
    setForm({
      name: hero.name,
      realName: hero.realName,
      emoji: hero.emoji,
      tagline: hero.tagline,
      epitaph: hero.epitaph,
      color: hero.color,
      greeting: hero.dialogue.greeting,
      persona: hero.dialogue.persona,
      fallbacksText: hero.dialogue.fallbacks.join("\n"),
      status: hero.status,
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.persona.trim().length < 10) {
      showToast("人设描述至少 10 个字", "error");
      return;
    }

    try {
      if (editingId) {
        await updateHero.mutateAsync({ id: editingId, data: form });
        showToast("英雄已更新", "success");
      } else {
        await createHero.mutateAsync(form);
        showToast("英雄已创建并上线", "success");
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      refreshAll();
    } catch {
      showToast("保存失败", "error");
    }
  };

  const approvedHeroes = allHeroes?.filter((h) => h.reviewStatus === "approved") ?? [];

  return (
    <>
      <section className="page-header admin-header">
        <div>
          <h2>🔐 管理后台</h2>
          <p>英雄管理 · 用户提交审核</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={logout}>
          退出管理
        </button>
      </section>

      <div className="admin-tabs">
        {(
          [
            ["pending", `待审核 (${pendingHeroes?.length ?? 0})`],
            ["heroes", "英雄管理"],
            ["create", editingId ? "编辑英雄" : "新建英雄"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            className={`admin-tab${tab === key ? " active" : ""}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "pending" && (
        <section className="section">
          {(pendingHeroes?.length ?? 0) === 0 ? (
            <p className="empty">暂无待审核提交</p>
          ) : (
            <div className="admin-list">
              {pendingHeroes!.map((hero) => (
                <div key={hero.id} className="admin-card">
                  <span className="admin-card-emoji">{hero.emoji}</span>
                  <div className="admin-card-body">
                    <h4>
                      {hero.name}{" "}
                      <small>
                        提交者：{hero.submittedBy?.nickname ?? "未知"} · {hero.source}
                      </small>
                    </h4>
                    <p>{hero.tagline}</p>
                    <p className="admin-persona-preview">{hero.dialogue.persona.slice(0, 120)}…</p>
                  </div>
                  <div className="admin-card-actions">
                    <button
                      className="btn-sm btn-approve"
                      onClick={() => void handleReview(hero.id, "approved")}
                    >
                      通过
                    </button>
                    <button
                      className="btn-sm btn-reject"
                      onClick={() => void handleReview(hero.id, "rejected")}
                    >
                      拒绝
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "heroes" && (
        <section className="section">
          <div className="admin-list">
            {approvedHeroes.map((hero) => (
              <div key={hero.id} className="admin-card">
                <span className="admin-card-emoji">{hero.emoji}</span>
                <div className="admin-card-body">
                  <h4>
                    {hero.name}{" "}
                    <span className={`source-badge source-${hero.source}`}>{hero.source}</span>
                  </h4>
                  <p>{hero.realName} · {hero.tagline}</p>
                </div>
                <div className="admin-card-actions">
                  <button className="btn-sm" onClick={() => startEdit(hero)}>
                    编辑
                  </button>
                  {hero.source !== "official" && (
                    <button
                      className="btn-sm btn-reject"
                      onClick={() => void handleDelete(hero.id, hero.name)}
                    >
                      删除
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "create" && (
        <section className="section create-skin">
          <form className="skin-form hero-submit-form" onSubmit={(e) => void handleFormSubmit(e)}>
            <div className="form-row-grid">
              <div className="form-row">
                <label>英雄名称 *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  maxLength={30}
                />
              </div>
              <div className="form-row">
                <label>真实身份</label>
                <input
                  value={form.realName}
                  onChange={(e) => setForm({ ...form, realName: e.target.value })}
                  maxLength={50}
                />
              </div>
            </div>

            <div className="form-row-grid">
              <div className="form-row">
                <label>表情</label>
                <input
                  value={form.emoji}
                  onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                  maxLength={4}
                />
              </div>
              <div className="form-row">
                <label>主题色</label>
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                />
              </div>
              <div className="form-row">
                <label>状态</label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as "candidate" | "resurrected" })
                  }
                >
                  <option value="candidate">候选人</option>
                  <option value="resurrected">已复活</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <label>标语</label>
              <input
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                maxLength={100}
              />
            </div>

            <div className="form-row">
              <label>墓志铭</label>
              <input
                value={form.epitaph}
                onChange={(e) => setForm({ ...form, epitaph: e.target.value })}
                maxLength={200}
              />
            </div>

            <div className="form-row">
              <label>开场白</label>
              <input
                value={form.greeting}
                onChange={(e) => setForm({ ...form, greeting: e.target.value })}
                maxLength={200}
              />
            </div>

            <div className="form-row">
              <label>人设描述 *</label>
              <textarea
                value={form.persona}
                onChange={(e) => setForm({ ...form, persona: e.target.value })}
                rows={8}
                maxLength={8000}
                required
              />
            </div>

            <div className="form-row">
              <label>兜底回复（每行一条）</label>
              <textarea
                value={form.fallbacksText}
                onChange={(e) => setForm({ ...form, fallbacksText: e.target.value })}
                rows={4}
                maxLength={2000}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={createHero.isPending || updateHero.isPending}>
                {editingId ? "保存修改" : "创建并上线"}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setEditingId(null);
                    setForm(EMPTY_FORM);
                  }}
                >
                  取消编辑
                </button>
              )}
            </div>
          </form>
        </section>
      )}
    </>
  );
}
