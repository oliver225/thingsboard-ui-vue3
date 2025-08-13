import type { Recordable } from '@vben/types';

import type { EntityId } from '#/types';

export interface Page<T> {
  data: Array<T>;
  hasNext: boolean;
  totalElements: number;
  totalPages: string;
}

export interface BasicQuery extends Recordable<any> {
  pageSize: number;
  page: number;
  textSearch?: string;
  sortProperty?: string;
  sortOrder?: 'ASC' | 'DESC' | null;
}

export interface EntityInfo<T> extends Recordable<any> {
  id: EntityId<T>;
  name: string;
}

export interface UploadFileParams {
  file: File;
  onError?: (error: Error) => void;
  onProgress?: (progress: { percent: number }) => void;
  onSuccess?: (data: any, file: File) => void;
}
