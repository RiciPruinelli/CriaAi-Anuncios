'use client'
import {useState} from 'react'
export default function CreatePage(){
  const [title,setTitle]=useState(''); const [details,setDetails]=useState(''); const [tone,setTone]=useState('Profissional');
  async function submit(e){
    e.preventDefault();
    const token = localStorage.getItem('criaai_token') || '';
    const res = await fetch('/api/generate-ad', { method: 'POST', headers: {'Content-Type':'application/json','authorization': token }, body: JSON.stringify({ title, text: details }) });
    if(res.ok){ alert('Anúncio gerado com sucesso'); window.location.href = '/history'; } else { alert('Erro ao gerar anúncio') }
  }
  return (
    <div className="bg-white rounded-xl p-6 shadow">
      <h2 className="text-2xl font-semibold mb-4">Criar Conteúdo</h2>
      <label className="block text-gray-700 mb-2">Imagens do Produto <span className="text-sm text-gray-400">0/5</span></label>
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center mb-4">Adicionar</div>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="block text-sm text-gray-700 mb-1">Nome do Produto *</label><input required value={title} onChange={e=>setTitle(e.target.value)} className="w-full p-3 rounded-lg border border-gray-200" placeholder="Ex: Tênis Esportivo Premium"/></div>
        <div><label className="block text-sm text-gray-700 mb-1">Detalhes Adicionais</label><textarea value={details} onChange={e=>setDetails(e.target.value)} className="w-full p-3 rounded-lg border border-gray-200 min-h-[120px]" placeholder="Ex: Material respirável, solado antiderrapante..."/></div>
        <div><label className="block text-sm text-gray-700 mb-1">Tom de Voz</label><select value={tone} onChange={e=>setTone(e.target.value)} className="p-3 rounded-lg border border-gray-200 w-full"><option>Profissional</option><option>Conversacional</option><option>Divertido</option></select></div>
        <div><button className="w-full px-4 py-3 rounded-lg text-white font-semibold gradient-btn">✨ Cria.AI meu anúncio</button></div>
      </form>
    </div>
  )
}
