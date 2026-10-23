import { Link, Route, Routes } from 'react-router';

export function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <main>
            <p className="eyebrow">LGPD Data Mapping Platform</p>
            <h1>Ambiente local iniciado</h1>
            <p>
              A aplicação está executando. As funcionalidades do produto serão
              disponibilizadas nas próximas entregas.
            </p>
          </main>
        }
      />
      <Route
        path="*"
        element={
          <main>
            <h1>Página não encontrada</h1>
            <Link to="/">Voltar para início</Link>
          </main>
        }
      />
    </Routes>
  );
}
