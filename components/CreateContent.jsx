// /components/CreateContent.jsx (CORRIGIDO com Tabela Comparativa de Planos)
'use client';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

export default function CreateContent({ onSuccess }) {
  // === Estados ===
  const [productName, setProductName] = useState('');
  const [details, setDetails] = useState('');
  const [tone, setTone] = useState('Profissional');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bgRemovalLimit, setBgRemovalLimit] = useState(3);
  const [bgRemovalPerGenerationLimit, setBgRemovalPerGenerationLimit] = useState(1);
  const [isLimitChecked, setIsLimitChecked] = useState(false);
  const [userPlan, setUserPlan] = useState('FREE'); 
  const fileInputRef = useRef(null);

  // === Efeito para buscar o limite ===
  useEffect(() => {
    const checkBgRemovalLimit = async () => {
      console.log(">>>> CreateContent: [useEffect] Verificando limite de BG...");
      const token = localStorage.getItem('token');
      if (!token) { setIsLimitChecked(true); return; }
      try {
        const response = await fetch('/api/user/info', { headers: { 'Authorization': `Bearer ${token}` } });
        if (response.ok) {
          const data = await response.json();
          
          if (data.user?.plan) {
            setUserPlan(data.user.plan); 
          }

          const usedThisMonth = data.user?.bgRemovalUsesThisMonth;
          const limits = data.limits; 
          if (typeof usedThisMonth === 'number' && !isNaN(usedThisMonth) && limits) {
              const remaining = limits.bg_removals_monthly - usedThisMonth;
              setBgRemovalLimit(Math.max(0, remaining));
              setBgRemovalPerGenerationLimit(limits.bg_removals_per_generation);
          } else { setBgRemovalLimit(3); setBgRemovalPerGenerationLimit(1); }
        } else { setBgRemovalLimit(3); setBgRemovalPerGenerationLimit(1); }
      } catch (error) { setBgRemovalLimit(3); setBgRemovalPerGenerationLimit(1); } 
      finally { setIsLimitChecked(true); }
    };
    checkBgRemovalLimit();
  }, []);

  // === Funções de Imagem ===
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (images.length + files.length > 5) { toast.error('Máximo de 5 imagens.'); return; }
    if (files.length > bgRemovalPerGenerationLimit) { toast.error(`Máximo de ${bgRemovalPerGenerationLimit} imagens com remoção de fundo por anúncio.`); return; }
    const newImagesPromises = files.map(file => {
        return new Promise((resolve) => {
            const previewUrl = URL.createObjectURL(file);
            resolve({ file, preview: previewUrl, name: file.name, removeBg: false });
        });
    });
    Promise.all(newImagesPromises).then(newImages => {
        setImages(prev => [...prev, ...newImages].slice(0, 5));
    });
    if (fileInputRef.current) { fileInputRef.current.value = ''; }
  };

  const removeImage = (indexToRemove) => {
    setImages(prev => {
      const imageToRemove = prev[indexToRemove];
      if (imageToRemove?.preview) URL.revokeObjectURL(imageToRemove.preview);
      return prev.filter((_, i) => i !== indexToRemove);
    });
  };

  const toggleRemoveBg = (index) => {
    const currentImage = images[index];
    if (bgRemovalLimit <= 0 && !currentImage.removeBg) {
        toast.error(`Limite mensal de remoções atingido.`);
        return;
    }
    if (!currentImage.removeBg && images.filter(img => img.removeBg).length >= bgRemovalPerGenerationLimit) {
        toast.error(`Limite de ${bgRemovalPerGenerationLimit} remoção de fundo por anúncio atingido.`);
        return;
    }
    setImages(prev => prev.map((img, i) => ({ ...img, removeBg: i === index ? !img.removeBg : false })));
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // === Função de Submissão (Completa) ===
  const handleSubmit = async () => {
    if (!productName.trim()) { toast.error('Insira o nome do produto.'); return; }
    const imageWithBgRemoval = images.find(img => img.removeBg);
    if (imageWithBgRemoval && bgRemovalLimit <= 0) { toast.error('Limite de remoções atingido.'); return; }

    setLoading(true);
    const loadingToast = toast.loading('Gerando seu anúncio... a mágica está acontecendo! ✨');
    const token = localStorage.getItem('token');

    try {
      const base64Images = await Promise.all(images.map(img => convertToBase64(img.file)));
      const payload = { title: productName, description: details, tone, images: base64Images, removeBg: !!imageWithBgRemoval };

      const response = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) { throw new Error(data.error || 'Erro desconhecido'); }
      toast.success('Anúncio gerado!', { id: loadingToast });

      setProductName(''); setDetails(''); setTone('Profissional'); setImages([]);
      if (imageWithBgRemoval) { setBgRemovalLimit(prev => Math.max(0, prev - 1)); }
      if (onSuccess) { onSuccess(data.generation); }

    } catch (error) {
      console.error('>>>> CreateContent: [handleSubmit] ERRO:', error);
      toast.error(error.message || 'Erro ao gerar', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  // === A Estrutura Visual (JSX - 100% COMPLETA E FINAL) ===
  return (
    <div className="space-y-6">
      {/* Título da Seção */}
      <div className="flex items-center gap-3">
        <div className="w-1 h-8 bg-gradient-to-b from-purple-600 to-violet-600 rounded-r"></div>
        <h2 className="text-2xl font-bold text-slate-800">Criar Conteúdo</h2>
      </div>

      {/* Card Principal do Formulário */}
      <div className="card">
        {/* Seção de Upload de Imagens */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-slate-700">Imagens do Produto</label>
            <span className="text-sm text-slate-400 font-medium">{images.length}/5</span>
          </div>
          <div className="alert alert-info mb-4">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg>
              <div><strong>Recomendado:</strong> Carregue fotos para resultados mais precisos.</div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {/* Botão Adicionar */}
            {images.length < 5 && (
              <label className="image-upload-area aspect-square cursor-pointer">
                <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                <span className="text-xs sm:text-sm text-slate-600 font-medium text-center">Adicionar</span>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={loading}/>
              </label>
            )}
            {/* Mapeamento das Imagens */}
            {Array.isArray(images) && images.map((img, index) => {
                if (!img || !img.preview) { return null; }
                return (
                  <div key={img.name || index} className="image-preview aspect-square group relative">
                    <img src={img.preview} alt={img.name || `Imagem ${index + 1}`} className="w-full h-full object-cover rounded-xl" onError={(e) => { e.target.style.display='none'; }}/>
                    <button onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-white/70 backdrop-blur-sm rounded-full p-1 shadow-md hover:bg-red-100 text-slate-600 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100 z-10" disabled={loading} title="Remover imagem">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                    <label className="absolute bottom-1.5 left-1.5 flex items-center gap-1 bg-white/80 backdrop-blur-sm px-1.5 py-0.5 rounded-full shadow-md text-[10px] sm:text-xs cursor-pointer hover:bg-white transition-colors z-10">
                      <input type="checkbox" checked={img.removeBg} onChange={() => toggleRemoveBg(index)} className={`w-3 h-3 text-purple-600 rounded focus:ring-purple-500 border-slate-300 ${loading || (!img.removeBg && bgRemovalLimit <= 0 && isLimitChecked) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        disabled={loading || (!img.removeBg && bgRemovalLimit <= 0 && isLimitChecked)}
                        title={bgRemovalLimit <= 0 && !img.removeBg && isLimitChecked ? `Limite mensal de remoções atingido` : `Remover fundo (Restantes: ${bgRemovalLimit} mensais, ${bgRemovalPerGenerationLimit} por anúncio)`}/>
                      <span className="hidden sm:inline select-none">Remover Fundo</span>
                      <span className="sm:hidden select-none">BG</span>
                    </label>
                  </div>
                );
            })}
          </div>
        </div>
        {/* Campos de Texto */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Nome do Produto <span className="text-red-500">*</span></label>
          <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} className="input-field" placeholder="Ex: Tênis Esportivo Premium" disabled={loading} />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Detalhes Adicionais</label>
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} className="input-field resize-none" rows="4" placeholder="Ex: Material respirável, solado antiderrapante..." disabled={loading}></textarea>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Tom de Voz</label>
          <select value={tone} onChange={(e) => setTone(e.target.value)} className="input-field" disabled={loading}>
            <option>Profissional</option> <option>Amigável</option> <option>Divertido</option> <option>Urgente</option> <option>Luxuoso</option>
          </select>
        </div>
        
        {/* Botão de Gerar (CORRIGIDO) */}
        <button onClick={handleSubmit} disabled={loading || !productName.trim()} className="btn-primary w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? ( <><svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Gerando anúncio...</> )
            : ( <>✨ Cria.AI meu anúncio</> )}
        </button>
      </div>

      {/* === NOVO CARD DE BENEFÍCIOS (SÓ APARECE SE O PLANO FOR 'FREE') === */}
      {userPlan === 'FREE' && (
        <div className="card border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-violet-600 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-800 mb-2">Evolua para o Plano Premium!</h3>
              <p className="text-sm text-slate-600 mb-4">Compare os benefícios e desbloqueie todo o potencial da IA para seus anúncios:</p>

              {/* === Tabela de Comparação === */}
              <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-3 gap-2 items-center">
                  <span className="text-sm font-bold text-slate-700">Recurso</span>
                  <span className="text-sm font-bold text-slate-500 text-center">Grátis</span>
                  <span className="text-sm font-bold text-purple-600 text-center bg-purple-100 rounded-full px-3 py-0.5">✨ Premium</span>
                </div>
                
                {/* Linha 1: Gerações de Texto */}
                <div className="grid grid-cols-3 gap-2 items-center p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                  <span className="text-sm font-medium text-slate-700">Gerações de Texto</span>
                  <span className="text-sm text-slate-600 text-center">30 / mês</span>
                  <span className="text-sm font-semibold text-purple-700 text-center">Ilimitadas</span>
                </div>
                
                {/* Linha 2: Opções por Geração */}
                <div className="grid grid-cols-3 gap-2 items-center p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                  <span className="text-sm font-medium text-slate-700">Opções por Geração</span>
                  <span className="text-sm text-slate-600 text-center">1 opção</span>
                  <span className="text-sm font-semibold text-purple-700 text-center">2 opções</span>
                </div>
                
                {/* Linha 3: Remoção de Fundo (Mês) */}
                <div className="grid grid-cols-3 gap-2 items-center p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                  <span className="text-sm font-medium text-slate-700">Remoção de Fundo (Mês)</span>
                  <span className="text-sm text-slate-600 text-center">3 / mês</span>
                  <span className="text-sm font-semibold text-purple-700 text-center">10 / mês</span>
                </div>

                {/* Linha 4: Remoção de Fundo (Anúncio) */}
                <div className="grid grid-cols-3 gap-2 items-center p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                  <span className="text-sm font-medium text-slate-700">Remoção de Fundo (Anúncio)</span>
                  <span className="text-sm text-slate-600 text-center">1 / anúncio</span>
                  <span className="text-sm font-semibold text-purple-700 text-center">3 / anúncio</span>
                </div>
              </div>
              {/* === Fim da Tabela === */}
              
              <p className="text-sm text-slate-600 mt-4">
                Clique no botão <strong>✨ Fazer Upgrade</strong> no topo da página para assinar!
              </p>
            </div>
          </div>
        </div>
      )}
      {/* === FIM DO NOVO CARD === */}
      
      {/* Card "Pronto para vender mais?" */}
      <div className="card bg-gradient-to-br from-purple-50 to-violet-50 border-purple-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-violet-600 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Pronto para vender mais?</h3>
            <p className="text-sm text-slate-600 mb-4">Adicione imagens do seu produto, preencha os detalhes e deixe nossa IA criar conteúdo profissional otimizado para conversão.</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl p-3 border border-purple-100"><div className="text-sm font-semibold text-slate-800">Instagram</div><div className="text-xs text-slate-500">Posts + Hashtags</div></div>
              <div className="bg-white rounded-xl p-3 border border-purple-100"><div className="text-sm font-semibold text-slate-800">Facebook</div><div className="text-xs text-slate-500">Posts de vendas</div></div>
              <div className="bg-white rounded-xl p-3 border border-purple-100"><div className="text-sm font-semibold text-slate-800">Marketplace</div><div className="text-xs text-slate-500">Descrições SEO</div></div>
              <div className="bg-white rounded-xl p-3 border border-purple-100"><div className="text-sm font-semibold text-slate-800">Hashtags</div><div className="text-xs text-slate-500">Para vendas</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}