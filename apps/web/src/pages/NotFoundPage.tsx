import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <div className="max-w-2xl rounded-xl border border-shell-border bg-white p-6 sm:p-10">
      <p className="mb-3 text-xs font-semibold tracking-widest text-shell-accent">
        PÁGINA INDISPONÍVEL
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">
        Página não encontrada
      </h1>
      <p className="mt-4 leading-8 text-shell-muted">
        Não encontramos a página deste endereço. Você pode voltar ao início para
        continuar.
      </p>
      <Link
        to="/"
        className="mt-7 inline-flex items-center gap-2 rounded-shell bg-shell-accent px-4 py-3 text-sm font-medium text-white hover:bg-indigo-800"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar para início
      </Link>
    </div>
  );
}
