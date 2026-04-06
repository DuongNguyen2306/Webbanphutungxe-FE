import { useCallback } from 'react'
import { PRICE_SLIDER_MIN, PRICE_SLIDER_MAX } from '../data/filterOptions'

export function PriceRangeSlider({ min, max, onChange }) {
  const clampPair = useCallback(
    (a, b) => {
      let lo = Math.min(a, b)
      let hi = Math.max(a, b)
      lo = Math.max(PRICE_SLIDER_MIN, Math.min(lo, PRICE_SLIDER_MAX))
      hi = Math.max(PRICE_SLIDER_MIN, Math.min(hi, PRICE_SLIDER_MAX))
      if (lo > hi) [lo, hi] = [hi, lo]
      return { lo, hi }
    },
    [],
  )

  const onMinInput = (e) => {
    const v = Number(e.target.value)
    const { lo, hi } = clampPair(v, max)
    onChange(lo, hi)
  }

  const onMaxInput = (e) => {
    const v = Number(e.target.value)
    const { lo, hi } = clampPair(min, v)
    onChange(lo, hi)
  }

  const minPct =
    ((min - PRICE_SLIDER_MIN) / (PRICE_SLIDER_MAX - PRICE_SLIDER_MIN)) * 100
  const maxPct =
    ((max - PRICE_SLIDER_MIN) / (PRICE_SLIDER_MAX - PRICE_SLIDER_MIN)) * 100

  return (
    <div className="pt-1">
      <div className="relative h-8">
        <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gray-200" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand"
          style={{
            left: `${minPct}%`,
            width: `${Math.max(0, maxPct - minPct)}%`,
          }}
        />
        <input
          type="range"
          min={PRICE_SLIDER_MIN}
          max={PRICE_SLIDER_MAX}
          step={10_000}
          value={min}
          onChange={onMinInput}
          className="price-range-input absolute inset-x-0 top-0 z-10 h-8 w-full cursor-pointer appearance-none bg-transparent"
          aria-label="Giá tối thiểu"
        />
        <input
          type="range"
          min={PRICE_SLIDER_MIN}
          max={PRICE_SLIDER_MAX}
          step={10_000}
          value={max}
          onChange={onMaxInput}
          className="price-range-input absolute inset-x-0 top-0 z-20 h-8 w-full cursor-pointer appearance-none bg-transparent"
          aria-label="Giá tối đa"
        />
      </div>
      <div className="mt-2 flex justify-between text-xs font-semibold text-ink/70">
        <span>{formatK(min)}</span>
        <span>{formatK(max)}</span>
      </div>
    </div>
  )
}

function formatK(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}tr`
  if (n >= 1000) return `${Math.round(n / 1000)}k`
  return `${n}`
}
