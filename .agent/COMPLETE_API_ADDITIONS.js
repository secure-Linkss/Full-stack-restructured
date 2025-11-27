// ===================================================================
// COMPLETE API.JS ADDITIONS - COPY AND PASTE INTO src/services/api.js
// ===================================================================

// 1. ADD THESE METHODS TO THE EXISTING `security` OBJECT (around line 276)
// Find the security object and add these methods before the closing brace:

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

                                    // 3. ADD SUPPORT/TICKETING METHODS (add as a new object after notifications)

                                    // ==================== SUPPORT TICKETS APIs ====================
                                    support: {
    getTickets: () => fetchWithAuth(`${API_BASE_URL}/support/tickets`),
        getTicket: (id) => fetchWithAuth(`${API_BASE_URL}/support/tickets/${id}`),
            createTicket: (ticketData) => fetchWithAuth(`${API_BASE_URL}/support/tickets`, {
                method: 'POST',
                body: JSON.stringify(ticketData),
            }),
                replyToTicket: (id, message) => fetchWithAuth(`${API_BASE_URL}/support/tickets/${id}/reply`, {
                    method: 'POST',
                    body: JSON.stringify({ message }),
                }),
                    closeTicket: (id) => fetchWithAuth(`${API_BASE_URL}/support/tickets/${id}/close`, {
                        method: 'POST',
                    }),
                        uploadAttachment: (id, formData) => {
                            const token = getAuthToken();
                            return fetch(`${API_BASE_URL}/support/tickets/${id}/attachment`, {
                                method: 'POST',
                                headers: { 'Authorization': `Bearer ${token}` },
                                body: formData,
                            }).then(res => res.json());
                        },
},

// Backward compatibility
getSupportTickets: () => fetchWithAuth(`${API_BASE_URL}/support/tickets`),
    createSupportTicket: (ticketData) => fetchWithAuth(`${API_BASE_URL}/support/tickets`, {
        method: 'POST',
        body: JSON.stringify(ticketData),
    }),

        // 4. ADD CONTACT FORM API (add as a new object)

        // ==================== CONTACT FORM APIs ====================
        contact: {
    submit: (formData) => fetchWithAuth(`${API_BASE_URL}/contact`, {
        method: 'POST',
        body: JSON.stringify(formData),
    }),
        getSubmissions: () => fetchWithAuth(`${API_BASE_URL}/admin/contact-submissions`), // Admin only
},

// 5. REPLACE THE EXISTING `shortener` OBJECT (around line 588) WITH THIS:

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

// 6. ADD THESE BACKWARD COMPATIBILITY METHODS AT THE END (before the export statement)

// ==================== BACKWARD COMPATIBILITY METHODS ====================
getCampaigns: () => fetchWithAuth(`${API_BASE_URL}/campaigns`),
    getCampaignMetrics: () => fetchWithAuth(`${API_BASE_URL}/analytics/dashboard?period=30d`).then(data => data.campaignPerformance || []),
        getLinks: () => fetchWithAuth(`${API_BASE_URL}/links`),
            getLinksMetrics: () => fetchWithAuth(`${API_BASE_URL}/analytics/dashboard?period=7d`),
                getGeographyData: () => fetchWithAuth(`${API_BASE_URL}/analytics/geography`),
                    getLiveEvents: (filters = {}) => {
                        const params = new URLSearchParams(filters);
                        return fetchWithAuth(`${API_BASE_URL}/events/live?${params}`);
                    },
                        getNotifications: () => fetchWithAuth(`${API_BASE_URL}/notifications`),
                            updateProfile: (profileData) => fetchWithAuth(`${API_BASE_URL}/user/profile`, {
                                method: 'PUT',
                                body: JSON.stringify(profileData),
                            }),

// ===================================================================
// END OF API.JS ADDITIONS
// ===================================================================
