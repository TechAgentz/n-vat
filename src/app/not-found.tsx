import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold">404</h1>
        <p className="text-muted-foreground">Page not found.</p>
        <Link href="/dashboard" className="underline">Go to dashboard</Link>
      </div>
    </div>
  );
}
