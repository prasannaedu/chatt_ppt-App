import React from 'react'
import { Link, useLocation } from "react-router-dom"

export default function Shell({ children, theme }) {
  const location = useLocation()
  const isPink = theme === 'pink'
  
  const bgClass = isPink ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-gradient-to-r from-blue-600 to-indigo-700'
  const brandClass = isPink ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'
  const activeClass = isPink ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-800">
      {/* Top Bar */}
      <div className={`${bgClass} text-white shadow-lg`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-lg ${brandClass} flex items-center justify-center font-bold`}>
                🎯
              </div>
              <div>
                <h1 className="text-lg font-bold">Chat → PPT</h1>
                <p className="text-xs opacity-90">AI-Powered Presentation Generator</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-1 bg-black/20 rounded-lg p-1">
              <Link 
                to="/" 
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  isActive('/') ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                New Deck
              </Link>
              <Link 
                to="/history" 
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  isActive('/history') ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                History
              </Link>
              <Link 
                to="/settings" 
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  isActive('/settings') ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                Settings
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="container mx-auto px-4 py-6">
        {children}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex justify-around items-center p-2">
          <Link 
            to="/" 
            className={`flex flex-col items-center p-2 rounded-lg text-xs ${
              isActive('/') ? activeClass : 'text-gray-600'
            }`}
          >
            <span className="text-lg">✨</span>
            <span>New</span>
          </Link>
          <Link 
            to="/history" 
            className={`flex flex-col items-center p-2 rounded-lg text-xs ${
              isActive('/history') ? activeClass : 'text-gray-600'
            }`}
          >
            <span className="text-lg">📚</span>
            <span>History</span>
          </Link>
          <Link 
            to="/settings" 
            className={`flex flex-col items-center p-2 rounded-lg text-xs ${
              isActive('/settings') ? activeClass : 'text-gray-600'
            }`}
          >
            <span className="text-lg">⚙️</span>
            <span>Settings</span>
          </Link>
        </div>
      </div>
    </div>
  )
}