import { useCallback } from 'react';

export default function useHuggingFace() {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const fetchWithErrorHandling = useCallback(async (url, options = {}) => {
    try {
      console.log(`🔧 API Call: ${url}`);
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error ${response.status}:`, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ API Success:`, data);
      return data;
    } catch (error) {
      console.error('💥 API call failed:', error);
      throw error;
    }
  }, []);

  return {
    async fetchHealth() {
      return fetchWithErrorHandling(`${API}/api/health`);
    },

    async fetchBackgroundColors() {
      return fetchWithErrorHandling(`${API}/api/background-colors`);
    },

    async fetchContentDepths() {
      return fetchWithErrorHandling(`${API}/api/content-depths`);
    },

    async fetchOutline(payload) {
      console.log('🎯 Generating outline with payload:', payload);
      return fetchWithErrorHandling(`${API}/api/outline`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    async generatePPT(payload) {
      console.log('🚀 Generating PPT with payload:', payload);
      const response = await fetch(`${API}/api/generate-ppt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`PPT generation failed: ${response.status} - ${errorText}`);
      }
      
      console.log('✅ PPT generated successfully');
      return await response.blob();
    },

    async fetchHistory() {
      return fetchWithErrorHandling(`${API}/api/history`);
    },

    async fetchMetrics() {
      return fetchWithErrorHandling(`${API}/api/metrics`);
    },

    async deleteHistoryItem(presentationId) {
      return fetchWithErrorHandling(`${API}/api/history/${presentationId}`, {
        method: 'DELETE',
      });
    },

    async clearHistory() {
      return fetchWithErrorHandling(`${API}/api/history`, {
        method: 'DELETE',
      });
    },
  };
}