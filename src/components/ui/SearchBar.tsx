"use client"

import { useEffect, useRef, useMemo, useState, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useAppStore } from "@/lib/store"
import { createStarSearchIndex, searchStars } from "@/lib/star-search"
import type { StarData } from "@/lib/spotify/types"

export function SearchBar() {
  const searchOpen = useAppStore((s) => s.searchOpen)
  const setSearchOpen = useAppStore((s) => s.setSearchOpen)
  const searchQuery = useAppStore((s) => s.searchQuery)
  const setSearchQuery = useAppStore((s) => s.setSearchQuery)
  const stars = useAppStore((s) => s.stars)

  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Build search index (memoized on star count change)
  const searchIndex = useMemo(
    () => createStarSearchIndex(stars),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stars.length]
  )

  // Compute results from debounced query
  const results = useMemo(
    () => searchStars(searchIndex, debouncedQuery),
    [searchIndex, debouncedQuery]
  )

  // Debounce search query by 100ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 100)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchQuery])

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [results])

  // Auto-focus input when search opens
  useEffect(() => {
    if (searchOpen) {
      // Small delay to allow animation to start
      const timer = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    }
  }, [searchOpen])

  // Global keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if another input is focused
      const target = e.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return
      }

      if (
        e.code === "Slash" ||
        ((e.metaKey || e.ctrlKey) && e.code === "KeyK")
      ) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [setSearchOpen])

  const handleSelect = useCallback(
    (star: StarData) => {
      const store = useAppStore.getState()
      store.setSearchOpen(false)
      store.setSearchQuery("")
      store.startWarp({ position: star.position, starId: star.id })
    },
    []
  )

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) =>
        results.length > 0 ? (prev + 1) % results.length : 0
      )
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) =>
        results.length > 0 ? (prev - 1 + results.length) % results.length : 0
      )
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (results.length > 0 && results[selectedIndex]) {
        handleSelect(results[selectedIndex])
      }
    } else if (e.key === "Escape") {
      e.preventDefault()
      setSearchOpen(false)
      setSearchQuery("")
    }
  }

  const hasResults = debouncedQuery.trim().length > 0
  const dropdownOpen = hasResults

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-20"
        >
          <div className="w-[480px] max-w-[calc(100vw-32px)]">
            {/* Search input */}
            <div
              className="relative flex items-center"
              style={{
                background: "rgba(0, 0, 20, 0.9)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(0, 240, 255, 0.6)",
                borderRadius: dropdownOpen ? "12px 12px 0 0" : "12px",
              }}
            >
              {/* Search icon */}
              <div className="pl-4 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: "rgba(255, 255, 255, 0.4)" }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>

              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded={dropdownOpen}
                aria-activedescendant={
                  dropdownOpen && results.length > 0
                    ? `search-result-${selectedIndex}`
                    : undefined
                }
                aria-controls="search-results-listbox"
                aria-label="Search songs or artists"
                placeholder="Search songs or artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                className="flex-1 h-[44px] px-3 text-[16px] text-white bg-transparent outline-none"
                style={{
                  caretColor: "#00f0ff",
                }}
              />

              {/* Keyboard hint badge */}
              <div className="pr-4 flex items-center">
                <span
                  className="text-[12px] font-semibold px-1.5 py-0.5 rounded"
                  style={{
                    background: "rgba(0, 240, 255, 0.15)",
                    color: "rgba(255, 255, 255, 0.4)",
                  }}
                >
                  /
                </span>
              </div>
            </div>

            {/* Dropdown results */}
            {dropdownOpen && (
              <div
                id="search-results-listbox"
                role="listbox"
                aria-label="Search results"
                style={{
                  background: "rgba(0, 0, 20, 0.95)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderTop: "none",
                  borderRadius: "0 0 12px 12px",
                }}
              >
                {results.length > 0 ? (
                  results.map((star, index) => (
                    <div
                      key={star.id}
                      id={`search-result-${index}`}
                      role="option"
                      aria-selected={index === selectedIndex}
                      onClick={() => handleSelect(star)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className="h-[44px] px-4 flex items-center cursor-pointer transition-colors"
                      style={{
                        background:
                          index === selectedIndex
                            ? "rgba(0, 240, 255, 0.08)"
                            : "transparent",
                        borderLeft:
                          index === selectedIndex
                            ? "2px solid #00f0ff"
                            : "2px solid transparent",
                      }}
                    >
                      <span className="text-[14px] text-white truncate">
                        {star.name}
                      </span>
                      <span className="text-[14px] mx-1" style={{ color: "rgba(255, 255, 255, 0.5)" }}>
                        {" - "}
                      </span>
                      <span
                        className="text-[14px] truncate"
                        style={{ color: "rgba(255, 255, 255, 0.5)" }}
                      >
                        {star.artist}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="h-[44px] flex items-center justify-center">
                    <span
                      className="text-[14px]"
                      style={{ color: "rgba(255, 255, 255, 0.4)" }}
                    >
                      No matching stars found
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
