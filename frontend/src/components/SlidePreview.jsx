import React from 'react'

export default function SlidePreview({ index, slide, theme, backgroundColor = "#FFFFFF", contentDepth = "detailed" }) {
  const isPink = theme === 'pink'
  
  const borderClass = isPink 
    ? 'border-l-4 border-pink-400 hover:border-pink-600' 
    : 'border-l-4 border-blue-400 hover:border-blue-600'
  
  const titleClass = isPink ? 'text-pink-700' : 'text-blue-700'
  
  const depthColors = {
    basic: 'bg-blue-500',
    detailed: 'bg-green-500', 
    comprehensive: 'bg-purple-500'
  }
  const accentClass = depthColors[contentDepth] || (isPink ? 'bg-pink-500' : 'bg-blue-500')

  // Determine if background is dark for text color adjustment
  const hexColor = backgroundColor.replace('#', '')
  const r = parseInt(hexColor.substr(0, 2), 16)
  const g = parseInt(hexColor.substr(2, 2), 16)
  const b = parseInt(hexColor.substr(4, 2), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  const isDarkBackground = brightness < 128
  
  const textClass = isDarkBackground ? 'text-white' : 'text-gray-800'
  const bulletClass = isDarkBackground ? 'text-gray-200' : 'text-gray-700'
  const cardClass = isDarkBackground ? 'bg-black/20' : 'bg-white/90'

  const getDepthIcon = (depth) => {
    switch(depth) {
      case 'basic': return '📝'
      case 'detailed': return '📊'
      case 'comprehensive': return '🎯'
      default: return '📄'
    }
  }

  return (
    <div 
      className={`p-5 ${borderClass} ${cardClass} card-hover transition-all duration-300 hover:shadow-xl rounded-lg border border-gray-200/50 backdrop-blur-sm`}
      style={{ backgroundColor: backgroundColor }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full ${accentClass} flex items-center justify-center text-white text-sm font-bold shadow-sm`}>
            {index}
          </div>
          <div className="flex flex-col">
            <div className={`text-xs font-semibold ${textClass} opacity-80`}>SLIDE {index}</div>
            <div className="flex items-center gap-2">
              <span className="text-xs">{getDepthIcon(contentDepth)}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${isDarkBackground ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {slide.bullets?.length || 0} points
              </span>
            </div>
          </div>
        </div>
        
        {slide.image_path && (
          <div className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${isDarkBackground ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-800'}`}>
            <span>🖼️</span>
            <span>Image</span>
          </div>
        )}
      </div>
      
      <div className={`font-bold text-lg mb-4 ${titleClass} line-clamp-2 leading-tight`}>
        {slide.title}
      </div>
      
      <ul className="space-y-3">
        {slide.bullets && slide.bullets.map((bullet, i) => (
          <li key={i} className="flex items-start text-sm">
            <span className={`w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0 ${accentClass} shadow-sm`}></span>
            <span className={`leading-relaxed ${bulletClass} flex-1`}>{bullet}</span>
          </li>
        ))}
        
        {(!slide.bullets || slide.bullets.length === 0) && (
          <li className="flex items-start text-sm">
            <span className={`w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0 ${accentClass} shadow-sm`}></span>
            <span className={`leading-relaxed ${bulletClass} opacity-70`}>Content being generated...</span>
          </li>
        )}
      </ul>
      
      {/* Content Depth Indicator */}
      <div className="mt-4 pt-3 border-t border-gray-200/50">
        <div className={`text-xs font-medium ${isDarkBackground ? 'text-gray-300' : 'text-gray-500'} flex items-center justify-between`}>
          <span>Content Level: {contentDepth.toUpperCase()}</span>
          <span>{slide.bullets?.length || 0}/{contentDepth === 'basic' ? 3 : contentDepth === 'detailed' ? 4 : 5} points</span>
        </div>
      </div>
    </div>
  )
}