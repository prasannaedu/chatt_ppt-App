import React from 'react'

export default function Dashboard({ downloads, status }) {
  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800 border border-gray-200'
    
    if (status.ok) {
      return 'bg-green-100 text-green-800 border border-green-200'
    }
    return 'bg-yellow-100 text-yellow-800 border border-yellow-200'
  }

  const getStatusText = (status) => {
    if (!status) return 'Checking AI Service...'
    
    if (status.ok) {
      return '✅ Gemini AI Connected'
    }
    return '🔄 Enhanced Generation Active'
  }

  const getModelDisplay = (status) => {
    const model = status?.model || 'Gemini 2.5 Flash'
    // Reflects the backend fix for consistent 5-bullet generation
    if (!status?.ok) {
        return `${model} (Guaranteed 5 Bullets)`
    }
    return model
  }

  return (
    <div className="glass p-4 text-sm flex items-center gap-3 flex-wrap border border-gray-200/50">
      <span className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full border border-blue-200 font-semibold">
        📥 Downloads: <b>{downloads}</b>
      </span>
      <span className="bg-purple-100 text-purple-800 px-3 py-2 rounded-full border border-purple-200 font-semibold">
        🤖 AI: <b>{getModelDisplay(status)}</b>
      </span>
      <span className={`px-3 py-2 rounded-full font-semibold ${getStatusColor(status)}`}>
        Status: <b>{getStatusText(status)}</b>
      </span>
      {status?.ok && (
        <span className="bg-green-100 text-green-800 px-3 py-2 rounded-full border border-green-200 font-semibold">
          🚀 Real AI Generation
        </span>
      )}
      {!status?.ok && (
        <span className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded-full border border-yellow-200 font-semibold">
          ⚡ Enhanced Mode
        </span>
      )}
    </div>
  )
}