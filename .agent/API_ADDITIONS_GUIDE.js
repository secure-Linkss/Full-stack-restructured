// ==================== COPY THIS INTO src/services/api.js ====================

// 1. ADD THESE METHODS TO THE security OBJECT (around line 276, inside the security object before the closing brace)

updateSetting: (setting) => fetchWithAuth(`${API_BASE_URL}/security/settings`, {
    method: 'PATCH',
    body: JSON.stringify(setting),
}),
    getBlockedIPs: () => fetchWithAuth(`${API_BASE_URL}/security/blocked-ips`),
        addBlockedIP: (ip) => fetchWithAuth(`${API_BASE_URL}/security/blocked-ips`, {
            method: 'POST',
            body: JSON.stringify({ ip }),
        }),
            removeBlockedIP: (ip) => fetchWithAuth(`${API_BASE_URL}/security/blocked-ips/${encodeURIComponent(ip)}`, {
                method: 'DELETE',
            }),
                getBlockedCountries: () => fetchWithAuth(`${API_BASE_URL}/security/blocked-countries`),
                    addBlockedCountry: (country) => fetchWithAuth(`${API_BASE_URL}/security/blocked-countries`, {
                        method: 'POST',
                        body: JSON.stringify({ country }),
                    }),
                        removeBlockedCountry: (country) => fetchWithAuth(`${API_BASE_URL}/security/blocked-countries/${encodeURIComponent(country)}`, {
                            method: 'DELETE',
                        }),

                            // 2. ADD THESE AS TOP-LEVEL METHODS (after the security object closes, around line 293)

                            // Backward compatibility methods for Security component
                            getSecurityMetrics: () => fetchWithAuth(`${API_BASE_URL}/security/metrics`),
                                getSecurityLogs: (days = 7) => fetchWithAuth(`${API_BASE_URL}/security/logs?days=${days}`),

                                    // 3. REPLACE THE shortener OBJECT (around line 588) WITH THIS:

                                    // ==================== LINK SHORTENER APIs ====================
                                    shortener: {
    shorten: (url, options = {}) => fetchWithAuth(`${API_BASE_URL}/shorten`, {
        method: 'POST',
        body: JSON.stringify({ url, ...options }),
    }),
        getAll: () => fetchWithAuth(`${API_BASE_URL}/shorten`),
            delete: (id) => fetchWithAuth(`${API_BASE_URL}/shorten/${id}`, { method: 'DELETE' }),
                regenerate: (id) => fetchWithAuth(`${API_BASE_URL}/shorten/${id}/regenerate`, { method: 'POST' }),
                    generateQR: (shortCode) => fetchWithAuth(`${API_BASE_URL}/shorten/${shortCode}/qr`),
  },

// Alias for backward compatibility
shorten: {
    getAll: () => fetchWithAuth(`${API_BASE_URL}/shorten`),
        delete: (id) => fetchWithAuth(`${API_BASE_URL}/shorten/${id}`, { method: 'DELETE' }),
            regenerate: (id) => fetchWithAuth(`${API_BASE_URL}/shorten/${id}/regenerate`, { method: 'POST' }),
  },
