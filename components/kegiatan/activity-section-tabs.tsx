'use client'

import { Fragment, useState, type KeyboardEvent, type ReactNode } from 'react'
import type { ActivitySection } from '@/lib/activities'

type SectionItem = {
  key: ActivitySection
  label: string
  count: number
  node: ReactNode
}

type TabKey = 'all' | ActivitySection

const tabClass = (active: boolean) =>
  [
    'inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
    active
      ? 'border-orange-600 bg-orange-600 text-white'
      : 'border-stone-200 bg-white text-stone-600 hover:border-orange-300 hover:text-orange-700',
  ].join(' ')

export function ActivitySectionTabs({ sections }: { sections: SectionItem[] }) {
  const [active, setActive] = useState<TabKey>('all')

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'all', label: 'Semua' },
    ...sections.map(({ key, label, count }) => ({ key, label, count })),
  ]

  const activeSections =
    active === 'all' ? sections : sections.filter((section) => section.key === active)

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const direction = event.key === 'ArrowRight' ? 1 : -1
    const nextIndex = (index + direction + tabs.length) % tabs.length
    const next = tabs[nextIndex]
    setActive(next.key)
    document.getElementById(`activity-tab-${next.key}`)?.focus()
  }

  return (
    <>
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4 md:pb-6">
          <div
            role="tablist"
            aria-label="Bagian katalog kegiatan"
            className="no-scrollbar flex gap-2 overflow-x-auto border-b border-orange-100 pb-3"
          >
            {tabs.map((tab, index) => {
              const isActive = active === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  id={`activity-tab-${tab.key}`}
                  aria-selected={isActive}
                  aria-controls="activity-panel"
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActive(tab.key)}
                  onKeyDown={(event) => handleKeyDown(event, index)}
                  className={tabClass(isActive)}
                >
                  {tab.label}
                  {tab.count != null && (
                    <span
                      className={`text-[10px] font-semibold ${
                        isActive ? 'text-white/80' : 'text-stone-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div
        id="activity-panel"
        role="tabpanel"
        aria-labelledby={`activity-tab-${active}`}
        tabIndex={0}
        className="focus-visible:outline-none"
      >
        {activeSections.map(({ key, node }) => (
          <Fragment key={key}>{node}</Fragment>
        ))}
      </div>
    </>
  )
}
