'use client'
import {useState} from 'react'
import {useRouter}from 'next/navigation'
export default function RegisterPage(){
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const router = useRouter();
  async function submit(e){ e.preventDefault(); const res = await fetch('/api/auth/register', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email,password})}); if(res.ok) router.push('/auth/login'); else alert('Erro ao registrar') }
  return (<div className="bg-white rounded-xl p-6 shadow"><h2 className="text-xl font-semibold mb-4">Registrar</h2><form onSubmit={submit} className="space-y-3"><input placeholder='Email' value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-3 rounded-lg border"/><input placeholder='Senha' type='password' value={password} onChange={e=>setPassword(e.target.value)} className="w-full p-3 rounded-lg border"/><button className="gradient-btn w-full">Registrar</button></form></div>) 
}
