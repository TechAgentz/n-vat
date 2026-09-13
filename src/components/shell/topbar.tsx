import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

export async function Topbar() {
  const session = await auth();
  const user = session?.user;
  return (
    <header className="h-14 flex items-center justify-between border-b bg-card px-4 sticky top-0 z-10">
      <div className="text-sm text-muted-foreground">
        {user ? `Signed in as ${user.name} (${(user as any).role})` : "Not signed in"}
      </div>
      <div className="flex items-center gap-2">
        <div className="text-xs text-muted-foreground hidden sm:block">
          Shortcut: <span className="font-mono">Ctrl + Alt + Shift + N</span>
        </div>
        {user && (
          <>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              {user.email}
            </div>
            <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
              <Button size="sm" variant="outline" type="submit"><LogOut className="h-4 w-4" /> Sign out</Button>
            </form>
          </>
        )}
      </div>
    </header>
  );
}
