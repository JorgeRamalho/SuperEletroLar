export default function Header({ showBack, onBack, onHome, onCart, cartCount, currentView, onNavigate }) {
  return (
    <header className="app-header" role="banner">
      <div className="header-inner">
        <div className="header-start">
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
            <span className="header-brand-mark" aria-hidden="true">
              <img src="/assets/logo.svg" alt="" width="40" height="40" />
            </span>
            <span className="header-brand-text">
              <span className="brand-name">Trampolim</span>
            </span>
          </a>
        </div>

        <div className="header-actions">
          <button className="header-link-btn header-action-cart" onClick={onCart} aria-label="Carrinho" title="Carrinho">
            <span className="header-link-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
              </svg>
            </span>
            <span className="header-link-label">Carrinho</span>
            {cartCount > 0 && (
              <span className="badge badge-cart" data-count={cartCount} aria-label={`${cartCount} itens no carrinho`}>
                {cartCount}
              </span>
            )}
          </button>

          <button className="header-user-btn" onClick={() => onNavigate(currentView === 'account' ? 'home' : 'account')} aria-label="Minha conta" title="Conta">
            <span className="header-user-avatar" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </span>
            <span className="header-user-name">Entrar</span>
          </button>

          <button className="header-cta-btn" onClick={() => onNavigate('hub')} aria-label="Anunciar grátis" title="Anunciar grátis">
            <span className="header-cta-plus" aria-hidden="true">+</span>
            <span>Anunciar grátis</span>
          </button>
        </div>
      </div>
    </header>
  );
}
