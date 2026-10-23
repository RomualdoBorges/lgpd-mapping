import { Info } from 'lucide-react';

type EmptyStateProps = { title: string; description: string };

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-shell-border bg-white p-6 sm:flex-row sm:p-8">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-shell bg-indigo-50 text-shell-accent">
        <Info className="size-5" aria-hidden="true" />
      </span>
      <div>
        <h2 className="font-semibold text-shell-text">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-shell-muted">
          {description}
        </p>
      </div>
    </section>
  );
}
