/** Lưới 3 cột mobile (~6 SP/2 hàng); rail ngang md+ khớp catalog (3→4→5 cột). */
export const PRODUCT_SHELF_RAIL_CLASS =
  'max-md:grid max-md:grid-cols-3 max-md:gap-1.5 max-md:overflow-visible ' +
  'md:flex md:items-stretch md:gap-3 md:overflow-x-auto md:scroll-smooth md:pb-1 md:pt-1 [scrollbar-width:thin]'

export const PRODUCT_SHELF_ITEM_CLASS =
  'flex min-h-0 min-w-0 flex-col max-md:w-full ' +
  'md:w-[calc((100%-2*0.75rem)/3)] md:shrink-0 ' +
  'lg:w-[calc((100%-3*0.75rem)/4)] ' +
  'xl:w-[calc((100%-4*1.5rem)/5)]'
