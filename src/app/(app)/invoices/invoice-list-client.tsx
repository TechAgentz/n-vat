"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { ConversionDialog } from "./conversion-dialog";
import { useShortcut, loadShortcut, formatShortcut } from "@/hooks/use-shortcut";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, RefreshCcw, Filter } from "lucide-react";

type Row = {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  customer: string;
  totalAmount: number;
  vatAmount: number;
  status: string;
  type: string;
  createdBy: string;
  updatedAt: string;
};

type Filters = {
  q?: string; customer?: string; type: "VAT" | "N_VAT" | "ALL";
  status: "PENDING" | "ISSUED" | "CONVERTED" | "CANCELLED" | "ALL";
  from?: string; to?: string; sort: string; page: number; pageSize: number;
};

const statusVariant = (s: string) =>
  s === "ISSUED" ? "info" : s === "CONVERTED" ? "warning" : s === "CANCELLED" ? "destructive" : "secondary";

export function InvoiceListClient({
  initialItems, total, page, pageSize, filters, canConvert,
}: {
  initialItems: Row[]; total: number; page: number; pageSize: number; filters: Filters; canConvert: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);

  const shortcut = useMemo(() => (typeof window !== "undefined" ? loadShortcut() : { ctrl: true, alt: true, shift: true, key: "n" }), []);
  const shortcutLabel = formatShortcut(shortcut);

  const eligibleIds = useMemo(
    () => new Set(initialItems.filter((r) => r.type === "VAT" && r.status === "ISSUED").map((r) => r.id)),
    [initialItems]
  );

  const selectedRows = initialItems.filter((r) => selected.has(r.id));
  const anySelected = selectedRows.length > 0;
  const allEligibleSelectedIneligible = selectedRows.some((r) => !eligibleIds.has(r.id));

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleAllEligible = useCallback(() => {
    const eligibleOnPage = initialItems.filter((r) => eligibleIds.has(r.id));
    if (eligibleOnPage.every((r) => selected.has(r.id))) {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const r of eligibleOnPage) next.delete(r.id);
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const r of eligibleOnPage) next.add(r.id);
        return next;
      });
    }
  }, [initialItems, eligibleIds, selected]);

  const openDialog = useCallback(() => {
    if (!canConvert) { toast.error("You do not have permission to convert invoices."); return; }
    if (selectedRows.length === 0) { toast.error("No invoice selected."); return; }
    if (allEligibleSelectedIneligible) { toast.error("Only eligible VAT invoices can be converted."); return; }
    setDialogOpen(true);
  }, [canConvert, selectedRows.length, allEligibleSelectedIneligible]);

  useShortcut(shortcut, openDialog, { enabled: true });

  const setParam = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === "") params.delete(k); else params.set(k, v);
    }
    if (!("page" in patch)) params.delete("page");
    router.push(`/invoices?${params.toString()}`);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            Select eligible VAT invoices and convert to N-VAT / Damage. Shortcut:{" "}
            <span className="font-mono">{shortcutLabel}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.refresh()}><RefreshCcw className="h-4 w-4" /> Refresh</Button>
          <Button onClick={openDialog} disabled={!canConvert || !anySelected}>
            Convert to N-VAT / Damage
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Filter className="h-4 w-4" /> Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid grid-cols-1 gap-3 md:grid-cols-6"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              setParam({
                q: String(fd.get("q") || ""),
                customer: String(fd.get("customer") || ""),
                from: String(fd.get("from") || ""),
                to: String(fd.get("to") || ""),
              });
            }}
          >
            <Input name="q" placeholder="Invoice #" defaultValue={filters.q ?? ""} />
            <Input name="customer" placeholder="Customer" defaultValue={filters.customer ?? ""} />
            <Input name="from" type="date" defaultValue={filters.from ?? ""} />
            <Input name="to" type="date" defaultValue={filters.to ?? ""} />
            <Select defaultValue={filters.type} onValueChange={(v) => setParam({ type: v })}>
              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All types</SelectItem>
                <SelectItem value="VAT">VAT</SelectItem>
                <SelectItem value="N_VAT">N-VAT</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue={filters.status} onValueChange={(v) => setParam({ status: v })}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="ISSUED">Issued</SelectItem>
                <SelectItem value="CONVERTED">Converted</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
              </SelectContent>
            </Select>
            <div className="md:col-span-6 flex justify-end gap-2">
              <Select defaultValue={filters.sort} onValueChange={(v) => setParam({ sort: v })}>
                <SelectTrigger className="w-56"><SelectValue placeholder="Sort" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_desc">Date (newest)</SelectItem>
                  <SelectItem value="date_asc">Date (oldest)</SelectItem>
                  <SelectItem value="number_desc">Invoice # (desc)</SelectItem>
                  <SelectItem value="number_asc">Invoice # (asc)</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit">Apply</Button>
              <Button type="button" variant="ghost" onClick={() => router.push("/invoices")}>Clear</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={
                      initialItems.filter((r) => eligibleIds.has(r.id)).length > 0 &&
                      initialItems.filter((r) => eligibleIds.has(r.id)).every((r) => selected.has(r.id))
                    }
                    onCheckedChange={toggleAllEligible}
                    aria-label="Select all eligible"
                  />
                </TableHead>
                <TableHead>Number</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">VAT</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created by</TableHead>
                <TableHead>Modified</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialItems.length === 0 && (
                <TableRow><TableCell colSpan={10} className="text-center py-10 text-muted-foreground">No invoices match your filters.</TableCell></TableRow>
              )}
              {initialItems.map((r) => {
                const eligible = eligibleIds.has(r.id);
                return (
                  <TableRow key={r.id} data-state={selected.has(r.id) ? "selected" : undefined}>
                    <TableCell>
                      <Checkbox
                        disabled={!eligible}
                        checked={selected.has(r.id)}
                        onCheckedChange={() => toggle(r.id)}
                        aria-label={`Select ${r.invoiceNumber}`}
                      />
                    </TableCell>
                    <TableCell className="font-mono"><Link className="underline" href={`/invoices/${r.id}`}>{r.invoiceNumber}</Link></TableCell>
                    <TableCell>{formatDate(r.invoiceDate)}</TableCell>
                    <TableCell>{r.customer}</TableCell>
                    <TableCell className="text-right">{formatCurrency(r.totalAmount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(r.vatAmount)}</TableCell>
                    <TableCell><Badge variant={r.type === "VAT" ? "default" : "warning"}>{r.type === "N_VAT" ? "N-VAT" : r.type}</Badge></TableCell>
                    <TableCell><Badge variant={statusVariant(r.status) as any}>{r.status}</Badge></TableCell>
                    <TableCell>{r.createdBy}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDateTime(r.updatedAt)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm">
        <div>
          {total} invoice(s). {selectedRows.length} selected.
          {allEligibleSelectedIneligible && (
            <span className="ml-2 text-destructive">Selection includes ineligible invoices — they will be ignored.</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setParam({ page: String(page - 1) })}><ChevronLeft className="h-4 w-4" /></Button>
          <span>Page {page} / {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setParam({ page: String(page + 1) })}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <ConversionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selected={selectedRows.filter((r) => eligibleIds.has(r.id)).map((r) => ({ id: r.id, invoiceNumber: r.invoiceNumber }))}
        onDone={() => setSelected(new Set())}
      />
    </div>
  );
}
