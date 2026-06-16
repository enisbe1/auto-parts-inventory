"use client";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/" || pathname === "/login";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#09090b]">
      <Sidebar />
      <main className="flex-1 ml-56 min-h-screen overflow-auto">
        {children}
      </main>
    </div>
  );
}
