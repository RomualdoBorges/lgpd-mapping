import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Elemento raiz ausente.');
createRoot(root).render(
  <StrictMode>
    <main>
      <p className="eyebrow">LGPD Data Mapping Platform</p>
      <h1>Ambiente local iniciado</h1>
      <p>
        A aplicação está executando. As funcionalidades do produto serão
        disponibilizadas nas próximas entregas.
      </p>
    </main>
  </StrictMode>,
);
