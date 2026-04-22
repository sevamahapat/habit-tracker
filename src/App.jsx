import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Menu, Loader2 } from 'lucide-react'
import Calendar from './components/Calendar.jsx'
import HabitSidebar from './components/HabitSidebar.jsx'
import ThemePicker from './components/ThemePicker.jsx'
import Onboarding from './components/Onboarding.jsx'
import ViewTabs from './components/ViewTabs.jsx'
import Stats from './components/Stats.jsx'
import YearHeatmap from './components/YearHeatmap.jsx'
import TagFilter from './components/TagFilter.jsx'
import AuthGate from './components/AuthGate.jsx'
import AccountMenu, { GuestPill } from './components/AccountMenu.jsx'
import PasswordRecovery from './components/PasswordRecovery.jsx'
import InstallButton from './components/InstallButton.jsx'
import { useHabits, habitTargetAmount } from './hooks/useHabits.js'
import { useChecks } from './hooks/useChecks.js'
import { useTheme } from './hooks/useTheme.js'
import { useSettings } from './hooks/useSettings.js'
import { useReminders } from './hooks/useReminders.js'
import { useAuth } from './hooks/useAuth.js'
import { useCloudSync } from './hooks/useCloudSync.js'
import { usePWA } from './hooks/usePWA.js'
import { fmtDateKey } from './components/DayCard.jsx'
import { exportData, readImportFile } from './lib/dataIO.js'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const isTypingTarget = (el) => {
  if (!el) return false
  const tag = el.tagName
  return (
    tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' ||
    el.isContentEditable === true
  )
}

const isInteractiveTarget = (el) => {
  if (!el) return false
  const tag = el.tagName
  return tag === 'BUTTON' || tag === 'A' || tag === 'SUMMARY'
}

