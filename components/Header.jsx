'use client';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

export default function Header({ onMenuClick }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');
    // Se não houver token, não faz nada, pois o useEffect do dashboard vai redirecionar
    if (!token) return;

    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/user/info', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user); // Agora o usuário tem o 'plan'
        } else {
          // Se a sessão for inválida, limpa e redireciona
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
        }
      } catch (error) {
        console.error("Erro ao buscar informações do usuário:", error);
      }
    };

    fetchUserInfo();
  }, []);

    const handleUpgrade = async () => {
    setIsUpgrading(true);
    const token = localStorage.getItem('token');
    const loadingToast = toast.loading('Redirecionando para o pagamento...');

    try {
      const response = await fetch('/api/mercadopago/checkout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao criar o link de pagamento.');
      }

      // Redireciona o usuário para a URL de checkout do Mercado Pago
      window.location.href = data.checkoutUrl;

    } catch (error) {
      toast.error(error.message, { id: loadingToast });
      setIsUpgrading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo e título */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-violet-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">criar.AI anúncios</h1>
                <p className="text-xs text-slate-500">Conteúdo de marketing com IA</p>
              </div>
            </div>
          </div>

          {/* Menu do usuário e Upgrade */}
          <div className="flex items-center gap-4">
            {user && user.plan === 'FREE' && (
              <button 
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isUpgrading ? 'Aguarde...' : '✨ Fazer Upgrade'}
              </button>
            )}

            {user && (
              <div className="hidden sm:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-800">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-violet-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-700 font-semibold text-sm">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors"
              title="Sair"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

