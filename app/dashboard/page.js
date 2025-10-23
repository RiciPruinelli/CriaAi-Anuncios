// /app/dashboard/page.js (CORRIGIDO com "Opção 2" oculta para plano FREE)
'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import CreateContent from '../../components/CreateContent';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedGeneration, setSelectedGeneration] = useState(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadHistory();
  }, [router]);

  useEffect(() => {
    if (selectedGeneration && resultsRef.current) {
      const timer = setTimeout(() => {
          resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedGeneration]);

  const loadHistory = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoadingHistory(true);
    try {
      const response = await fetch('/api/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data.generations || []);
      } else {
        console.error('Erro ao carregar histórico:', response.status, response.statusText);
        toast.error(`Erro ${response.status} ao carregar histórico.`);
        if (response.status === 401) {
          localStorage.removeItem('token'); localStorage.removeItem('user'); router.push('/login');
        }
      }
    } catch (error) {
      console.error('Erro de rede ao carregar histórico:', error);
      toast.error('Erro de rede ao carregar histórico.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleGenerationSuccess = (generation) => {
    loadHistory();
    setSelectedGeneration(generation);
  };

    const copyToClipboard = (text, platform) => {
    if (text && typeof text === 'string') {
        navigator.clipboard.writeText(text).then(() => toast.success(`${platform} copiado!`)).catch(err => toast.error(`Falha ao copiar: ${err}`));
    } else {
        toast.error(`Conteúdo para ${platform} está vazio.`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try { const date = new Date(dateString); if (isNaN(date.getTime())) return 'Data inválida'; return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }); } catch (e) { return 'Data inválida'}
  };

  const downloadImage = (base64String, filename) => {
    if (!base64String || typeof base64String !== 'string' || !base64String.startsWith('data:image')) { toast.error("Formato de imagem inválido."); return; }
    try { const link = document.createElement('a'); link.href = base64String; link.download = filename || 'imagem-sem-fundo.png'; document.body.appendChild(link); link.click(); document.body.removeChild(link); toast.success("Download iniciado!"); } catch(e) { console.error("Erro download:", e); toast.error("Erro ao baixar imagem."); }
  };

  // --- NOVO COMPONENTE DE UPSELL ---
  const UpsellCard = () => (
    <div className="p-3 bg-white/60 rounded-md border-dashed border-slate-300 text-center">
      <h5 className="font-semibold text-slate-700 text-sm flex items-center justify-center gap-2">
        <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2V7a5 5 0 00-5-5zM8 7v2h4V7a3 3 0 00-3-3 3 3 0 00-3 3z"></path></svg>
        Opção 2 é um benefício Premium
      </h5>
      <p className="text-xs text-slate-600 mt-1">
        Faça o upgrade no botão <strong>✨ Fazer Upgrade</strong> (no topo da tela) para gerar múltiplas opções.
      </p>
    </div>
  );
  // --- FIM DO NOVO COMPONENTE ---

  // Função para renderizar a área de conteúdo principal
  const renderMainContent = () => {
    if (selectedGeneration) {
      // --- MOSTRAR RESULTADOS ---
      return (
        <div ref={resultsRef} className="space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2 sm:gap-3"><svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Resultado Gerado</h3>
            <button onClick={() => setSelectedGeneration(null)} className="btn-secondary py-2 px-4 text-sm font-semibold flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Criar Novo Anúncio</button>
          </div>
          {/* Card: Imagem com fundo removido */}
          {selectedGeneration.bgRemovedImageUrl && (
            <div className="card bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200"><div className="flex items-center justify-between mb-3"><h4 className="font-semibold sm:font-bold text-slate-800 flex items-center gap-2"><span className="text-blue-600">🖼️</span> Imagem Processada</h4><button onClick={() => downloadImage(selectedGeneration.bgRemovedImageUrl, `produto-${selectedGeneration.id}-sem-fundo.png`)} className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>Download</button></div><img src={selectedGeneration.bgRemovedImageUrl} alt="Imagem sem fundo" className="max-w-xs h-auto rounded-lg shadow-md mx-auto" /></div>
          )}
          {/* Card: Instagram */}
          <div className="card bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200">
            <h4 className="font-semibold sm:font-bold text-slate-800 flex items-center gap-2 mb-3"><span className="text-pink-600">📸</span> Instagram</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-500">OPÇÃO 1</span>
                  <button onClick={() => copyToClipboard(selectedGeneration.resultInstagramOp1, 'Instagram Opção 1')} className="text-xs text-pink-600 hover:text-pink-700 font-semibold">Copiar</button>
                </div>
                <p className="text-sm sm:text-base text-slate-700 whitespace-pre-wrap p-3 bg-white/60 rounded-md">{selectedGeneration.resultInstagramOp1 || 'N/A'}</p>
              </div>
              
              {/* --- LÓGICA DE EXIBIÇÃO CORRIGIDA --- */}
              {selectedGeneration.resultInstagramOp2 ? (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-500">OPÇÃO 2</span>
                    <button onClick={() => copyToClipboard(selectedGeneration.resultInstagramOp2, 'Instagram Opção 2')} className="text-xs text-pink-600 hover:text-pink-700 font-semibold">Copiar</button>
                  </div>
                  <p className="text-sm sm:text-base text-slate-700 whitespace-pre-wrap p-3 bg-white/60 rounded-md">{selectedGeneration.resultInstagramOp2}</p>
                </div>
              ) : (
                <UpsellCard /> // Mostra o card de upgrade
              )}
              {/* --- FIM DA LÓGICA --- */}
            </div>
          </div>
          {/* Card: Facebook */}
          <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <h4 className="font-semibold sm:font-bold text-slate-800 flex items-center gap-2 mb-3"><span className="text-blue-600">👥</span> Facebook</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-500">OPÇÃO 1</span>
                  <button onClick={() => copyToClipboard(selectedGeneration.resultFacebookOp1, 'Facebook Opção 1')} className="text-xs text-blue-600 hover:text-blue-700 font-semibold">Copiar</button>
                </div>
                <p className="text-sm sm:text-base text-slate-700 whitespace-pre-wrap p-3 bg-white/60 rounded-md">{selectedGeneration.resultFacebookOp1 || 'N/A'}</p>
              </div>

              {/* --- LÓGICA DE EXIBIÇÃO CORRIGIDA --- */}
              {selectedGeneration.resultFacebookOp2 ? (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-500">OPÇÃO 2</span>
                    <button onClick={() => copyToClipboard(selectedGeneration.resultFacebookOp2, 'Facebook Opção 2')} className="text-xs text-blue-600 hover:text-blue-700 font-semibold">Copiar</button>
                  </div>
                  <p className="text-sm sm:text-base text-slate-700 whitespace-pre-wrap p-3 bg-white/60 rounded-md">{selectedGeneration.resultFacebookOp2}</p>
                </div>
              ) : (
                <UpsellCard /> // Mostra o card de upgrade
              )}
              {/* --- FIM DA LÓGICA --- */}
            </div>
          </div>
          {/* Card: Marketplace */}
          <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <h4 className="font-semibold sm:font-bold text-slate-800 flex items-center gap-2 mb-3"><span className="text-green-600">🛒</span> Marketplace</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-500">OPÇÃO 1</span>
                  <button onClick={() => copyToClipboard(selectedGeneration.resultMarketplaceOp1, 'Marketplace Opção 1')} className="text-xs text-green-600 hover:text-green-700 font-semibold">Copiar</button>
                </div>
                <p className="text-sm sm:text-base text-slate-700 whitespace-pre-wrap p-3 bg-white/60 rounded-md">{selectedGeneration.resultMarketplaceOp1 || 'N/A'}</p>
              </div>

              {/* --- LÓGICA DE EXIBIÇÃO CORRIGIDA --- */}
              {selectedGeneration.resultMarketplaceOp2 ? (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-500">OPÇÃO 2</span>
                    <button onClick={() => copyToClipboard(selectedGeneration.resultMarketplaceOp2, 'Marketplace Opção 2')} className="text-xs text-green-600 hover:text-green-700 font-semibold">Copiar</button>
                  </div>
                  <p className="text-sm sm:text-base text-slate-700 whitespace-pre-wrap p-3 bg-white/60 rounded-md">{selectedGeneration.resultMarketplaceOp2}</p>
                </div>
              ) : (
                <UpsellCard /> // Mostra o card de upgrade
              )}
              {/* --- FIM DA LÓGICA --- */}
            </div>
          </div>
          {/* Card: Hashtags */}
          <div className="card bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200"><div className="flex items-center justify-between mb-3"><h4 className="font-semibold sm:font-bold text-slate-800 flex items-center gap-2"><span className="text-amber-600">#️⃣</span> Hashtags</h4><button onClick={() => copyToClipboard(selectedGeneration.hashtags || '', 'Hashtags')} className="text-xs sm:text-sm text-amber-600 hover:text-amber-700 font-semibold">Copiar</button></div><p className="text-sm sm:text-base text-slate-700 whitespace-pre-wrap">{Array.isArray(selectedGeneration.hashtags) ? selectedGeneration.hashtags.join(' ') : selectedGeneration.hashtags || 'N/A'}</p></div>
        </div>
      );
    }
    // --- SE NENHUMA GERAÇÃO ESTIVER SELECIONADA, MOSTRA O FORMULÁRIO ---
    console.log(">>>> Dashboard: [renderMainContent] Renderizando CreateContent.");
    return <CreateContent onSuccess={handleGenerationSuccess} />;
  };

  // === JSX Principal da Página ===
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 overflow-hidden">
        {/* Sidebar */}
        <aside className={`fixed lg:sticky top-16 lg:top-8 bottom-0 lg:bottom-auto left-0 z-40 w-64 bg-white shadow-xl transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out lg:flex-shrink-0 lg:h-[calc(100vh-6rem)] lg:self-start lg:rounded-xl overflow-y-hidden`}>
          <div className="p-4 sm:p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2"><svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Histórico</h3>
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg transition-colors"><svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            {loadingHistory ? ( <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div> )
              : history.length === 0 ? ( <div className="flex-1 flex flex-col items-center justify-center text-center py-8"><svg className="w-12 h-12 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg><p className="text-sm text-slate-500">Nenhum anúncio.</p></div> )
              : ( <div className="flex-1 overflow-y-auto space-y-2 pr-1 sm:pr-2 -mr-1 sm:-mr-2"> {history.map((item) => ( <button key={item.id} onClick={() => { setSelectedGeneration(item); setIsSidebarOpen(false); }} className={`block w-full text-left p-2.5 sm:p-3 rounded-lg border transition-all ${selectedGeneration?.id === item.id ? 'bg-purple-50 border-purple-300 shadow-sm' : 'bg-slate-50 border-slate-100 hover:bg-purple-50 hover:border-purple-200'}`}><div className="font-semibold text-sm text-slate-800 mb-1 truncate">{item.title}</div><div className="text-xs text-slate-500 flex items-center gap-1.5"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>{formatDate(item.createdAt)}</div></button> ))} </div> )}
          </div>
        </aside>
        {/* Overlay */}
        {isSidebarOpen && (<div className="fixed inset-0 bg-black bg-opacity-30 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>)}
        {/* Conteúdo Principal */}
        <main className="flex-1 lg:ml-8 w-full overflow-y-auto h-[calc(100vh-6rem)] pr-1 scroll-smooth">
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
}