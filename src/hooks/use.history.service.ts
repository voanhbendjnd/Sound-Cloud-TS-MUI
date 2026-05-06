'use client'

import { useCallback, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import axios from 'axios'

interface HistorySession {
  trackId: number
  startTime: number
  duration: number
  isPlaying: boolean
}

interface HistoryEntry {
  trackId: number
  durationListened: number
}

interface HistoryResponse {
  statusCode: number
  error: any
  message: string
  data: {
    id: number
    title: string
    imgUrl: string
    uploader: string
    trackUrl: string
    countPlays: number
    countLikes: number
  }
}

export const useHistoryService = () => {
  const { data: session } = useSession()
  const currentSession = useRef<HistorySession | null>(null)
  const historyQueue = useRef<HistoryEntry[]>([] as HistoryEntry[])
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const retryTimer = useRef<NodeJS.Timeout | null>(null)
  const isOnline = useRef(true)

  // Track current playing session
  const startTracking = useCallback((trackId: number) => {
    // End previous session if exists
    if (currentSession.current && currentSession.current.trackId !== trackId) {
      endTracking()
    }

    currentSession.current = {
      trackId,
      startTime: Date.now(),
      duration: 0,
      isPlaying: true
    }
  }, [])

  // Calculate final duration when track ends
  const calculateDuration = useCallback(() => {
    if (currentSession.current) {
      return Math.floor((Date.now() - currentSession.current.startTime) / 1000)
    }
    return 0
  }, [])

  // End tracking and queue for API
  const endTracking = useCallback(() => {
    if (!currentSession.current) return

    const session = currentSession.current
    session.isPlaying = false
    session.duration = calculateDuration()

    // Only queue if duration > 0 (meaningful listening)
    if (session.duration > 0) {
      historyQueue.current.push({
        trackId: session.trackId,
        durationListened: session.duration
      })

      // Trigger debounced save
      scheduleSave()
    }

    currentSession.current = null
  }, [])

  // Schedule debounced API call
  const scheduleSave = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      saveHistory()
    }, 15000) // 30 seconds delay
  }, [])

  // Save history to API with batch processing
  const saveHistory = useCallback(async () => {
    if (!session?.access_token || historyQueue.current.length === 0) {
      return
    }

    const entriesToSave = [...historyQueue.current]
    historyQueue.current = []

    try {
      // Process in batches of 10
      const batches = []
      for (let i = 0; i < entriesToSave.length; i += 10) {
        // @ts-ignore
        batches.push(entriesToSave.slice(i, i + 10))
      }

      const promises = batches.map(batch =>
        axios.post<HistoryResponse>(
          'http://localhost:8080/api/v1/history',
          batch, // Send entire batch as array
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        )
      )

      await Promise.all(promises)
      console.log(`Saved ${entriesToSave.length} history entries`)

    } catch (error) {
      console.error('Failed to save history:', error)

      // Re-queue failed entries
      historyQueue.current.unshift(...entriesToSave)

      // Retry with exponential backoff
      scheduleRetry()
    }
  }, [session?.access_token])

  // Retry mechanism with exponential backoff
  const scheduleRetry = useCallback(() => {
    if (retryTimer.current) {
      clearTimeout(retryTimer.current)
    }

    const retryDelay = Math.min(1000 * Math.pow(2, 3), 30000) // Max 30 seconds
    retryTimer.current = setTimeout(() => {
      if (isOnline.current) {
        saveHistory()
      }
    }, retryDelay)
  }, [saveHistory])

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      isOnline.current = true
      if (historyQueue.current.length > 0) {
        saveHistory()
      }
    }

    const handleOffline = () => {
      isOnline.current = false
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [saveHistory])

  // Remove 1-second interval updates - duration calculated on end

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentSession.current) {
        endTracking()
        // Sync save for page unload - send entire queue
        if (historyQueue.current.length > 0 && session?.access_token) {
          navigator.sendBeacon(
            'http://localhost:8080/api/v1/history',
            JSON.stringify(historyQueue.current)
          )
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [endTracking, session?.access_token])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      if (retryTimer.current) clearTimeout(retryTimer.current)
      if (currentSession.current) endTracking()
    }
  }, [endTracking])

  return {
    startTracking,
    endTracking,
    calculateDuration,
    getCurrentSession: () => currentSession.current,
    getQueueSize: () => historyQueue.current.length
  }
}
