'use client';

export default function History({ isOpen, onClose }) {
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Fundo Escurecido */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-black/30 z-20 animate-fadeIn"
      ></div>

      {/* Painel Lateral */}
      <aside className="fixed top-0 left-0 h-full w-80 bg-white z-30 shadow-2xl p-6 flex flex-col transition-transform duration-300 ease-out"
             style={{ transform: isOpen ? 'translateX(0)' : 'translateX(-100%)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Histórico
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto">
          {/* Conteúdo do histórico virá aqui */}
          <p className="text-slate-500 text-sm">Nenhum anúncio criado ainda.</p>
        </div>
      </aside>
    </>
  );
}