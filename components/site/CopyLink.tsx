"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "@/components/ui/toast";

/**
 * A small pill that copies a link to the clipboard and says so with the RareUI toast.
 * If the browser refuses (no clipboard access, or an insecure page) the toast says that, in plain words.
 */
export default function CopyLink({ url, name }: { url: string; name: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    toast.dismiss();
    try {
      if (!navigator.clipboard) throw new Error("no clipboard");
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      toast("Link copied", { description: url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""), duration: 3500 });
    } catch {
      toast("Could not copy the link", { description: "Your browser blocked it. Select the link and copy it by hand.", duration: 6000 });
    }
  }

  return (
    <button type="button" className="btn btn--quiet btn--sm copy-link" onClick={copy} aria-label={`Copy link: ${name}`}>
      {copied ? <Check aria-hidden="true" size={16} /> : <Copy aria-hidden="true" size={16} />}
      <span aria-hidden="true">Copy link</span>
    </button>
  );
}
