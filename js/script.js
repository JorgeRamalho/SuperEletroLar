/**
 * Trampolim — Script principal v2
 * API, auth, checkout, detalhe de produto, PWA
 */

const Trampolim = (() => {
  'use strict';

  let CATEGORIES = [];
  let PRODUCTS = [];
  let HERO_SLIDES = [];
  let cart = JSON.parse(localStorage.getItem('sel-cart') || '[]');
  let favorites = JSON.parse(localStorage.getItem('sel-favorites') || '[]');
  let currentView = 'home';
  let viewHistory = ['home'];
  let activeCategory = null;
  let currentProduct = null;
  let checkoutStep = 1;
  let selectedShipping = 'standard';
  let heroIndex = 0;
  let heroTimer = null;
  let currentOrder = null;
  let currentPayment = null;
  let deferredPrompt = null;
  let HUB_PLATFORMS = [];
  let hubFilters = { q: '', marketplace: '', condition: '', listingType: '', minPrice: '', maxPrice: '', state: '', sort: 'relevance' };
  let hubSearchTimer = null;
  let productFilters = {
    listingType: '',
    condition: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    state: '',
    sort: 'relevance',
    freeShipping: false,
    onSale: false,
  };
  let filtersApplyTimer = null;

  const CONDITION_COLORS = {
    new: '#0066FF',
    semi_used: '#00C9A7',
    used: '#FF6B35',
    service: '#7C3AED',
  };

  const SHOWCASE_THEMES = [
    {
      id: 'theme-tvs',
      badge: '📺 Produto',
      name: 'Smart TVs',
      description: 'Imagem 4K para a sala',
      image: 'assets/showcase/smart-tvs.png',
      action: 'offers',
      gradient: 'cool',
    },
    {
      id: 'theme-eletrica',
      badge: '⚡ Serviço',
      name: 'Serviços elétricos',
      description: 'Instalações e reparos com segurança',
      image: 'assets/showcase/servicos/servico-eletrica.png',
      action: 'hub',
      gradient: 'electric',
    },
    {
      id: 'theme-geladeiras',
      badge: '🧊 Produto',
      name: 'Geladeiras',
      description: 'Frost free e duplex',
      image: 'assets/showcase/geladeiras.png',
      action: 'categories',
      gradient: 'ocean',
    },
    {
      id: 'theme-encanamento',
      badge: '🔧 Serviço',
      name: 'Encanamento e vazamentos',
      description: 'Profissionais para consertos em casa',
      image: 'assets/showcase/servicos/servico-encanamento.png',
      action: 'hub',
      gradient: 'warm',
    },
    {
      id: 'theme-fogoes',
      badge: '🔥 Produto',
      name: 'Fogões',
      description: 'Fogões a gás e cooktops',
      image: 'assets/showcase/fogoes.png',
      action: 'categories',
      gradient: 'warm',
    },
    {
      id: 'theme-eletro',
      badge: '🛠️ Serviço',
      name: 'Reparo de eletrodomésticos',
      description: 'Técnicos especializados perto de você',
      image: 'assets/showcase/servicos/servico-eletro.png',
      action: 'hub',
      gradient: 'cool',
    },
    {
      id: 'theme-audio',
      badge: '🔊 Produto',
      name: 'Áudio',
      description: 'Soundbars e caixas de som',
      image: 'assets/showcase/audio.png',
      action: 'categories',
      gradient: 'purple',
    },
    {
      id: 'theme-limpeza',
      badge: '✨ Serviço',
      name: 'Limpeza profissional',
      description: 'Casa e escritório impecáveis',
      image: 'assets/showcase/servicos/servico-limpeza.png',
      action: 'hub',
      gradient: 'ocean',
    },
    {
      id: 'theme-lavadoras',
      badge: '🫧 Produto',
      name: 'Lavadoras',
      description: 'Lavadoras e lava e seca',
      image: 'assets/showcase/lavadoras.png',
      action: 'categories',
      gradient: 'electric',
    },
    {
      id: 'theme-pintura',
      badge: '🎨 Serviço',
      name: 'Pintura e reforma',
      description: 'Acabamento com quem entende do trampo',
      image: 'assets/showcase/servicos/servico-pintura.png',
      action: 'hub',
      gradient: 'purple',
    },
    {
      id: 'theme-notebooks',
      badge: '💻 Produto',
      name: 'Notebooks',
      description: 'Para trabalho e estudo',
      image: 'assets/showcase/notebooks.png',
      action: 'categories',
      gradient: 'cool',
    },
    {
      id: 'theme-entrega',
      badge: '📦 Serviço',
      name: 'Entregas e fretes',
      description: 'Leve e receba com praticidade',
      image: 'assets/showcase/servicos/servico-entrega.png',
      action: 'hub',
      gradient: 'warm',
    },
    {
      id: 'theme-ar',
      badge: '❄️ Produto',
      name: 'Ar-condicionado',
      description: 'Splits e inverter',
      image: 'assets/showcase/ar-condicionado.png',
      action: 'offers',
      gradient: 'ocean',
    },
    {
      id: 'theme-ti',
      badge: '🖥️ Serviço',
      name: 'TI e suporte técnico',
      description: 'Notebook, rede e instalação',
      image: 'assets/showcase/servicos/servico-ti.png',
      action: 'hub',
      gradient: 'electric',
    },
    {
      id: 'theme-cafeteiras',
      badge: '☕ Produto',
      name: 'Cafeteiras',
      description: 'Espresso e cápsulas',
      image: 'assets/showcase/cafeteiras.png',
      action: 'categories',
      gradient: 'warm',
    },
    {
      id: 'theme-jardim',
      badge: '🌿 Serviço',
      name: 'Jardinagem e área externa',
      description: 'Cuidado com plantas e quintal',
      image: 'assets/showcase/servicos/servico-jardim.png',
      action: 'hub',
      gradient: 'ocean',
    },
    {
      id: 'theme-fritadeiras',
      badge: '🍳 Produto',
      name: 'Fritadeiras',
      description: 'Air fryers sem óleo',
      image: 'assets/showcase/fritadeiras.png',
      action: 'categories',
      gradient: 'purple',
    },
    {
      id: 'theme-aspiradores',
      badge: '🌀 Produto',
      name: 'Aspiradores',
      description: 'Robôs e verticais',
      image: 'assets/showcase/aspiradores.png',
      action: 'categories',
      gradient: 'cool',
    },
  ];

  const SHOWCASE_SCROLL_STEP = 216;
  const formatPrice = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const installment = (p) => `ou 12x de ${formatPrice(p / 12)} sem juros`;
  const saveCart = () => localStorage.setItem('sel-cart', JSON.stringify(cart));
  const saveFavorites = () => localStorage.setItem('sel-favorites', JSON.stringify(favorites));
  const getShippingCost = () => selectedShipping === 'express' ? 49.90 : 0;
  const getCartSubtotal = () => cart.reduce((s, i) => {
    const p = PRODUCTS.find(pr => pr.id === i.id);
    return s + (p ? p.price * i.qty : 0);
  }, 0);
  const getCartTotal = () => getCartSubtotal() + getShippingCost();

  function renderStars(rating) {
    const full = Math.floor(rating);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  /* ── API Data Loading ── */
  async function loadData() {
    try {
      [CATEGORIES, PRODUCTS, HERO_SLIDES] = await Promise.all([
        api.getCategories(),
        api.getProducts(),
        api.getCarousel(),
      ]);
    } catch {
      showToast('⚠️ Modo offline — usando dados em cache');
      CATEGORIES = getFallbackCategories();
      PRODUCTS = getFallbackProducts();
      HERO_SLIDES = getFallbackHero();
    }
    renderAll();
  }

  function getFallbackHero() {
    return [
      { id: 1, badge: '🚀 Trampolim', title: 'Seu impulso para o trampo', subtitle: 'Trabalho, serviços e oportunidades para o Brasil.', image: 'assets/brand/trampolim-hero.png', gradient: 'gradient-brand', cta: 'hub', ctaLabel: 'Abrir Radar' },
      { id: 2, badge: '📺 Smart TV', title: 'Filmes, séries e diversão em casa', subtitle: 'Família reunida na sala — entretenimento no seu lar.', image: 'assets/carousel/lifestyle/tv-casa.png', gradient: 'gradient-cool', cta: 'offers', ctaLabel: 'Ver Smart TVs' },
      { id: 3, badge: '🔊 Áudio', title: 'Música em cada canto do lar', subtitle: 'Fones, caixas de som e soundbars.', image: 'assets/carousel/lifestyle/musica-casa.png', gradient: 'gradient-purple', cta: 'categories', ctaLabel: 'Ver áudio' },
      { id: 4, badge: '🛏️ Conforto', title: 'Descanso merecido no seu quarto', subtitle: 'Climatização e bem-estar para noites tranquilas.', image: 'assets/carousel/lifestyle/cama-descanso.png', gradient: 'gradient-ocean', cta: 'categories', ctaLabel: 'Climatização' },
      { id: 5, badge: '🍳 Cozinha', title: 'Eletrodomésticos que facilitam o dia', subtitle: 'Geladeira, fogão, micro-ondas e mais.', image: 'assets/carousel/lifestyle/cozinha-eletro.png', gradient: 'gradient-warm', cta: 'categories', ctaLabel: 'Linha branca' },
      { id: 6, badge: '🫧 Lavanderia', title: 'Roupas limpas sem complicação', subtitle: 'Lavadoras e lava e seca para ganhar tempo.', image: 'assets/carousel/lifestyle/lavanderia.png', gradient: 'gradient-electric', cta: 'categories', ctaLabel: 'Ver lavadoras' },
      { id: 7, badge: '❄️ Sala', title: 'Seu refúgio no fim do dia', subtitle: 'Conforto e ar-condicionado em casa.', image: 'assets/carousel/lifestyle/sala-conforto.png', gradient: 'gradient-sunset', cta: 'offers', ctaLabel: 'Ver ofertas' },
    ];
  }

  function getFallbackCategories() {
    return [
      { id: 'geladeiras', name: 'Geladeiras', icon: '🧊', description: 'Refrigeradores frost free e duplex', image: 'assets/showcase/geladeiras.png', fallbackImage: 'assets/showcase/geladeiras.png' },
      { id: 'fogoes', name: 'Fogões', icon: '🔥', description: 'Fogões a gás e cooktops', image: 'assets/showcase/fogoes.png', fallbackImage: 'assets/showcase/fogoes.png' },
      { id: 'lavadoras', name: 'Lavadoras', icon: '🫧', description: 'Lavadoras e lava e seca', image: 'assets/showcase/lavadoras.png', fallbackImage: 'assets/showcase/lavadoras.png' },
      { id: 'tvs', name: 'Smart TVs', icon: '📺', description: 'Smart TVs 4K e QLED', image: 'assets/showcase/smart-tvs.png', fallbackImage: 'assets/showcase/smart-tvs.png' },
      { id: 'ar', name: 'Ar-condicionado', icon: '❄️', description: 'Splits e inverter', image: 'assets/showcase/ar-condicionado.png', fallbackImage: 'assets/showcase/ar-condicionado.png' },
      { id: 'micro', name: 'Micro-ondas', icon: '📡', description: 'Micro-ondas com grill', image: 'assets/showcase/micro-ondas.png', fallbackImage: 'assets/showcase/micro-ondas.png' },
      { id: 'celulares', name: 'Celulares', icon: '📱', description: 'Smartphones 5G', image: 'assets/showcase/smart-tvs.png', fallbackImage: 'assets/showcase/smart-tvs.png' },
      { id: 'notebooks', name: 'Notebooks', icon: '💻', description: 'Notebooks para trabalho e estudo', image: 'assets/showcase/notebooks.png', fallbackImage: 'assets/showcase/notebooks.png' },
      { id: 'aspiradores', name: 'Aspiradores', icon: '🌀', description: 'Robôs e aspiradores verticais', image: 'assets/showcase/aspiradores.png', fallbackImage: 'assets/showcase/aspiradores.png' },
      { id: 'cafeteiras', name: 'Cafeteiras', icon: '☕', description: 'Espresso e cápsulas', image: 'assets/showcase/cafeteiras.png', fallbackImage: 'assets/showcase/cafeteiras.png' },
      { id: 'fritadeiras', name: 'Fritadeiras', icon: '🍳', description: 'Air fryers sem óleo', image: 'assets/showcase/fritadeiras.png', fallbackImage: 'assets/showcase/fritadeiras.png' },
      { id: 'audio', name: 'Áudio', icon: '🔊', description: 'Soundbars e caixas de som', image: 'assets/showcase/audio.png', fallbackImage: 'assets/showcase/audio.png' },
    ];
  }

  function getFallbackProducts() {
    return [];
  }

  /* ── Product Card ── */
  function productCardHTML(product) {
    const isFav = favorites.includes(product.id);
    const catName = CATEGORIES.find(c => c.id === product.category)?.name || product.category;
    const img = product.image
      ? `<img src="${product.image}" alt="${product.name}" loading="lazy" width="300" height="300">`
      : `<span style="font-size:5rem" aria-hidden="true">${product.emoji || '📦'}</span>`;

    return `
      <article class="product-card" role="listitem" data-product-id="${product.id}">
        <div class="product-image" data-open-product="${product.id}" style="cursor:pointer">
          ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
          <button class="product-favorite ${isFav ? 'active' : ''}" aria-label="${isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}" data-fav="${product.id}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
          ${img}
        </div>
        <div class="product-info" data-open-product="${product.id}" style="cursor:pointer">
          <span class="product-category">${catName}</span>
          <h3 class="product-name">${product.name}</h3>
          <div class="product-rating">
            <span class="stars" aria-hidden="true">${renderStars(product.rating)}</span>
            <span>(${product.reviews})</span>
          </div>
          <div class="product-price">
            <span class="price-current">${formatPrice(product.price)}</span>
            ${product.oldPrice ? `<span class="price-old">${formatPrice(product.oldPrice)}</span>` : ''}
            <div class="price-installment">${installment(product.price)}</div>
          </div>
        </div>
        <div class="product-actions">
          <button class="btn btn-primary btn-sm add-to-cart" data-add="${product.id}" aria-label="Adicionar ${product.name} ao carrinho">Adicionar ao carrinho</button>
        </div>
      </article>`;
  }

  function renderProducts(containerId, products) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!products.length) {
      el.innerHTML = '<p style="text-align:center;color:var(--color-text-muted);padding:2rem">Nenhum produto encontrado.</p>';
      return;
    }
    el.innerHTML = products.map(productCardHTML).join('');
    updateProductSchema(products);
  }

  function renderCategories() {
    const scroll = document.getElementById('categories-scroll');
    if (scroll) {
      scroll.innerHTML = CATEGORIES.map(cat => `
        <button class="category-card has-image" role="tab" data-category="${cat.id}" aria-label="Categoria ${cat.name}">
          ${cat.image ? `<img class="category-img" src="${cat.image}" alt="${cat.name}" loading="lazy" width="120" height="80">` : `<span class="category-icon" aria-hidden="true">${cat.icon}</span>`}
          <span class="category-name">${cat.name}</span>
        </button>`).join('');
      requestAnimationFrame(updateCategoryArrows);
    }
    const grid = document.getElementById('categories-grid');
    if (grid) {
      grid.innerHTML = CATEGORIES.map(cat => `
        <button class="category-card has-image" style="min-height:140px" data-category="${cat.id}" aria-label="Ver ${cat.name}">
          ${cat.image ? `<img class="category-img" src="${cat.image}" alt="${cat.name}" loading="lazy" width="200" height="100">` : `<span class="category-icon" style="font-size:2.5rem">${cat.icon}</span>`}
          <span class="category-name">${cat.name}</span>
        </button>`).join('');
    }
  }

  function renderHeroCarousel() {
    const track = document.getElementById('hero-track');
    const dots = document.getElementById('hero-dots');
    if (!track || !HERO_SLIDES.length) return;

    track.innerHTML = HERO_SLIDES.map((slide, i) => `
      <div class="hero-slide ${slide.gradient || 'gradient-brand'}" role="tabpanel" aria-label="${slide.title}" ${i === 0 ? '' : 'aria-hidden="true"'}>
        <div class="hero-slide-bg" style="background-image:url('${slide.image}')"></div>
        <div class="hero-slide-content">
          <span class="hero-slide-badge">${slide.badge || '🚀 Trampolim'}</span>
          <h2>${slide.title}</h2>
          <p>${slide.subtitle}</p>
          <div class="hero-actions">
            <button class="btn btn-primary" data-action="${slide.cta || 'explore'}">${slide.ctaLabel || 'Explorar'}</button>
          </div>
        </div>
      </div>`).join('');

    dots.innerHTML = HERO_SLIDES.map((_, i) => `
      <button class="hero-dot ${i === 0 ? 'active' : ''}" data-hero-dot="${i}" aria-label="Slide ${i + 1}" role="tab"></button>
    `).join('');

    heroIndex = 0;
    startHeroAutoplay();
  }

  function goToHeroSlide(index) {
    const track = document.getElementById('hero-track');
    const dots = document.querySelectorAll('.hero-dot');
    if (!track || !HERO_SLIDES.length) return;

    heroIndex = (index + HERO_SLIDES.length) % HERO_SLIDES.length;
    track.style.transform = `translateX(-${heroIndex * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === heroIndex));
    track.querySelectorAll('.hero-slide').forEach((s, i) => {
      s.setAttribute('aria-hidden', i !== heroIndex);
    });
  }

  function startHeroAutoplay() {
    clearInterval(heroTimer);
    heroTimer = setInterval(() => goToHeroSlide(heroIndex + 1), 5000);
  }

  function getShowcaseImage(cat) {
    return cat.image || cat.fallbackImage || '';
  }

  function updateShowcaseArrows() {
    const track = document.getElementById('showcase-track');
    const prev = document.getElementById('showcase-prev');
    const next = document.getElementById('showcase-next');
    if (!track || !prev || !next) return;
    const maxScroll = track.scrollWidth - track.clientWidth;
    prev.disabled = track.scrollLeft <= 4;
    next.disabled = track.scrollLeft >= maxScroll - 4;
  }

  function updateCategoryArrows() {
    const scroll = document.getElementById('categories-scroll');
    const prev = document.getElementById('cat-prev');
    const next = document.getElementById('cat-next');
    if (!scroll || !prev || !next) return;
    const maxScroll = scroll.scrollWidth - scroll.clientWidth;
    prev.disabled = scroll.scrollLeft <= 4;
    next.disabled = maxScroll <= 4 || scroll.scrollLeft >= maxScroll - 4;
  }

  function renderShowcase() {
    const track = document.getElementById('showcase-track');
    if (!track) return;

    const mixed = [...SHOWCASE_THEMES].sort(() => Math.random() - 0.5);

    track.innerHTML = mixed.map(theme => `
      <div class="showcase-item showcase-theme showcase-theme-${theme.gradient}" role="listitem" data-showcase-action="${theme.action}" tabindex="0" aria-label="${theme.name}">
        <span class="showcase-item-badge">${theme.badge}</span>
        <div class="showcase-item-visual">
          <img src="${theme.image}" alt="${theme.name}" loading="lazy" width="200" height="140" class="showcase-img showcase-theme-img">
        </div>
        <div class="showcase-item-info">
          <h4>${theme.name}</h4>
          <span>${theme.description}</span>
          <span class="showcase-theme-cta">Explorar →</span>
        </div>
      </div>`).join('');

    track.querySelectorAll('.showcase-img').forEach(img => {
      img.addEventListener('error', function onErr() {
        const fallback = this.dataset.fallback;
        if (fallback && this.src !== fallback) {
          this.src = fallback;
        } else if (!this.classList.contains('showcase-theme-img')) {
          this.replaceWith(Object.assign(document.createElement('div'), {
            className: 'showcase-item-placeholder',
            textContent: this.alt?.split('—')[0]?.trim()?.charAt(0) || '📦',
          }));
        }
        this.removeEventListener('error', onErr);
      });
    });

    updateShowcaseArrows();
  }

  function renderFavorites() {
    const favProducts = PRODUCTS.filter(p => favorites.includes(p.id));
    renderProducts('favorites-grid', favProducts);
    const grid = document.getElementById('favorites-grid');
    if (grid && !favProducts.length) {
      grid.innerHTML = '<p style="text-align:center;color:var(--color-text-muted);padding:2rem;grid-column:1/-1">Nenhum favorito ainda. Toque no ❤️ nos produtos.</p>';
    }
  }

  async function renderOrders() {
    const el = document.getElementById('orders-content');
    if (!el) return;

    if (!api.getUser()) {
      el.innerHTML = '<div class="checkout-panel"><p>Faça login para ver seus pedidos.</p><button class="btn btn-primary btn-sm" id="btn-orders-login">Entrar</button></div>';
      return;
    }

    try {
      const orders = await api.getOrders();
      if (!orders.length) {
        el.innerHTML = '<p style="text-align:center;color:var(--color-text-muted);padding:2rem">Você ainda não fez nenhum pedido.</p>';
        return;
      }
      el.innerHTML = `<div class="orders-list">${orders.map(o => `
        <div class="order-card">
          <div class="order-card-header">
            <strong>${o.trackingCode || o.id.slice(0, 8).toUpperCase()}</strong>
            <span class="order-status ${o.status === 'paid' ? 'paid' : 'pending'}">${o.status === 'paid' ? '✅ Pago' : '⏳ Pendente'}</span>
          </div>
          <p style="font-size:0.875rem;color:var(--color-text-secondary)">${new Date(o.createdAt).toLocaleDateString('pt-BR')} · ${o.items?.length || 0} item(s)</p>
          <p style="font-weight:700;margin-top:0.5rem">${formatPrice(o.total)}</p>
        </div>`).join('')}</div>`;
    } catch {
      el.innerHTML = '<p class="form-error">Erro ao carregar pedidos.</p>';
    }
  }

  function renderAll() {
    renderHeroCarousel();
    renderShowcase();
    renderCategories();
    renderFiltersSidebar();
    applyProductFilters();
    renderFavorites();
    renderCart();
    updateAccountView();
  }

  /* ── Sidebar filters ── */
  function hasActiveProductFilters() {
    const f = productFilters;
    return !!(
      f.listingType || f.condition || f.category ||
      f.minPrice || f.maxPrice || f.state ||
      f.freeShipping || f.onSale || (f.sort && f.sort !== 'relevance')
    );
  }

  function countActiveProductFilters() {
    const f = productFilters;
    let n = 0;
    if (f.listingType) n++;
    if (f.condition) n++;
    if (f.category) n++;
    if (f.minPrice) n++;
    if (f.maxPrice) n++;
    if (f.state) n++;
    if (f.freeShipping) n++;
    if (f.onSale) n++;
    if (f.sort && f.sort !== 'relevance') n++;
    return n;
  }

  function updateFiltersBadge() {
    const count = countActiveProductFilters();
    document.querySelectorAll('.filters-active-badge, #filters-active-badge').forEach(badge => {
      if (count > 0) {
        badge.textContent = String(count);
        badge.hidden = false;
      } else {
        badge.hidden = true;
      }
    });
  }

  function renderFiltersSidebar() {
    updateFiltersBadge();
  }

  function getProductCondition(product) {
    if (product?.condition) return product.condition;
    if (product?.listingType === 'service') return 'service';
    const badge = String(product?.badge || '').toLowerCase();
    if (badge.includes('usado') || badge.includes('semi')) {
      return badge.includes('semi') ? 'semi_used' : 'used';
    }
    if (badge.includes('novo') || badge.includes('lançamento') || badge.includes('oferta')) return 'new';
    return 'new';
  }

  function getFilteredProducts(baseList) {
    const f = productFilters;
    const q = (document.getElementById('header-search-input')?.value || '').trim().toLowerCase();
    let results = [...(baseList || PRODUCTS)];

    if (f.listingType === 'service' || f.condition === 'opportunity' || f.condition === 'trampo') return [];

    if (q) {
      results = results.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }

    if (f.listingType === 'product') {
      results = results.filter(p => (p.listingType || 'product') !== 'service');
    }
    if (f.condition) {
      results = results.filter(p => getProductCondition(p) === f.condition);
    }
    if (f.category) results = results.filter(p => p.category === f.category);
    if (f.minPrice) results = results.filter(p => p.price >= Number(f.minPrice));
    if (f.maxPrice) results = results.filter(p => p.price <= Number(f.maxPrice));
    if (f.state) results = results.filter(p => (p.state || '').toUpperCase() === f.state.toUpperCase());
    if (f.freeShipping) results = results.filter(p => p.freeShipping);
    if (f.onSale) results = results.filter(p => p.badge || (p.oldPrice && p.oldPrice > p.price));

    if (f.sort === 'price-asc') results.sort((a, b) => a.price - b.price);
    else if (f.sort === 'price-desc') results.sort((a, b) => b.price - a.price);
    else if (f.sort === 'rating') results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (f.sort === 'name') results.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

    return results;
  }

  function applyProductFilters() {
    const openHub = productFilters.listingType === 'service'
      || productFilters.condition === 'opportunity'
      || productFilters.condition === 'trampo';
    const filtered = getFilteredProducts(PRODUCTS);
    const countEl = document.getElementById('filters-result-count');

    if (openHub) {
      if (countEl) countEl.textContent = 'Abrindo Radar Trampolim…';
      syncSidebarToHub();
      if (currentView === 'home' || currentView === 'categories' || currentView === 'offers') {
        navigateTo('hub');
      }
      runHubSearch();
      updateFiltersBadge();
      closeFiltersDrawer();
      return;
    }

    if (currentView === 'hub') {
      syncSidebarToHub();
      runHubSearch();
    }

    const offersBase = PRODUCTS.filter(p => p.badge);
    renderProducts('offers-grid', getFilteredProducts(offersBase));

    if (activeCategory || productFilters.category) {
      const catId = productFilters.category || activeCategory;
      const catProducts = getFilteredProducts(PRODUCTS.filter(p => p.category === catId));
      renderProducts('category-products-grid', catProducts);
      const c = CATEGORIES.find(x => x.id === catId);
      const title = document.getElementById('category-products-title');
      if (title && c) title.textContent = `${c.icon || ''} ${c.name}`;
    } else if (document.getElementById('category-products-grid')) {
      renderProducts('category-products-grid', filtered.slice(0, 12));
    }

    if (countEl) {
      countEl.textContent = filtered.length === 1
        ? '1 resultado encontrado'
        : `${filtered.length} resultados encontrados`;
    }

    updateFiltersBadge();
  }

  function syncSidebarToHub() {
    hubFilters.listingType = productFilters.listingType || '';
    hubFilters.condition = (productFilters.condition === 'opportunity' || productFilters.condition === 'trampo')
      ? ''
      : (productFilters.condition || '');
    hubFilters.minPrice = productFilters.minPrice || '';
    hubFilters.maxPrice = productFilters.maxPrice || '';
    hubFilters.state = productFilters.state || '';
    if (productFilters.sort === 'price-asc') hubFilters.sort = 'price_asc';
    else if (productFilters.sort === 'price-desc') hubFilters.sort = 'price_desc';
    else hubFilters.sort = 'relevance';

    const hubMin = document.getElementById('hub-min-price');
    const hubMax = document.getElementById('hub-max-price');
    const hubState = document.getElementById('hub-state');
    const hubSort = document.getElementById('hub-sort');
    if (hubMin) hubMin.value = hubFilters.minPrice;
    if (hubMax) hubMax.value = hubFilters.maxPrice;
    if (hubState) hubState.value = hubFilters.state;
    if (hubSort) hubSort.value = hubFilters.sort;

    document.querySelectorAll('[data-hub-filter="listingType"]').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.value === (hubFilters.listingType || ''));
    });
    document.querySelectorAll('[data-hub-filter="condition"]').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.value === (hubFilters.condition || ''));
    });
  }

  function getFilterTypeSelectValue() {
    if (productFilters.listingType === 'service') return 'service';
    if (productFilters.listingType === 'product') return 'product';
    if (productFilters.condition) return productFilters.condition;
    return '';
  }

  function setProductTypeFilter(value) {
    productFilters.listingType = '';
    productFilters.condition = '';

    if (value === 'product' || value === 'service') {
      productFilters.listingType = value;
    } else if (value === 'new' || value === 'semi_used' || value === 'used' || value === 'opportunity' || value === 'trampo') {
      productFilters.condition = value;
    }

    const typeSelect = document.getElementById('filter-type');
    if (typeSelect && typeSelect.value !== getFilterTypeSelectValue()) {
      typeSelect.value = getFilterTypeSelectValue();
    }
  }

  function clearProductFilters() {
    productFilters = {
      listingType: '',
      condition: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      state: '',
      sort: 'relevance',
      freeShipping: false,
      onSale: false,
    };
    activeCategory = null;

    const type = document.getElementById('filter-type');
    const min = document.getElementById('filter-min-price');
    const max = document.getElementById('filter-max-price');
    const sort = document.getElementById('filter-sort');
    const free = document.getElementById('filter-free-shipping');
    const sale = document.getElementById('filter-on-sale');
    if (type) type.value = '';
    if (min) min.value = '';
    if (max) max.value = '';
    if (sort) sort.value = 'relevance';
    if (free) free.checked = false;
    if (sale) sale.checked = false;

    syncSearchState('');
    renderFiltersSidebar();
    applyProductFilters();
    showToast('Filtros limpos');
  }

  function openFiltersDrawer() {
    document.getElementById('filters-sidebar')?.classList.add('is-open');
    const overlay = document.getElementById('filters-overlay');
    if (overlay) overlay.hidden = false;
    document.body.classList.add('filters-drawer-open');
    document.querySelectorAll('.btn-open-filters, #btn-open-filters').forEach(btn => {
      btn.setAttribute('aria-expanded', 'true');
    });
  }

  function closeFiltersDrawer() {
    document.getElementById('filters-sidebar')?.classList.remove('is-open');
    const overlay = document.getElementById('filters-overlay');
    if (overlay) overlay.hidden = true;
    document.body.classList.remove('filters-drawer-open');
    document.querySelectorAll('.btn-open-filters, #btn-open-filters').forEach(btn => {
      btn.setAttribute('aria-expanded', 'false');
    });
  }

  function scheduleApplyFilters() {
    clearTimeout(filtersApplyTimer);
    filtersApplyTimer = setTimeout(applyProductFilters, 200);
  }

  function bindFiltersEvents() {
    document.getElementById('btn-open-filters')?.addEventListener('click', openFiltersDrawer);
    document.querySelectorAll('[data-open-filters]').forEach(btn => {
      btn.addEventListener('click', openFiltersDrawer);
    });
    document.getElementById('btn-filters-close')?.addEventListener('click', closeFiltersDrawer);
    document.getElementById('filters-overlay')?.addEventListener('click', closeFiltersDrawer);
    document.getElementById('btn-filters-clear')?.addEventListener('click', clearProductFilters);

    document.getElementById('filters-sidebar')?.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-filter]');
      if (chip) {
        const key = chip.dataset.filter;
        const val = chip.dataset.value;
        productFilters[key] = val;
        applyProductFilters();
      }
    });

    document.getElementById('filter-type')?.addEventListener('change', (e) => {
      setProductTypeFilter(e.target.value);
      applyProductFilters();
    });

    document.getElementById('filter-min-price')?.addEventListener('input', (e) => {
      productFilters.minPrice = e.target.value;
      scheduleApplyFilters();
    });
    document.getElementById('filter-max-price')?.addEventListener('input', (e) => {
      productFilters.maxPrice = e.target.value;
      scheduleApplyFilters();
    });
    document.getElementById('filter-sort')?.addEventListener('change', (e) => {
      productFilters.sort = e.target.value;
      applyProductFilters();
    });
    document.getElementById('filter-free-shipping')?.addEventListener('change', (e) => {
      productFilters.freeShipping = e.target.checked;
      applyProductFilters();
    });
    document.getElementById('filter-on-sale')?.addEventListener('change', (e) => {
      productFilters.onSale = e.target.checked;
      applyProductFilters();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeFiltersDrawer();
    });
  }

  /* ── Product Detail ── */
  async function openProduct(productId) {
    try {
      currentProduct = await api.getProduct(productId);
    } catch {
      currentProduct = PRODUCTS.find(p => p.id === productId);
    }
    if (!currentProduct) return;

    document.title = `${currentProduct.name} — Trampolim`;
    updateProductSchema([currentProduct]);

    const specs = currentProduct.specs
      ? Object.entries(currentProduct.specs).map(([k, v]) =>
          `<div class="spec-item"><strong>${k}</strong>${v}</div>`).join('')
      : '';

    const el = document.getElementById('product-detail-content');
    if (!el) return;

    const images = currentProduct.images?.length ? currentProduct.images : [currentProduct.image];
    const thumbs = images.map((img, i) =>
      `<img src="${img}" alt="${currentProduct.name} - foto ${i + 1}" class="${i === 0 ? 'active' : ''}" data-gallery-thumb="${i}" loading="lazy" width="64" height="64">`
    ).join('');

    el.innerHTML = `
      <div class="product-detail">
        <div class="product-detail-gallery product-gallery">
          <div class="product-gallery-main">
            <img id="gallery-main" src="${images[0]}" alt="${currentProduct.name}" width="600" height="600">
          </div>
          ${images.length > 1 ? `<div class="product-gallery-thumbs">${thumbs}</div>` : ''}
        </div>
        <div class="product-detail-info">
          <span class="product-category">${CATEGORIES.find(c => c.id === currentProduct.category)?.name || ''}</span>
          <h1>${currentProduct.name}</h1>
          <p class="product-detail-brand">Marca: ${currentProduct.brand || '—'}</p>
          <div class="product-rating" style="margin-bottom:1rem">
            <span class="stars">${renderStars(currentProduct.rating)}</span>
            <span>(${currentProduct.reviews} avaliações)</span>
          </div>
          <div class="stock-badge ${currentProduct.stock < 10 ? 'low' : ''}">
            ${currentProduct.stock < 10 ? '⚠️ Últimas unidades' : '✅ Em estoque'}
          </div>
          <div class="product-detail-price">
            <span class="price-current">${formatPrice(currentProduct.price)}</span>
            ${currentProduct.oldPrice ? `<span class="price-old">${formatPrice(currentProduct.oldPrice)}</span>` : ''}
            <div class="price-installment">${installment(currentProduct.price)}</div>
          </div>
          <p class="product-detail-desc">${currentProduct.description || ''}</p>
          ${specs ? `<div class="specs-grid">${specs}</div>` : ''}
          <div class="product-detail-actions">
            <button class="btn btn-primary" data-add="${currentProduct.id}">Adicionar ao carrinho</button>
            <button class="btn btn-outline" data-buy-now="${currentProduct.id}">Comprar agora</button>
          </div>
        </div>
      </div>
      ${currentProduct.related?.length ? `
        <div class="section-header"><h2 class="section-title">Produtos relacionados</h2></div>
        <div class="products-grid" id="related-products" role="list"></div>` : ''}`;

    if (currentProduct.related?.length) {
      renderProducts('related-products', currentProduct.related);
    }

    navigateTo('product');
  }

  /* ── Cart ── */
  function renderCart() {
    const container = document.getElementById('cart-content');
    if (!container) return;

    if (!cart.length) {
      container.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty-icon" aria-hidden="true">🛒</div>
          <h2>Seu carrinho está vazio</h2>
          <p>Explore nossos produtos e encontre o ideal para seu lar.</p>
          <button class="btn btn-primary" data-action="explore">Explorar produtos</button>
        </div>`;
      return;
    }

    const items = cart.map(item => {
      const product = PRODUCTS.find(p => p.id === item.id);
      if (!product) return '';
      const img = product.image
        ? `<img src="${product.image}" alt="${product.name}" width="80" height="80">`
        : `<span style="font-size:2.5rem">${product.emoji || '📦'}</span>`;
      return `
        <div class="cart-item" data-cart-id="${item.id}">
          <div class="cart-item-image">${img}</div>
          <div class="cart-item-info">
            <div class="cart-item-name">${product.name}</div>
            <div class="cart-item-price">${formatPrice(product.price)}</div>
            <div class="cart-item-controls">
              <button class="qty-btn" data-qty-minus="${item.id}" aria-label="Diminuir">−</button>
              <span class="qty-value">${item.qty}</span>
              <button class="qty-btn" data-qty-plus="${item.id}" aria-label="Aumentar">+</button>
              <button class="qty-btn" data-remove="${item.id}" aria-label="Remover" style="margin-left:auto;color:var(--color-secondary)">✕</button>
            </div>
          </div>
        </div>`;
    }).join('');

    const subtotal = getCartSubtotal();
    const shipping = getShippingCost();
    const total = subtotal + shipping;

    container.innerHTML = `
      <div class="cart-items">${items}</div>
      <div class="cart-summary">
        <div class="summary-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
        <div class="summary-row"><span>Frete</span><span style="color:var(--color-accent)">${shipping ? formatPrice(shipping) : 'Grátis'}</span></div>
        <div class="summary-row total"><span>Total</span><span>${formatPrice(total)}</span></div>
        <button class="btn btn-primary" style="width:100%" id="btn-go-checkout">Finalizar compra</button>
      </div>`;
  }

  function updateCartBadge() {
    const total = cart.reduce((s, i) => s + i.qty, 0);
    const badge = document.getElementById('cart-badge');
    if (badge) {
      badge.textContent = total;
      badge.dataset.count = total;
    }
  }

  function updateFavoritesBadge() {
    const btn = document.getElementById('btn-favorites-header');
    const badge = document.getElementById('favorites-badge');
    const count = favorites.length;

    if (btn) {
      btn.hidden = count === 0;
      btn.classList.toggle('has-favorites', count > 0);
    }
    if (badge) {
      badge.textContent = count;
      badge.dataset.count = count;
      badge.hidden = count === 0;
    }
  }

  function addToCart(productId) {
    const existing = cart.find(i => i.id === productId);
    if (existing) existing.qty++;
    else cart.push({ id: productId, qty: 1 });
    saveCart();
    updateCartBadge();
    const product = PRODUCTS.find(p => p.id === productId);
    showToast(`✅ ${product?.name || 'Produto'} adicionado ao carrinho`);
  }

  /* ── Checkout ── */
  function renderCheckout() {
    const el = document.getElementById('checkout-content');
    if (!el) return;

    const subtotal = getCartSubtotal();
    const shipping = getShippingCost();
    const total = getCartTotal();

    const steps = ['Dados', 'Endereço', 'Pagamento', 'Confirmação'];
    const stepsHTML = steps.map((s, i) =>
      `<div class="checkout-step ${checkoutStep === i + 1 ? 'active' : ''} ${checkoutStep > i + 1 ? 'done' : ''}">${i + 1}. ${s}</div>`
    ).join('');

    let panelHTML = '';

    if (checkoutStep === 1) {
      const user = api.getUser();
      panelHTML = `
        <div class="checkout-panel">
          <h3>Seus dados</h3>
          <div class="form-group"><label class="form-label" for="ck-name">Nome completo *</label>
            <input class="form-input" id="ck-name" value="${user?.name || ''}" required></div>
          <div class="form-group"><label class="form-label" for="ck-email">E-mail *</label>
            <input class="form-input" id="ck-email" type="email" value="${user?.email || ''}" required></div>
          <div class="form-group"><label class="form-label" for="ck-phone">Telefone</label>
            <input class="form-input" id="ck-phone" type="tel" value="${user?.phone || ''}" placeholder="(11) 99999-9999"></div>
          <button class="btn btn-primary" id="ck-next-1" style="width:100%">Continuar</button>
        </div>`;
    } else if (checkoutStep === 2) {
      panelHTML = `
        <div class="checkout-panel">
          <h3>Endereço de entrega</h3>
          <div class="form-group"><label class="form-label" for="ck-cep">CEP *</label>
            <input class="form-input" id="ck-cep" placeholder="00000-000" maxlength="9" required></div>
          <div class="form-group"><label class="form-label" for="ck-street">Rua *</label>
            <input class="form-input" id="ck-street" required></div>
          <div class="form-row">
            <div class="form-group"><label class="form-label" for="ck-number">Número *</label>
              <input class="form-input" id="ck-number" required></div>
            <div class="form-group"><label class="form-label" for="ck-comp">Complemento</label>
              <input class="form-input" id="ck-comp"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label" for="ck-city">Cidade *</label>
              <input class="form-input" id="ck-city" required></div>
            <div class="form-group"><label class="form-label" for="ck-state">UF *</label>
              <input class="form-input" id="ck-state" maxlength="2" required></div>
          </div>
          <h4 style="margin:1rem 0 0.5rem;font-size:0.9rem">Opções de frete</h4>
          <div class="shipping-options">
            <label class="shipping-option ${selectedShipping === 'standard' ? 'selected' : ''}" data-shipping="standard">
              <input type="radio" name="shipping" value="standard" ${selectedShipping === 'standard' ? 'checked' : ''}>
              <div class="shipping-option-info"><strong>📦 Entrega Padrão</strong><small>5 a 10 dias úteis</small></div>
              <span class="shipping-option-price">Grátis</span>
            </label>
            <label class="shipping-option ${selectedShipping === 'express' ? 'selected' : ''}" data-shipping="express">
              <input type="radio" name="shipping" value="express" ${selectedShipping === 'express' ? 'checked' : ''}>
              <div class="shipping-option-info"><strong>🚀 Entrega Expressa</strong><small>2 a 4 dias úteis</small></div>
              <span class="shipping-option-price">${formatPrice(49.90)}</span>
            </label>
          </div>
          <button class="btn btn-primary" id="ck-next-2" style="width:100%">Continuar</button>
        </div>`;
    } else if (checkoutStep === 3) {
      panelHTML = `
        <div class="checkout-panel">
          <h3>Forma de pagamento</h3>
          <div class="payment-methods">
            <label class="payment-option selected" data-payment="pix">
              <input type="radio" name="payment" value="pix" checked>
              <span class="payment-icon">💚</span>
              <div><strong>Pix</strong><br><small>Aprovação instantânea</small></div>
            </label>
            <label class="payment-option" data-payment="card">
              <input type="radio" name="payment" value="card">
              <span class="payment-icon">💳</span>
              <div><strong>Cartão de crédito</strong><br><small>Até 12x sem juros</small></div>
            </label>
            <label class="payment-option" data-payment="mercadopago">
              <input type="radio" name="payment" value="mercadopago">
              <span class="payment-icon">🛒</span>
              <div><strong>Mercado Pago</strong><br><small>Pix, boleto ou cartão</small></div>
            </label>
          </div>
          <div id="card-fields" style="display:none;margin-top:1rem">
            <div class="form-group"><label class="form-label">Número do cartão</label>
              <input class="form-input" id="ck-card" placeholder="0000 0000 0000 0000" maxlength="19"></div>
            <div class="form-group"><label class="form-label">Nome no cartão</label>
              <input class="form-input" id="ck-card-name"></div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">Validade</label>
                <input class="form-input" id="ck-expiry" placeholder="MM/AA" maxlength="5"></div>
              <div class="form-group"><label class="form-label">CVV</label>
                <input class="form-input" id="ck-cvv" placeholder="000" maxlength="4" type="password"></div>
            </div>
            <div class="form-group"><label class="form-label">Parcelas</label>
              <select class="form-input" id="ck-installments">
                ${Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}">${i + 1}x de ${formatPrice(total / (i + 1))}</option>`).join('')}
              </select></div>
          </div>
          <button class="btn btn-primary" id="ck-pay" style="width:100%;margin-top:1rem">Pagar ${formatPrice(total)}</button>
        </div>`;
    } else if (checkoutStep === 4) {
      panelHTML = `
        <div class="order-success">
          <div class="order-success-icon">🎉</div>
          <h2>Pedido confirmado!</h2>
          <p>Obrigado pela preferência. Seu pedido foi recebido com sucesso.</p>
          ${currentOrder?.trackingCode ? `<div class="tracking-code">${currentOrder.trackingCode}</div>` : ''}
          <p style="color:var(--color-text-secondary);font-size:0.875rem">Guarde o código acima para rastrear seu pedido.</p>
          <button class="btn btn-primary" data-action="explore" style="margin-top:1rem">Continuar comprando</button>
        </div>`;
    }

    el.innerHTML = `
      <div class="checkout-steps">${stepsHTML}</div>
      <div class="cart-summary" style="margin-bottom:1.5rem;position:static">
        <div class="summary-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
        <div class="summary-row"><span>Frete</span><span>${shipping ? formatPrice(shipping) : 'Grátis'}</span></div>
        <div class="summary-row total"><span>Total</span><span>${formatPrice(total)}</span></div>
      </div>
      ${panelHTML}`;
  }

  async function processPayment() {
    const total = getCartTotal();

    const method = document.querySelector('input[name="payment"]:checked')?.value || 'pix';

    try {
      const order = await api.createOrder({
        items: cart,
        shipping: selectedShipping,
        customer: {
          name: document.getElementById('ck-name')?.value,
          email: document.getElementById('ck-email')?.value,
          phone: document.getElementById('ck-phone')?.value,
        },
        address: {
          cep: document.getElementById('ck-cep')?.value,
          street: document.getElementById('ck-street')?.value,
          number: document.getElementById('ck-number')?.value,
          complement: document.getElementById('ck-comp')?.value,
          city: document.getElementById('ck-city')?.value,
          state: document.getElementById('ck-state')?.value,
        },
      });

      currentOrder = order;

      if (method === 'pix') {
        currentPayment = await api.createPixPayment(order.id, total);
        const el = document.getElementById('checkout-content');
        el.innerHTML = `
          <div class="checkout-panel">
            <h3>💚 Pague com Pix</h3>
            <div class="pix-qr">
              <img src="${currentPayment.pixQrCode}" alt="QR Code Pix" width="250" height="250">
              <p style="margin-bottom:1rem;color:var(--color-text-secondary)">Escaneie o QR Code ou copie o código abaixo</p>
              <div class="pix-code" id="pix-code">${currentPayment.pixCode}</div>
              <button class="btn btn-outline btn-sm" id="btn-copy-pix" style="margin-bottom:1rem">📋 Copiar código Pix</button>
              <p style="font-size:0.75rem;color:var(--color-text-muted)">Expira em 30 minutos</p>
              <button class="btn btn-primary" id="btn-confirm-pix" style="width:100%;margin-top:1rem">Já paguei</button>
            </div>
          </div>`;
        return;
      }

      if (method === 'card') {
        const result = await api.payWithCard({
          orderId: order.id,
          amount: total,
          cardNumber: document.getElementById('ck-card')?.value,
          cardName: document.getElementById('ck-card-name')?.value,
          expiry: document.getElementById('ck-expiry')?.value,
          cvv: document.getElementById('ck-cvv')?.value,
          installments: document.getElementById('ck-installments')?.value,
        });
        currentOrder.trackingCode = result.trackingCode;
      } else if (method === 'mercadopago') {
        const result = await api.payWithMercadoPago(order.id, total);
        currentOrder.trackingCode = result.trackingCode || `SEL${Date.now().toString(36).toUpperCase()}`;
      }

      cart = [];
      saveCart();
      updateCartBadge();
      checkoutStep = 4;
      renderCheckout();
      showToast('🎉 Pagamento aprovado!');
    } catch (err) {
      showToast(`❌ ${err.message}`);
    }
  }

  /* ── Auth Modal ── */
  function formatCpf(value) {
    const d = value.replace(/\D/g, '').slice(0, 11);
    return d
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  function formatPhone(value) {
    const d = value.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 10) {
      return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
    }
    return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
  }

  function formatCep(value) {
    const d = value.replace(/\D/g, '').slice(0, 8);
    return d.replace(/(\d{5})(\d)/, '$1-$2');
  }

  function isValidCpf(cpf) {
    const d = cpf.replace(/\D/g, '');
    if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += Number(d[i]) * (10 - i);
    let rev = (sum * 10) % 11;
    if (rev === 10) rev = 0;
    if (rev !== Number(d[9])) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += Number(d[i]) * (11 - i);
    rev = (sum * 10) % 11;
    if (rev === 10) rev = 0;
    return rev === Number(d[10]);
  }

  function showAuthModal(tab = 'login') {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'auth-modal';
    const isRegister = tab === 'register';
    overlay.innerHTML = `
      <div class="modal ${isRegister ? 'modal-auth-register' : ''}" role="dialog" aria-label="Autenticação">
        <div class="modal-header">
          <h2 class="modal-title">Minha Conta</h2>
          <button type="button" class="modal-close" aria-label="Fechar">✕</button>
        </div>
        <div class="form-tabs">
          <button type="button" class="form-tab ${tab === 'login' ? 'active' : ''}" data-auth-tab="login">Entrar</button>
          <button type="button" class="form-tab ${isRegister ? 'active' : ''}" data-auth-tab="register">Cadastrar</button>
        </div>
        <form id="auth-form" class="auth-form ${isRegister ? 'auth-form-register' : ''}">
          ${isRegister ? `
          <div class="auth-section">
            <h3 class="auth-section-title">Dados pessoais</h3>
            <div class="form-group">
              <label class="form-label" for="auth-name">Nome completo *</label>
              <input class="form-input" id="auth-name" autocomplete="name" required placeholder="Seu nome completo">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="auth-cpf">CPF *</label>
                <input class="form-input" id="auth-cpf" inputmode="numeric" autocomplete="off" required placeholder="000.000.000-00" maxlength="14">
              </div>
              <div class="form-group">
                <label class="form-label" for="auth-birthdate">Data de nascimento *</label>
                <input class="form-input" id="auth-birthdate" type="date" required max="">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="auth-phone">Telefone *</label>
                <input class="form-input" id="auth-phone" type="tel" inputmode="tel" autocomplete="tel" required placeholder="(11) 99999-9999" maxlength="15">
              </div>
              <div class="form-group">
                <label class="form-label" for="auth-email">E-mail *</label>
                <input class="form-input" id="auth-email" type="email" required autocomplete="email" placeholder="seu@email.com">
              </div>
            </div>
          </div>
          <div class="auth-section">
            <h3 class="auth-section-title">Endereço</h3>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="auth-cep">CEP *</label>
                <input class="form-input" id="auth-cep" inputmode="numeric" autocomplete="postal-code" required placeholder="00000-000" maxlength="9">
              </div>
              <div class="form-group">
                <label class="form-label" for="auth-number">Número *</label>
                <input class="form-input" id="auth-number" autocomplete="address-line2" required placeholder="Nº">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="auth-street">Rua / Logradouro *</label>
              <input class="form-input" id="auth-street" autocomplete="address-line1" required placeholder="Rua, avenida...">
            </div>
            <div class="form-group">
              <label class="form-label" for="auth-complement">Complemento</label>
              <input class="form-input" id="auth-complement" autocomplete="address-line3" placeholder="Apto, bloco, referência...">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="auth-neighborhood">Bairro *</label>
                <input class="form-input" id="auth-neighborhood" autocomplete="address-level3" required placeholder="Bairro">
              </div>
              <div class="form-group">
                <label class="form-label" for="auth-city">Cidade *</label>
                <input class="form-input" id="auth-city" autocomplete="address-level2" required placeholder="Cidade">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="auth-state">Estado *</label>
              <select class="form-input" id="auth-state" required>
                <option value="">Selecione o estado</option>
              </select>
            </div>
          </div>
          <div class="auth-section">
            <h3 class="auth-section-title">Acesso</h3>
            <div class="form-group">
              <label class="form-label" for="auth-password">Senha *</label>
              <input class="form-input" id="auth-password" type="password" required minlength="6" autocomplete="new-password" placeholder="Mínimo 6 caracteres">
            </div>
          </div>
          ` : `
          <div class="form-group">
            <label class="form-label" for="auth-email">E-mail</label>
            <input class="form-input" id="auth-email" type="email" required autocomplete="email">
          </div>
          <div class="form-group">
            <label class="form-label" for="auth-password">Senha</label>
            <input class="form-input" id="auth-password" type="password" required minlength="6" autocomplete="current-password">
          </div>
          `}
          <div id="auth-error" class="form-error" style="display:none"></div>
          <button type="submit" class="btn btn-primary auth-submit-btn">${isRegister ? 'Criar conta' : 'Entrar'}</button>
        </form>
      </div>`;
    document.body.appendChild(overlay);
    overlay.dataset.tab = tab;

    if (isRegister) {
      fillBrazilianStates(document.getElementById('auth-state'));
      const birth = document.getElementById('auth-birthdate');
      if (birth) {
        const max = new Date();
        max.setFullYear(max.getFullYear() - 16);
        birth.max = max.toISOString().slice(0, 10);
      }
    }

    overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  }

  async function lookupAuthCep(cep) {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    try {
      const data = await api.getCep(digits);
      const street = document.getElementById('auth-street');
      const neighborhood = document.getElementById('auth-neighborhood');
      const city = document.getElementById('auth-city');
      const state = document.getElementById('auth-state');
      if (street && data.street) street.value = data.street;
      if (neighborhood && data.neighborhood) neighborhood.value = data.neighborhood;
      if (city && data.city) city.value = data.city;
      if (state && data.state) state.value = data.state;
      document.getElementById('auth-number')?.focus();
    } catch {
      showToast('CEP não encontrado');
    }
  }

  /* ── Account View ── */
  function formatCpfDisplay(cpf) {
    const d = String(cpf || '').replace(/\D/g, '');
    if (d.length !== 11) return cpf || '—';
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  function formatBirthDisplay(date) {
    if (!date) return '—';
    const [y, m, d] = String(date).split('-');
    if (!y || !m || !d) return date;
    return `${d}/${m}/${y}`;
  }

  function updateHeaderUser(user = api.getUser()) {
    const nameEl = document.getElementById('header-user-name');
    const avatarEl = document.getElementById('header-user-avatar');
    if (!nameEl || !avatarEl) return;

    if (user?.name) {
      const first = user.name.trim().split(/\s+/)[0];
      nameEl.textContent = first;
      avatarEl.textContent = first.charAt(0).toUpperCase();
    } else {
      nameEl.textContent = 'Entrar';
      avatarEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
    }
  }

  function updateAccountView() {
    const user = api.getUser();
    const header = document.querySelector('#view-account .profile-header');
    const panel = document.querySelector('#view-account .account-panel');
    updateHeaderUser(user);
    if (!header) return;

    document.getElementById('account-profile-card')?.remove();

    if (user) {
      const addr = user.address || {};
      header.innerHTML = `
        <div class="profile-avatar" aria-hidden="true">${(user.name || '?').charAt(0).toUpperCase()}</div>
        <h2 class="profile-title">Olá, ${user.name.split(' ')[0]}!</h2>
        <p class="profile-subtitle">${user.email}</p>
        <div class="account-auth-actions">
          <button type="button" class="btn btn-outline btn-sm account-auth-btn" id="btn-logout">Sair</button>
        </div>`;

      if (panel) {
        const card = document.createElement('div');
        card.id = 'account-profile-card';
        card.className = 'account-profile-card';
        card.innerHTML = `
          <h3 class="account-profile-title">Seus dados cadastrados</h3>
          <dl class="account-profile-grid">
            <div><dt>Nome</dt><dd>${user.name || '—'}</dd></div>
            <div><dt>E-mail</dt><dd>${user.email || '—'}</dd></div>
            <div><dt>Telefone</dt><dd>${user.phone || '—'}</dd></div>
            <div><dt>CPF</dt><dd>${formatCpfDisplay(user.cpf)}</dd></div>
            <div><dt>Nascimento</dt><dd>${formatBirthDisplay(user.birthdate)}</dd></div>
            <div><dt>CEP</dt><dd>${addr.cep || '—'}</dd></div>
            <div class="account-profile-full"><dt>Endereço</dt><dd>${
              [addr.street, addr.number, addr.complement, addr.neighborhood, addr.city, addr.state]
                .filter(Boolean).join(', ') || '—'
            }</dd></div>
          </dl>
          <p class="account-profile-note">Dados salvos no banco de dados da Trampolim.</p>`;
        const menu = panel.querySelector('.menu-list');
        if (menu) panel.insertBefore(card, menu);
        else panel.appendChild(card);
      }
    } else {
      header.innerHTML = `
        <div class="profile-avatar" aria-hidden="true">👤</div>
        <h2 class="profile-title">Bem-vindo à Trampolim</h2>
        <p class="profile-subtitle">Entre ou cadastre-se para aproveitar todas as vantagens</p>
        <div class="account-auth-actions">
          <button type="button" class="btn btn-primary btn-sm account-auth-btn">Entrar</button>
          <button type="button" class="btn btn-outline btn-sm account-auth-btn">Cadastrar</button>
        </div>`;
    }
  }

  async function syncUserFromDatabase() {
    if (!api.token) return null;
    try {
      const user = await api.getMe();
      api.setUser(user);
      updateAccountView();
      return user;
    } catch {
      return null;
    }
  }

  /* ── Marketplace Hub ── */
  function hubListingCardHTML(item) {
    const mp = item.marketplace || {};
    const loc = item.location ? `${item.location.city}, ${item.location.state}` : '';
    const condColor = CONDITION_COLORS[item.condition] || '#64748B';
    return `
      <article class="hub-card" role="listitem" data-hub-listing="${item.id}">
        <div class="hub-card-image" data-open-hub="${item.id}">
          <img src="${item.image}" alt="" loading="lazy" onerror="this.src='assets/showcase/smart-tvs.png'">
          <span class="hub-card-condition" style="background:${condColor}">${item.conditionLabel || item.condition}</span>
          <span class="hub-card-platform" style="background:${mp.color || '#333'};color:${mp.textColor || '#fff'}">${mp.icon || ''} ${mp.name || ''}</span>
        </div>
        <div class="hub-card-body" data-open-hub="${item.id}">
          <h3 class="hub-card-title">${item.title}</h3>
          <p class="hub-card-location">📍 ${loc}</p>
          <div class="hub-card-price">
            <strong>${formatPrice(item.price)}</strong>
            ${item.oldPrice ? `<s>${formatPrice(item.oldPrice)}</s>` : ''}
          </div>
          ${item.seller ? `<p class="hub-card-seller">${item.seller.verified ? '✓' : ''} ${item.seller.name} · ⭐ ${item.seller.rating}</p>` : ''}
        </div>
        <div class="hub-card-actions">
          ${item.isRetail
            ? `<button class="btn btn-primary btn-sm" data-add="${item.productId}">Comprar na loja</button>`
            : `<button class="btn btn-outline btn-sm" data-open-hub="${item.id}">Ver anúncio</button>`
          }
        </div>
      </article>`;
  }

  async function runHubSearch() {
    const stats = document.getElementById('hub-stats');
    const results = document.getElementById('hub-results');
    const empty = document.getElementById('hub-empty');
    if (!results) return;

    results.innerHTML = '<div class="hub-loading">Buscando em todas as plataformas...</div>';
    empty?.classList.add('hidden');

    try {
      const params = Object.fromEntries(
        Object.entries(hubFilters).filter(([, v]) => v !== '' && v != null)
      );
      const data = await api.searchMarketplace(params);
      const items = data.items || [];

      if (stats) {
        stats.innerHTML = `
          <span><strong>${data.pagination?.total || items.length}</strong> resultados</span>
          <span class="hub-stats-sep">·</span>
          <span>${data.facets?.totalCatalog || 0} no catálogo unificado</span>`;
      }

      if (!items.length) {
        results.innerHTML = '';
        empty?.classList.remove('hidden');
        return;
      }

      results.innerHTML = items.map(hubListingCardHTML).join('');
    } catch {
      results.innerHTML = '<p class="hub-muted">Erro ao buscar. Verifique se a API está rodando.</p>';
    }
  }

  function renderHubPlatforms() {
    const el = document.getElementById('hub-platforms');
    if (!el) return;
    el.innerHTML = `
      <button type="button" class="hub-platform-tab active" data-hub-marketplace="" aria-selected="true">
        <span>🌐</span> Todas
      </button>
      ${HUB_PLATFORMS.map(mp => `
        <button type="button" class="hub-platform-tab" data-hub-marketplace="${mp.id}" style="--mp-color:${mp.color}">
          <span>${mp.icon}</span> ${mp.name}
        </button>`).join('')}`;
  }

  async function initHub() {
    try {
      HUB_PLATFORMS = await api.getMarketplacePlatforms();
    } catch {
      HUB_PLATFORMS = [];
    }
    renderHubPlatforms();
    await runHubSearch();
    await renderHubAnalytics();
  }

  function renderHub() {
    initHub();
  }

  async function openHubListing(id) {
    try {
      const listing = await api.getHubListing(id);
      if (!listing) { showToast('Anúncio não encontrado'); return; }

      const el = document.getElementById('hub-listing-detail');
      if (!el) return;

      const mp = listing.marketplace || {};
      const seller = listing.seller || {};
      el.innerHTML = `
        <div class="hub-detail">
          <div class="hub-detail-gallery">
            <img src="${listing.image}" alt="${listing.title}" onerror="this.src='assets/showcase/smart-tvs.png'">
            <span class="hub-card-platform" style="background:${mp.color};color:${mp.textColor || '#fff'}">${mp.icon} ${mp.name}</span>
          </div>
          <div class="hub-detail-info">
            <span class="hub-detail-condition" style="background:${CONDITION_COLORS[listing.condition]}">${listing.conditionLabel}</span>
            <h1>${listing.title}</h1>
            <p class="hub-detail-price">${formatPrice(listing.price)} ${listing.oldPrice ? `<s>${formatPrice(listing.oldPrice)}</s>` : ''}</p>
            <p class="hub-detail-desc">${listing.description || ''}</p>
            <div class="hub-detail-meta">
              <p>📍 ${listing.location?.city}, ${listing.location?.state}</p>
              <p>👤 ${seller.name} ${seller.verified ? '✓ Verificado' : ''} · ⭐ ${seller.rating} · ${seller.salesCount} vendas</p>
              <p>👁 ${listing.views || 0} visualizações</p>
            </div>
            <div class="hub-detail-actions">
              ${listing.isRetail
                ? `<button class="btn btn-primary" data-open-product="${listing.productId}">Comprar na Trampolim</button>`
                : `<button class="btn btn-primary" id="btn-hub-deal">Contratar via Trampolim 🚀</button>
                   <p class="hub-fee-hint" id="hub-fee-hint">Comissão calculada automaticamente · pagamento seguro</p>
                   ${listing.externalUrl ? `<a class="btn btn-outline" href="${listing.externalUrl}" target="_blank" rel="noopener">Ver na ${mp.name}</a>` : ''}`
              }
            </div>
          </div>
        </div>`;

      document.getElementById('btn-hub-deal')?.addEventListener('click', () => {
        if (!api.token) {
          showToast('Faça login para contratar via Trampolim');
          showAuthModal('login');
          return;
        }
        openHubDealCheckout(listing);
      });

      api.getFeePreview(listing.id).then(preview => {
        const hint = document.getElementById('hub-fee-hint');
        if (hint && preview?.fees) {
          const f = preview.fees;
          hint.textContent = `Comissão ${formatPrice(f.platformFee)} · vendedor recebe ${formatPrice(f.netAmount)}`;
        }
      }).catch(() => {});

      navigateTo('hub-listing');
    } catch {
      showToast('Erro ao carregar anúncio');
    }
  }

  async function openHubDealCheckout(listing, existingDeal = null) {
    let fees;
    try {
      if (existingDeal) {
        fees = {
          grossAmount: existingDeal.grossAmount,
          platformFee: existingDeal.platformFee,
          processingFee: existingDeal.processingFee,
          netAmount: existingDeal.netAmount,
          buyerTotal: existingDeal.buyerTotal,
          effectivePercent: existingDeal.feeBreakdown?.platform?.percent,
          breakdown: existingDeal.feeBreakdown,
        };
      } else {
        const preview = await api.getFeePreview(listing.id);
        fees = preview.fees;
      }
    } catch (err) {
      showToast(err.message || 'Erro ao calcular taxas');
      return;
    }

    const breakdown = fees.breakdown || {};
    const platform = breakdown.platform || {};
    const processing = breakdown.processing || {};

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay visible';
    overlay.id = 'hub-deal-modal';
    overlay.innerHTML = `
      <div class="modal hub-modal hub-deal-modal" role="dialog" aria-label="Contratar via Trampolim">
        <div class="modal-header">
          <h2 class="modal-title">Contratar via Trampolim 🚀</h2>
          <button class="modal-close" type="button" aria-label="Fechar">✕</button>
        </div>
        <p class="hub-deal-listing">${listing.title}</p>
        <div class="hub-deal-fees">
          <div class="hub-deal-fee-row"><span>Valor acordado</span><strong>${formatPrice(fees.grossAmount || listing.price)}</strong></div>
          <div class="hub-deal-fee-row hub-deal-fee-deduct"><span>${platform.label || 'Comissão Trampolim'} (${fees.effectivePercent ?? '—'}%)</span><strong>− ${formatPrice(fees.platformFee || 0)}</strong></div>
          ${processing.amount ? `<div class="hub-deal-fee-row hub-deal-fee-deduct"><span>${processing.label || 'Taxa pagamento'}</span><strong>− ${formatPrice(processing.amount)}</strong></div>` : ''}
          <div class="hub-deal-fee-row hub-deal-fee-total"><span>Vendedor recebe</span><strong>${formatPrice(fees.netAmount ?? breakdown.sellerReceives ?? 0)}</strong></div>
          <div class="hub-deal-fee-row hub-deal-fee-pay"><span>Você paga</span><strong>${formatPrice(fees.buyerTotal || fees.grossAmount || listing.price)}</strong></div>
        </div>
        <div class="hub-deal-methods">
          <label class="hub-deal-method active"><input type="radio" name="deal-pay" value="pix" checked> Pix</label>
          <label class="hub-deal-method"><input type="radio" name="deal-pay" value="checkout"> Checkout Mercado Pago</label>
        </div>
        <div id="hub-deal-payment-area"></div>
        <button type="button" class="btn btn-primary" id="btn-hub-deal-pay" style="width:100%">Iniciar pagamento</button>
        <p class="hub-muted hub-deal-legal">Valores retidos pela Trampolim até confirmação. Comissão automática conforme tipo de anúncio.</p>
      </div>`;

    document.body.appendChild(overlay);
    overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelectorAll('.hub-deal-method').forEach(label => {
      label.addEventListener('click', () => {
        overlay.querySelectorAll('.hub-deal-method').forEach(l => l.classList.remove('active'));
        label.classList.add('active');
        label.querySelector('input').checked = true;
      });
    });

    const payBtn = overlay.querySelector('#btn-hub-deal-pay');
    payBtn.addEventListener('click', async () => {
      payBtn.disabled = true;
      payBtn.textContent = 'Processando…';
      try {
        const method = overlay.querySelector('input[name="deal-pay"]:checked')?.value || 'pix';
        let deal = existingDeal;
        if (!deal) {
          deal = await api.createHubDeal({ listingId: listing.id });
        }
        const user = api.getUser();
        const result = await api.payHubDeal(deal.id, {
          method: method === 'checkout' ? 'checkout' : 'pix',
          email: user?.email,
        });

        if (result.payment?.checkoutUrl || result.payment?.sandboxUrl) {
          const url = result.payment.sandboxUrl || result.payment.checkoutUrl;
          window.location.href = url;
          return;
        }

        const area = overlay.querySelector('#hub-deal-payment-area');
        area.innerHTML = `
          <div class="hub-deal-pix">
            <img src="${result.payment.pixQrCode}" alt="QR Code Pix" width="200" height="200">
            <p class="hub-muted">Escaneie ou copie o código Pix</p>
            <textarea class="form-input hub-pix-code" readonly rows="3">${result.payment.pixCode || ''}</textarea>
            <button type="button" class="btn btn-outline btn-sm" id="btn-copy-deal-pix">Copiar código</button>
            ${result.payment.mode === 'simulated' ? `<button type="button" class="btn btn-primary" id="btn-confirm-deal-pix" style="width:100%;margin-top:0.75rem">Confirmar pagamento (simulado)</button>` : ''}
          </div>`;

        payBtn.style.display = 'none';
        area.querySelector('#btn-copy-deal-pix')?.addEventListener('click', () => {
          navigator.clipboard?.writeText(result.payment.pixCode || '');
          showToast('Código Pix copiado');
        });
        area.querySelector('#btn-confirm-deal-pix')?.addEventListener('click', async () => {
          try {
            const completed = await api.confirmHubDeal(deal.id);
            showToast(`✅ Pagamento confirmado! Código: ${completed.trackingCode || deal.id}`);
            overlay.remove();
            await renderHubAnalytics();
          } catch (err) {
            showToast(err.message);
          }
        });
      } catch (err) {
        showToast(err.message || 'Erro ao iniciar pagamento');
        payBtn.disabled = false;
        payBtn.textContent = 'Iniciar pagamento';
      }
    });
  }

  async function openHubDealFromUrl(dealId) {
    try {
      const deal = await api.getHubDeal(dealId);
      const listing = await api.getHubListing(deal.listingId);
      if (deal.status === 'completed') {
        showToast(`✅ Negociação concluída · ${deal.trackingCode || deal.id}`);
        navigateTo('hub', false);
        return;
      }
      openHubDealCheckout(listing, deal);
    } catch {
      showToast('Negociação não encontrada');
    }
  }

  async function renderHubAnalytics() {
    const el = document.getElementById('hub-analytics-content');
    if (!el) return;

    if (!api.token) {
      el.innerHTML = '<p class="hub-muted">Faça login para ver seu fluxo de transações e cruzamento de contas.</p>';
      return;
    }

    try {
      const profile = await api.getHubProfile();
      const s = profile.analytics?.summary || {};
      const cross = profile.crossReference || {};
      el.innerHTML = `
        <div class="hub-analytics-grid">
          <div class="hub-stat"><span class="hub-stat-value">${s.transactionCount || 0}</span><span class="hub-stat-label">Transações</span></div>
          <div class="hub-stat"><span class="hub-stat-value">${formatPrice(s.totalGross || 0)}</span><span class="hub-stat-label">Volume bruto</span></div>
          <div class="hub-stat"><span class="hub-stat-value">${formatPrice(s.totalNet || 0)}</span><span class="hub-stat-label">Líquido</span></div>
          <div class="hub-stat"><span class="hub-stat-value">${cross.matches?.length || 0}</span><span class="hub-stat-label">Contas cruzadas</span></div>
        </div>
        ${profile.seller ? `<p class="hub-muted">Vendedor: <strong>${profile.seller.name}</strong> · ${profile.seller.salesCount} vendas</p>` : ''}
        ${cross.matches?.length ? `<p class="hub-cross-ref">🔗 ${cross.matches.length} vínculo(s) detectado(s) entre plataformas (email/telefone)</p>` : ''}`;
    } catch {
      el.innerHTML = '<p class="hub-muted">Erro ao carregar painel.</p>';
    }
  }

  function openAnnounceFree() {
    if (!api.token) {
      showToast('Faça login para anunciar grátis');
      showAuthModal('login');
      return;
    }
    navigateTo('hub');
    setTimeout(() => showHubListingForm(), 350);
  }

  async function openMyListings() {
    if (!api.token) {
      showToast('Faça login para ver seus anúncios');
      showAuthModal('login');
      return;
    }
    navigateTo('hub');
    await renderHubAnalytics();
    setTimeout(() => {
      document.querySelector('.hub-seller-cta')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  }

  async function showChatModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay visible';
    overlay.id = 'chat-modal';
    overlay.innerHTML = `
      <div class="modal hub-modal chat-modal" role="dialog" aria-label="Chat Trampolim">
        <div class="modal-header">
          <h2 class="modal-title">💬 Chat</h2>
          <button class="modal-close" type="button" aria-label="Fechar">✕</button>
        </div>
        <p class="hub-muted chat-modal-hint">Negociações e mensagens dos seus anúncios e compras.</p>
        <div id="chat-modal-list" class="chat-modal-list">
          <p class="hub-muted">Carregando conversas…</p>
        </div>
        <button type="button" class="btn btn-outline" id="btn-chat-go-hub" style="width:100%;margin-top:0.75rem">Abrir Radar Trampolim</button>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelector('#btn-chat-go-hub')?.addEventListener('click', () => {
      overlay.remove();
      navigateTo('hub');
    });

    const list = overlay.querySelector('#chat-modal-list');
    if (!api.token) {
      list.innerHTML = '<p class="hub-muted">Faça login para ver suas conversas de negociação.</p>';
      return;
    }

    try {
      const deals = await api.getMyHubDeals();
      if (!deals.length) {
        list.innerHTML = '<p class="hub-muted">Nenhuma conversa ainda. Contrate ou anuncie no Radar Trampolim.</p>';
        return;
      }
      list.innerHTML = deals.slice(0, 8).map(d => `
        <button type="button" class="chat-thread" data-deal-id="${d.id}">
          <span class="chat-thread-title">${d.listingTitle || 'Negociação'}</span>
          <span class="chat-thread-meta">${d.status === 'completed' ? '✅ Concluída' : '💬 Em andamento'} · ${formatPrice(d.grossAmount || 0)}</span>
        </button>`).join('');
      list.querySelectorAll('.chat-thread').forEach(btn => {
        btn.addEventListener('click', async () => {
          overlay.remove();
          try {
            const deal = await api.getHubDeal(btn.dataset.dealId);
            const listing = await api.getHubListing(deal.listingId);
            openHubDealCheckout(listing, deal);
          } catch {
            showToast('Não foi possível abrir a conversa');
          }
        });
      });
    } catch {
      list.innerHTML = '<p class="hub-muted">Erro ao carregar conversas.</p>';
    }
  }

  async function updateChatBadge() {
    const badge = document.getElementById('chat-badge');
    if (!badge) return;
    let count = 0;
    if (api.token) {
      try {
        const deals = await api.getMyHubDeals();
        count = deals.filter(d => d.status === 'awaiting_payment' || d.status === 'pending_payment').length;
      } catch { /* ignore */ }
    }
    badge.textContent = count;
    badge.dataset.count = count;
  }

  function showHubListingForm() {
    if (!api.token) { showToast('Faça login para publicar'); navigateTo('account'); return; }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay visible';
    modal.innerHTML = `
      <div class="modal hub-modal">
        <div class="modal-header">
          <h2>📣 Publicar anúncio</h2>
          <button class="modal-close" id="hub-modal-close" aria-label="Fechar">✕</button>
        </div>
        <form id="hub-listing-form" class="hub-form">
          <div class="form-group"><label class="form-label">Título</label><input class="form-input" name="title" required placeholder="Ex: Geladeira usada 380L"></div>
          <div class="form-group"><label class="form-label">Descrição</label><textarea class="form-input" name="description" rows="3"></textarea></div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Preço (R$)</label><input class="form-input" name="price" type="number" min="0" step="0.01" required></div>
            <div class="form-group"><label class="form-label">Condição</label>
              <select class="form-input" name="condition">
                <option value="new">Novo</option>
                <option value="semi_used">Semi-novo</option>
                <option value="used" selected>Usado</option>
                <option value="service">Serviço</option>
              </select>
            </div>
          </div>
          <div class="form-group"><label class="form-label">Tipo</label>
            <select class="form-input" name="listingType">
              <option value="product">Produto</option>
              <option value="service">Serviço</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%">Publicar no Trampolim</button>
        </form>
      </div>`;
    document.body.appendChild(modal);

    modal.querySelector('#hub-modal-close')?.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    modal.querySelector('#hub-listing-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await api.createHubListing(Object.fromEntries(fd));
        showToast('✅ Anúncio publicado!');
        modal.remove();
        runHubSearch();
      } catch (err) {
        showToast(err.message || 'Erro ao publicar');
      }
    });
  }

  async function registerHubSeller() {
    if (!api.token) { showToast('Faça login primeiro'); navigateTo('account'); return; }
    const user = api.getUser();
    try {
      const result = await api.registerHubSeller({
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: { city: 'São Paulo', state: 'SP' },
      });
      showToast(result.created ? '✅ Cadastro de vendedor concluído!' : 'Você já é vendedor');
      await renderHubAnalytics();
    } catch (err) {
      showToast(err.message || 'Erro no cadastro');
    }
  }

  function bindHubEvents() {
    document.getElementById('hub-search-btn')?.addEventListener('click', () => {
      hubFilters.q = document.getElementById('hub-search-input')?.value || '';
      runHubSearch();
    });

    document.getElementById('hub-search-input')?.addEventListener('input', (e) => {
      hubFilters.q = e.target.value;
      clearTimeout(hubSearchTimer);
      hubSearchTimer = setTimeout(runHubSearch, 400);
    });

    document.getElementById('hub-platforms')?.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-hub-marketplace]');
      if (!tab) return;
      document.querySelectorAll('[data-hub-marketplace]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      hubFilters.marketplace = tab.dataset.hubMarketplace;
      runHubSearch();
    });

    document.getElementById('hub-filters')?.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-hub-filter]');
      if (!chip) return;
      const key = chip.dataset.hubFilter;
      const val = chip.dataset.value;
      document.querySelectorAll(`[data-hub-filter="${key}"]`).forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      hubFilters[key] = val;
      runHubSearch();
    });

    ['hub-min-price', 'hub-max-price', 'hub-state', 'hub-sort'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', (e) => {
        const map = { 'hub-min-price': 'minPrice', 'hub-max-price': 'maxPrice', 'hub-state': 'state', 'hub-sort': 'sort' };
        hubFilters[map[id]] = e.target.value;
        runHubSearch();
      });
    });

    document.getElementById('btn-hub-seller-register')?.addEventListener('click', registerHubSeller);
    document.getElementById('btn-hub-new-listing')?.addEventListener('click', showHubListingForm);

    document.getElementById('hub-results')?.addEventListener('click', (e) => {
      const card = e.target.closest('[data-open-hub]');
      if (card) { openHubListing(card.dataset.openHub); return; }
    });
  }

  /* ── Navigation ── */
  function navigateTo(view, pushHistory = true) {
    if (pushHistory && view !== currentView) viewHistory.push(view);
    currentView = view;

    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${view}`)?.classList.add('active');

    document.querySelectorAll('.nav-item').forEach(item => {
      const active = item.dataset.view === view;
      item.classList.toggle('active', active);
      item.setAttribute('aria-current', active ? 'page' : 'false');
    });

    document.querySelectorAll('.desktop-nav a').forEach(link => {
      link.classList.toggle('active', link.dataset.view === view);
    });

    document.getElementById('btn-back')?.classList.toggle('visible', viewHistory.length > 1);

    const catalogViews = ['home', 'categories', 'offers', 'hub'];
    document.querySelector('.app-shell')?.classList.toggle('filters-visible', catalogViews.includes(view));
    if (!catalogViews.includes(view)) closeFiltersDrawer();
    else requestAnimationFrame(() => { syncHeaderOffset(); syncFiltersPanelPosition(); });

    if (view === 'cart') renderCart();
    if (view === 'checkout') { checkoutStep = 1; renderCheckout(); }
    if (view === 'orders') renderOrders();
    if (view === 'favorites') renderFavorites();
    if (view === 'account') { updateAccountView(); syncUserFromDatabase(); }
    if (view === 'hub') renderHub();
    if (view === 'home') document.title = 'Trampolim — Seu impulso para o trampo';
    if (view === 'hub') document.title = 'Radar Trampolim — Busca';
    if (view === 'hub-listing') document.title = 'Anúncio — Trampolim';
    if (view === 'privacy') document.title = 'Política de Privacidade — Trampolim';
    if (view === 'cookies') document.title = 'Política de Cookies — Trampolim';

    if (view !== 'home' && window.innerWidth < 1024) toggleHeaderSearch(false);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goBack() {
    if (viewHistory.length > 1) {
      viewHistory.pop();
      navigateTo(viewHistory[viewHistory.length - 1], false);
    }
  }

  /* ── SEO Schema ── */
  function updateProductSchema(products) {
    let script = document.getElementById('schema-products');
    if (!script) {
      script = document.createElement('script');
      script.id = 'schema-products';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: products.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: p.name,
          image: p.image,
          description: p.description,
          brand: { '@type': 'Brand', name: p.brand },
          offers: {
            '@type': 'Offer',
            price: p.price,
            priceCurrency: 'BRL',
            availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: p.rating,
            reviewCount: p.reviews,
          },
        },
      })),
    });
  }

  /* ── Toast ── */
  function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast success';
    toast.setAttribute('role', 'alert');
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
  }

  /* ── PWA / Baixar App ── */
  function getAppInstallUrl() {
    const url = new URL(window.location.origin + '/');
    url.searchParams.set('install', '1');
    return url.toString();
  }

  function getAppQrImageUrl(size = 220) {
    const data = encodeURIComponent(getAppInstallUrl());
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${data}&margin=8`;
  }

  function isAppInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
  }

  async function promptNativeInstall() {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
    document.getElementById('install-banner')?.remove();
    return choice?.outcome === 'accepted';
  }

  function showDownloadAppModal() {
    document.getElementById('download-app-modal')?.remove();

    const installUrl = getAppInstallUrl();
    const qrUrl = getAppQrImageUrl(240);
    const canNative = !!deferredPrompt;
    const installed = isAppInstalled();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'download-app-modal';
    overlay.innerHTML = `
      <div class="modal modal-download-app" role="dialog" aria-labelledby="download-app-title" aria-modal="true">
        <div class="modal-header">
          <h2 class="modal-title" id="download-app-title">Baixar o App Trampolim</h2>
          <button type="button" class="modal-close" aria-label="Fechar">✕</button>
        </div>
        <div class="download-app-body">
          <p class="download-app-lead">Escaneie o QR Code com a câmera do celular para abrir e instalar o Trampolim.</p>
          <div class="download-app-layout">
            <div class="download-app-qr-col">
              <div class="download-app-qr-wrap">
                <img class="download-app-qr" src="${qrUrl}" alt="QR Code para baixar o app Trampolim" width="220" height="220">
              </div>
              <p class="download-app-url">${installUrl.replace(/\?install=1$/, '')}</p>
            </div>
            <div class="download-app-info-col">
              <h3 class="download-app-how">Como instalar</h3>
              <ol class="download-app-steps">
                <li>Abra a câmera do celular e aponte para o QR Code</li>
                <li>Toque no link do Trampolim</li>
                <li>No navegador, escolha <strong>Adicionar à tela inicial</strong> ou <strong>Instalar app</strong></li>
              </ol>
            </div>
          </div>
          <div class="download-app-actions">
            ${installed
              ? '<p class="download-app-installed">✅ O app já está instalado neste dispositivo.</p>'
              : canNative
                ? '<button type="button" class="btn btn-primary" id="btn-install-native">Instalar neste dispositivo</button>'
                : '<button type="button" class="btn btn-primary" id="btn-copy-app-link">Copiar link do app</button>'
            }
            <button type="button" class="btn btn-outline" id="btn-share-app">Compartilhar</button>
          </div>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    overlay.querySelector('.modal-close')?.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    document.getElementById('btn-install-native')?.addEventListener('click', async () => {
      const ok = await promptNativeInstall();
      if (ok) {
        showToast('✅ App instalado!');
        overlay.remove();
      } else {
        showToast('Instalação cancelada ou indisponível neste navegador');
      }
    });

    document.getElementById('btn-copy-app-link')?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(installUrl);
        showToast('📋 Link do app copiado!');
      } catch {
        showToast(installUrl);
      }
    });

    document.getElementById('btn-share-app')?.addEventListener('click', async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Trampolim',
            text: 'Baixe o app Trampolim — Seu impulso para o trampo',
            url: installUrl,
          });
        } catch { /* cancelado */ }
      } else {
        try {
          await navigator.clipboard.writeText(installUrl);
          showToast('📋 Link copiado para compartilhar');
        } catch {
          showToast(installUrl);
        }
      }
    });
  }

  function initFooterAppQr() {
    const sectionQr = document.getElementById('section-app-qr');
    const footerQr = document.getElementById('footer-app-qr');
    const src = getAppQrImageUrl(200);
    if (sectionQr) sectionQr.src = src;
    if (footerQr) footerQr.src = getAppQrImageUrl(140);
  }

  function initPWA() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (!localStorage.getItem('sel-install-dismissed')) showInstallBanner();
    });

    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      document.getElementById('install-banner')?.remove();
      showToast('✅ Trampolim instalado com sucesso!');
    });

    window.addEventListener('online', () => document.getElementById('offline-badge')?.classList.remove('visible'));
    window.addEventListener('offline', () => document.getElementById('offline-badge')?.classList.add('visible'));

    initFooterAppQr();

    const params = new URLSearchParams(window.location.search);
    if (params.get('install') === '1' && !isAppInstalled()) {
      setTimeout(() => {
        if (deferredPrompt) promptNativeInstall();
        else showDownloadAppModal();
      }, 600);
    }
  }

  function showInstallBanner() {
    if (document.getElementById('install-banner') || isAppInstalled()) return;
    const banner = document.createElement('div');
    banner.id = 'install-banner';
    banner.className = 'install-banner';
    banner.innerHTML = `
      <p>📲 Instale o Trampolim no seu celular!</p>
      <button type="button" class="btn" id="btn-install">Instalar</button>
      <button type="button" class="btn btn-ghost-light" id="btn-install-qr">QR Code</button>
      <button type="button" class="modal-close" id="btn-dismiss-install" aria-label="Fechar">✕</button>`;
    document.body.appendChild(banner);

    document.getElementById('btn-install')?.addEventListener('click', async () => {
      const ok = await promptNativeInstall();
      if (ok) banner.remove();
      else showDownloadAppModal();
    });
    document.getElementById('btn-install-qr')?.addEventListener('click', () => {
      showDownloadAppModal();
    });
    document.getElementById('btn-dismiss-install')?.addEventListener('click', () => {
      localStorage.setItem('sel-install-dismissed', '1');
      banner.remove();
    });
  }

  /* ── Cookie consent (LGPD) ── */
  const COOKIE_CONSENT_KEY = 'sel-cookie-consent';

  function getCookieConsent() {
    return localStorage.getItem(COOKIE_CONSENT_KEY);
  }

  function setCookieConsent(type) {
    localStorage.setItem(COOKIE_CONSENT_KEY, type);
    localStorage.setItem('sel-cookie-consent-date', new Date().toISOString());
    hideCookieBanner();
    if (type === 'all') showToast('Preferências de cookies salvas');
  }

  function showCookieBanner(force = false) {
    if (!force && getCookieConsent()) return;
    const banner = document.getElementById('cookie-banner');
    if (!banner) return;
    banner.hidden = false;
    document.body.classList.add('cookie-banner-visible');
  }

  function hideCookieBanner() {
    const banner = document.getElementById('cookie-banner');
    if (!banner) return;
    banner.hidden = true;
    document.body.classList.remove('cookie-banner-visible');
  }

  function initCookieConsent() {
    document.getElementById('cookie-accept-all')?.addEventListener('click', () => setCookieConsent('all'));
    document.getElementById('cookie-essential-only')?.addEventListener('click', () => setCookieConsent('essential'));
    document.getElementById('cookie-settings')?.addEventListener('click', () => showCookieBanner(true));
    showCookieBanner();
  }

  /* ── Theme ── */
  /* ── Header scroll & search ── */
  function initStateSelects() {
    fillBrazilianStates(document.getElementById('header-search-state'), 'BR', 'uf');
    fillBrazilianStates(document.getElementById('hub-state'));
  }

  function getSearchState() {
    return document.getElementById('header-search-state')?.value || '';
  }

  function syncSearchState(value) {
    const header = document.getElementById('header-search-state');
    if (header && header.value !== value) header.value = value;
    productFilters.state = value || '';
  }

  function runProductSearch(query, gridId = 'products-grid', state) {
    if (state !== undefined) syncSearchState(state);
    syncSearchInputs(query);
    applyProductFilters();
    return Promise.resolve();
  }

  function syncSearchInputs(value) {
    const headerInput = document.getElementById('header-search-input');
    if (headerInput && headerInput.value !== value) headerInput.value = value;
    document.getElementById('btn-search-clear')?.toggleAttribute('hidden', !value);
  }

  function toggleHeaderSearch(forceOpen) {
    const header = document.getElementById('app-header');
    const input = document.getElementById('header-search-input');
    if (!header) return;

    const isOpen = typeof forceOpen === 'boolean' ? forceOpen : !header.classList.contains('search-open');
    header.classList.toggle('search-open', isOpen);

    if (isOpen) {
      navigateTo('home');
      setTimeout(() => input?.focus(), 120);
    }
  }

  function syncHeaderOffset() {
    const header = document.getElementById('app-header');
    if (!header) return;
    const height = Math.ceil(header.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--header-offset', `${height}px`);
  }

  function syncFiltersPanelPosition() {
    // Desktop usa position:sticky (CSS). Limpa estilos inline do antigo fixed.
    const sidebar = document.getElementById('filters-sidebar');
    const inner = sidebar?.querySelector('.filters-sidebar-inner');
    if (inner) {
      inner.style.left = '';
      inner.style.width = '';
      inner.style.top = '';
      inner.style.height = '';
      inner.style.maxHeight = '';
    }
    if (sidebar) {
      sidebar.style.width = '';
      sidebar.style.height = '';
    }
  }

  function initHeaderScroll() {
    const header = document.getElementById('app-header');
    const progress = document.getElementById('header-scroll-progress');
    if (!header) return;

    const SCROLL_LIGHT = 48;
    const SCROLL_DEEP = 220;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(100, (y / docHeight) * 100) : 0;

      header.classList.toggle('header-scrolled', y > SCROLL_LIGHT);
      header.classList.toggle('header-scrolled-deep', y > SCROLL_DEEP);
      if (progress) progress.style.width = `${pct}%`;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    const onLayout = () => {
      syncHeaderOffset();
      syncFiltersPanelPosition();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onLayout, { passive: true });
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(onLayout).observe(header);
    }
    onLayout();
    update();
  }

  function initHeaderSearch() {
    const headerInput = document.getElementById('header-search-input');
    const clearBtn = document.getElementById('btn-search-clear');
    const headerState = document.getElementById('header-search-state');

    const handleSearch = (value) => {
      syncSearchInputs(value);
      if (currentView !== 'home') navigateTo('home');
      runProductSearch(value);
    };

    const handleStateChange = (value) => {
      syncSearchState(value);
      if (currentView !== 'home') navigateTo('home');
      runProductSearch(headerInput?.value || '');
    };

    headerInput?.addEventListener('input', (e) => handleSearch(e.target.value));
    headerState?.addEventListener('change', (e) => handleStateChange(e.target.value));

    clearBtn?.addEventListener('click', () => {
      syncSearchInputs('');
      runProductSearch('');
      headerInput?.focus();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') toggleHeaderSearch(false);
    });

    document.addEventListener('click', (e) => {
      const header = document.getElementById('app-header');
      if (!header?.classList.contains('search-open')) return;
      if (e.target.closest('#header-search')) return;
      if (window.innerWidth >= 1024) return;
      toggleHeaderSearch(false);
    });
  }

  /* ── Carousel ── */
  function initCarousel() {
    const scroll = document.getElementById('categories-scroll');
    const prev = document.getElementById('cat-prev');
    const next = document.getElementById('cat-next');
    if (scroll) {
      prev?.addEventListener('click', () => scroll.scrollBy({ left: -200, behavior: 'smooth' }));
      next?.addEventListener('click', () => scroll.scrollBy({ left: 200, behavior: 'smooth' }));
      scroll.addEventListener('scroll', updateCategoryArrows, { passive: true });
      updateCategoryArrows();
    }

    const showcase = document.getElementById('showcase-track');
    const showcasePrev = document.getElementById('showcase-prev');
    const showcaseNext = document.getElementById('showcase-next');
    showcasePrev?.addEventListener('click', () => {
      showcase?.scrollBy({ left: -SHOWCASE_SCROLL_STEP, behavior: 'smooth' });
    });
    showcaseNext?.addEventListener('click', () => {
      showcase?.scrollBy({ left: SHOWCASE_SCROLL_STEP, behavior: 'smooth' });
    });
    showcase?.addEventListener('scroll', updateShowcaseArrows, { passive: true });
    window.addEventListener('resize', () => {
      updateShowcaseArrows();
      updateCategoryArrows();
    });

    document.getElementById('hero-prev')?.addEventListener('click', () => { goToHeroSlide(heroIndex - 1); startHeroAutoplay(); });
    document.getElementById('hero-next')?.addEventListener('click', () => { goToHeroSlide(heroIndex + 1); startHeroAutoplay(); });

    document.getElementById('hero-dots')?.addEventListener('click', (e) => {
      const dot = e.target.closest('[data-hero-dot]');
      if (dot) { goToHeroSlide(Number(dot.dataset.heroDot)); startHeroAutoplay(); }
    });

    if (showcase) {
      let showcaseTimer = setInterval(() => {
        const maxScroll = showcase.scrollWidth - showcase.clientWidth;
        if (maxScroll <= 0) return;
        if (showcase.scrollLeft >= maxScroll - 10) {
          showcase.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          showcase.scrollBy({ left: SHOWCASE_SCROLL_STEP, behavior: 'smooth' });
        }
      }, 4500);
      showcase.addEventListener('mouseenter', () => clearInterval(showcaseTimer));
      updateShowcaseArrows();
    }
  }

  async function lookupCep(cep) {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    try {
      const data = await api.getCep(digits);
      const street = document.getElementById('ck-street');
      const city = document.getElementById('ck-city');
      const state = document.getElementById('ck-state');
      if (street && data.street) street.value = data.street;
      if (city && data.city) city.value = data.city;
      if (state && data.state) state.value = data.state;
      document.getElementById('ck-number')?.focus();
    } catch {
      showToast('CEP não encontrado');
    }
  }

  /* ── Events ── */
  function bindEvents() {
    bindHubEvents();
    bindFiltersEvents();
    document.querySelectorAll('[data-view]').forEach(el => {
      el.addEventListener('click', (e) => { e.preventDefault(); navigateTo(el.dataset.view); });
    });

    document.getElementById('btn-back')?.addEventListener('click', goBack);
    document.getElementById('brand-link')?.addEventListener('click', (e) => {
      e.preventDefault(); viewHistory = ['home']; navigateTo('home', false);
    });
    document.getElementById('btn-cart-header')?.addEventListener('click', () => navigateTo('cart'));

    document.addEventListener('click', (e) => {
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        const a = actionBtn.dataset.action;
        if (a === 'explore') { viewHistory = ['home']; navigateTo('home', false); }
        if (a === 'offers') navigateTo('offers');
        if (a === 'categories') navigateTo('categories');
        if (a === 'hub') navigateTo('hub');
        if (a === 'announce') openAnnounceFree();
        if (a === 'my-listings') openMyListings();
        if (a === 'chat') showChatModal();
        if (a === 'download-app') { e.preventDefault(); showDownloadAppModal(); }
        if (a === 'copy-app-link') {
          e.preventDefault();
          const url = getAppInstallUrl();
          navigator.clipboard?.writeText(url)
            .then(() => showToast('📋 Link do app copiado!'))
            .catch(() => showToast(url));
        }
        if (a === 'cookie-settings') { e.preventDefault(); showCookieBanner(true); }
      }
    });

    document.addEventListener('blur', (e) => {
      if (e.target.id === 'ck-cep') lookupCep(e.target.value);
      if (e.target.id === 'auth-cep') lookupAuthCep(e.target.value);
    }, true);

    document.addEventListener('input', (e) => {
      if (e.target.id === 'auth-cpf') e.target.value = formatCpf(e.target.value);
      if (e.target.id === 'auth-phone') e.target.value = formatPhone(e.target.value);
      if (e.target.id === 'auth-cep') e.target.value = formatCep(e.target.value);
    });

    document.addEventListener('click', async (e) => {
      const openProd = e.target.closest('[data-open-product]');
      if (openProd) { openProduct(Number(openProd.dataset.openProduct)); return; }

      const add = e.target.closest('[data-add]');
      if (add) { addToCart(Number(add.dataset.add)); return; }

      const buyNow = e.target.closest('[data-buy-now]');
      if (buyNow) { addToCart(Number(buyNow.dataset.buyNow)); navigateTo('checkout'); return; }

      const fav = e.target.closest('[data-fav]');
      if (fav) {
        const id = Number(fav.dataset.fav);
        const idx = favorites.indexOf(id);
        if (idx >= 0) { favorites.splice(idx, 1); showToast('Removido dos favoritos'); }
        else { favorites.push(id); showToast('❤️ Adicionado aos favoritos'); }
        saveFavorites();
        updateFavoritesBadge();
        renderAll();
        return;
      }

      const cat = e.target.closest('[data-category]');
      if (cat) {
        activeCategory = cat.dataset.category;
        productFilters.category = activeCategory;
        const c = CATEGORIES.find(x => x.id === activeCategory);
        document.getElementById('category-products-title').textContent = `${c?.icon || ''} ${c?.name || ''}`;
        renderFiltersSidebar();
        applyProductFilters();
        navigateTo('categories');
        return;
      }

      if (e.target.id === 'btn-go-checkout') { navigateTo('checkout'); return; }

      if (e.target.id === 'btn-orders-login') { showAuthModal('login'); return; }

      if (e.target.id === 'ck-next-1') {
        const name = document.getElementById('ck-name')?.value?.trim();
        const email = document.getElementById('ck-email')?.value?.trim();
        if (!name || !email) { showToast('Preencha nome e e-mail'); return; }
        checkoutStep = 2; renderCheckout(); return;
      }
      if (e.target.id === 'ck-next-2') {
        const cep = document.getElementById('ck-cep')?.value?.trim();
        const street = document.getElementById('ck-street')?.value?.trim();
        const number = document.getElementById('ck-number')?.value?.trim();
        if (!cep || !street || !number) { showToast('Preencha CEP, rua e número'); return; }
        checkoutStep = 3; renderCheckout(); return;
      }
      if (e.target.id === 'ck-pay') { await processPayment(); return; }

      const shipOpt = e.target.closest('[data-shipping]');
      if (shipOpt) {
        selectedShipping = shipOpt.dataset.shipping;
        document.querySelectorAll('.shipping-option').forEach(o => o.classList.remove('selected'));
        shipOpt.classList.add('selected');
        renderCheckout();
        return;
      }

      const thumb = e.target.closest('[data-gallery-thumb]');
      if (thumb && currentProduct) {
        const idx = Number(thumb.dataset.galleryThumb);
        const images = currentProduct.images?.length ? currentProduct.images : [currentProduct.image];
        const main = document.getElementById('gallery-main');
        if (main && images[idx]) {
          main.src = images[idx];
          document.querySelectorAll('[data-gallery-thumb]').forEach(t => t.classList.remove('active'));
          thumb.classList.add('active');
        }
        return;
      }

      const showcase = e.target.closest('.showcase-item');
      if (showcase) {
        const themeAction = showcase.dataset.showcaseAction;
        if (themeAction === 'hub') { navigateTo('hub'); return; }
        if (themeAction === 'offers') { navigateTo('offers'); return; }
        if (themeAction === 'categories') { navigateTo('categories'); return; }
        activeCategory = showcase.dataset.category;
        productFilters.category = activeCategory;
        const c = CATEGORIES.find(x => x.id === activeCategory);
        document.getElementById('category-products-title').textContent = `${c?.icon || ''} ${c?.name || ''}`;
        renderFiltersSidebar();
        applyProductFilters();
        navigateTo('categories');
        return;
      }

      if (e.target.id === 'btn-copy-pix') {
        navigator.clipboard?.writeText(currentPayment?.pixCode || '');
        showToast('📋 Código Pix copiado!');
        return;
      }

      if (e.target.id === 'btn-confirm-pix') {
        try {
          const result = await api.confirmPixPayment(currentPayment.id);
          currentOrder.trackingCode = result.trackingCode;
          cart = []; saveCart(); updateCartBadge();
          checkoutStep = 4; renderCheckout();
          showToast('🎉 Pagamento Pix confirmado!');
        } catch (err) { showToast(`❌ ${err.message}`); }
        return;
      }

      const minus = e.target.closest('[data-qty-minus]');
      if (minus) { updateQty(Number(minus.dataset.qtyMinus), -1); return; }
      const plus = e.target.closest('[data-qty-plus]');
      if (plus) { updateQty(Number(plus.dataset.qtyPlus), 1); return; }
      const remove = e.target.closest('[data-remove]');
      if (remove) { removeFromCart(Number(remove.dataset.remove)); return; }

      const payOpt = e.target.closest('.payment-option');
      if (payOpt) {
        document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
        payOpt.classList.add('selected');
        const cardFields = document.getElementById('card-fields');
        if (cardFields) cardFields.style.display = payOpt.dataset.payment === 'card' ? 'block' : 'none';
        return;
      }

      if (e.target.id === 'btn-logout') {
        api.logout();
        updateAccountView();
        updateChatBadge();
        showToast('Você saiu da conta');
        return;
      }

      const authTab = e.target.closest('[data-auth-tab]');
      if (authTab) {
        const modal = document.getElementById('auth-modal');
        if (modal) { modal.remove(); showAuthModal(authTab.dataset.authTab); }
        return;
      }
    });

    document.addEventListener('submit', async (e) => {
      if (e.target.id === 'auth-form') {
        e.preventDefault();
        const modal = document.getElementById('auth-modal');
        const tab = modal?.dataset.tab || 'login';
        const errorEl = document.getElementById('auth-error');
        try {
          if (tab === 'login') {
            await api.login(
              document.getElementById('auth-email').value,
              document.getElementById('auth-password').value
            );
          } else {
            const cpf = document.getElementById('auth-cpf')?.value || '';
            if (!isValidCpf(cpf)) {
              throw new Error('CPF inválido. Verifique os números digitados.');
            }
            const birthdate = document.getElementById('auth-birthdate')?.value;
            if (birthdate) {
              const birth = new Date(birthdate);
              const minAge = new Date();
              minAge.setFullYear(minAge.getFullYear() - 16);
              if (birth > minAge) throw new Error('É necessário ter pelo menos 16 anos para se cadastrar.');
            }
            await api.register({
              name: document.getElementById('auth-name').value.trim(),
              email: document.getElementById('auth-email').value.trim(),
              password: document.getElementById('auth-password').value,
              phone: document.getElementById('auth-phone').value.trim(),
              cpf: cpf.replace(/\D/g, ''),
              birthdate,
              address: {
                cep: document.getElementById('auth-cep')?.value.trim() || '',
                street: document.getElementById('auth-street')?.value.trim() || '',
                number: document.getElementById('auth-number')?.value.trim() || '',
                complement: document.getElementById('auth-complement')?.value.trim() || '',
                neighborhood: document.getElementById('auth-neighborhood')?.value.trim() || '',
                city: document.getElementById('auth-city')?.value.trim() || '',
                state: document.getElementById('auth-state')?.value || '',
              },
            });
          }
          modal?.remove();
          updateAccountView();
          updateChatBadge();
          showToast('✅ Bem-vindo à Trampolim!');
        } catch (err) {
          if (errorEl) { errorEl.textContent = err.message; errorEl.style.display = 'block'; }
        }
      }

      if (e.target.id === 'track-form') {
        e.preventDefault();
        const code = document.getElementById('track-code')?.value;
        try {
          const order = await api.trackOrder(code);
          document.getElementById('track-result').innerHTML = `
            <div class="checkout-panel" style="margin-top:1rem">
              <h3>📦 Pedido ${order.trackingCode}</h3>
              <p>Status: <strong>${order.status === 'paid' ? '✅ Pago' : '⏳ Pendente'}</strong></p>
              <p>Data: ${new Date(order.createdAt).toLocaleDateString('pt-BR')}</p>
              <p>Total: ${formatPrice(order.total)}</p>
            </div>`;
        } catch (err) {
          document.getElementById('track-result').innerHTML = `<p class="form-error">${err.message}</p>`;
        }
      }
    });

    document.querySelectorAll('#view-account .btn-primary, #view-account .btn-outline').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.textContent.includes('Entrar')) showAuthModal('login');
        if (btn.textContent.includes('Cadastrar')) showAuthModal('register');
      });
    });
  }

  function updateQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
    saveCart(); updateCartBadge(); renderCart();
  }

  function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart(); updateCartBadge(); renderCart();
    showToast('Item removido');
  }

  /* ── Init ── */
  async function init() {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const dealParam = params.get('deal');
    if (viewParam) currentView = viewParam;

    bindEvents();
    initStateSelects();
    initCarousel();
    initPWA();
    initCookieConsent();
    initHeaderScroll();
    initHeaderSearch();
    updateCartBadge();
    updateFavoritesBadge();
    updateChatBadge();
    updateHeaderUser();
    document.querySelector('.app-shell')?.classList.add('filters-visible');

    document.getElementById('app-loading')?.classList.remove('hidden');
    await loadData();
    await syncUserFromDatabase();
    document.getElementById('app-loading')?.classList.add('hidden');

    if (viewParam) navigateTo(viewParam, false);
    if (dealParam && api.token) openHubDealFromUrl(dealParam);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
