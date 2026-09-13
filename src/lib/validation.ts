import { z } from "zod";

export const remarkSchema = z
  .string()
  .transform((v) => v.trim())
  .refine((v) => v.length >= 5, "Remark must be at least 5 characters")
  .refine((v) => v.length <= 500, "Remark must not exceed 500 characters");

export const convertInvoicesSchema = z.object({
  invoiceIds: z.array(z.string().min(1)).min(1, "No invoice selected."),
  remark: remarkSchema,
  conversionType: z.enum(["DAMAGE", "N_VAT_ADJUSTMENT"]).default("DAMAGE"),
  // Optional per-line damaged quantities keyed by invoiceItemId. Absent => full quantity.
  itemQuantities: z.record(z.string(), z.number().nonnegative()).optional(),
});

export const invoiceFiltersSchema = z.object({
  q: z.string().optional(),
  customer: z.string().optional(),
  type: z.enum(["VAT", "N_VAT", "ALL"]).default("ALL"),
  status: z.enum(["PENDING", "ISSUED", "CONVERTED", "CANCELLED", "ALL"]).default("ALL"),
  from: z.string().optional(),
  to: z.string().optional(),
  sort: z.enum(["date_desc", "date_asc", "number_asc", "number_desc"]).default("date_desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(10).max(200).default(25),
});

export const createInvoiceSchema = z.object({
  customerId: z.string().min(1),
  invoiceDate: z.string(),
  notes: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().positive(),
        unitPrice: z.number().nonnegative(),
        vatRate: z.number().nonnegative(),
      })
    )
    .min(1, "At least one line required"),
});
