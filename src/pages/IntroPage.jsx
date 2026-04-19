import { useEffect, useState } from 'react'
import { BadgeInfo, Sparkles } from 'lucide-react'
import { Header } from '../components/Header'
import { SiteFooter } from '../components/SiteFooter'
import { getLatestIntro } from '../api/contentApi'

export function IntroPage() {
  const [search, setSearch] = useState('')
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getLatestIntro()
        if (!cancelled) setArticle(data)
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Không tải được nội dung giới thiệu.')
          setArticle(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="min-h-svh bg-page font-sans text-ink">
      <Header searchQuery={search} onSearchQueryChange={setSearch} />
      <main className="mx-auto w-full max-w-[1100px] px-4 py-8">
        <section className="relative overflow-hidden rounded-2xl border border-[#BC1F26]/20 bg-gradient-to-r from-[#1f2937] via-[#111827] to-[#111827] p-6 text-white shadow-lg md:p-8">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#BC1F26]/25 blur-2xl" />
          <div className="relative">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide">
              <Sparkles className="size-3.5 text-[#D4AF37]" />
              Thai Vũ Official
            </p>
            <h1 className="mt-3 text-2xl font-black leading-tight md:text-4xl">
              Giới thiệu về Thai Vũ
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/85 md:text-base">
              Nơi hội tụ phụ tùng và phụ kiện xe máy chất lượng cao, tư vấn tận tâm và chính sách minh bạch.
            </p>
          </div>
        </section>

        {loading ? (
          <p className="mt-5 text-sm text-gray-500">Đang tải nội dung...</p>
        ) : error ? (
          <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : (
          <article className="mt-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] md:p-8">
            <p className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#BC1F26]">
              <BadgeInfo className="size-3.5" />
              Tổng quan
            </p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-gray-900 md:text-3xl">
              {article?.title || 'Giới thiệu'}
            </h2>
            <div
              className="prose mt-5 max-w-none leading-relaxed text-gray-800 prose-headings:text-gray-900 prose-a:text-brand prose-strong:text-gray-900"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: article?.content || '<p>Chưa có nội dung.</p>' }}
            />
          </article>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
