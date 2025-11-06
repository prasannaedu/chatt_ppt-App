export default function useOllama() {
  const API = 'http://localhost:8000'

  return {
    async fetchHealth() {
      return (await fetch(`${API}/api/health`)).json()
    },

    async fetchBackgroundColors() {
      return (await fetch(`${API}/api/background-colors`)).json()
    },

    async fetchContentDepths() {
      return (await fetch(`${API}/api/content-depths`)).json()
    },

    async fetchOutline(payload) {
      const r = await fetch(`${API}/api/outline`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      })
      return r.json()
    },

    async generatePPT(payload) {
      const r = await fetch(`${API}/api/generate-ppt`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      })
      return r.blob()
    },

    async fetchHistory() {
      return (await fetch(`${API}/api/history`)).json()
    },

    async fetchMetrics() {
      return (await fetch(`${API}/api/metrics`)).json()
    },

    async deleteHistoryItem(presentationId) {
      const r = await fetch(`${API}/api/history/${presentationId}`, {
        method: 'DELETE'
      })
      return r.json()
    },

    async clearHistory() {
      const r = await fetch(`${API}/api/history`, {
        method: 'DELETE'
      })
      return r.json()
    }
  }
}