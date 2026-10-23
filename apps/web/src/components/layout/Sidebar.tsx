import { House, ShieldCheck } from 'lucide-react';
import { NavLink } from 'react-router';

type SidebarProps = { hidden: boolean; onNavigate: () => void };

export function Sidebar({ hidden, onNavigate }: SidebarProps) {
  return (
    <aside className="border-b border-shell-border bg-white lg:min-h-screen lg:border-r lg:border-b-0">
      <div className="hidden items-center gap-3 px-7 py-8 lg:flex">
        <ShieldCheck className="size-8 text-shell-accent" aria-hidden="true" />
        <div>
          <p className="font-semibold tracking-tight">LGPD</p>
          <p className="text-xs text-shell-muted">Mapeamento de dados</p>
        </div>
      </div>
      <nav
        id="primary-navigation"
        aria-label="Navegação principal"
        hidden={hidden}
        className="p-4 lg:px-4 lg:py-2"
      >
        <NavLink
          to="/"
          end
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-shell px-4 py-3 text-sm font-medium ${isActive ? 'bg-indigo-50 text-shell-accent' : 'text-shell-muted hover:bg-slate-100'}`
          }
        >
          <House className="size-5" aria-hidden="true" />
          Início
        </NavLink>
      </nav>
    </aside>
  );
}
