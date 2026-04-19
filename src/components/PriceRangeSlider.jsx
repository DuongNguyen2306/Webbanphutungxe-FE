import { useCallback } from 'react'
import { PRICE_SLIDER_MIN } from '../data/filterOptions'

export function PriceRangeSlider({ min, max, absoluteMax, onChange }) {
  const safeAbsoluteMax = Math.max(PRICE_SLIDER_MIN, Number(absoluteMax) || PRICE_SLIDER_MIN)
  const effectiveMax = max == null ? safeAbsoluteMax : max

  const clampPair = useCallback(
    (a, b) => {
      let lo = Math.min(a, b)
      let hi = Math.max(a, b)
      lo = Math.max(PRICE_SLIDER_MIN, Math.min(lo, safeAbsoluteMax))
      hi = Math.max(PRICE_SLIDER_MIN, Math.min(hi, safeAbsoluteMax))
      if (lo > hi) [lo, hi] = [hi, lo]
      return { lo, hi }
    },
    [safeAbsoluteMax],
  )

  const onMinInput = (e) => {
    const v = Number(e.target.value)
    const { lo, hi } = clampPair(v, effectiveMax)
    onChange(lo, hi)
  }

  const onMaxInput = (e) => {
    const v = Number(e.target.value)
    const { lo, hi } = clampPair(min, v)
    onChange(lo, hi)
  }

  const onMinTextInput = (e) => {
    const raw = e.target.value.replace(/\D/g, '')
    const v = raw === '' ? PRICE_SLIDER_MIN : Number(raw)
    const { lo, hi } = clampPair(v, effectiveMax)
    onChange(lo, hi)
  }

  const onMaxTextInput = (e) => {
    const raw = e.target.value.replace(/\D/g, '')
    if (raw === '') {
      onChange(min, null)
      return
    }
    const v = Number(raw)
    const { lo, hi } = clampPair(min, v)
    onChange(lo, hi)
  }

  const minPct =
    ((min - PRICE_SLIDER_MIN) / (safeAbsoluteMax - PRICE_SLIDER_MIN || 1)) * 100
  const maxPct =
    ((effectiveMax - PRICE_SLIDER_MIN) / (safeAbsoluteMax - PRICE_SLIDER_MIN || 1)) * 100

  const maxReachedLabel =
    effectiveMax >= safeAbsoluteMax
      ? safeAbsoluteMax >= 5_000_000
        ? 'Trên 5tr'
        : 'Giá tối đa'
      : null

  const thumb = 18
  const insetPx = thumb / 2

  return (
    <div className="pt-1">
      <div className="relative h-8 w-full">
        <div
          className="pointer-events-none absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-gray-200"
          style={{
            left: insetPx,
            right: insetPx,
          }}
        />
        <div
          className="pointer-events-none absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-brand"
          style={{
            left: `calc(${insetPx}px + (100% - ${thumb}px) * ${minPct / 100})`,
            width: `calc((100% - ${thumb}px) * ${Math.max(0, maxPct - minPct) / 100})`,
          }}
        />
        <input
          type="range"
          min={PRICE_SLIDER_MIN}
          max={safeAbsoluteMax}
          step={10_000}
          value={min}
          onChange={onMinInput}
          className="price-range-input absolute inset-x-0 top-0 z-10 h-8 w-full cursor-pointer appearance-none bg-transparent"
          aria-label="Giá tối thiểu"
        />
        <input
          type="range"
          min={PRICE_SLIDER_MIN}
          max={safeAbsoluteMax}
          step={10_000}
          value={effectiveMax}
          onChange={onMaxInput}
          className="price-range-input absolute inset-x-0 top-0 z-20 h-8 w-full cursor-pointer appearance-none bg-transparent"
          aria-label="Giá tối đa"
        />
      </div>
      <div
        className="mt-2 flex justify-between text-xs font-semibold text-ink/70"
        style={{ paddingLeft: insetPx, paddingRight: insetPx }}
      >
        <span>{formatK(min)}</span>
        <span className="text-right">{maxReachedLabel || formatK(effectiveMax)}</span>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          type="text"
          inputMode="numeric"
          value={String(min)}
          onChange={onMinTextInput}
          placeholder="Giá tối thiểu"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
        />
        <input
          type="text"
          inputMode="numeric"
          value={max == null ? '' : String(max)}
          onChange={onMaxTextInput}
          placeholder="Giá tối đa"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
        />
      </div>
    </div>
  )
}

function formatK(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}tr`
  if (n >= 1000) return `${Math.round(n / 1000)}k`
  return `${n}`
}