export default function App() {
  const today = new Date()
  const [cursor, setCursor] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [focusedDateKey, setFocusedDateKey] = useState(fmtDateKey(today))
  const [view, setView] = useState('calendar')
  const [activeTagId, setActiveTagId] = useState(null)
  const [guestMode, setGuestMode] = useState(false)

  const auth = useAuth()
  const {
    habits,
    firstRun,
    addHabit,
    removeHabit,
    renameHabit,
    updateHabitSchedule,
    updateHabitTarget,
    updateHabitReminder,
    setHabitTags,
    reorderHabits,
    addDayHabit,
    removeDayHabit,
    renameDayHabit,
    getHabitsForDay,
    replaceAll: replaceHabits,
    finishOnboarding,
    addTag,
    removeTag,
    renameTag,
    recolorTag,
  } = useHabits()
  const {
    isChecked,
    toggleCheck,
    getValue,
    setValue,
    incrementValue,
    replaceAll: replaceChecks,
    checks,
  } = useChecks()
  const { theme, setTheme } = useTheme()
  const { settings, updateSettings } = useSettings()
  const reminders = useReminders({ habits, getValue, getHabitsForDay })
  const pwa = usePWA()

  // Drop tag filter if the tag was deleted
  useEffect(() => {
    if (activeTagId && !habits.tags.some((t) => t.id === activeTagId)) {
      setActiveTagId(null)
    }
  }, [habits.tags, activeTagId])

  const filteredHabitsView = useMemo(() => {
    if (!activeTagId) return habits
    return {
      ...habits,
      habits: habits.habits.filter((h) => h.tagIds?.includes(activeTagId)),
    }
  }, [habits, activeTagId])

  const cloudPayload = useMemo(
    () => ({ habits, checks, theme, settings }),
    [habits, checks, theme, settings],
  )

  // Silent variant of applyImportPayload — used by cloud hydration.
  const applyCloudPayload = useCallback(
    (incoming) => {
      if (!incoming || typeof incoming !== 'object') return false
      const ok = replaceHabits(incoming.habits ?? incoming)
      if (!ok) return false
      if (incoming.checks) replaceChecks(incoming.checks)
      if (incoming.theme && typeof incoming.theme === 'string') setTheme(incoming.theme)
      if (incoming.settings && typeof incoming.settings === 'object') {
        updateSettings(incoming.settings)
      }
      return true
    },
    [replaceHabits, replaceChecks, setTheme, updateSettings],
  )

  const sync = useCloudSync({
    user: guestMode ? null : auth.user,
    payload: cloudPayload,
    applyPayload: applyCloudPayload,
  })

  const shiftMonth = useCallback((delta) => {
    setCursor((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }, [])

  const goToday = useCallback(() => {
    const now = new Date()
    setCursor({ year: now.getFullYear(), month: now.getMonth() })
    setFocusedDateKey(fmtDateKey(now))
  }, [])

  const focusDate = useCallback((nextDate) => {
    const key = fmtDateKey(nextDate)
    setFocusedDateKey(key)
    setCursor({ year: nextDate.getFullYear(), month: nextDate.getMonth() })
  }, [])

  const moveFocusedDay = useCallback((delta) => {
    setFocusedDateKey((prevKey) => {
      const [y, m, d] = prevKey.split('-').map(Number)
      const next = new Date(y, m - 1, d + delta)
      setCursor({ year: next.getFullYear(), month: next.getMonth() })
      return fmtDateKey(next)
    })
  }, [])

  const handleExport = useCallback(() => {
    exportData({ habits, checks, theme, settings })
  }, [habits, checks, theme, settings])

  const applyImportPayload = useCallback(
    (parsed) => {
      if (!parsed || typeof parsed !== 'object') {
        alert('That file does not look like a Bloom export.')
        return false
      }
      const ok = replaceHabits(parsed.habits ?? parsed)
      if (!ok) {
        alert('That file does not look like a Bloom export.')
        return false
      }
      if (parsed.checks) replaceChecks(parsed.checks)
      if (parsed.theme && typeof parsed.theme === 'string') setTheme(parsed.theme)
      if (parsed.settings && typeof parsed.settings === 'object') {
        updateSettings(parsed.settings)
      }
      return true
    },
    [replaceHabits, replaceChecks, setTheme, updateSettings],
  )

  const handleImportFile = useCallback(
    async (file) => {
      try {
        const parsed = await readImportFile(file)
        return applyImportPayload(parsed)
      } catch (err) {
        alert(err.message || 'Could not read that file.')
        return false
      }
    },
    [applyImportPayload],
  )

  const showApp =
    auth.status === 'disabled' || guestMode || auth.status === 'signedIn'

  useEffect(() => {
    if (firstRun) return
    if (!showApp) return
    if (view !== 'calendar') return
    if (sync.hydration === 'pulling') return
    const onKey = (e) => {
      if (isTypingTarget(e.target)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          if (e.shiftKey) shiftMonth(-1)
          else moveFocusedDay(-1)
          break
        case 'ArrowRight':
          e.preventDefault()
          if (e.shiftKey) shiftMonth(1)
          else moveFocusedDay(1)
          break
        case 'ArrowUp':
          e.preventDefault()
          moveFocusedDay(-7)
          break
        case 'ArrowDown':
          e.preventDefault()
          moveFocusedDay(7)
          break
        case 't':
        case 'T':
          e.preventDefault()
          goToday()
          break
        case ' ': {
          if (isInteractiveTarget(e.target)) return
          e.preventDefault()
          const [y, m, d] = focusedDateKey.split('-').map(Number)
          const date = new Date(y, m - 1, d)
          const dayHabits = getHabitsForDay(date, focusedDateKey)
          if (dayHabits.length === 0) return
          const firstUnchecked = dayHabits.find(
            (h) => getValue(focusedDateKey, h.id) < habitTargetAmount(h),
          )
          const target = firstUnchecked ?? dayHabits[0]
          toggleCheck(focusedDateKey, target.id, habitTargetAmount(target))
          break
        }
        default:
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    firstRun, showApp, view, sync.hydration,
    moveFocusedDay, shiftMonth, goToday,
    focusedDateKey, getHabitsForDay, getValue, toggleCheck,
  ])

  // -- Boot screens --------------------------------------------------------

  if (auth.status === 'loading') {
    return (
      <>
        <div className="blob blob--pink" aria-hidden="true" />
        <div className="blob blob--lav" aria-hidden="true" />
        <div className="blob blob--cream" aria-hidden="true" />
        <div className="boot">
          <Loader2 size={28} className="boot__spin" />
          <p className="boot__label">Waking up…</p>
        </div>
      </>
    )
  }

  if (auth.recoveryMode) {
    return (
      <>
        <div className="blob blob--pink" aria-hidden="true" />
        <div className="blob blob--lav" aria-hidden="true" />
        <div className="blob blob--cream" aria-hidden="true" />
        <PasswordRecovery
          updatePassword={auth.updatePassword}
          onCancel={() => auth.signOut()}
        />
      </>
    )
  }

  if (auth.status === 'signedOut' && !guestMode) {
    return (
      <>
        <div className="blob blob--pink" aria-hidden="true" />
        <div className="blob blob--lav" aria-hidden="true" />
        <div className="blob blob--cream" aria-hidden="true" />
        <AuthGate
          enabled={auth.enabled}
          signIn={auth.signIn}
          signUp={auth.signUp}
          sendPasswordReset={auth.sendPasswordReset}
          onGuest={() => setGuestMode(true)}
        />
      </>
    )
  }

  if (sync.hydration === 'pulling') {
    return (
      <>
        <div className="blob blob--pink" aria-hidden="true" />
        <div className="blob blob--lav" aria-hidden="true" />
        <div className="blob blob--cream" aria-hidden="true" />
        <div className="boot">
          <Loader2 size={28} className="boot__spin" />
          <p className="boot__label">Pulling your habits from the cloud…</p>
        </div>
      </>
    )
  }

  if (firstRun) {
    return (
      <>
        <div className="blob blob--pink" aria-hidden="true" />
        <div className="blob blob--lav" aria-hidden="true" />
        <div className="blob blob--cream" aria-hidden="true" />
        <Onboarding onChoose={finishOnboarding} onImport={applyImportPayload} />
      </>
    )
  }

  return (
    <>
      <div className="blob blob--pink" aria-hidden="true" />
      <div className="blob blob--lav" aria-hidden="true" />
      <div className="blob blob--cream" aria-hidden="true" />

      <div className="app">
        <main className="app__main">
          <header className="header">
            <div>
              <div className="header__brand">
                <span aria-hidden="true">❀</span>
                <span>Bloom</span>
              </div>
              <h1 className="header__title">
                {view === 'calendar' ? (
                  <>
                    <span className="header__month">{MONTH_NAMES[cursor.month]}</span>
                    <span className="header__year">{cursor.year}</span>
                  </>
                ) : view === 'stats' ? (
                  <span className="header__month">Stats</span>
                ) : (
                  <span className="header__month">Heatmap</span>
                )}
              </h1>
            </div>
            <div className="header__nav">
              <ViewTabs view={view} setView={setView} />
              {pwa.canInstall && <InstallButton onInstall={pwa.promptInstall} />}
              <ThemePicker theme={theme} setTheme={setTheme} />
              {auth.status === 'signedIn' && !guestMode ? (
                <AccountMenu user={auth.user} onSignOut={auth.signOut} sync={sync} />
              ) : auth.enabled ? (
                <GuestPill onSignIn={() => setGuestMode(false)} />
              ) : null}
              {view === 'calendar' && (
                <>
                  <button
                    className="nav-btn"
                    onClick={() => shiftMonth(-1)}
                    aria-label="Previous month"
                    type="button"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    className="nav-btn nav-btn--today"
                    onClick={goToday}
                    type="button"
                  >
                    Today
                  </button>
                  <button
                    className="nav-btn"
                    onClick={() => shiftMonth(1)}
                    aria-label="Next month"
                    type="button"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>
          </header>

          <TagFilter
            tags={habits.tags}
            activeTagId={activeTagId}
            setActiveTagId={setActiveTagId}
          />

          {view === 'calendar' && (
            <>
              <Calendar
                year={cursor.year}
                month={cursor.month}
                tags={habits.tags}
                getHabitsForDay={getHabitsForDay}
                isChecked={isChecked}
                toggleCheck={toggleCheck}
                getValue={getValue}
                setValue={setValue}
                incrementValue={incrementValue}
                addDayHabit={addDayHabit}
                removeDayHabit={removeDayHabit}
                renameHabit={renameHabit}
                renameDayHabit={renameDayHabit}
                focusedDateKey={focusedDateKey}
                onFocusDate={(key) => {
                  const [y, m, d] = key.split('-').map(Number)
                  focusDate(new Date(y, m - 1, d))
                }}
                activeTagId={activeTagId}
              />

              <p className="keyhint">
                ← → move day · ↑ ↓ ±week · <kbd>T</kbd> today · <kbd>Space</kbd> tick next
                habit · <kbd>Shift</kbd>+← → change month
              </p>
            </>
          )}

          {view === 'stats' && (
            <Stats habits={filteredHabitsView} checks={checks} settings={settings} />
          )}

          {view === 'heatmap' && (
            <YearHeatmap habits={filteredHabitsView} checks={checks} />
          )}
        </main>

        <HabitSidebar
          habits={habits}
          addHabit={addHabit}
          removeHabit={removeHabit}
          renameHabit={renameHabit}
          updateHabitSchedule={updateHabitSchedule}
          updateHabitTarget={updateHabitTarget}
          updateHabitReminder={updateHabitReminder}
          setHabitTags={setHabitTags}
          reorderHabits={reorderHabits}
          addTag={addTag}
          removeTag={removeTag}
          renameTag={renameTag}
          recolorTag={recolorTag}
          reminders={reminders}
          onExport={handleExport}
          onImport={handleImportFile}
          settings={settings}
          updateSettings={updateSettings}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div
          className={`backdrop ${sidebarOpen ? 'backdrop--open' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />
      </div>

      <button
        className="sidebar-fab"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open habit manager"
        type="button"
      >
        <Menu size={24} />
      </button>
    </>
  )
}
