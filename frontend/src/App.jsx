import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom"

import Shell from './components/Shell.jsx'
import PromptBox from './components/PromptBox.jsx'
import SlidePreview from './components/SlidePreview.jsx'
import ToggleTheme from './components/ToggleTheme.jsx'
import Dashboard from './components/Dashboard.jsx'
import useHuggingFace from './hooks/useHuggingFace.js'

import Home from "./pages/Home.jsx"
import History from "./pages/History.jsx"
import Settings from "./pages/Settings.jsx"

// Define background colors for frontend use
const BACKGROUND_COLORS = {
  "Pure White": "#FFFFFF",
  "Soft Gray": "#F8FAFC", 
  "Warm White": "#FEF7EE",
  "Ice Blue": "#F0F9FF",
  "Mint Cream": "#F0FDF4",
  "Lavender": "#FDF4FF",
  "Peach": "#FFF7ED",
  "Dark Mode": "#1E293B",
  "Professional Blue": "#F0F7FF",
  "Executive Gray": "#F8FAFC"
};

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'blue')
  const [outline, setOutline] = useState([])
  const [status, setStatus] = useState({ ok: false, model: 'gemini-2.5-flash-lite' })
  const [downloads, setDownloads] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [history, setHistory] = useState([])
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF")
  const [contentDepth, setContentDepth] = useState("detailed")
  const [lastUpdate, setLastUpdate] = useState(Date.now())
  const [backgroundOptions, setBackgroundOptions] = useState(BACKGROUND_COLORS)
  const [contentDepthOptions, setContentDepthOptions] = useState({})

  const { 
    fetchHealth, 
    fetchOutline, 
    generatePPT, 
    fetchHistory, 
    fetchMetrics, 
    deleteHistoryItem, 
    clearHistory 
  } = useHuggingFace()

  // Load initial data
  useEffect(() => { 
    fetchHealth().then(setStatus)
    loadHistory()
    loadMetrics()
    fetchContentDepths()
  }, [])

  // Fetch content depths - FIXED THIS FUNCTION
  const fetchContentDepths = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/content-depths`)


      if (response.ok) {
        const depths = await response.json()
        setContentDepthOptions(depths)
      } else {
        throw new Error('Failed to fetch content depths')
      }
    } catch (error) {
      console.error('Failed to fetch content depths:', error)
      setContentDepthOptions({
        "basic": "Basic (3 bullets, 5-7 words each)",
        "detailed": "Detailed (4 bullets, 8-12 words each)", 
        "comprehensive": "Comprehensive (5 bullets, 12-15 words each)"
      })
    }
  }

  // Persist theme in localStorage
  useEffect(() => { 
    localStorage.setItem('theme', theme) 
  }, [theme])

  // ✅ FIXED timestamp formatting
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Unknown date";

    try {
      // Handle both SQLite format and ISO format
      let date;
      if (timestamp.includes(' ')) {
        // SQLite format: "YYYY-MM-DD HH:mm:ss"
        const utcString = timestamp.replace(" ", "T") + "Z";
        date = new Date(utcString);
      } else {
        // ISO format or other
        date = new Date(timestamp);
      }

      if (isNaN(date.getTime())) {
        return "Invalid date";
      }

      return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "Invalid date";
    }
  };

  // Load history data
  const loadHistory = async () => {
    try {
      const data = await fetchHistory()
      setHistory(data.presentations || [])
      setLastUpdate(Date.now())
      console.log(`✅ Loaded ${data.presentations?.length || 0} history items`)
    } catch (error) {
      console.error('Failed to load history:', error)
    }
  }

  // Load metrics data
  const loadMetrics = async () => {
    try {
      const data = await fetchMetrics()
      setDownloads(data.total_downloads || 0)
    } catch (error) {
      console.error('Failed to load metrics:', error)
    }
  }

  // Generate presentation outline
  const onGenerate = async (topic, slides, includeImages, bgColor = "#FFFFFF", depth = "detailed") => {
    setIsGenerating(true)
    setBackgroundColor(bgColor)
    setContentDepth(depth)
    try {
      const res = await fetchOutline({
        topic,
        slides,
        style: theme === 'pink' ? 'Pink-Creative' : 'Blue-Professional',
        include_images: includeImages,
        background_color: bgColor,
        content_depth: depth
      })
      setOutline(res.slides || [])
      
      // Reload history to include the new presentation
      await loadHistory()
    } catch (error) {
      console.error('Generation failed:', error)
      alert('Failed to generate outline. Please check if the backend is running.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Download presentation (and refresh metrics/history)
  const onDownload = async (topic, slides, includeImages, bgColor = "#FFFFFF", depth = "detailed") => {
    setIsGenerating(true)
    try {
      const blob = await generatePPT({
        topic,
        slides,
        style: theme === 'pink' ? 'Pink-Creative' : 'Blue-Professional',
        include_images: includeImages,
        background_color: bgColor,
        content_depth: depth
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${topic.replace(/[^a-z0-9_-]+/gi,'_')}_presentation.pptx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Wait for backend to update metrics/history
      await new Promise(resolve => setTimeout(resolve, 1000))
      await loadMetrics()
      await loadHistory()
      
      console.log(`✅ Presentation "${topic}" downloaded successfully!`)
    } catch (error) {
      console.error('Download failed:', error)
      alert('Failed to generate PPT. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Delete history
  const onDeleteHistory = async (presentationId = null) => {
    try {
      if (presentationId) {
        await deleteHistoryItem(presentationId)
      } else {
        await clearHistory()
      }
      await loadHistory()
      await loadMetrics()
    } catch (error) {
      console.error('Failed to delete history:', error)
      alert('Failed to delete history item.')
    }
  }

  // Manual refresh
  const refreshHistory = async () => {
    await loadHistory()
    await loadMetrics()
  }

  // Helper for slide depth color tag
  const getDepthColor = (depth) => {
    switch(depth) {
      case 'basic': return 'blue'
      case 'detailed': return 'green'
      case 'comprehensive': return 'purple'
      default: return 'gray'
    }
  }

  const getColorName = (colorValue) => {
    return Object.keys(backgroundOptions).find(key => backgroundOptions[key] === colorValue) || 'Custom Color';
  }

  return (
    <BrowserRouter>
      <Shell theme={theme}>
        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <ToggleTheme theme={theme} setTheme={setTheme} />
          <Dashboard downloads={downloads} status={status} />
        </div>

        {/* Prompt Input */}
        <PromptBox 
          onGenerate={onGenerate} 
          onDownload={onDownload} 
          isGenerating={isGenerating}
          backgroundOptions={backgroundOptions}
          contentDepthOptions={contentDepthOptions}
        />

        {/* Generating indicator */}
        {isGenerating && (
          <div className="glass p-4 mt-4 text-center border border-gray-200/50">
            <div className="animate-pulse flex items-center justify-center gap-3">
              <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              <span className="ml-2 font-semibold text-gray-700">
                Generating enhanced {contentDepth} AI content with {contentDepth === 'basic' ? 3 : contentDepth === 'detailed' ? 4 : 5} bullet points per slide...
              </span>
            </div>
          </div>
        )}

        {/* Routes */}
        <Routes>
          <Route path="/" element={
            outline.length > 0 ? (
              <div className="mt-8">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      <span>✨</span>
                      Enhanced Slide Preview
                    </h2>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className={`text-sm px-3 py-1 rounded-full bg-${getDepthColor(contentDepth)}-100 text-${getDepthColor(contentDepth)}-800 border border-${getDepthColor(contentDepth)}-200 font-semibold`}>
                        {contentDepth.toUpperCase()} CONTENT
                      </span>
                      <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                        {outline.length} slides generated
                      </span>
                      <span className="text-sm text-green-600 bg-green-100 px-3 py-1 rounded-full border border-green-200">
                        {contentDepth === 'comprehensive' ? '5' : contentDepth === 'detailed' ? '4' : '3'} bullets per slide
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700 bg-white/80 px-4 py-2 rounded-full border border-gray-200">
                    <span className="font-semibold">Background:</span>
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-sm"
                      style={{ backgroundColor: backgroundColor }}
                    ></div>
                    <span className="font-medium">
                      {getColorName(backgroundColor)}
                    </span>
                  </div>
                </div>

                {/* Slide preview grid */}
                <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {outline.map((s, i) => (
                    <SlidePreview 
                      key={i} 
                      index={i+1} 
                      slide={s} 
                      theme={theme}
                      backgroundColor={backgroundColor}
                      contentDepth={contentDepth}
                    />
                  ))}
                </div>

                {/* Action buttons at bottom */}
                <div className="mt-8 glass p-6 border border-gray-200/50 rounded-lg">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      Ready to Download Your Presentation?
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Your {outline.length}-slide {contentDepth} presentation is ready for download.
                      {contentDepth === 'comprehensive' && ' Includes 5 comprehensive bullet points per slide.'}
                    </p>
                    <button 
                      onClick={() => onDownload(
                        outline[0]?.title || "Presentation", 
                        outline.length, 
                        false, 
                        backgroundColor, 
                        contentDepth
                      )}
                      className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold text-lg"
                    >
                      🚀 Download Complete PPT
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Home />
            )
          }/>

          {/* History Page */}
          <Route path="/history" element={
            <History 
              history={history} 
              onDeleteHistory={onDeleteHistory}
              formatTimestamp={formatTimestamp}
              refreshHistory={refreshHistory}
              lastUpdate={lastUpdate}
            />
          } />

          {/* Settings Page */}
          <Route path="/settings" element={<Settings status={status} metrics={{downloads}} />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  )
}
