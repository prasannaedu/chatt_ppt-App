import React, { useState, useEffect } from 'react'

export default function PromptBox({ onGenerate, onDownload, isGenerating }) {
  const [topic, setTopic] = useState("AI in Healthcare")
  const [slides, setSlides] = useState(6)
  const [includeImages, setIncludeImages] = useState(false)
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF")
  const [contentDepth, setContentDepth] = useState("detailed")
  const [backgroundOptions, setBackgroundOptions] = useState({})
  const [contentDepthOptions, setContentDepthOptions] = useState({})

  // Fetch background color options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [bgResponse, depthResponse] = await Promise.all([
          fetch('http://localhost:8000/api/background-colors'),
          fetch('http://localhost:8000/api/content-depths')
        ])
        const bgColors = await bgResponse.json()
        const depths = await depthResponse.json()
        setBackgroundOptions(bgColors)
        setContentDepthOptions(depths)
      } catch (error) {
        console.error('Failed to fetch options:', error)
        // Default options if API fails
        setBackgroundOptions({
          "Pure White": "#FFFFFF",
          "Soft Gray": "#F8FAFC",
          "Warm White": "#FEF7EE",
          "Ice Blue": "#F0F9FF"
        })
        setContentDepthOptions({
          "basic": "Basic Content",
          "detailed": "Detailed Content", 
          "comprehensive": "Comprehensive Content"
        })
      }
    }
    fetchOptions()
  }, [])

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
      case 'basic': return 'bg-blue-100 text-blue-800'
      case 'detailed': return 'bg-green-100 text-green-800'
      case 'comprehensive': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="glass p-6 card-hover">
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Presentation Topic</label>
        <input 
          value={topic} 
          onChange={e => setTopic(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your presentation topic..."
          disabled={isGenerating}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-2">Number of Slides</label>
          <input 
            type="number" 
            value={slides} 
            min={3} 
            max={15}
            onChange={e => setSlides(parseInt(e.target.value) || 3)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isGenerating}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Background Color</label>
          <select
            value={backgroundColor}
            onChange={e => setBackgroundColor(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isGenerating}
          >
            {Object.entries(backgroundOptions).map(([name, color]) => (
              <option key={color} value={color}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Content Depth</label>
          <select
            value={contentDepth}
            onChange={e => setContentDepth(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isGenerating}
          >
            {Object.entries(contentDepthOptions).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
          <input 
            type="checkbox" 
            checked={includeImages}
            onChange={e => setIncludeImages(e.target.checked)}
            disabled={isGenerating}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium">Include AI Images (Pollinations)</span>
        </div>

        {/* Content Depth Badge */}
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getDepthBadgeColor(contentDepth)}`}>
          {contentDepth.toUpperCase()} CONTENT
        </div>

        {/* Color Preview */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Preview:</span>
          <div 
            className="w-8 h-8 rounded-lg border border-gray-300"
            style={{ backgroundColor: backgroundColor }}
          ></div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button 
          onClick={handleGenerate}
          disabled={isGenerating || !topic.trim()}
          className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-blue-800 transition-all"
        >
          {isGenerating ? 'Generating...' : 'Preview Enhanced Outline'}
        </button>

        <button 
          onClick={handleDownload}
          disabled={isGenerating || !topic.trim()}
          className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-green-600 to-green-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-700 hover:to-green-800 transition-all"
        >
          {isGenerating ? 'Generating...' : 'Download Professional PPT'}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-600">
        <div className="text-center p-2 bg-blue-50 rounded">
          <strong>Basic:</strong> 3 bullets, 5-7 words
        </div>
        <div className="text-center p-2 bg-green-50 rounded">
          <strong>Detailed:</strong> 4 bullets, 8-12 words  
        </div>
        <div className="text-center p-2 bg-purple-50 rounded">
          <strong>Comprehensive:</strong> 5 bullets, 12-15 words
        </div>
      </div>

      {includeImages && (
        <div className="mt-3 text-xs text-gray-600">
          💡 Enhanced image generation for professional presentation quality.
        </div>
      )}
    </div>
  )
}