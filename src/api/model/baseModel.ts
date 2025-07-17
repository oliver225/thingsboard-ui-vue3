import type { Result } from '/#/axios';
import { EntityId } from '/#/store';

export interface Page<T> {
  data: Array<T>;
  hasNext: boolean;
  totalElements: number;
  totalPages: string;
}

export interface BasicModel<T> extends Result, Recordable {
  id: EntityId<T>;
  createdTime?: number;
}

export interface EntityInfo<T> extends Recordable {
  id: EntityId<T>;
  name: string;
}

export interface BasicQuery extends Recordable {
  pageSize: number;
  page: number;
  textSearch?: string;
  sortProperty?: string;
  sortOrder?: 'ASC' | 'DESC';
}
