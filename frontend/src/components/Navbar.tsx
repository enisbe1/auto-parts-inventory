"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/dashboard",  label: "Dashboard" },
  { href: "/vehicles",   label: "Vehicles" },
  { href: "/parts",      label: "Parts" },
  { href: "/categories", label: "Categories" },
  { href: "/catalogue",  label: "Catalogue" },
  { href: "/search",     label: "Search" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();

  const logout = () => {
    localStorage.removeItem("access_token");
    router.push("/login");
  };

  return (
    <nav className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-1">
        <span className="text-blue-400 font-bold text-lg mr-4">AutoParts</span>
        {links.map(l => (
          <Link key={l.href} href={l.href}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              pathname.startsWith(l.href)
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }`}>
            {l.label}
          </Link>
        ))}
      </div>
      <button onClick={logout} className="text-gray-400 hover:text-white text-sm">
        Log out
      </button>
    </nav>
  );
}
