"use client";

import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DEFAULT_CONVERT_SHORTCUT, formatShortcut, loadShortcut, saveShortcut, type ShortcutConfig } from "@/hooks/use-shortcut";
import { toast } from "sonner";

export function ShortcutSettings() {
  const [s, setS] = useState<ShortcutConfig>(DEFAULT_CONVERT_SHORTCUT);
  useEffect(() => { setS(loadShortcut()); }, []);

  const modifierCount = [s.ctrl, s.alt, s.shift, s.meta].filter(Boolean).length;
  const isFourKey = modifierCount === 3 && !!s.key;

  return (
    <div className="space-y-4 max-w-md">
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm"><Checkbox checked={!!s.ctrl} onCheckedChange={(v) => setS({ ...s, ctrl: !!v })} /> Ctrl</label>
        <label className="flex items-center gap-2 text-sm"><Checkbox checked={!!s.alt} onCheckedChange={(v) => setS({ ...s, alt: !!v })} /> Alt</label>
        <label className="flex items-center gap-2 text-sm"><Checkbox checked={!!s.shift} onCheckedChange={(v) => setS({ ...s, shift: !!v })} /> Shift</label>
        <label className="flex items-center gap-2 text-sm"><Checkbox checked={!!s.meta} onCheckedChange={(v) => setS({ ...s, meta: !!v })} /> Meta / Cmd</label>
      </div>
      <div className="space-y-2">
        <Label>Key</Label>
        <Input maxLength={1} value={s.key} onChange={(e) => setS({ ...s, key: e.target.value.toLowerCase() })} className="w-24" />
      </div>
      <div className="text-sm">
        Preview: <span className="font-mono">{formatShortcut(s)}</span>
        {!isFourKey && <span className="ml-2 text-destructive">Use exactly 3 modifiers + 1 letter (four keys together).</span>}
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => {
            if (!isFourKey) { toast.error("Shortcut must use 3 modifiers + 1 key."); return; }
            saveShortcut(s);
            toast.success("Shortcut saved.");
          }}
        >Save</Button>
        <Button variant="outline" onClick={() => { saveShortcut(DEFAULT_CONVERT_SHORTCUT); setS(DEFAULT_CONVERT_SHORTCUT); toast("Reset to default"); }}>
          Reset to default
        </Button>
      </div>
    </div>
  );
}
