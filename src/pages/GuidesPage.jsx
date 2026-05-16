import { useCallback, useEffect, useMemo, useState } from 'react'
import { BookOpenText, ListChecks, ShoppingBag } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Header } from '../components/Header'
import { SiteFooter } from '../components/SiteFooter'
import { PurchaseGuide } from '../components/guides/PurchaseGuide'
import { getGuides } from '../api/contentApi'
import {
  isPurchaseGuideQuery,
  PURCHASE_GUIDE_ID,
} from '../constants/guides'

export { PURCHASE_GUIDE_ID } from '../constants/guides'

export function GuidesPage() {
  const [search, setSearch] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const [guides, setGuides] = useState([])
  const [selectedId, setSelectedId] = useState(PURCHASE_GUIDE_ID)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isPurchaseGuideQuery(searchParams)) {
      setSelectedId(PURCHASE_GUIDE_ID)
    }
  }, [searchParams])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const list = await getGuides()
        if (cancelled) return
        setGuides(list)
      } catch (err) {
        if (cancelled) return
        setError(err.response?.data?.message || 'Không tải được danh sách hướng dẫn.')
        setGuides([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const topics = useMemo(
    () => [
      { id: PURCHASE_GUIDE_ID, title: 'Hướng dẫn cách thức mua hàng', kind: 'purchase' },
      ...guides.map((g) => ({ id: g.id, title: g.title, kind: 'article', content: g.content })),
    ],
    [guides],
  )

  const selected = useMemo(
    () => topics.find((item) => item.id === selectedId) || topics[0],
    [topics, selectedId],
  )

  const isPurchaseGuide = selected?.kind === 'purchase'

  const selectTopic = useCallback(
    (id) => {
      setSelectedId(id)
      if (id === PURCHASE_GUIDE_ID) {
        setSearchParams({ 'mua-hang': '1' }, { replace: true })
      } else {
        setSearchParams({}, { replace: true })
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [setSearchParams],
  )

  return (
    <div className="min-h-svh bg-page font-sans text-ink">
      <Header searchQuery={search} onSearchQueryChange={setSearch} />
      <main
        className={`mx-auto w-full px-4 py-8 ${isPurchaseGuide ? 'max-w-[1400px]' : 'max-w-[1200px]'}`}
      >
        <section className="rounded-2xl border border-[#BC1F26]/20 bg-gradient-to-r from-[#1f2937] via-[#111827] to-[#111827] p-5 text-white shadow-lg md:p-7">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide">
            <BookOpenText className="size-3.5 text-[#D4AF37]" />
            Trung tâm hướng dẫn
          </p>
          <h1 className="mt-3 text-2xl font-black uppercase tracking-tight md:text-3xl">
            Hướng dẫn sử dụng
          </h1>
          <p className="mt-2 text-sm text-white/85 md:text-base">
            Cách đặt hàng trên website và các bài hướng dẫn lắp đặt, bảo dưỡng phụ tùng.
          </p>
        </section>

        {loading && guides.length === 0 ? (
          <p className="mt-5 text-sm text-gray-500">Đang tải bài hướng dẫn...</p>
        ) : null}

        {error ? (
          <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {error}
            {!isPurchaseGuide ? (
              <span className="mt-1 block">Vẫn có thể xem hướng dẫn đặt hàng bên dưới.</span>
            ) : null}
          </p>
        ) : null}

        <div
          className={`mt-5 grid gap-4 ${isPurchaseGuide ? 'lg:grid-cols-[260px_minmax(0,1fr)]' : 'lg:grid-cols-[300px_minmax(0,1fr)]'}`}
        >
          <aside className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm lg:sticky lg:top-28 lg:h-fit">
            <p className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
              <ListChecks className="size-3.5 text-brand" />
              Danh mục ({topics.length})
            </p>
            <ul className="space-y-2">
              {topics.map((item, index) => {
                const active = selected?.id === item.id
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => selectTopic(item.id)}
                      className={`flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                        active
                          ? 'border border-brand/20 bg-brand text-white shadow-sm'
                          : 'border border-transparent bg-gray-100 text-gray-700 hover:border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {item.kind === 'purchase' ? (
                        <ShoppingBag
                          className={`mt-0.5 size-4 shrink-0 ${active ? 'text-white' : 'text-brand'}`}
                          strokeWidth={2.2}
                        />
                      ) : (
                        <span className="mt-0.5 text-[11px] font-black opacity-80">#{index}</span>
                      )}
                      <span className="min-w-0 flex-1 leading-snug">{item.title}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </aside>

          <article
            className={`rounded-2xl border border-gray-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)] ${
              isPurchaseGuide ? 'p-4 md:p-6 lg:p-8' : 'p-5 md:p-7 lg:p-8'
            }`}
          >
            {isPurchaseGuide ? (
              <PurchaseGuide />
            ) : (
              <>
                <h2 className="text-xl font-black text-gray-900 md:text-2xl">
                  {selected?.title || 'Chưa có bài viết'}
                </h2>
                <div
                  className="prose mt-5 max-w-none leading-relaxed text-gray-800 prose-headings:text-gray-900 prose-a:text-brand prose-strong:text-gray-900"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{
                    __html: selected?.content || '<p>Chưa có nội dung hướng dẫn.</p>',
                  }}
                />
              </>
            )}
          </article>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
