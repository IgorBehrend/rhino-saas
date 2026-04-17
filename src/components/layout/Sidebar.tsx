'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from '@/lib/actions/auth';
import { LayoutDashboard, Package, Factory, Ship, ShoppingCart, CalendarDays, LogOut, ChevronRight, Menu, X } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard',  label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/machines',   label: 'Equipamentos', icon: Package },
  { href: '/production', label: 'Produção',     icon: Factory },
  { href: '/imports',    label: 'Importações',  icon: Ship },
  { href: '/purchases',  label: 'Compras',      icon: ShoppingCart },
  { href: '/feiras',     label: 'Feiras',       icon: CalendarDays },
];

interface SidebarProps { userName?: string | null; }

export default function Sidebar({ userName }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const NavContent = () => (
    <>
      <div className="flex items-center gap-3 px-5 h-16 shrink-0" style={{ borderBottom: '1px solid #003a1d' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm text-white shrink-0" style={{ backgroundColor: '#008434' }}>R</div>
        <div>
          <p className="font-bold text-sm leading-none text-white">RHINO</p>
          <p className="text-xs mt-0.5" style={{ color: '#ffba00' }}>CNC Machines</p>
        </div>
        <button onClick={() => setOpen(false)} className="ml-auto lg:hidden text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#00562c' }}>Menu</p>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={active ? { backgroundColor: '#008434', color: '#fff' } : { color: '#86efac' }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = '#003a1d'; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3 h-3 opacity-70" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4 pt-3 shrink-0" style={{ borderTop: '1px solid #003a1d' }}>
        <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold" style={{ backgroundColor: '#00562c', color: '#ffba00', border: '1px solid #008434' }}>
            {userName?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate text-white">{userName ?? 'Usuário'}</p>
            <p className="text-xs" style={{ color: '#ffba00' }}>Operador</p>
          </div>
        </div>
        <form action={signOut}>
          <button type="submit" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all" style={{ color: '#86efac' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#003a1d'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}>
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </form>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center px-4 gap-3" style={{ backgroundColor: '#001e0e', borderBottom: '1px solid #003a1d' }}>
        <button onClick={() => setOpen(true)} className="text-white"><Menu className="w-5 h-5" /></button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: '#008434' }}>R</div>
          <span className="text-white font-bold text-sm">RHINO CNC</span>
        </div>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative flex flex-col w-64 h-full" style={{ backgroundColor: '#001e0e' }}>
            <NavContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 flex-col" style={{ width: 'var(--sidebar-width)', backgroundColor: '#001e0e', borderRight: '1px solid #003a1d' }}>
        <NavContent />
      </aside>
    </>
  );
}
