'use client'
import {useEffect, useState} from 'react'
export default function HistoryPage(){
  const [ads,setAds]=useState([])
  useEffect(()=>{ fetch('/api/ads').then(r=>r.json()).then(setAds) },[])
  return (
    <div className="bg-white rounded-xl p-6 shadow">
      <h2 className="text-2xl font-semibold mb-4">Histórico</h2>
      <ul className="space-y-4">
        {ads.map(a=>(
          <li key={a.id} className="border-l-4 border-violet-400 pl-4">
            <div className="flex items-center justify-between"><h3 className="font-semibold">{a.title}</h3><small className="text-gray-500">{new Date(a.createdAt).toLocaleDateString()}</small></div>
            <p className="text-gray-700 mt-1">{a.text}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
