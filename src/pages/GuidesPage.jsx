import { useEffect, useMemo, useState } from 'react'
import { BookOpenText, ListChecks } from 'lucide-react'
import { Header } from '../components/Header'
import { SiteFooter } from '../components/SiteFooter'
import { getGuides } from '../api/contentApi'

export function GuidesPage() {
  const [search, setSearch] = useState('')
  const [guides, setGuides] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const list = await getGuides()
        if (cancelled) return
        setGuides(list)
        setSelectedId(list[0]?.id || '')
      } catch (err) {
        if (cancelled) return
        setError(err.response?.data?.message || 'Không tải được danh sách hướng dẫn.')
        setGuides([])
        setSelectedId('')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const selectedGuide = useMemo(
    () => guides.find((item) => item.id === selectedId) || guides[0],
    [guides, selectedId],
  )

  return (
    <div className="min-h-svh bg-page font-sans text-ink">
      <Header searchQuery={search} onSearchQueryChange={setSearch} />
      <main className="mx-auto w-full max-w-[1200px] px-4 py-8">
        <section className="rounded-2xl border border-[#BC1F26]/20 bg-gradient-to-r from-[#1f2937] via-[#111827] to-[#111827] p-5 text-white shadow-lg md:p-7">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide">
            <BookOpenText className="size-3.5 text-[#D4AF37]" />
            Trung tâm hướng dẫn
          </p>
          <h1 className="mt-3 text-2xl font-black uppercase tracking-tight md:text-3xl">
            Hướng dẫn sử dụng
          </h1>
          <p className="mt-2 text-sm text-white/85 md:text-base">
            Chọn chủ đề bên trái để xem chi tiết cách lắp đặt, sử dụng và bảo dưỡng.
          </p>
        </section>
        {loading ? (
          <p className="mt-5 text-sm text-gray-500">Đang tải bài hướng dẫn...</p>
        ) : error ? (
          <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm lg:sticky lg:top-28 lg:h-fit">
              <p className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                <ListChecks className="size-3.5 text-brand" />
                Danh sách bài viết ({guides.length})
              </p>
              <ul className="space-y-2">
                {guides.map((item, index) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={`w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                        selectedGuide?.id === item.id
                          ? 'border border-brand/20 bg-brand text-white shadow-sm'
                          : 'border border-transparent bg-gray-100 text-gray-700 hover:border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className="mr-2 text-[11px] font-black opacity-80">#{index + 1}</span>
                      {item.title}
                    </button>
                  </li>
                ))}
              </ul>
            </aside>
            <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] md:p-7">
              <h2 className="text-xl font-black text-gray-900 md:text-2xl">
                {selectedGuide?.title || 'Chưa có bài viết'}
              </h2>
              <div
                className="prose mt-5 max-w-none leading-relaxed text-gray-800 prose-headings:text-gray-900 prose-a:text-brand prose-strong:text-gray-900"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                  __html: selectedGuide?.content || '<p>Chưa có nội dung hướng dẫn.</p>',
                }}
              />
            </article>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
