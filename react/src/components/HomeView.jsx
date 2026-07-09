import { useRef } from 'react';
import { useStore } from '../context/StoreContext';

export default function HomeView({ searchQuery, setSearchQuery, navigateTo }) {
  const { categories } = useStore();
  const scrollRef = useRef(null);

  return (
    <section aria-label="Página inicial">
      <div className="hero" role="region" aria-label="Destaque principal">
        <div className="hero-content">
          <span className="hero-emoji" aria-hidden="true">⚡🏠</span>
          <h1>Seu impulso para o trampo</h1>
          <p>Eletrodomésticos, linha branca e eletrônicos com as melhores condições para a família brasileira.</p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => setSearchQuery('')}>Explorar produtos</button>
            <button className="btn btn-secondary" onClick={() => navigateTo('offers')}>Ver ofertas 🔥</button>
          </div>
        </div>
      </div>

      <div className="search-bar" role="search">
        <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
        <label htmlFor="search-input" className="sr-only">Buscar produtos</label>
        <input type="search" id="search-input" placeholder="Buscar geladeira, TV, fogão..."
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoComplete="off" />
      </div>

      <div className="promo-banners">
        <div className="promo-card blue"><h3>🏷️ Até 40% OFF em Linha Branca</h3><p>Geladeiras, fogões e lavadoras com frete grátis</p></div>
        <div className="promo-card orange"><h3>📺 Smart TVs em 12x sem juros</h3><p>As melhores marcas com entrega rápida</p></div>
      </div>

      <div className="section-header">
        <h2 className="section-title">Categorias</h2>
        <button className="section-link" onClick={() => navigateTo('categories')}>Ver todas →</button>
      </div>

      <div className="carousel-wrapper">
        <button className="carousel-arrow prev" onClick={() => scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' })} aria-label="Anterior">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div className="categories-scroll" ref={scrollRef} role="tablist">
          {categories.map(cat => (
            <button key={cat.id} className="category-card" onClick={() => navigateTo('categories')}>
              <span className="category-icon">{cat.icon}</span>
              <span className="category-name">{cat.name}</span>
            </button>
          ))}
        </div>
        <button className="carousel-arrow next" onClick={() => scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' })} aria-label="Próximo">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>

    </section>
  );
}
