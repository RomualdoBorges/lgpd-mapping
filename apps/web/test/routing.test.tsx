import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { App } from '../src/app/App';

describe('rotas provisórias do shell', () => {
  it('preserva o bootstrap na rota inicial', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Ambiente local iniciado',
      }),
    ).toBeVisible();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('mostra o fallback e permite voltar para início com teclado', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/rota-inexistente']}>
        <App />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Página não encontrada' }),
    ).toBeVisible();
    const home = screen.getByRole('link', { name: 'Voltar para início' });
    expect(home).toHaveAttribute('href', '/');
    await user.tab();
    expect(home).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Ambiente local iniciado',
      }),
    ).toBeVisible();
    expect(
      screen.queryByRole('heading', { name: 'Página não encontrada' }),
    ).not.toBeInTheDocument();
  });
});
