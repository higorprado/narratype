# Lessons Learned

Hard-won knowledge from past bugs and design decisions. Read this before modifying the typing engine or stats system.

## WPM Calculation Bug

**Problem:** Storing derived metrics (WPM) instead of raw data (char count + elapsed time) caused WPM to be wrong when the calculation inputs changed.

**Fix:** Never store derived metrics. Store raw data (correctChars, elapsedMs) and compute WPM at display time.

**Rule:** `calculateWPM(correctChars, elapsedMs)` is called in `buildFullStats()`, not stored anywhere. The StatsAccumulator stores only `totalChars`, `totalTimeMs`, `sessionChars`, `sessionStartTime`.

## Stats Separation: Presentation vs Accumulator

**Problem:** Originally, the TypingEngine tried to track both character state and timing. This led to coupling that made it impossible to freeze stats during inactivity without breaking the typing state.

**Fix:** Split into two independent systems:
- `useTypingEngine`: Presentation only. Characters, cursor, char states, completion. Returns char counts via `getStats()`.
- `useStatsAccumulator`: Numbers only. Char counts and time. Knows nothing about what characters look like.

`TypingArea` merges both in `buildFullStats()`.

**Rule:** If you're adding timing or WPM logic to `useTypingEngine`, stop. It belongs in `useStatsAccumulator`.

## Inactivity Time Freeze

**Problem:** Using `Date.now()` when pausing meant the "frozen" stats showed the current time, not the time of the last keystroke. The displayed WPM would be wrong because the denominator (elapsed time) included the inactive period.

**Fix:** `onPause(lastKeystrokeTime)` uses the recorded last keystroke timestamp, not `Date.now()`. The frozen stats are computed with `buildFullStatsAtTime(lastKeystrokeTime)`.

**Rule:** Always use `lastKeystrokeTimeRef.current` for time calculations during pause/freeze, never `Date.now()`.

## Blur Pause Uses Same Mechanism

**Problem:** Blur and inactivity timeout were implemented separately, causing inconsistent behavior (one would freeze stats, the other wouldn't).

**Fix:** Both use the same flow: `statsAcc.onPause(pauseTime)` -> freeze stats -> call `onInactivity()`.

**Rule:** Any new pause/stop mechanism must go through the same `onPause` + `onInactivity` path.

## Page Splitting Depends on Settings

**Problem:** Changing `wordsPerPage` setting shifted page boundaries, causing the current page index to become invalid.

**Fix:** `TypingConsolePage` detects `wordsPerPage` changes and navigates to page 0 if the current index exceeds the new page count.

**Rule:** Any setting that affects page splitting must trigger a boundary check.

## Dead Key Handling

**Problem:** International keyboards (ABNT2, US-Intl) send `key='Dead'` for accents. The next keystroke produces the composed character, but `keydown` fires with the raw key.

**Fix:** `TypingArea` tracks dead keys via `deadKeyRef`. When `key='Dead'`, store the base character from `DEAD_KEY_MAP`. When the next key is space, produce the base character. Otherwise, let it fall through to normal processing.

**Rule:** Any keyboard handling must account for dead keys. Test with `key='Dead'` and `code='Quote'` scenarios.

## Session Restore Validation

**Problem:** Restoring a saved session after the source text changed (e.g., book update) caused charStates length mismatch, leading to undefined behavior.

**Fix:** `loadTypingSession` validates both text prefix (first 100 chars) and charStates length. On mismatch, the session is cleared and returns null.

**Rule:** Never trust saved session data without validating against current text.
