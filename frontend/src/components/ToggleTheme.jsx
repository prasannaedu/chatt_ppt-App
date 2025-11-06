import React from 'react'

export default function ToggleTheme({ theme, setTheme }) {
  const isPink = theme === 'pink'
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">Theme:</span>
      <label className="inline-flex items-center cursor-pointer">
        <input type="checkbox" className="sr-only peer" checked={isPink} onChange={e=>setTheme(e.target.checked?'pink':'blue')} />
        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
        <span className="ml-2 text-sm">{isPink? 'Pink-Creative' : 'Blue-Professional'}</span>
      </label>
    </div>
  )
}
