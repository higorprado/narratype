import { useRef } from 'react'

interface StatsAccumulatorState {
  totalChars: number
  totalTimeMs: number
  sessionChars: number
  sessionStartTime: number | null
  // Elapsed time captured at the last keystroke or deletion.
  // Used by session persistence to avoid saving inflated elapsedMs
  // that includes idle time after the last keystroke.
  activeElapsedMs: number
}

const initialState = (): StatsAccumulatorState => ({
  totalChars: 0,
  totalTimeMs: 0,
  sessionChars: 0,
  sessionStartTime: null,
  activeElapsedMs: 0,
})

export function useStatsAccumulator() {
  const state = useRef<StatsAccumulatorState>(initialState())

  const onCharTyped = () => {
    if (state.current.sessionStartTime === null) {
      state.current.sessionStartTime = Date.now()
      state.current.sessionChars = 1
    } else {
      state.current.sessionChars++
    }
    state.current.activeElapsedMs = getElapsedMs()
  }

  const onCharDeleted = () => {
    if (state.current.sessionChars > 0) {
      state.current.sessionChars--
    }
    state.current.activeElapsedMs = getElapsedMs()
  }

  const onPause = (lastKeystrokeTime: number) => {
    if (state.current.sessionStartTime !== null) {
      state.current.totalChars += state.current.sessionChars
      state.current.totalTimeMs += lastKeystrokeTime - state.current.sessionStartTime
      state.current.sessionChars = 0
      state.current.sessionStartTime = null
    }
    state.current.activeElapsedMs = state.current.totalTimeMs
  }

  const restore = (totalChars: number, totalTimeMs: number) => {
    state.current.totalChars = totalChars
    state.current.totalTimeMs = totalTimeMs
    state.current.sessionChars = 0
    state.current.sessionStartTime = null
    state.current.activeElapsedMs = totalTimeMs
  }
  const reset = () => {
    state.current = initialState()
  }

  const getElapsedMs = (): number =>
    state.current.totalTimeMs + (state.current.sessionStartTime ? Date.now() - state.current.sessionStartTime : 0)

  const getElapsedMsAtTime = (timestamp: number): number =>
    state.current.totalTimeMs + (state.current.sessionStartTime ? timestamp - state.current.sessionStartTime : 0)

  const getAllChars = (): number =>
    state.current.totalChars + state.current.sessionChars

  const isSessionActive = (): boolean =>
    state.current.sessionStartTime !== null

  const getActiveElapsedMs = (): number =>
    state.current.activeElapsedMs


  return { onCharTyped, onCharDeleted, onPause, restore, reset, getElapsedMs, getElapsedMsAtTime, getActiveElapsedMs, getAllChars, isSessionActive }
}
