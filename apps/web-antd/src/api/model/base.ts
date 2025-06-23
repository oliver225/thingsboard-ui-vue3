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
  sortOrder?: 'ASC' | 'DESC' | null;
  [key: string]: any;
}
