import React from 'react'

export default function Dashboard({ downloads, status }) {
  return (
    <div className="glass p-4 text-sm flex items-center gap-4 flex-wrap">
      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
        📥 Downloads: <b>{downloads}</b>
      </span>
      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
        🤖 Model: <b>{status?.model || '-'}</b>
      </span>
      <span className={`px-3 py-1 rounded-full ${status?.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        Status: <b>{status?.ok ? '✅ Connected' : '❌ Disconnected'}</b>
      </span>
    </div>
  )
}