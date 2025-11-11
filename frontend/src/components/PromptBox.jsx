import React, { useState } from 'react'

export default function PromptBox({ onGenerate, onDownload, isGenerating, backgroundOptions, contentDepthOptions }) {
  const [topic, setTopic] = useState("AI in Modern Healthcare")
  const [slides, setSlides] = useState(6)
  const [includeImages, setIncludeImages] = useState(false)
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF")
  const [contentDepth, setContentDepth] = useState("detailed")

  const handleGenerate = () => {
    if (topic.trim() && !isGenerating) {
      onGenerate(topic, slides, includeImages, backgroundColor, contentDepth)
    }
  }

  const handleDownload = () => {
    if (topic.trim() && !isGenerating) {
      onDownload(topic, slides, includeImages, backgroundColor, contentDepth)
    }
  }

  const getDepthBadgeColor = (depth) => {
    switch(depth) {
      case 'basic': return 'bg-blue-100 text-blue-800 border border-blue-200'
      case 'detailed': return 'bg-green-100 text-green-800 border border-green-200'
      case 'comprehensive': return 'bg-purple-100 text-purple-800 border border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border border-gray-200'
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

  const getColorName = (colorValue) => {
    return Object.keys(backgroundOptions).find(key => backgroundOptions[key] === colorValue) || 'Custom';
  }

  return (
    <div className="glass p-6 card-hover border border-gray-200/50">
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-3 text-gray-700">
          🎯 Presentation Topic
        </label>
        <input 
          value={topic} 
          onChange={e => setTopic(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80"
          placeholder="Enter your presentation topic (e.g., Artificial Intelligence in Healthcare, Digital Transformation Strategies)..."
          disabled={isGenerating}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">
            📑 Slides Count
          </label>
          <input 
            type="number" 
            value={slides} 
            min={3} 
            max={20}
            onChange={e => setSlides(Math.min(20, Math.max(3, parseInt(e.target.value) || 3)))}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80"
            disabled={isGenerating}
          />
          <div className="text-xs text-gray-500 mt-1">{slides} slides total</div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">
            🎨 Background
          </label>
          <select
            value={backgroundColor}
            onChange={e => setBackgroundColor(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80"
            disabled={isGenerating}
          >
            {Object.entries(backgroundOptions).map(([name, color]) => (
              <option key={name} value={color}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">
            📊 Content Depth
          </label>
          <select
            value={contentDepth}
            onChange={e => setContentDepth(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80"
            disabled={isGenerating}
          >
            {Object.entries(contentDepthOptions).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">
            Color Preview
          </label>
          <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border border-gray-200">
            <div 
              className="w-10 h-10 rounded-lg border-2 border-gray-300 shadow-sm"
              style={{ backgroundColor: backgroundColor }}
            ></div>
            <div className="text-xs text-gray-600 font-medium">
              {getColorName(backgroundColor)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border border-gray-200">
          <input 
            type="checkbox" 
            checked={includeImages}
            onChange={e => setIncludeImages(e.target.checked)}
            disabled={isGenerating}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
          />
          <div>
            <span className="text-sm font-semibold text-gray-700">Include AI Images</span>
            <div className="text-xs text-gray-500">Enhanced visual content (Pollinations AI)</div>
          </div>
        </div>

        {/* Content Depth Badge */}
        <div className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${getDepthBadgeColor(contentDepth)}`}>
          <span>{getDepthIcon(contentDepth)}</span>
          <span>{contentDepth.toUpperCase()} CONTENT</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button 
          onClick={handleGenerate}
          disabled={isGenerating || !topic.trim()}
          className="flex-1 px-6 py-4 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Generating...
            </>
          ) : (
            <>
              <span>✨</span>
              Preview Enhanced Outline
            </>
          )}
        </button>

        <button 
          onClick={handleDownload}
          disabled={isGenerating || !topic.trim()}
          className="flex-1 px-6 py-4 rounded-lg bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Creating PPT...
            </>
          ) : (
            <>
              <span>🚀</span>
              Download Professional PPT
            </>
          )}
        </button>
      </div>

      {/* Content Depth Info */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="font-semibold text-blue-800 mb-1">📝 BASIC</div>
          <div className="text-xs text-blue-600">3 bullets per slide</div>
          <div className="text-xs text-blue-500">5-7 words each</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="font-semibold text-green-800 mb-1">📊 DETAILED</div>
          <div className="text-xs text-green-600">4 bullets per slide</div>
          <div className="text-xs text-green-500">8-12 words each</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="font-semibold text-purple-800 mb-1">🎯 COMPREHENSIVE</div>
          <div className="text-xs text-purple-600">5 bullets per slide</div>
          <div className="text-xs text-purple-500">12-15 words each</div>
        </div>
      </div>

      {includeImages && (
        <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 text-purple-800 text-sm font-semibold">
            <span>🖼️</span>
            <span>AI Image Generation Enabled</span>
          </div>
          <div className="text-xs text-purple-600 mt-1">
            Professional images will be generated for each slide using Pollinations AI
          </div>
        </div>
      )}
    </div>
  )
}