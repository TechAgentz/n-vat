import { auth, signOut } from "@/lib/auth";
import { Grip, Lightbulb, Plus, Filter, Bell, Settings, HelpCircle, Search, LogOut } from "lucide-react";

export async function Topbar() {
  const session = await auth();
  const user = session?.user;
  const initials =
    (user?.name ?? user?.email ?? "?")
      .split(/\s+/)
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <header className="h-12 bg-[#0b1220] text-white flex items-stretch sticky top-0 z-30 select-none">
      {/* App launcher + brand */}
      <button className="w-12 grid place-items-center hover:bg-white/10" aria-label="App launcher">
        <Grip className="h-5 w-5" />
      </button>
      <div className="flex items-center gap-3 pr-4">
        <span className="italic text-2xl font-serif tracking-tight" style={{ fontFamily: '"Brush Script MT", "Segoe Script", cursive' }}>
          D Marin
        </span>
        <span className="h-6 w-px bg-white/25" />
        <span className="text-sm">N-VAT</span>
      </div>

      {/* Search */}
      <div className="flex-1 flex items-center px-4">
        <div className="max-w-2xl w-full flex items-center h-8 rounded bg-white/95 text-black px-3 gap-2 shadow-inner">
          <Search className="h-4 w-4 text-neutral-500" />
          <input
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-neutral-500"
            placeholder="Search"
          />
        </div>
      </div>

      {/* SANDBOX label */}
      <div className="hidden md:flex items-center px-4 tracking-[0.25em] text-xl font-semibold">
        SANDBOX
      </div>

      {/* Right icons */}
      <div className="flex items-center">
        <IconBtn label="Copilot suggestions"><Lightbulb className="h-5 w-5" /></IconBtn>
        <IconBtn label="Create"><Plus className="h-5 w-5" /></IconBtn>
        <IconBtn label="Filter"><Filter className="h-5 w-5" /></IconBtn>
        <IconBtn label="Notifications"><Bell className="h-5 w-5" /></IconBtn>
        <IconBtn label="Settings"><Settings className="h-5 w-5" /></IconBtn>
        <IconBtn label="Help"><HelpCircle className="h-5 w-5" /></IconBtn>

        {/* Copilot pill */}
        <button className="mx-2 h-8 px-3 rounded-full text-sm flex items-center gap-2 bg-gradient-to-r from-sky-400 to-fuchsia-400 text-black font-medium hover:brightness-110">
          <span className="h-4 w-4 rounded-full bg-white/70" />
          Copilot
        </button>

        {/* Avatar */}
        <div className="pr-3">
          <div
            title={user?.email ?? ""}
            className="h-8 w-8 rounded-full grid place-items-center bg-sky-600 text-white text-xs font-semibold ring-2 ring-white/20"
          >
            {initials}
          </div>
        </div>

        {user && (
          <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
            <button title="Sign out" className="h-12 px-3 hover:bg-white/10 text-white/70">
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>
    </header>
  );
}

function IconBtn({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <button aria-label={label} title={label} className="h-12 w-10 grid place-items-center hover:bg-white/10 text-white/85">
      {children}
    </button>
  );
}
