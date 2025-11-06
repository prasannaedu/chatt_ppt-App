import React from 'react'

export default function Settings({ status, metrics }) {
  const systemInfo = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    cookies: navigator.cookieEnabled,
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Settings & System Info</h2>

      {/* Metrics */}
      <div className="glass p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="mr-2">📊</span>
          Application Metrics
        </h3>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{metrics.downloads || 0}</div>
            <div className="text-sm text-gray-600">Total Downloads</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">SQLite</div>
            <div className="text-sm text-gray-600">Database</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">v3.0</div>
            <div className="text-sm text-gray-600">Version</div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="glass p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="mr-2">🔧</span>
          System Status
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="font-medium">Backend Connection:</span>
              <span className={status.ok ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                {status.ok ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="font-medium">AI Model:</span>
              <span className="text-blue-600">{status.model || 'Unknown'}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="font-medium">Database:</span>
              <span className="text-green-600">SQLite (Active)</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="font-medium">Browser:</span>
              <span className="text-gray-600">{systemInfo.userAgent.split(' ').pop()}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="font-medium">Platform:</span>
              <span className="text-gray-600">{systemInfo.platform}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="font-medium">Cookies:</span>
              <span className={systemInfo.cookies ? 'text-green-600' : 'text-red-600'}>
                {systemInfo.cookies ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="glass p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="mr-2">🚀</span>
          Features
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center text-green-600">
              <span className="mr-2">✅</span>
              <span>SQL Database</span>
            </div>
            <div className="flex items-center text-green-600">
              <span className="mr-2">✅</span>
              <span>Persistent History</span>
            </div>
            <div className="flex items-center text-green-600">
              <span className="mr-2">✅</span>
              <span>Download Analytics</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center text-green-600">
              <span className="mr-2">✅</span>
              <span>Individual Deletion</span>
            </div>
            <div className="flex items-center text-green-600">
              <span className="mr-2">✅</span>
              <span>Background Colors</span>
            </div>
            <div className="flex items-center text-green-600">
              <span className="mr-2">✅</span>
              <span>AI Image Generation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}