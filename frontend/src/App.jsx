import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom"

import Shell from './components/Shell.jsx'
import PromptBox from './components/PromptBox.jsx'
import SlidePreview from './components/SlidePreview.jsx'
import ToggleTheme from './components/ToggleTheme.jsx'
import Dashboard from './components/Dashboard.jsx'
import useOllama from './hooks/useOllama.js'

import Home from "./pages/Home.jsx"
import History from "./pages/History.jsx"
import Settings from "./pages/Settings.jsx"

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'blue')
  const [outline, setOutline] = useState([])
  const [status, setStatus] = useState({ ok: false, model: 'phi3:mini' })
  const [downloads, setDownloads] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [history, setHistory] = useState([])
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF")
  const [contentDepth, setContentDepth] = useState("detailed")

  const { fetchHealth, fetchOutline, generatePPT, fetchHistory, fetchMetrics, deleteHistoryItem, clearHistory } = useOllama()

  useEffect(() => { 
    fetchHealth().then(setStatus)
    loadHistory()
    loadMetrics()
  }, [])

  useEffect(() => { 
    localStorage.setItem('theme', theme) 
  }, [theme])

  const loadHistory = async () => {
    try {
      const data = await fetchHistory()
      setHistory(data.presentations || [])
    } catch (error) {
      console.error('Failed to load history:', error)
    }
  }

  const loadMetrics = async () => {
    try {
      const data = await fetchMetrics()
      setDownloads(data.total_downloads || 0)
    } catch (error) {
      console.error('Failed to load metrics:', error)
    }
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown date'
    return new Date(timestamp).toLocaleString()
  }

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
      alert('Failed to generate outline. Please check if Ollama is running.')
    } finally {
      setIsGenerating(false)
    }
  }

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
      a.download = `${topic.replace(/[^a-z0-9_-]+/gi,'_')}.pptx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Reload metrics and history to get updated counts
      await loadMetrics()
      await loadHistory()
      
    } catch (error) {
      console.error('Download failed:', error)
      alert('Failed to generate PPT. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

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

  const getDepthColor = (depth) => {
    switch(depth) {
      case 'basic': return 'blue'
      case 'detailed': return 'green'
      case 'comprehensive': return 'purple'
      default: return 'gray'
    }
  }

  return (
    <BrowserRouter>
      <Shell theme={theme}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <ToggleTheme theme={theme} setTheme={setTheme} />
          <Dashboard downloads={downloads} status={status} />
        </div>

        <PromptBox 
          onGenerate={onGenerate} 
          onDownload={onDownload} 
          isGenerating={isGenerating}
        />

        {isGenerating && (
          <div className="glass p-4 mt-4 text-center">
            <div className="animate-pulse flex items-center justify-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              <span className="ml-2">Generating enhanced AI content ({contentDepth} depth)...</span>
            </div>
          </div>
        )}

        <Routes>
          <Route path="/" element={
            outline.length > 0 ? (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold">Enhanced Slide Preview</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full bg-${getDepthColor(contentDepth)}-100 text-${getDepthColor(contentDepth)}-800`}>
                        {contentDepth.toUpperCase()} CONTENT
                      </span>
                      <span className="text-xs text-gray-500">{outline.length} slides generated</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Background:</span>
                    <div 
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: backgroundColor }}
                    ></div>
                  </div>
                </div>
                <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
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
              </div>
            ) : (
              <Home />
            )
          }/>
          <Route path="/history" element={
            <History 
              history={history} 
              onDeleteHistory={onDeleteHistory}
              formatTimestamp={formatTimestamp}
            />
          } />
          <Route path="/settings" element={<Settings status={status} metrics={{downloads}} />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  )
}