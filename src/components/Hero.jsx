export function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-ink">
      <div className="relative aspect-[21/9] min-h-[200px] max-h-[420px] w-full sm:aspect-[2.4/1] md:max-h-[480px]">
        <img
          src="https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1920&h=800&fit=crop"
          alt=""
          className="h-full w-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />
        <div className="absolute inset-0 mx-auto flex w-full max-w-[1600px] flex-col justify-center px-4 sm:px-8 xl:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80 sm:text-sm">
            Thai Vũ · Phụ kiện & phụ tùng xe máy
          </p>
          <h1 className="mt-2 max-w-xl text-2xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl">
            Chính hãng · Giao nhanh · Tư vấn Zalo tức thì
          </h1>
          <p className="mt-3 max-w-md text-sm text-white/85 sm:text-base">
            Hơn 700 SKU Vespa, Honda, Yamaha, Piaggio — lọc nâng cao theo dòng xe,
            danh mục và mức giá.
          </p>
        </div>
      </div>
    </section>
  )
}
