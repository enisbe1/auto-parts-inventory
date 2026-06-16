"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { LANG_NAMES, type Lang } from "@/lib/i18n";

const ICONS = {
  dashboard: (
    <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  ),
  vehicles: (
    <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  ),
  parts: (
    <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
    </svg>
  ),
  categories: (
    <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
  ),
  catalogue: (
    <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  search: (
    <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  ),
  partTemplates: (
    <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
    </svg>
  ),
};

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { lang, setLang, t } = useLanguage();

  const logout = () => {
    localStorage.removeItem("access_token");
    router.push("/login");
  };

  const navLinks = [
    { href: "/dashboard",  label: t.nav.dashboard,  icon: ICONS.dashboard  },
    { href: "/vehicles",   label: t.nav.vehicles,   icon: ICONS.vehicles   },
    { href: "/parts",      label: t.nav.parts,      icon: ICONS.parts      },
    { href: "/categories", label: t.nav.categories, icon: ICONS.categories },
    { href: "/catalogue",  label: t.nav.catalogue,  icon: ICONS.catalogue  },
    { href: "/search",     label: t.nav.search,     icon: ICONS.search     },
  ];

  const settingsLinks = [
    { href: "/part-templates", label: t.nav.partTemplates, icon: ICONS.partTemplates },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 w-56 flex flex-col bg-[#111113] border-r border-[#1f1f23] z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[#1f1f23]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/40">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-100 leading-tight">AutoParts</p>
          <p className="text-[10px] text-zinc-600 leading-tight tracking-wide">Inventory</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest px-2 mb-2">{t.nav.menu}</p>
        <ul className="space-y-0.5">
          {navLinks.map((l) => {
            const active = pathname === l.href || (l.href !== "/dashboard" && pathname.startsWith(l.href + '/'));
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? "bg-blue-600/10 text-blue-400 ring-1 ring-blue-500/20"
                      : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300"
                  }`}
                >
                  <span className={active ? "text-blue-400" : "text-zinc-600"}>{l.icon}</span>
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest px-2 mt-6 mb-2">{t.nav.settings}</p>
        <ul className="space-y-0.5">
          {settingsLinks.map((l) => {
            const active = pathname === l.href;
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? "bg-blue-600/10 text-blue-400 ring-1 ring-blue-500/20"
                      : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300"
                  }`}
                >
                  <span className={active ? "text-blue-400" : "text-zinc-600"}>{l.icon}</span>
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Language picker */}
        <div className="mt-6 px-2">
          <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-2">Language</p>
          <div className="flex gap-1">
            {(["en", "de", "al"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all ${
                  lang === l
                    ? "bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/25"
                    : "text-zinc-600 hover:bg-white/[0.04] hover:text-zinc-400"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Footer / Logout */}
      <div className="px-3 py-4 border-t border-[#1f1f23]">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-600 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          {t.nav.logout}
        </button>
      </div>
    </aside>
  );
}
