import React, { useEffect, useState } from 'react'

export default function History({ history, onDeleteHistory, formatTimestamp, refreshHistory, lastUpdate }) {
  const [lastRefresh, setLastRefresh] = useState(Date.now())
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Auto-refresh when history changes or lastUpdate prop changes
  useEffect(() => {
    console.log('History component updated with', history.length, 'items')
    setLastRefresh(Date.now())
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
    setIsRefreshing(true)
    try {
      if (refreshHistory) {
        await refreshHistory()
      }
      setLastRefresh(Date.now())
    } catch (error) {
      console.error('Refresh failed:', error)
    } finally {
      setIsRefreshing(false)
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

  const getLastDownloadTime = (item) => {
    // Prefer updated_at, fall back to created_at if no download timestamp
    return item.updated_at || item.created_at
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Presentation History</h2>
          <p className="text-sm text-gray-600 mt-1">
            {history.length} presentations • Real-time updates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`px-3 py-2 rounded-lg transition-colors text-sm flex items-center gap-2 ${
              isRefreshing 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
            title="Refresh history"
          >
            {isRefreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
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

      {/* Refresh indicator */}
      <div className="text-xs text-gray-500 text-center mb-4">
        Last updated: {new Date(lastRefresh).toLocaleTimeString()} 
        {isRefreshing && ' • Refreshing...'}
      </div>

      {history.length === 0 ? (
        <div className="glass p-8 text-center">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold mb-2">No History Yet</h3>
          <p className="text-gray-600">Generate and download presentations to see them here.</p>
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh History'}
          </button>
        </div>
      ) : (
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
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm text-gray-600 gap-2">
                <div className="flex items-center gap-4">
                  <span>Style: {item.style || 'Blue-Professional'}</span>
                  <span className={`text-xs px-2 py-1 rounded ${getDepthColor(item.content_depth)}`}>
                    {getDepthName(item.content_depth)}
                  </span>
                  {item.include_images && (
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      🖼️ Images
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium">
                  Created: {formatTimestamp(item.created_at)}
                </span>
              </div>
              
              {item.downloaded && (
                <div className="mt-2 text-xs text-green-600 font-medium">
                  ✓ Downloaded {item.download_count || 1} time(s) • 
                  Last download: {formatTimestamp(getLastDownloadTime(item))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {history.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-500">
          Showing {history.length} most recent presentations • Auto-refreshes on download
        </div>
      )}
    </div>
  )
}