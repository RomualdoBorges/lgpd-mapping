import { EmptyState } from '../components/EmptyState';

export function HomePage() {
  return (
    <div className="space-y-9">
      <div className="max-w-2xl">
        <p className="mb-3 text-xs font-semibold tracking-widest text-shell-accent">
          MAPEAMENTO DE DADOS
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-shell-text sm:text-4xl">
          Bem-vindo à plataforma LGPD
        </h1>
        <p className="mt-5 text-base leading-8 text-shell-muted">
          Um espaço para organizar o mapeamento de dados pessoais e compreender
          como eles são tratados na sua organização.
        </p>
      </div>
      <EmptyState
        title="Um ponto de partida para o seu mapeamento"
        description="Esta é a interface inicial da plataforma. Os recursos de mapeamento serão disponibilizados nas próximas entregas."
      />
    </div>
  );
}
