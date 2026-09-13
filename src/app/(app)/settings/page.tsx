import { ShortcutSettings } from "./shortcut-settings";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Keyboard shortcut</CardTitle>
          <CardDescription>Four-key combination to open the VAT → N-VAT / Damage conversion modal. Stored per browser.</CardDescription>
        </CardHeader>
        <CardContent><ShortcutSettings /></CardContent>
      </Card>
    </div>
  );
}
