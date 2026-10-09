import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FileText, Home, Menu, ShieldCheck } from 'lucide-react'
import { Header } from '../components/Header'
import { SiteFooter } from '../components/SiteFooter'
import { getPolicyMetaBySlug, POLICY_PAGES } from '../constants/policies'
import { getPolicyHtmlContent } from '../data/policies'

// Nhóm các chính sách theo danh mục
const POLICY_CATEGORIES = [
  { id: 'mua-hang', label: 'Mua hàng & Thanh toán', policies: ['doi-tra', 'chinh-sach-gia', 'chinh-sach-thanh-toan', 'van-chuyen'] },
  { id: 'ban-hang', label: 'Bảo hành & Bảo mật', policies: ['bao-hanh', 'bao-mat'] },
  { id: 'phap-ly', label: 'Pháp lý & Quy định', policies: ['dieu-khoan', 'khieu-nai', 'dieu-kien-cung-cap', 'thong-tin-chu-quan'] },
]

export function PolicyPage() {
  const { slug } = useParams()
  const [search, setSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const meta = slug ? getPolicyMetaBySlug(slug) : null
  const html = meta ? getPolicyHtmlContent(meta.slug) : null

  // Tìm policy đầu tiên làm mặc định
  const defaultPolicy = POLICY_PAGES[0]

  return (
    <div className="min-h-svh bg-page font-sans text-ink">
      <Header searchQuery={search} onSearchQueryChange={setSearch} />

      {/* Breadcrumb */}
      <div className="border-b border-gray-200 bg-white/80 py-2">
        <div className="mx-auto flex max-w-[1200px] items-center gap-2 px-4 text-xs">
          <Link to="/shop" className="flex items-center gap-1 text-gray-500 transition hover:text-brand">
            <Home className="size-3.5" />
            Trang chủ
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-brand">Chính sách & Pháp lý</span>
          {meta && (
            <>
              <span className="text-gray-300">/</span>
              <span className="text-brand">{meta.badge}</span>
            </>
          )}
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1200px] px-4 py-6">
        {/* Banner Header */}
        <section className="rounded-2xl border border-[#BC1F26]/20 bg-gradient-to-r from-[#1f2937] via-[#111827] to-[#1f2937] p-5 text-white shadow-lg md:p-7">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide">
            <ShieldCheck className="size-3.5 text-[#D4AF37]" />
            Trung tâm pháp lý & Quy định
          </p>
          <h1 className="mt-3 text-2xl font-black uppercase tracking-tight md:text-3xl">
            Chính sách & Quy định chung
          </h1>
          <p className="mt-2 text-sm text-white/85 md:text-base">
            Tổng hợp các chính sách bán hàng, bảo hành, bảo mật và nghĩa vụ theo quy định TMĐT.
          </p>
        </section>

        <div className="mt-5 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* Sidebar - Danh mục chính sách */}
          <aside className="rounded-2xl border border-gray-200 bg-white shadow-sm lg:sticky lg:top-28 lg:h-fit lg:p-4">
            {/* Mobile Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mb-3 flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold lg:hidden"
            >
              <span className="flex items-center gap-2">
                <Menu className="size-4" />
                Danh mục chính sách
              </span>
              <span className="text-xs text-gray-400">{sidebarOpen ? 'Đóng' : 'Mở'}</span>
            </button>

            {/* Desktop Title */}
            <p className="mb-3 hidden items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500 lg:flex">
              <FileText className="size-4 text-brand" />
              Danh mục chính sách
            </p>

            {/* Policy List */}
            <nav className={`space-y-4 ${sidebarOpen ? 'block' : 'hidden'} lg:block`}>
              {POLICY_CATEGORIES.map((cat) => (
                <div key={cat.id}>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">
                    {cat.label}
                  </p>
                  <ul className="space-y-1">
                    {cat.policies.map((policySlug) => {
                      const policy = POLICY_PAGES.find((p) => p.slug === policySlug)
                      if (!policy) return null
                      const isActive = meta?.slug === policy.slug || (!meta && policy.slug === defaultPolicy.slug)
                      return (
                        <li key={policy.slug}>
                          <Link
                            to={policy.path}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                              isActive
                                ? 'border border-brand/20 bg-brand text-white shadow-sm'
                                : 'border border-transparent bg-gray-100 text-gray-700 hover:border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <span
                              className={`size-2 rounded-full ${isActive ? 'bg-white' : 'bg-gray-300'}`}
                            />
                            <span className="leading-snug">{policy.title}</span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>

          {/* Content Area */}
          <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] md:p-7 lg:p-8">
            {meta && html ? (
              <>
                <p className="inline-flex items-center gap-2 rounded-full border border-[#BC1F26]/20 bg-brand/5 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand">
                  <FileText className="size-3.5" />
                  {meta.badge}
                </p>
                <h2 className="mt-3 text-xl font-black text-gray-900 md:text-2xl">{meta.title}</h2>
                {meta.summary && (
                  <p className="mt-2 text-sm text-gray-600 md:text-base">{meta.summary}</p>
                )}
                <div className="policy-prose prose mt-5 max-w-none leading-relaxed text-gray-800 prose-headings:font-bold prose-headings:text-gray-900 prose-h2:mt-8 prose-h2:text-lg prose-h3:mt-5 prose-h3:text-base prose-a:text-brand prose-li:my-1 prose-ol:pl-5 prose-ul:pl-5 prose-strong:text-gray-900"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              </>
            ) : (
              /* Trang chính - Hiển thị tất cả */
              <div className="space-y-6">
                <h2 className="text-xl font-black text-gray-900 md:text-2xl">
                  Tổng quan chính sách
                </h2>
                <p className="text-gray-600">
                  Vui lòng chọn một mục chính sách từ danh sách bên trái để xem chi tiết.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {POLICY_PAGES.map((policy) => (
                    <Link
                      key={policy.slug}
                      to={policy.path}
                      className="group rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:border-brand hover:bg-brand/5"
                    >
                      <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand">
                        <FileText className="size-3.5" />
                        {policy.badge}
                      </p>
                      <h3 className="mt-2 font-semibold text-gray-900 group-hover:text-brand">
                        {policy.title}
                      </h3>
                      <p className="mt-1 text-xs text-gray-500 line-clamp-2">{policy.summary}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
