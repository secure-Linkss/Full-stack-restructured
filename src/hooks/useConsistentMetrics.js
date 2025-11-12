import { useState, useEffect } from 'react'

/**
 * Custom hook to fetch consistent metrics across all components
 * Ensures dashboard and links section show the same data
 */
export const useConsistentMetrics = (refreshInterval = 30000) => {
  const [metrics, setMetrics] = useState({
    totalClicks: 0,
    realVisitors: 0,
    botsBlocked: 0,
    activeLinks: 0,
    loading: true,
    error: null
  })

  const fetchMetrics = async () => {
    try {
      // Fetch from consistent endpoint
      const response = await fetch('/api/links/stats/consistent')
      
      if (!response.ok) {
        throw new Error('Failed to fetch metrics')
      }

      const data = await response.json()

      if (data.success) {
        setMetrics({
          totalClicks: data.total_clicks || 0,
          realVisitors: data.real_visitors || 0,
          botsBlocked: data.bots_blocked || 0,
          activeLinks: data.active_links || 0,
          loading: false,
          error: null
        })
      } else {
        throw new Error(data.error || 'Failed to load metrics')
      }
    } catch (error) {
      console.error('Error fetching metrics:', error)
      setMetrics(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }))
    }
  }

  useEffect(() => {
    fetchMetrics()

    // Refresh metrics at specified interval
    const interval = setInterval(fetchMetrics, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshInterval])

  return {
    ...metrics,
    refresh: fetchMetrics
  }
}

/**
 * Hook for admin dashboard metrics
 */
export const useAdminMetrics = (refreshInterval = 30000) => {
  const [metrics, setMetrics] = useState({
    users: { total: 0, active: 0, pending: 0 },
    links: { total: 0, active: 0 },
    traffic: {
      total_clicks: 0,
      real_visitors: 0,
      bot_clicks: 0,
      today_clicks: 0,
      today_visitors: 0
    },
    campaigns: { total: 0, active: 0 },
    security: { active_threats: 0 },
    loading: true,
    error: null
  })

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/stats/consistent')
      
      if (!response.ok) {
        throw new Error('Failed to fetch admin metrics')
      }

      const data = await response.json()

      if (data.success) {
        setMetrics({
          ...data,
          loading: false,
          error: null
        })
      } else {
        throw new Error(data.error || 'Failed to load admin metrics')
      }
    } catch (error) {
      console.error('Error fetching admin metrics:', error)
      setMetrics(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }))
    }
  }

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval])

  return {
    ...metrics,
    refresh: fetchMetrics
  }
}

export default useConsistentMetrics
