export interface Page<T> {
  data: Array<T>;
  hasNext: boolean;
  totalElements: number;
  totalPages: string;
}

export interface BasicQuery {
  pageSize: number;
  page: number;
  textSearch?: string;
  sortProperty?: string;
  sortOrder?: 'asc' | 'desc' | null;
  [key: string]: any;
}
