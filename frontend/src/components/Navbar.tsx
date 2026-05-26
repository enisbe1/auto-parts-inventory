'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar() {
  const path = usePathname();
  const router = useRouter();
  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/vehicles', label: 'Vehicles' },
    { href: '/parts', label: 'Parts' },
    { href: '/search', label: 'Search' },
  ];
  const logout = () => { localStorage.removeItem('token'); router.push('/login'); };
  return (
    <nav className="bg-blue-700 text-white px-6 py-3 flex items-center justify-between shadow">
      <span className="font-bold text-lg tracking-wide">🔧 AutoParts</span>
      <div className="flex gap-6 items-center">
        {links.map(l => (
          <Link key={l.href} href={l.href} className={`hover:text-blue-200 transition ${path.startsWith(l.href) ? 'font-bold underline' : ''}`}>{l.label}</Link>
        ))}
        <button onClick={logout} className="bg-white text-blue-700 px-3 py-1 rounded text-sm font-semibold hover:bg-blue-100 transition">Logout</button>
      </div>
    </nav>
  );
}
