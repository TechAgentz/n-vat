"use client";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  const msg =
    error.message === "FORBIDDEN" ? "You do not have permission to view this page." :
    error.message === "UNAUTHENTICATED" ? "Please sign in." :
    error.message === "NOT_FOUND" ? "Record not found." :
    "Something went wrong.";
  return (
    <div className="p-8 space-y-4">
      <h2 className="text-xl font-bold">{msg}</h2>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
