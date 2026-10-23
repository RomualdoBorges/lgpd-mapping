import { Menu, X } from 'lucide-react';

type HeaderProps = {
  title: string;
  desktop: boolean;
  navigationOpen: boolean;
  onToggleNavigation: () => void;
};

export function Header({
  title,
  desktop,
  navigationOpen,
  onToggleNavigation,
}: HeaderProps) {
  return (
    <header className="flex min-h-20 items-center justify-between gap-4 border-b border-shell-border bg-white px-5 sm:px-8 lg:px-10">
      <div className="min-w-0">
        <p className="text-xs font-semibold tracking-widest text-shell-muted lg:hidden">
          LGPD · MAPEAMENTO DE DADOS
        </p>
        <p className="mt-1 text-sm font-medium text-shell-text">{title}</p>
      </div>
      <button
        type="button"
        hidden={desktop}
        aria-label={navigationOpen ? 'Fechar navegação' : 'Abrir navegação'}
        aria-expanded={navigationOpen}
        aria-controls="primary-navigation"
        onClick={onToggleNavigation}
        className="shrink-0 rounded-shell border border-shell-border p-2 text-shell-text hover:bg-slate-100"
      >
        {navigationOpen ? (
          <X className="size-5" aria-hidden="true" />
        ) : (
          <Menu className="size-5" aria-hidden="true" />
        )}
      </button>
    </header>
  );
}
