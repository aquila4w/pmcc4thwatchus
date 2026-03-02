"use client";

import { useState, useEffect, useCallback } from "react";
import { useDocumentInfo, useField, useForm } from "@payloadcms/ui";
import { Puck, Data } from "@measured/puck";
import "@measured/puck/puck.css";
import { puckConfig } from "@/lib/puck/config";
import { puckTemplates, PuckTemplate } from "@/lib/puck/templates";

// Initial empty data
const initialData: Data = {
  content: [],
  root: {},
};

type ViewMode = "form" | "builder";
type ActiveTab = "schedule" | "media" | "content" | "registration";

export const NewsEventsPuckEditor = () => {
  const { id, collectionSlug } = useDocumentInfo();
  const { value: puckData, setValue: setPuckData } = useField<Data>({ path: "puckData" });
  const { value: contentMode } = useField<string>({ path: "contentMode" });
  const { submit } = useForm();

  const [data, setData] = useState<Data>(initialData);
  const [viewMode, setViewMode] = useState<ViewMode>("form");
  const [saving, setSaving] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load existing puck data
  useEffect(() => {
    if (puckData && typeof puckData === "object" && "content" in puckData) {
      setData(puckData as Data);
    }
  }, [puckData]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSave = useCallback(async (newData: Data) => {
    setSaving(true);
    try {
      // Update the puckData field
      setPuckData(newData);
      setData(newData);

      // Submit the form
      await submit();
      showMessage("success", "Page saved successfully!");
    } catch (error) {
      console.error("Save error:", error);
      showMessage("error", "Failed to save page");
    } finally {
      setSaving(false);
    }
  }, [setPuckData, submit]);

  const handleApplyTemplate = (template: PuckTemplate) => {
    if (data.content.length > 0) {
      if (!confirm("Applying a template will replace your current content. Continue?")) {
        return;
      }
    }
    setData(template.data);
    setPuckData(template.data);
    setShowTemplates(false);
    showMessage("success", `Template "${template.name}" applied!`);
  };

  const hasContent: boolean = Boolean(
    data &&
    typeof data === "object" &&
    Array.isArray(data.content) &&
    data.content.length > 0
  );

  // Only show for Puck content mode
  if (contentMode !== "puck") {
    return null;
  }

  return (
    <div className="puck-editor-container">
      {/* Floating Save Button */}
      <div className="puck-floating-toolbar">
        <div className="puck-toolbar-left">
          {viewMode === "builder" && (
            <button
              type="button"
              onClick={() => setViewMode("form")}
              className="puck-btn puck-btn-secondary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back to Form
            </button>
          )}
          {viewMode === "form" && (
            <button
              type="button"
              onClick={() => setViewMode("builder")}
              className="puck-btn puck-btn-primary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="9" y1="21" x2="9" y2="9"/>
              </svg>
              Open Visual Builder
            </button>
          )}
        </div>

        <div className="puck-toolbar-center">
          {message && (
            <div className={`puck-message ${message.type}`}>
              {message.text}
            </div>
          )}
        </div>

        <div className="puck-toolbar-right">
          {viewMode === "builder" && (
            <>
              <button
                type="button"
                onClick={() => setShowTemplates(true)}
                className="puck-btn puck-btn-secondary"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
                Templates
              </button>
              <button
                type="button"
                onClick={() => handleSave(data)}
                disabled={saving}
                className="puck-btn puck-btn-save"
              >
                {saving ? (
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                    <polyline points="17,21 17,13 7,13 7,21"/>
                    <polyline points="7,3 7,8 15,8"/>
                  </svg>
                )}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Form View - Preview Card */}
      {viewMode === "form" && (
        <div className="puck-preview-card">
          <div className="puck-preview-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
          </div>
          <h3>Visual Page Builder</h3>
          <p>
            {hasContent
              ? `Your page has ${data.content.length} component${data.content.length !== 1 ? "s" : ""}. Click below to edit.`
              : "Create beautiful event pages with our drag-and-drop editor."}
          </p>
          <button
            type="button"
            onClick={() => setViewMode("builder")}
            className="puck-btn puck-btn-primary puck-btn-large"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            {hasContent ? "Edit Visual Content" : "Start Building"}
          </button>
          {hasContent && (
            <div className="puck-status-badge success">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22,4 12,14.01 9,11.01"/>
              </svg>
              Visual content configured
            </div>
          )}
        </div>
      )}

      {/* Builder View - Full Puck Editor */}
      {viewMode === "builder" && (
        <div className="puck-editor-wrapper">
          <Puck
            config={puckConfig}
            data={data}
            onPublish={handleSave}
            onChange={setData}
          />
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <div className="puck-modal-overlay">
          <div className="puck-modal">
            <div className="puck-modal-header">
              <h2>Choose a Template</h2>
              <button
                type="button"
                onClick={() => setShowTemplates(false)}
                className="puck-modal-close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="puck-modal-body">
              {["event", "landing", "ministry", "about", "contact", "general"].map((category) => {
                const categoryTemplates = puckTemplates.filter(t => t.category === category);
                if (categoryTemplates.length === 0) return null;
                return (
                  <div key={category} className="puck-template-category">
                    <h3>{category.charAt(0).toUpperCase() + category.slice(1)} Templates</h3>
                    <div className="puck-template-grid">
                      {categoryTemplates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => handleApplyTemplate(template)}
                          className="puck-template-card"
                        >
                          <div className="puck-template-preview">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <rect x="3" y="3" width="18" height="18" rx="2"/>
                              <line x1="3" y1="9" x2="21" y2="9"/>
                              <line x1="9" y1="21" x2="9" y2="9"/>
                            </svg>
                          </div>
                          <h4>{template.name}</h4>
                          <p>{template.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .puck-editor-container {
          position: relative;
        }

        .puck-floating-toolbar {
          position: fixed;
          top: 0;
          right: 0;
          left: 280px;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 24px;
          background: var(--slate-800, #1e293b);
          border-bottom: 1px solid var(--slate-700, #334155);
          gap: 16px;
        }

        .puck-toolbar-left,
        .puck-toolbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .puck-toolbar-center {
          flex: 1;
          display: flex;
          justify-content: center;
        }

        .puck-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          font-size: 14px;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .puck-btn-primary {
          background: var(--pmcc-gold, #c9a227);
          color: var(--slate-900, #0f172a);
        }

        .puck-btn-primary:hover {
          background: #d4b445;
        }

        .puck-btn-secondary {
          background: var(--slate-700, #334155);
          color: white;
        }

        .puck-btn-secondary:hover {
          background: var(--slate-600, #475569);
        }

        .puck-btn-save {
          background: #22c55e;
          color: white;
        }

        .puck-btn-save:hover {
          background: #16a34a;
        }

        .puck-btn-save:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .puck-btn-large {
          padding: 14px 24px;
          font-size: 16px;
        }

        .puck-message {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
        }

        .puck-message.success {
          background: rgba(34, 197, 94, 0.2);
          color: #4ade80;
        }

        .puck-message.error {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
        }

        .puck-preview-card {
          padding: 48px 32px;
          background: var(--slate-800, #1e293b);
          border: 2px dashed var(--slate-600, #475569);
          border-radius: 16px;
          text-align: center;
          margin: 16px 0;
        }

        .puck-preview-icon {
          margin-bottom: 16px;
        }

        .puck-preview-icon svg {
          stroke: var(--pmcc-gold, #c9a227);
        }

        .puck-preview-card h3 {
          font-size: 20px;
          font-weight: 600;
          color: white;
          margin: 0 0 8px 0;
        }

        .puck-preview-card p {
          font-size: 14px;
          color: var(--slate-400, #94a3b8);
          margin: 0 0 24px 0;
        }

        .puck-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 16px;
          font-size: 13px;
        }

        .puck-status-badge.success {
          color: #4ade80;
        }

        .puck-editor-wrapper {
          margin-top: 60px;
          min-height: calc(100vh - 60px);
        }

        .puck-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 2000;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .puck-modal {
          background: var(--slate-800, #1e293b);
          border: 1px solid var(--slate-700, #334155);
          border-radius: 16px;
          max-width: 900px;
          width: 100%;
          max-height: 80vh;
          overflow: hidden;
        }

        .puck-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--slate-700, #334155);
        }

        .puck-modal-header h2 {
          font-size: 20px;
          font-weight: 600;
          color: white;
          margin: 0;
        }

        .puck-modal-close {
          background: transparent;
          border: none;
          color: var(--slate-400, #94a3b8);
          cursor: pointer;
          padding: 4px;
        }

        .puck-modal-close:hover {
          color: white;
        }

        .puck-modal-body {
          padding: 24px;
          overflow-y: auto;
          max-height: calc(80vh - 80px);
        }

        .puck-template-category {
          margin-bottom: 32px;
        }

        .puck-template-category:last-child {
          margin-bottom: 0;
        }

        .puck-template-category h3 {
          font-size: 12px;
          font-weight: 600;
          color: var(--slate-400, #94a3b8);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 16px 0;
        }

        .puck-template-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        @media (max-width: 768px) {
          .puck-template-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .puck-template-card {
          text-align: left;
          padding: 16px;
          background: var(--slate-700, #334155);
          border: 1px solid var(--slate-600, #475569);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .puck-template-card:hover {
          border-color: var(--pmcc-gold, #c9a227);
          background: rgba(201, 162, 39, 0.1);
        }

        .puck-template-preview {
          width: 100%;
          aspect-ratio: 16/9;
          background: var(--slate-600, #475569);
          border-radius: 8px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .puck-template-preview svg {
          stroke: var(--slate-400, #94a3b8);
        }

        .puck-template-card:hover .puck-template-preview svg {
          stroke: var(--pmcc-gold, #c9a227);
        }

        .puck-template-card h4 {
          font-size: 14px;
          font-weight: 600;
          color: white;
          margin: 0 0 4px 0;
        }

        .puck-template-card p {
          font-size: 12px;
          color: var(--slate-400, #94a3b8);
          margin: 0;
          line-height: 1.4;
        }

        /* Puck Editor Overrides for Dark Theme */
        .puck-editor-wrapper .Puck {
          background: var(--slate-900, #0f172a) !important;
        }

        .puck-editor-wrapper .Puck-header {
          display: none !important;
        }

        .puck-editor-wrapper .Puck-leftSideBar,
        .puck-editor-wrapper .Puck-rightSideBar {
          background: var(--slate-800, #1e293b) !important;
          border-color: var(--slate-700, #334155) !important;
        }

        .puck-editor-wrapper .Puck-frame {
          background: var(--slate-900, #0f172a) !important;
        }

        .puck-editor-wrapper .ComponentList-item {
          background: var(--slate-700, #334155) !important;
          border-color: var(--slate-600, #475569) !important;
          color: white !important;
        }

        .puck-editor-wrapper .ComponentList-item:hover {
          border-color: var(--pmcc-gold, #c9a227) !important;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @media (max-width: 1024px) {
          .puck-floating-toolbar {
            left: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default NewsEventsPuckEditor;
