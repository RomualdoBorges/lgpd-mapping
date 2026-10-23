import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';

function viewport(desktop: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches: desktop,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
}
function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

beforeEach(() => viewport(false));
afterEach(() => vi.unstubAllGlobals());

describe('frontend shell', () => {
  it('renderiza a HomePage informativa e os landmarks', () => {
    renderApp();
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Bem-vindo à plataforma LGPD',
      }),
    ).toBeVisible();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1');
    expect(
      screen.getByRole('link', { name: 'Ir para o conteúdo' }),
    ).toHaveAttribute('href', '#main-content');
    expect(
      screen.getByText('Um ponto de partida para o seu mapeamento'),
    ).toBeVisible();
  });

  it('exibe somente Início como destino na navegação desktop', () => {
    viewport(true);
    renderApp();
    const links = within(
      screen.getByRole('navigation', { name: 'Navegação principal' }),
    ).getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAccessibleName('Início');
    expect(links[0]).toHaveAttribute('href', '/');
    expect(links[0]).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('mostra o fallback e permite voltar para início com teclado', async () => {
    const user = userEvent.setup();
    renderApp('/rota-inexistente');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Página não encontrada' }),
    ).toBeVisible();
    const home = screen.getByRole('link', { name: 'Voltar para início' });
    expect(home).toHaveAttribute('href', '/');
    await user.tab(); // Skip link.
    await user.tab(); // Mobile navigation control.
    await user.tab();
    expect(home).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Bem-vindo à plataforma LGPD',
      }),
    ).toBeVisible();
    expect(
      screen.queryByRole('heading', { name: 'Página não encontrada' }),
    ).not.toBeInTheDocument();
  });

  it('abre e fecha a navegação móvel por teclado, sem foco em links recolhidos', async () => {
    const user = userEvent.setup();
    renderApp();
    const button = screen.getByRole('button', { name: 'Abrir navegação' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-controls', 'primary-navigation');
    expect(screen.getByRole('navigation', { hidden: true })).toHaveAttribute(
      'hidden',
    );
    expect(
      screen.queryByRole('link', { name: 'Início' }),
    ).not.toBeInTheDocument();
    await user.tab();
    expect(
      screen.getByRole('link', { name: 'Ir para o conteúdo' }),
    ).toHaveFocus();
    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveAccessibleName('Fechar navegação');
    expect(screen.getByRole('navigation')).not.toHaveAttribute('hidden');
    expect(screen.getByRole('link', { name: 'Início' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await user.keyboard(' ');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it('fecha a navegação móvel ao seguir Início e não marca rota desconhecida como atual', async () => {
    const user = userEvent.setup();
    renderApp('/desconhecida');
    await user.click(screen.getByRole('button', { name: 'Abrir navegação' }));
    const home = within(screen.getByRole('navigation')).getByRole('link', {
      name: 'Início',
    });
    expect(home).not.toHaveAttribute('aria-current');
    await user.click(home);
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Bem-vindo à plataforma LGPD',
      }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Abrir navegação' }),
    ).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('mantém ícones decorativos fora da árvore acessível', () => {
    const { container } = renderApp();
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
    icons.forEach((icon) =>
      expect(icon).toHaveAttribute('aria-hidden', 'true'),
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
