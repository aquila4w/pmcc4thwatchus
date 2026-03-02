"use client";

import React, { useState } from "react";
import { useFormFields } from "@payloadcms/ui";

export const InviteLinkField: React.FC = () => {
  const [copied, setCopied] = useState(false);

  // Get the inviteCode field value
  const inviteCode = useFormFields(([fields]) => fields.inviteCode?.value as string);

  if (!inviteCode) {
    return (
      <div className="field-type" style={{ marginBottom: '1rem' }}>
        <label className="field-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
          Invite Link
        </label>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>
          Save this user to generate their invite link.
        </p>
      </div>
    );
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const inviteLink = `${baseUrl}/invite/${inviteCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="field-type" style={{ marginBottom: '1rem' }}>
      <label className="field-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
        Invite Link
      </label>
      <div style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #e5e7eb'
      }}>
        <code style={{
          flex: 1,
          fontSize: '12px',
          wordBreak: 'break-all',
          color: '#1e3a5f'
        }}>
          {inviteLink}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          style={{
            padding: '6px 12px',
            backgroundColor: copied ? '#10b981' : '#1e3a5f',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            transition: 'background-color 0.2s'
          }}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '6px' }}>
        Share this link with guests to invite them to events.
      </p>
    </div>
  );
};

export default InviteLinkField;
