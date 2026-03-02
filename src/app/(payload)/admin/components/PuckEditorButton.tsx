"use client";

import { useDocumentInfo, useField } from "@payloadcms/ui";
import { useCallback, useState } from "react";

export const PuckEditorButton = () => {
  const { id, collectionSlug } = useDocumentInfo();
  const { value: puckData } = useField({ path: "puckData" });
  const [isHovered, setIsHovered] = useState(false);

  const handleOpenEditor = useCallback(() => {
    if (!id) {
      alert("Please save the document first before opening the visual editor. This ensures your changes are stored in the database.");
      return;
    }

    // Open the Puck editor in a new tab with the collection and document ID
    const editorUrl = `/puck-editor/${collectionSlug}/${id}`;
    window.open(editorUrl, "_blank");
  }, [id, collectionSlug]);

  const hasContent: boolean = Boolean(
    puckData &&
    typeof puckData === "object" &&
    Array.isArray((puckData as { content?: unknown[] }).content) &&
    (puckData as { content: unknown[] }).content.length > 0
  );

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{
        padding: "2rem",
        backgroundColor: "#1e293b",
        border: "2px dashed #334155",
        borderRadius: "12px",
        textAlign: "center",
      }}>
        <div style={{ marginBottom: "1rem" }}>
          <svg
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#c9a227"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ margin: "0 auto", display: "block" }}
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
        </div>

        <h3 style={{
          fontSize: "1.25rem",
          fontWeight: "600",
          color: "#ffffff",
          margin: "0 0 0.5rem 0",
        }}>
          Visual Page Builder
        </h3>

        <p style={{
          fontSize: "0.875rem",
          color: "#94a3b8",
          margin: "0 0 1.5rem 0",
          maxWidth: "400px",
          marginLeft: "auto",
          marginRight: "auto",
        }}>
          {hasContent
            ? "Your page has visual content. Click below to edit in the drag-and-drop editor."
            : "Create beautiful, responsive pages with our intuitive drag-and-drop editor. Changes are automatically saved to the database."}
        </p>

        <button
          type="button"
          onClick={handleOpenEditor}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.875rem 2rem",
            backgroundColor: isHovered ? "#d4b445" : "#c9a227",
            color: "#0f172a",
            fontWeight: "600",
            fontSize: "0.9375rem",
            border: "none",
            borderRadius: "9999px",
            cursor: id ? "pointer" : "not-allowed",
            transition: "all 0.2s ease",
            transform: isHovered ? "translateY(-2px)" : "translateY(0)",
            boxShadow: isHovered ? "0 4px 12px rgba(201, 162, 39, 0.4)" : "none",
            opacity: id ? 1 : 0.7,
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          {id ? "Open Visual Editor" : "Save First to Enable Editor"}
        </button>

        {!id && (
          <p style={{
            fontSize: "0.75rem",
            color: "#f97316",
            marginTop: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.375rem",
          }}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Save this document first to enable the visual editor
          </p>
        )}

        {hasContent && (
          <p style={{
            fontSize: "0.8125rem",
            color: "#4ade80",
            marginTop: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.375rem",
          }}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Visual content configured and saved to database
          </p>
        )}

        {/* Info about database sync */}
        <div style={{
          marginTop: "1.5rem",
          padding: "0.75rem 1rem",
          backgroundColor: "#0f172a",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
        }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#60a5fa"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          </svg>
          <span style={{ fontSize: "0.75rem", color: "#60a5fa" }}>
            All changes sync automatically to the database
          </span>
        </div>
      </div>
    </div>
  );
};

export default PuckEditorButton;
