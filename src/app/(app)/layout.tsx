import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f3f2f1] text-neutral-900">
      <Topbar />
      <Sidebar />
      <main className="md:pl-64 pt-2">
        <div className="mx-3 md:mx-4 my-3 p-4 md:p-6 rounded-md bg-white shadow-sm ring-1 ring-black/5">
          {children}
        </div>
      </main>
    </div>
  );
}
