import { useAuth } from '../context/AuthContext';

const MENU_ITEMS = [
  { icon: '📦', label: 'Meus Pedidos' },
  { icon: '❤️', label: 'Favoritos' },
  { icon: '📍', label: 'Endereços' },
  { icon: '💳', label: 'Formas de Pagamento' },
  { icon: '🔔', label: 'Notificações' },
  { icon: '❓', label: 'Ajuda e Suporte' },
];

export default function AccountView({ onLogin, onRegister }) {
  const { user, logout } = useAuth();

  return (
    <section aria-label="Minha conta">
      <div className="profile-header">
        {user ? (
          <>
            <div className="profile-avatar">{user.name.charAt(0).toUpperCase()}</div>
            <h2>Olá, {user.name.split(' ')[0]}!</h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>{user.email}</p>
            <button className="btn btn-outline btn-sm" onClick={logout} style={{ marginTop: '1rem' }}>Sair</button>
          </>
        ) : (
          <>
            <div className="profile-avatar">👤</div>
            <h2>Bem-vindo à Trampolim</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>Entre ou cadastre-se para aproveitar todas as vantagens</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem' }}>
              <button className="btn btn-primary btn-sm" onClick={onLogin}>Entrar</button>
              <button className="btn btn-outline btn-sm" onClick={onRegister}>Cadastrar</button>
            </div>
          </>
        )}
      </div>
      <nav className="menu-list" aria-label="Menu da conta">
        {MENU_ITEMS.map(({ icon, label }) => (
          <button key={label} className="menu-item" type="button">
            <span className="menu-item-icon">{icon}</span>
            <span className="menu-item-text">{label}</span>
            <span className="menu-item-arrow">›</span>
          </button>
        ))}
      </nav>
    </section>
  );
}
