import { listPrice } from './catalogFilters'

/**
 * @param {import('../data/products').Product[]} items
 * @param {'default' | 'price_asc' | 'price_desc' | 'name'} sortBy
 */
export function sortCatalogProducts(items, sortBy) {
  const copy = [...items]
  switch (sortBy) {
    case 'price_asc':
      return copy.sort((a, b) => listPrice(a) - listPrice(b))
    case 'price_desc':
      return copy.sort((a, b) => listPrice(b) - listPrice(a))
    case 'name':
      return copy.sort((a, b) =>
        String(a.name || '').localeCompare(String(b.name || ''), 'vi', {
          sensitivity: 'base',
        }),
      )
    default:
      return copy
  }
}
