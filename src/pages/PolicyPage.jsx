import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { Header } from '../components/Header'
import { SiteFooter } from '../components/SiteFooter'
import { getPolicyMetaBySlug, POLICY_PAGES } from '../constants/policies'
import { getPolicyHtmlContent } from '../data/policies'

export function PolicyPage() {
  const { slug } = useParams()
  const [search, setSearch] = useState('')

  const meta = useMemo(() => getPolicyMetaBySlug(slug || ''), [slug])
  const html = useMemo(() => (meta ? getPolicyHtmlContent(meta.slug) : null), [meta])

  if (!meta || !html) {
    return <Navigate to="/shop" replace />
  }

  const others = POLICY_PAGES.filter((p) => p.slug !== meta.slug)

  return (
    <div className="min-h-svh bg-page font-sans text-ink">
      <Header searchQuery={search} onSearchQueryChange={setSearch} />
      <main className="mx-auto w-full max-w-[900px] px-4 py-8">
        <section className="rounded-2xl border border-[#BC1F26]/20 bg-gradient-to-r from-[#1f2937] via-[#111827] to-[#111827] p-5 text-white shadow-lg md:p-7">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide">
            <FileText className="size-3.5 text-[#D4AF37]" />
            {meta.badge}
          </p>
          <h1 className="mt-3 text-xl font-black leading-tight md:text-3xl">{meta.title}</h1>
          <p className="mt-2 text-sm text-white/85 md:text-base">{meta.summary}</p>
        </section>

        <article className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] md:p-8">
          <div
            className="policy-prose prose max-w-none leading-relaxed text-gray-800 prose-headings:font-bold prose-headings:text-gray-900 prose-h2:mt-8 prose-h2:text-lg prose-h3:mt-5 prose-h3:text-base prose-a:text-brand prose-li:my-1 prose-ol:pl-5 prose-ul:pl-5 prose-strong:text-gray-900"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </article>

        <nav
          className="mt-6 rounded-xl border border-gray-200 bg-white p-4"
          aria-label="Chính sách khác"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
            Xem thêm chính sách
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {others.map((p) => (
              <li key={p.slug}>
                <Link
                  to={p.path}
                  className="inline-block rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-brand/30 hover:text-brand"
                >
                  {p.badge}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>
      <SiteFooter />
    </div>
  )
}
