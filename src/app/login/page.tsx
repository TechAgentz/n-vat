import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in to N-VAT</CardTitle>
          <CardDescription>VAT / N-VAT / Damage invoice management</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={null}><LoginForm /></Suspense>
          <div className="mt-6 text-xs text-muted-foreground space-y-1">
            <div className="font-semibold">Demo accounts (from seed):</div>
            <div>admin@nvat.local / Admin@12345</div>
            <div>manager@nvat.local / Manager@12345</div>
            <div>user@nvat.local / User@12345</div>
            <div>auditor@nvat.local / Auditor@12345</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
