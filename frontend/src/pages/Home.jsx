import React from 'react'

export default function Home() {
  const features = [
    { icon: '🤖', title: 'AI-Powered', desc: 'Uses local Phi-3 model for content' },
    { icon: '🎨', title: 'Beautiful Themes', desc: 'Blue professional & pink creative' },
    { icon: '🖼️', title: 'AI Images', desc: 'Optional image generation' },
    { icon: '📊', title: 'Professional', desc: 'Clean, structured presentations' },
    { icon: '⚡', title: 'Fast', desc: 'Generates in seconds' },
    { icon: '💾', title: 'Local', desc: 'Works completely offline' },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="text-6xl mb-4">✨</div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          Create Stunning Presentations
          <br />
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            with AI Magic
          </span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Transform your ideas into professional PowerPoint presentations instantly. 
          Powered by local AI for complete privacy and speed.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {features.map((feature, index) => (
          <div key={index} className="glass p-6 card-hover text-center">
            <div className="text-3xl mb-3">{feature.icon}</div>
            <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
            <p className="text-gray-600 text-sm">{feature.desc}</p>
          </div>
        ))}
      </div>

      {/* How it Works */}
      <div className="glass p-8">
        <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">1</div>
            <h3 className="font-semibold mb-2">Enter Topic</h3>
            <p className="text-gray-600 text-sm">Describe what you want to present</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">2</div>
            <h3 className="font-semibold mb-2">AI Generates</h3>
            <p className="text-gray-600 text-sm">LLM creates structured content</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">3</div>
            <h3 className="font-semibold mb-2">Download PPT</h3>
            <p className="text-gray-600 text-sm">Get your ready-to-use presentation</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center mt-12">
        <p className="text-gray-600 mb-4">
          Ready to create your first AI-powered presentation?
        </p>
        <div className="text-2xl animate-bounce">👇</div>
      </div>
    </div>
  )
}