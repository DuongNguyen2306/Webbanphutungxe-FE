import { useEffect, useState } from 'react'
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { getPublicBanners } from '../api/contentApi'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

const FALLBACK_BANNER = {
  imageUrl:
    'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1920&h=800&fit=crop',
  linkTo: '',
  textLayers: [],
}

function renderLayer(layer, banner, index) {
  const defaultPositionByLevel = {
    h1: { x: '8%', y: '20%', maxWidth: '620px' },
    h2: { x: '8%', y: '12%', maxWidth: '620px' },
    h3: { x: '8%', y: '8%', maxWidth: '620px' },
    body: { x: '8%', y: '56%', maxWidth: '560px' },
    cta: { x: '8%', y: '74%', maxWidth: '300px' },
  }
  const fallback = defaultPositionByLevel[layer?.level] || defaultPositionByLevel.body

  const style = {
    color: layer?.style?.color || '#fff',
    fontSize: layer?.style?.fontSize || undefined,
    fontWeight: layer?.style?.fontWeight || undefined,
    textAlign: layer?.style?.align || undefined,
    position: 'absolute',
    left: layer?.style?.x || fallback.x,
    top: layer?.style?.y || fallback.y,
    maxWidth: layer?.style?.maxWidth || fallback.maxWidth,
  }
  const text = layer?.text || ''
  const key = `${banner.id || banner.imageUrl}-${layer.level}-${index}`

  if (layer.level === 'h1') {
    return (
      <h1 key={key} style={style} className="text-2xl font-black leading-tight sm:text-4xl md:text-5xl">
        {text}
      </h1>
    )
  }
  if (layer.level === 'h2') {
    return (
      <h2 key={key} style={style} className="text-xl font-extrabold leading-tight sm:text-3xl">
        {text}
      </h2>
    )
  }
  if (layer.level === 'h3') {
    return (
      <h3 key={key} style={style} className="text-lg font-bold leading-tight sm:text-xl">
        {text}
      </h3>
    )
  }
  if (layer.level === 'cta') {
    const href = banner.linkTo || '#'
    return (
      <a
        key={key}
        href={href}
        style={style}
        className="inline-flex rounded-md bg-brand px-4 py-2 text-sm font-extrabold uppercase tracking-wide text-white shadow-sm hover:brightness-110"
      >
        {text}
      </a>
    )
  }
  return (
    <p key={key} style={style} className="text-sm leading-relaxed sm:text-base">
      {text}
    </p>
  )
}

export function Hero() {
  const [banners, setBanners] = useState([FALLBACK_BANNER])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const list = await getPublicBanners()
        if (cancelled) return
        if (list.length) setBanners(list)
      } catch {
        if (!cancelled) setBanners([FALLBACK_BANNER])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="relative w-full overflow-hidden bg-ink">
      <Swiper
        modules={[Autoplay, Navigation, Pagination]}
        autoplay={{ delay: 4500, disableOnInteraction: false }}
        loop={banners.length > 1}
        navigation
        pagination={{ clickable: true }}
        className="hero-swiper"
      >
        {banners.map((item) => (
          <SwiperSlide key={item.id || item.imageUrl}>
            <div className="relative aspect-[21/9] min-h-[200px] max-h-[420px] w-full sm:aspect-[2.4/1] md:max-h-[480px]">
              {item.linkTo ? (
                <a href={item.linkTo} className="block h-full w-full">
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="h-full w-full object-cover opacity-90"
                  />
                </a>
              ) : (
                <img
                  src={item.imageUrl}
                  alt=""
                  className="h-full w-full object-cover opacity-90"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />
              {Array.isArray(item.textLayers) && item.textLayers.length > 0 ? (
                <div className="absolute inset-0 mx-auto w-full max-w-[1600px] px-4 sm:px-8 xl:px-10">
                  {item.textLayers
                    .filter((layer) => layer.isActive !== false && String(layer.text || '').trim())
                    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
                    .map((layer, index) => renderLayer(layer, item, index))}
                </div>
              ) : (
                <div className="absolute inset-0 mx-auto flex w-full max-w-[1600px] flex-col justify-center px-4 sm:px-8 xl:px-10">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80 sm:text-sm">
                    Thai Vũ · Phụ kiện & phụ tùng xe máy
                  </p>
                  <h1 className="mt-2 max-w-xl text-2xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl">
                    Chính hãng · Giao nhanh · Tư vấn Zalo nhanh
                  </h1>
                  <p className="mt-3 max-w-md text-sm text-white/85 sm:text-base">
                    Rất nhiều mặt hàng dành cho anh em chơi xe và nhiều mức giá.
                  </p>
                </div>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  )
}
