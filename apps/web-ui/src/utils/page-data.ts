import type { PageData, PageLink } from '#/types/tb';

/** Read all pages for entity selectors; the server can return fewer than pageSize items. */
export async function loadAllPages<T>(
  fetchPage: (pageLink: PageLink) => Promise<PageData<T>>,
): Promise<T[]> {
  const items: T[] = [];
  for (let page = 0; ; page++) {
    const result = await fetchPage({ page, pageSize: 500 });
    items.push(...result.data);
    if (!result.hasNext) return items;
    if (result.data.length === 0)
      throw new Error('Empty page returned with hasNext=true');
  }
}
