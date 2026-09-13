"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { convertInvoicesToNvat } from "@/server/invoices";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Selected = { id: string; invoiceNumber: string };

export function ConversionDialog({
  open, onOpenChange, selected, onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selected: Selected[];
  onDone: () => void;
}) {
  const [remark, setRemark] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();

  const trimmed = remark.trim();
  const valid = trimmed.length >= 5 && trimmed.length <= 500;

  function reset() { setRemark(""); }

  async function submit() {
    if (!valid) return;
    start(async () => {
      const res = await convertInvoicesToNvat({
        invoiceIds: selected.map((s) => s.id),
        remark: trimmed,
        conversionType: "DAMAGE",
      });
      if (res.converted.length && !res.failed.length) {
        toast.success(`Converted ${res.converted.length} invoice(s).`);
      } else if (res.converted.length && res.failed.length) {
        toast.warning(`Converted ${res.converted.length}, failed ${res.failed.length}: ${res.failed.map(f => f.reason).join("; ")}`);
      } else {
        toast.error(`Conversion failed: ${res.failed.map(f => f.reason).join("; ")}`);
      }
      reset();
      onOpenChange(false);
      onDone();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!pending) { onOpenChange(v); if (!v) reset(); } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Convert VAT Invoice to N-VAT / Damage</DialogTitle>
          <DialogDescription>
            This action is irreversible for the selected invoices. The original invoices will be preserved and marked CONVERTED; a linked N-VAT / Damage adjustment will be recorded.
          </DialogDescription>
        </DialogHeader>

        <div>
          <Label>Selected invoices ({selected.length})</Label>
          <ul className="mt-2 max-h-40 overflow-y-auto rounded-md border p-2 text-sm space-y-1">
            {selected.map((s) => (<li key={s.id} className="font-mono">- {s.invoiceNumber}</li>))}
          </ul>
        </div>

        <div className="space-y-2">
          <Label htmlFor="remark">Remark <span className="text-destructive">*</span></Label>
          <Textarea
            id="remark"
            placeholder="e.g. 2 units damaged after VAT invoice"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            maxLength={500}
            autoFocus
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Required. 5–500 characters. Explain why this conversion is being made.</span>
            <span>{trimmed.length}/500</span>
          </div>
          {!valid && remark.length > 0 && (
            <p className="text-xs text-destructive">
              {trimmed.length < 5 ? "Remark must be at least 5 characters." : "Remark must not exceed 500 characters."}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { if (!pending) { onOpenChange(false); reset(); } }} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!valid || pending || selected.length === 0}>
            {pending ? "Converting…" : "Convert"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
