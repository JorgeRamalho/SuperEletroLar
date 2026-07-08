export default function Header({ showBack, onBack, onHome, onCart, onTheme, theme, cartCount, currentView, onNavigate }) {
  return (
    <header className="app-header" role="banner">
      <button
        className={`header-back ${showBack ? 'visible' : ''}`}
        onClick={onBack}
        aria-label="Voltar"
        title="Voltar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>

      <a href="#" className="header-brand" onClick={(e) => { e.preventDefault(); onHome(); }} aria-label="Trampolim — Página inicial">
        <img src="/assets/logo.svg" alt="" width="40" height="40" />
        <div>
          <div className="brand-name">🚀 Trampolim</div>
          <div className="brand-slogan">Seu impulso para o trampo</div>
        </div>
      </a>

      <nav className="desktop-nav" aria-label="Navegação principal">
        {['home', 'categories', 'offers', 'account'].map(v => (
          <a
            key={v}
            href="#"
            className={currentView === v ? 'active' : ''}
            onClick={(e) => { e.preventDefault(); onNavigate(v); }}
          >
            {{ home: 'Início', categories: 'Categorias', offers: 'Ofertas', account: 'Conta' }[v]}
          </a>
        ))}
      </nav>

      <div className="header-actions">
        <button className="icon-btn" aria-label="Buscar produtos" title="Buscar">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
        </button>
        <button className="icon-btn" onClick={onTheme} aria-label="Alternar tema" title="Tema">
          {theme === 'light' ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
            </svg>
          )}
        </button>
        <button className="icon-btn" onClick={onCart} aria-label="Carrinho de compras" title="Carrinho">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
          </svg>
          {cartCount > 0 && (
            <span className="badge" data-count={cartCount} aria-label={`${cartCount} itens no carrinho`}>
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
