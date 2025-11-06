import React, { useEffect, useState } from 'react'

export default function History({ history, onDeleteHistory, formatTimestamp, refreshHistory, lastUpdate }) {
  const [lastRefresh, setLastRefresh] = useState(Date.now())
  
  // Auto-refresh when history changes or lastUpdate prop changes
  useEffect(() => {
    console.log('History updated, showing', history.length, 'presentations')
  }, [history, lastUpdate])

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

  const handleRefresh = async () => {
    if (refreshHistory) {
      await refreshHistory()
      setLastRefresh(Date.now())
    }
  }

  const getDepthColor = (depth) => {
    switch(depth) {
      case 'basic': return 'bg-blue-100 text-blue-800'
      case 'detailed': return 'bg-green-100 text-green-800'
      case 'comprehensive': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDepthName = (depth) => {
    switch(depth) {
      case 'basic': return 'BASIC'
      case 'detailed': return 'DETAILED'
      case 'comprehensive': return 'COMPREHENSIVE'
      default: return 'DETAILED'
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Presentation History</h2>
          <p className="text-sm text-gray-600 mt-1">
            {history.length} presentations • Auto-updates on download
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefresh}
            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center gap-2"
            title="Refresh history"
          >
            🔄 Refresh
          </button>
          {history.length > 0 && (
            <button 
              onClick={clearHistory}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {history.length === 0 ? (
        <div className="glass p-8 text-center">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold mb-2">No History Yet</h3>
          <p className="text-gray-600">Your generated presentations will appear here automatically.</p>
          <button 
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Refresh History
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Refresh indicator */}
          <div className="text-xs text-gray-500 text-center">
            Last updated: {new Date(lastRefresh).toLocaleTimeString()}
          </div>
          
          {/* History items */}
          <div className="grid gap-4">
            {history.map((item) => (
              <div key={item.id} className="glass p-4 card-hover border-l-4 border-blue-400">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                    {item.topic}
                    {item.downloaded && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded animate-pulse">
                        ✅ Downloaded
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {item.slides || '?'} slides
                    </span>
                    {item.downloaded && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        {item.download_count || 1}x
                      </span>
                    )}
                    <button 
                      onClick={() => deleteItem(item.id, item.topic)}
                      className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200 transition-colors"
                      title="Delete this presentation"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Style */}
                    <span className="text-sm font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded">
                      {item.style || 'Blue-Professional'}
                    </span>
                    
                    {/* Content Depth */}
                    <span className={`text-xs px-2 py-1 rounded ${getDepthColor(item.content_depth)}`}>
                      {getDepthName(item.content_depth)}
                    </span>
                    
                    {/* Images */}
                    {item.include_images && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        🖼️ Images
                      </span>
                    )}
                    
                    {/* Background Color */}
                    {item.background_color && item.background_color !== "#FFFFFF" && (
                      <div className="flex items-center gap-1 text-xs">
                        <span>BG:</span>
                        <div 
                          className="w-4 h-4 rounded border border-gray-300"
                          style={{ backgroundColor: item.background_color }}
                          title={item.background_color}
                        ></div>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs font-medium text-gray-500 flex flex-col items-end">
                    <div>Created: {formatTimestamp(item.created_at)}</div>
                    {item.downloaded && (
                      <div className="text-green-600 font-semibold">
                        ✓ Downloaded {item.download_count || 1} time(s)
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Additional Info Row */}
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>ID: {item.id}</span>
                    {item.downloaded && (
                      <span className="text-green-600">
                        Last downloaded: {formatTimestamp(item.updated_at) || 'Recently'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {history.length > 0 && (
        <div className="mt-6 text-center">
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            🔄 Refresh History
          </button>
          <div className="mt-2 text-sm text-gray-500">
            Showing {history.length} most recent presentations • Auto-updates on download
          </div>
        </div>
      )}
    </div>
  )
}