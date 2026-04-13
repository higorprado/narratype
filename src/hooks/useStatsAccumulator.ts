import { useRef } from 'react'

interface StatsAccumulatorState {
  totalChars: number
  totalTimeMs: number
  sessionChars: number
  sessionStartTime: number | null
}

const initialState = (): StatsAccumulatorState => ({
  totalChars: 0,
  totalTimeMs: 0,
  sessionChars: 0,
  sessionStartTime: null,
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
  }

  const onCharDeleted = () => {
    if (state.current.sessionChars > 0) {
      state.current.sessionChars--
    }
  }

  const onPause = (lastKeystrokeTime: number) => {
    if (state.current.sessionStartTime !== null) {
      state.current.totalChars += state.current.sessionChars
      state.current.totalTimeMs += lastKeystrokeTime - state.current.sessionStartTime
      state.current.sessionChars = 0
      state.current.sessionStartTime = null
    }
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

  return { onCharTyped, onCharDeleted, onPause, reset, getElapsedMs, getElapsedMsAtTime, getAllChars, isSessionActive }
}
