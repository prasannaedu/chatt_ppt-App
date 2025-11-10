import React from 'react'

export default function Dashboard({ downloads, status }) {
  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800'
    
    if (status.ok) {
      return 'bg-green-100 text-green-800'
    }
    return 'bg-yellow-100 text-yellow-800'
  }

  const getStatusText = (status) => {
    if (!status) return 'Checking Gemini AI...'
    
    if (status.ok) {
      return '✅ Gemini AI Connected'
    }
    return '🔄 Enhanced Generation'
  }

  const getModelDisplay = (status) => {
    return 'Gemini 2.5 Flash'
  }

  return (
    <div className="glass p-4 text-sm flex items-center gap-4 flex-wrap">
      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
        📥 Downloads: <b>{downloads}</b>
      </span>
      <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
        🤖 AI: <b>{getModelDisplay(status)}</b>
      </span>
      <span className={`px-3 py-1 rounded-full ${getStatusColor(status)}`}>
        Status: <b>{getStatusText(status)}</b>
      </span>
      {status?.ok && (
        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
          🚀 Real AI Generation
        </span>
      )}
    </div>
  )
}