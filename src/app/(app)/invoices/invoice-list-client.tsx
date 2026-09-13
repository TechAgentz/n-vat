"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { ConversionDialog } from "./conversion-dialog";
import { useShortcut, loadShortcut, formatShortcut } from "@/hooks/use-shortcut";
import { toast } from "sonner";
import {
  ArrowLeft, ChevronDown, LayoutGrid, PieChart, Plus, RefreshCcw, Trash2, Sparkles,
  Mail, MoreHorizontal, Share2, Columns3, Filter, Search, ChevronLeft, ChevronRight, ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [q, setQ] = useState(filters.q ?? "");

  const shortcut = useMemo(
    () => (typeof window !== "undefined" ? loadShortcut() : { ctrl: true, alt: true, shift: true, key: "n" }),
    []
  );
  const shortcutLabel = formatShortcut(shortcut);

  const eligibleIds = useMemo(
    () => new Set(initialItems.filter((r) => r.type === "VAT" && r.status === "ISSUED").map((r) => r.id)),
    [initialItems]
  );

  const selectedRows = initialItems.filter((r) => selected.has(r.id));
  const anySelected = selectedRows.length > 0;
  const hasIneligible = selectedRows.some((r) => !eligibleIds.has(r.id));

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAllEligible = useCallback(() => {
    const eligibleOnPage = initialItems.filter((r) => eligibleIds.has(r.id));
    const allSelected = eligibleOnPage.every((r) => selected.has(r.id));
    setSelected((prev) => {
      const next = new Set(prev);
      for (const r of eligibleOnPage) allSelected ? next.delete(r.id) : next.add(r.id);
      return next;
    });
  }, [initialItems, eligibleIds, selected]);

  const openDialog = useCallback(() => {
    if (!canConvert) { toast.error("You do not have permission to convert invoices."); return; }
    if (selectedRows.length === 0) { toast.error("No invoice selected."); return; }
    if (hasIneligible) { toast.error("Only eligible VAT invoices can be converted."); return; }
    setDialogOpen(true);
  }, [canConvert, selectedRows.length, hasIneligible]);

  useShortcut(shortcut, openDialog, { enabled: true });

  const setParam = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === "") params.delete(k);
      else params.set(k, v);
    }
    if (!("page" in patch)) params.delete("page");
    router.push(`/invoices?${params.toString()}`);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const allEligibleChecked =
    initialItems.filter((r) => eligibleIds.has(r.id)).length > 0 &&
    initialItems.filter((r) => eligibleIds.has(r.id)).every((r) => selected.has(r.id));

  return (
    <div className="-m-4 md:-m-6">
      {/* Command bar */}
      <div className="flex flex-wrap items-center gap-1 border-b px-3 h-12">
        <IconAction icon={ArrowLeft} label="Back" onClick={() => router.back()} />
        <CmdBtn icon={LayoutGrid} label="Show As" trailing />
        <CmdBtn icon={PieChart} label="Show Chart" />
        <CmdBtn icon={Plus} label="New" primary />
        <CmdBtn icon={RefreshCcw} label="Refresh" onClick={() => router.refresh()} />
        <CmdBtn icon={Trash2} label="Delete" />
        <CmdBtn icon={Sparkles} label="Visualize this view" />
        <CmdBtn icon={Mail} label="Email a Link" trailing />
        <CmdBtn
          icon={RefreshCcw}
          label={`Convert (${shortcutLabel})`}
          onClick={openDialog}
          disabled={!canConvert || !anySelected}
          highlight
        />
        <CmdBtn icon={MoreHorizontal} label="" />
        <div className="ml-auto">
          <button className="h-8 px-3 rounded border text-sm flex items-center gap-2 hover:bg-neutral-50">
            <Share2 className="h-4 w-4" /> Share
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* View title + filter chips */}
      <div className="flex flex-wrap items-center gap-4 px-4 pt-4">
        <button className="flex items-center gap-2 text-2xl font-semibold text-neutral-800">
          My Open Invoices
          <ChevronDown className="h-5 w-5 text-neutral-500" />
        </button>
        <div className="ml-auto flex items-center gap-4">
          <button className="text-sm text-sky-700 hover:underline flex items-center gap-1">
            <Columns3 className="h-4 w-4" /> Edit columns
          </button>
          <button className="text-sm text-sky-700 hover:underline flex items-center gap-1">
            <Filter className="h-4 w-4" /> Edit filters
          </button>
          <form
            onSubmit={(e) => { e.preventDefault(); setParam({ q }); }}
            className="h-8 w-64 flex items-center gap-2 border rounded px-2 bg-white"
          >
            <Search className="h-4 w-4 text-neutral-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter by keyword"
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </form>
        </div>
      </div>

      {/* Table */}
      <div className="mt-3 border-t">
        <table className="w-full text-sm">
          <thead className="bg-white">
            <tr className="text-left border-b">
              <th className="w-10 px-3 py-2">
                <Checkbox
                  checked={allEligibleChecked}
                  onCheckedChange={toggleAllEligible}
                  aria-label="Select all eligible"
                />
              </th>
              <ColHeader label="Invoice #" />
              <ColHeader label="Customer" />
              <ColHeader label="Date" />
              <ColHeader label="Total" alignRight />
              <ColHeader label="VAT" alignRight />
              <ColHeader label="Type" />
              <ColHeader label="Status" />
              <ColHeader label="Created By" />
              <ColHeader label="Modified" sortDesc />
            </tr>
          </thead>
          <tbody>
            {initialItems.length === 0 && (
              <tr>
                <td colSpan={10}>
                  <EmptyState />
                </td>
              </tr>
            )}
            {initialItems.map((r) => {
              const eligible = eligibleIds.has(r.id);
              const checked = selected.has(r.id);
              return (
                <tr
                  key={r.id}
                  className={cn(
                    "border-b hover:bg-sky-50/50 transition-colors",
                    checked && "bg-sky-50"
                  )}
                >
                  <td className="px-3 py-2 align-middle">
                    <Checkbox
                      disabled={!eligible}
                      checked={checked}
                      onCheckedChange={() => toggle(r.id)}
                      aria-label={`Select ${r.invoiceNumber}`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Link className="text-sky-700 hover:underline font-medium" href={`/invoices/${r.id}`}>
                      {r.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{r.customer}</td>
                  <td className="px-3 py-2">{formatDate(r.invoiceDate)}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(r.totalAmount)}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(r.vatAmount)}</td>
                  <td className="px-3 py-2">
                    <Badge variant={r.type === "VAT" ? "info" : "warning"}>
                      {r.type === "N_VAT" ? "N-VAT" : r.type}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant={statusVariant(r.status) as any}>{r.status}</Badge>
                  </td>
                  <td className="px-3 py-2">{r.createdBy}</td>
                  <td className="px-3 py-2 text-neutral-500">{formatDateTime(r.updatedAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer / pagination */}
      <div className="flex items-center justify-between px-4 py-3 text-xs text-neutral-600">
        <div>
          Rows: {total}. {selectedRows.length} selected.
          {hasIneligible && (
            <span className="ml-2 text-red-600">Selection includes ineligible invoices — they will be ignored.</span>
          )}
          <span className="ml-4 text-neutral-400">Shortcut: {shortcutLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setParam({ page: String(page - 1) })}
            className="h-7 w-7 grid place-items-center border rounded disabled:opacity-40 hover:bg-neutral-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span>
            Page {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setParam({ page: String(page + 1) })}
            className="h-7 w-7 grid place-items-center border rounded disabled:opacity-40 hover:bg-neutral-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <ConversionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selected={selectedRows
          .filter((r) => eligibleIds.has(r.id))
          .map((r) => ({ id: r.id, invoiceNumber: r.invoiceNumber }))}
        onDone={() => setSelected(new Set())}
      />
    </div>
  );
}

function CmdBtn({
  icon: Icon, label, primary, highlight, trailing, disabled, onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  primary?: boolean;
  highlight?: boolean;
  trailing?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-8 px-2 flex items-center gap-1 text-sm rounded hover:bg-neutral-100 disabled:opacity-50 disabled:hover:bg-transparent",
        primary && "text-sky-700",
        highlight && "text-sky-700 border border-sky-200 bg-sky-50 hover:bg-sky-100"
      )}
    >
      <Icon className="h-4 w-4" />
      {label && <span className="whitespace-nowrap">{label}</span>}
      {trailing && <ChevronDown className="h-3 w-3 opacity-60" />}
    </button>
  );
}

function IconAction({
  icon: Icon, label, onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="h-8 w-8 grid place-items-center rounded hover:bg-neutral-100"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function ColHeader({
  label, alignRight, sortDesc,
}: { label: string; alignRight?: boolean; sortDesc?: boolean }) {
  return (
    <th
      className={cn(
        "px-3 py-2 text-neutral-600 font-medium",
        alignRight && "text-right"
      )}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortDesc && <ArrowDown className="h-3 w-3 text-sky-700" />}
        <ChevronDown className="h-3 w-3 text-neutral-400" />
      </span>
    </th>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-neutral-500">
      <div className="h-40 w-40 rounded-full bg-neutral-200 grid place-items-center relative">
        <div className="grid grid-cols-3 gap-1.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-6 w-6 rounded bg-white/80" />
          ))}
        </div>
        <Sparkles className="absolute right-3 top-3 h-5 w-5 text-neutral-400" />
      </div>
      <div className="mt-4 text-sm">We didn&apos;t find anything to show here</div>
    </div>
  );
}
