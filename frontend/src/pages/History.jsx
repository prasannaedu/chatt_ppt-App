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
    if (window.confirm('Are you sure you want to clear all presentation history? This action cannot be undone.')) {
      onDeleteHistory()
    }
  }

  const deleteItem = (presentationId, topic) => {
    if (window.confirm(`Are you sure you want to delete "${topic}" from history?`)) {
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
      case 'basic': return 'bg-blue-100 text-blue-800 border border-blue-200'
      case 'detailed': return 'bg-green-100 text-green-800 border border-green-200'
      case 'comprehensive': return 'bg-purple-100 text-purple-800 border border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border border-gray-200'
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

  const getDepthIcon = (depth) => {
    switch(depth) {
      case 'basic': return '📝'
      case 'detailed': return '📊'
      case 'comprehensive': return '🎯'
      default: return '📄'
    }
  }

  const getLastDownloadTime = (item) => {
    return item.updated_at || item.created_at
  }

  // FIXED: Get actual slide count - handle both old and new data
  const getSlideCount = (item) => {
    // Try to get actual_slides first, then slides, then fallback
    return item.actual_slides || item.slides || '?'
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span>📚</span>
            Presentation History
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            {history.length} presentations • Real-time updates • Unlimited storage
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`px-4 py-2 rounded-lg transition-all duration-200 text-sm flex items-center gap-2 font-semibold ${
              isRefreshing 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg hover:shadow-xl'
            }`}
            title="Refresh history"
          >
            {isRefreshing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Refreshing...
              </>
            ) : (
              <>
                <span>🔄</span>
                Refresh
              </>
            )}
          </button>
          {history.length > 0 && (
            <button 
              onClick={clearHistory}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 shadow-lg hover:shadow-xl text-sm font-semibold"
            >
              🗑️ Clear All
            </button>
          )}
        </div>
      </div>

      {/* Refresh indicator */}
      <div className="text-xs text-gray-500 text-center mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
        Last updated: {new Date(lastRefresh).toLocaleTimeString()} 
        {isRefreshing && ' • Refreshing data...'}
        {history.length > 50 && (
          <div className="mt-1 text-green-600 font-semibold">
            ✓ Showing {history.length} presentations (unlimited storage)
          </div>
        )}
      </div>

      {history.length === 0 ? (
        <div className="glass p-8 text-center border border-gray-200/50">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold mb-2 text-gray-800">No History Yet</h3>
          <p className="text-gray-600 mb-4">Generate and download presentations to see them here.</p>
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:bg-gray-400 font-semibold"
          >
            {isRefreshing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Refreshing...
              </>
            ) : (
              '🔄 Refresh History'
            )}
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {history.map((item) => (
            <div key={item.id} className="glass p-5 card-hover border-l-4 border-blue-400 border border-gray-200/50 rounded-lg">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2 flex-wrap">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2 py-1 rounded text-sm">
                    {getDepthIcon(item.content_depth)}
                  </span>
                  {item.topic}
                  {item.downloaded && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full animate-pulse font-semibold">
                      ✅ Downloaded
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-2">
                  {/* FIXED: Use getSlideCount function to get proper slide count */}
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded border border-gray-200 font-medium">
                    {getSlideCount(item)} slides
                  </span>
                  {item.downloaded && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded border border-green-200 font-medium">
                      {item.download_count || 1}x downloaded
                    </span>
                  )}
                  <button 
                    onClick={() => deleteItem(item.id, item.topic)}
                    className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded border border-red-200 hover:bg-red-200 transition-colors font-medium"
                    title="Delete this presentation"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm text-gray-600 gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-medium">Style: {item.style || 'Blue-Professional'}</span>
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getDepthColor(item.content_depth)}`}>
                    {getDepthIcon(item.content_depth)} {getDepthName(item.content_depth)}
                  </span>
                  {item.include_images && (
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded border border-purple-200 font-medium">
                      🖼️ AI Images
                    </span>
                  )}
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded border border-blue-200 font-medium">
                    🎨 {item.background_color ? 'Custom BG' : 'Default'}
                  </span>
                </div>
                <span className="text-xs font-semibold bg-gray-50 px-3 py-1 rounded border border-gray-200">
                  Created: {formatTimestamp(item.created_at)}
                </span>
              </div>
              
              {item.downloaded && (
                <div className="mt-3 text-xs text-green-600 font-semibold bg-green-50 px-3 py-2 rounded border border-green-200">
                  ✓ Downloaded {item.download_count || 1} time(s) • 
                  Last download: {formatTimestamp(getLastDownloadTime(item))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {history.length > 0 && (
        <div className="mt-8 text-center text-sm text-gray-500 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="font-semibold mb-2">
            Showing {history.length} most recent presentations • Auto-refreshes on download
          </div>
          <div className="text-xs">
            💡 History storage is now unlimited! All your presentations are safely stored.
          </div>
          <div className="text-xs text-green-600 mt-1 font-semibold">
            ✅ Slide counts now properly displayed
          </div>
        </div>
      )}
    </div>
  )
}