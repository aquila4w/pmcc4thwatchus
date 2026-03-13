"use client";

import { useEffect, useState } from "react";

export default function EventInviteLinkField({ data }: { data: { inviteCode?: string; id?: string } }) {
  const [inviteUrl, setInviteUrl] = useState<string>("");

  useEffect(() => {
    if (data?.inviteCode) {
      const baseUrl = window.location.origin;
      setInviteUrl(`${baseUrl}/event-invite/${data.inviteCode}`);
    }
  }, [data?.inviteCode]);

  const handleCopy = async () => {
    if (inviteUrl) {
      await navigator.clipboard.writeText(inviteUrl);
      alert("Invite link copied to clipboard!");
    }
  };

  if (!inviteUrl) {
    return <div className="text-slate-400 text-sm">No invite code yet</div>;
  }

  return (
    <div className="flex items-center gap-2">
      <code className="bg-slate-100 px-2 py-1 rounded text-xs text-slate-600 truncate max-w-[200px]">
        {inviteUrl}
      </code>
      <button
        type="button"
        onClick={handleCopy}
        className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
      >
        Copy Link
      </button>
    </div>
  );
}
