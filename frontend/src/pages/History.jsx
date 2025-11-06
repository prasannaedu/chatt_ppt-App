import React from 'react'

export default function History({ history, onDeleteHistory, formatTimestamp }) {
  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      onDeleteHistory()
    }
  }

  const deleteItem = (presentationId, topic) => {
    if (window.confirm(`Are you sure you want to delete "${topic}"?`)) {
      onDeleteHistory(presentationId)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Presentation History</h2>
        {history.length > 0 && (
          <button 
            onClick={clearHistory}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
          >
            Clear All
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="glass p-8 text-center">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold mb-2">No History Yet</h3>
          <p className="text-gray-600">Your generated presentations will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {history.map((item) => (
            <div key={item.id} className="glass p-4 card-hover">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg text-gray-800">{item.topic}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {item.slides || '?'} slides
                  </span>
                  {item.downloaded && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      ✅ Downloaded ({item.download_count || 1}x)
                    </span>
                  )}
                  <button 
                    onClick={() => deleteItem(item.id, item.topic)}
                    className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm text-gray-600 gap-2">
                <div className="flex items-center gap-4">
                  <span>Style: {item.style || 'Blue-Professional'}</span>
                  {item.include_images && (
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      🖼️ Images
                    </span>
                  )}
                  {item.background_color && item.background_color !== "#FFFFFF" && (
                    <div className="flex items-center gap-1">
                      <span>BG:</span>
                      <div 
                        className="w-4 h-4 rounded border border-gray-300"
                        style={{ backgroundColor: item.background_color }}
                      ></div>
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium">
                  Created: {formatTimestamp(item.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {history.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-500">
          Showing {history.length} most recent presentations
        </div>
      )}
    </div>
  )
}