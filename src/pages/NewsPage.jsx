import { useEffect, useMemo, useState } from 'react'
import { Newspaper, Rss } from 'lucide-react'
import { Header } from '../components/Header'
import { SiteFooter } from '../components/SiteFooter'
import { getNewsArticles } from '../api/contentApi'

function formatDate(input) {
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('vi-VN')
}

export function NewsPage() {
  const [search, setSearch] = useState('')
  const [items, setItems] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const list = await getNewsArticles()
        if (cancelled) return
        setItems(list)
        setSelectedId(list[0]?.id || '')
      } catch (err) {
        if (cancelled) return
        setError(err.response?.data?.message || 'Không tải được danh sách tin tức.')
        setItems([])
        setSelectedId('')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const selected = useMemo(
    () => items.find((it) => it.id === selectedId) || items[0],
    [items, selectedId],
  )

  return (
    <div className="min-h-svh bg-page font-sans text-ink">
      <Header searchQuery={search} onSearchQueryChange={setSearch} />
      <main className="mx-auto w-full max-w-[1200px] px-4 py-8">
        <section className="rounded-2xl border border-[#BC1F26]/20 bg-gradient-to-r from-[#1f2937] via-[#111827] to-[#111827] p-5 text-white shadow-lg md:p-7">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide">
            <Rss className="size-3.5 text-[#D4AF37]" />
            Cập nhật mới
          </p>
          <h1 className="mt-3 text-2xl font-black uppercase tracking-tight md:text-3xl">
            Tin tức
          </h1>
          <p className="mt-2 text-sm text-white/85 md:text-base">
            Tổng hợp các thông báo, chương trình và bài viết mới nhất từ Thai Vũ.
          </p>
        </section>

        {loading ? (
          <p className="mt-5 text-sm text-gray-500">Đang tải tin tức...</p>
        ) : error ? (
          <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm lg:sticky lg:top-28 lg:h-fit">
              <p className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                <Newspaper className="size-3.5 text-brand" />
                Danh sách tin ({items.length})
              </p>
              <ul className="space-y-2">
                {items.map((item, index) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={`w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                        selected?.id === item.id
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
                {selected?.title || 'Chưa có bài viết'}
              </h2>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {selected?.author ? `Tác giả: ${selected.author}` : 'Tác giả: Thai Vũ'}{' '}
                {selected?.createdAt ? `· ${formatDate(selected.createdAt)}` : ''}
              </p>
              <div
                className="prose mt-5 max-w-none leading-relaxed text-gray-800 prose-headings:text-gray-900 prose-a:text-brand prose-strong:text-gray-900"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                  __html: selected?.content || '<p>Chưa có nội dung tin tức.</p>',
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
