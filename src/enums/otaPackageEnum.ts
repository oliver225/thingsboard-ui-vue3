export enum CHECK_SUM_ALGORITHM {
    MD5 = 'MD5',
    SHA256 = 'SHA256',
    SHA384 = 'SHA384',
    SHA512 = 'SHA512',
    CRC32 = 'CRC32',
    MURMUR3_32 = 'MURMUR3_32',
    MURMUR3_128 = 'MURMUR3_128',
}

export const CHECK_SUM_ALGORITHM_OPTIONS = [
    { value: CHECK_SUM_ALGORITHM.MD5, label: 'MD5' },
    { value: CHECK_SUM_ALGORITHM.CRC32, label: 'CRC-32' },
    { value: CHECK_SUM_ALGORITHM.SHA256, label: 'SHA-256' },
    { value: CHECK_SUM_ALGORITHM.SHA384, label: 'SHA-384' },
    { value: CHECK_SUM_ALGORITHM.SHA512, label: 'SHA-512' },
    { value: CHECK_SUM_ALGORITHM.MURMUR3_32, label: 'MURMUR3-32' },
    { value: CHECK_SUM_ALGORITHM.MURMUR3_128, label: 'MURMUR3-128' },
]