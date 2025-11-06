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
  const textClass = brightness < 128 ? 'text-white' : 'text-gray-800'
  const bulletClass = brightness < 128 ? 'text-gray-200' : 'text-gray-700'

  return (
    <div 
      className={`p-4 ${borderClass} card-hover transition-all duration-300 hover:shadow-lg rounded-lg`}
      style={{ backgroundColor: backgroundColor }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-6 h-6 rounded-full ${accentClass} flex items-center justify-center text-white text-xs font-bold`}>
          {index}
        </div>
        <div className="flex items-center gap-2">
          <div className={`text-xs font-medium ${textClass}`}>SLIDE {index}</div>
          {slide.bullets && (
            <div className="text-xs bg-black/10 px-2 py-1 rounded text-gray-600">
              {slide.bullets.length} points
            </div>
          )}
        </div>
      </div>
      
      <div className={`font-bold text-lg mb-3 ${titleClass} line-clamp-2`}>
        {slide.title}
      </div>
      
      <ul className="space-y-2">
        {slide.bullets.map((bullet, i) => (
          <li key={i} className="flex items-start text-sm">
            <span className={`w-1.5 h-1.5 rounded-full mt-2 mr-2 flex-shrink-0 ${accentClass}`}></span>
            <span className={`leading-relaxed ${bulletClass}`}>{bullet}</span>
          </li>
        ))}
      </ul>
      
      {slide.image_path && (
        <div className="mt-3 p-2 bg-black/10 rounded text-xs text-gray-600 flex items-center">
          <span className="mr-1">🖼️</span>
          AI Image Included
        </div>
      )}
    </div>
  )
}