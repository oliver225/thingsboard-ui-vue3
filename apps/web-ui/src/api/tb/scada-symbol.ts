/**
 * SCADA 符号库接口(SYS_ADMIN / TENANT_ADMIN)
 *
 * SCADA 符号本质是 `resourceSubType=SCADA_SYMBOL` 的图片资源(SVG),
 * 与普通图片共用 ImageController 的同一套端点,仅子类型不同。
 * 故此处薄封装 image 接口:列表/上传按 SCADA_SYMBOL 子类型定制,
 * 其余(信息/替换/标题/公开/删除/导入导出/下载)与子类型无关,直接复用。
 */
import type { ImageQuery } from '#/api/tb/image';

import {
  deleteImage,
  downloadImage,
  downloadImagePreview,
  exportImage,
  getImageInfo,
  getImages,
  importImage,
  updateImage,
  updateImageInfo,
  updateImagePublicStatus,
  uploadImage,
} from '#/api/tb/image';

export type {
  ImageDescriptor,
  ResourceExportData,
  TbResourceDeleteResult,
  TbResourceInfo,
} from '#/api/tb/image';

/** SCADA 符号分页列表(GET /api/images,imageSubType=SCADA_SYMBOL) */
export function getScadaSymbols(params: Omit<ImageQuery, 'imageSubType'>) {
  return getImages({ ...params, imageSubType: 'SCADA_SYMBOL' });
}

/** 上传新 SCADA 符号(POST /api/image,SVG 文件) */
export function uploadScadaSymbol(file: Blob | File, title?: string) {
  return uploadImage(file, title, 'SCADA_SYMBOL');
}

// 以下端点与子类型无关,直接复用 image 接口(对外暴露 SCADA 语义别名)
export {
  deleteImage as deleteScadaSymbol,
  downloadImage as downloadScadaSymbol,
  downloadImagePreview as downloadScadaSymbolPreview,
  exportImage as exportScadaSymbol,
  getImageInfo as getScadaSymbolInfo,
  importImage as importScadaSymbol,
  updateImage as updateScadaSymbolFile,
  updateImageInfo as updateScadaSymbolInfo,
  updateImagePublicStatus as updateScadaSymbolPublicStatus,
};
