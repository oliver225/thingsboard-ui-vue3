import { BasicModel, BasicQuery, Page } from "../model/baseModel";
import { EntityId } from "/#/store";
import { EntityType } from "/@/enums/entityTypeEnum";
import { defHttp } from "/@/utils/http/axios";

export interface OtaPackageInfo extends BasicModel<EntityType.OTA_PACKAGE> {
    tenantId: EntityId<EntityType.TENANT>;
    deviceProfileId: EntityId<EntityType.DEVICE_PROFILE>;
    title?: string;
    type?: 'FIRMWARE' | 'SOFTWARE';
    version?: string;
    tag?: string;
    url?: string;
    hasData?: boolean;
    fileName?: string;
    contentType?: string;
    checksum?: string;
    dataSize?: number;
    checksumAlgorithm?: 'MD5' | 'SHA256' | 'SHA384' | 'SHA512' | 'CRC32' | 'MURMUR3_32' | 'MURMUR3_128';
}

export interface otaPackage extends OtaPackageInfo {
    data?: Recordable;
}

export function downloadOtaPackage(otaPackageId: string) {
    return defHttp.get(
        { url: `/api/otaPackage/${otaPackageId}/download`, responseType: 'blob' },
        { isReturnNativeResponse: true, joinPrefix: false }
    );
}

export function getOtaPackageInfoById(otaPackageId: string) {
    return defHttp.get<OtaPackageInfo>({
        url: `/api/otaPackage/info/${otaPackageId}`,
    })
}

export function getOtaPackageById(otaPackageId: string) {
    return defHttp.get<otaPackage>({
        url: `/api/otaPackage/${otaPackageId}`,
    })
}

export function saveOtaPackageInfo(data: { otaPackageInfo: OtaPackageInfo, usesUrl: boolean } | any) {
    return defHttp.postJson<OtaPackageInfo>({
        url: '/api/otaPackage',
        data
    })
}

export function saveOtaPackageData(otaPackageId: string, checksum: string, checksumAlgorithmStr: string, file: any) {
    return defHttp.post<OtaPackageInfo>({
        url: `/api/otaPackage/${otaPackageId}`,
        data: {
            checksum: checksum,
            checksumAlgorithmStr: checksumAlgorithmStr,
            file: file,
        }
    })
}

export function getOtaPackageList(params: BasicQuery) {
    return defHttp.get<Page<OtaPackageInfo>>({
        url: '/api/otaPackages',
        params,
    });
}

export function getOtaPackageListByDeviceProfile(deviceProfileId: string, type: string, params: BasicQuery) {
    return defHttp.get<Page<OtaPackageInfo>>({
        url: `/api/otaPackages/${deviceProfileId}/${type}`,
        params,
    });
}

export function deleteOtaPackage(otaPackageId: string) {
    return defHttp.delete<void>({
        url: `/api/otaPackage/${otaPackageId}`,
    });
}