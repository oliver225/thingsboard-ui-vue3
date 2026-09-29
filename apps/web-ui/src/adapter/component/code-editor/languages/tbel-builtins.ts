/*
 * Copyright 2016-2026 The ThingsBoard Authors
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy at https://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Function metadata adapted from ui-ngx/shared/models/ace/tbel-utils.models.ts.
 */

export interface TbelBuiltin {
  description: string;
  name: string;
  requiredArguments: string[];
  signature: string;
}

export const tbelBuiltins: TbelBuiltin[] = [
  {
    name: 'btoa',
    description: 'Encodes a string to Base64.',
    signature: 'btoa(str: string): string',
    requiredArguments: ['str'],
  },
  {
    name: 'atob',
    description: 'Decodes a Base64 encoded string.',
    signature: 'atob(str: string): string',
    requiredArguments: ['str'],
  },
  {
    name: 'bytesToString',
    description:
      'Converts a list of bytes to a string, optionally specifying the charset.',
    signature: 'bytesToString(data: list, charsetName?: string): string',
    requiredArguments: ['data'],
  },
  {
    name: 'decodeToString',
    description: 'Converts a list of bytes to a string.',
    signature: 'decodeToString(data: list): string',
    requiredArguments: ['data'],
  },
  {
    name: 'decodeToJson',
    description:
      'Parses a JSON string or converts a list of bytes to a string and parses it as JSON.',
    signature: 'decodeToJson(data: string | list): object',
    requiredArguments: ['data'],
  },
  {
    name: 'stringToBytes',
    description:
      'Converts a string to a list of bytes, optionally specifying the charset.',
    signature: 'stringToBytes(str: string, charsetName?: string): list',
    requiredArguments: ['str'],
  },
  {
    name: 'parseInt',
    description:
      'Parses a string to an integer, optionally specifying the radix.',
    signature: 'parseInt(str: string, radix?: number): number',
    requiredArguments: ['str'],
  },
  {
    name: 'parseLong',
    description:
      'Parses a string to a long integer, optionally specifying the radix.',
    signature: 'parseLong(str: string, radix?: number): number',
    requiredArguments: ['str'],
  },
  {
    name: 'parseFloat',
    description: 'Parses a string to a float, optionally specifying the radix.',
    signature: 'parseFloat(str: string, radix?: number): number',
    requiredArguments: ['str'],
  },
  {
    name: 'parseHexIntLongToFloat',
    description:
      'Parses a hexadecimal string to a float, treating it as an integer value.',
    signature:
      'parseHexIntLongToFloat(hex: string, bigEndian: boolean): number',
    requiredArguments: ['hex', 'bigEndian'],
  },
  {
    name: 'parseDouble',
    description:
      'Parses a string to a double, optionally specifying the radix.',
    signature: 'parseDouble(str: string, radix?: number): number',
    requiredArguments: ['str'],
  },
  {
    name: 'parseLittleEndianHexToInt',
    description: 'Parses a little-endian hexadecimal string to an integer.',
    signature: 'parseLittleEndianHexToInt(hex: string): number',
    requiredArguments: ['hex'],
  },
  {
    name: 'parseBigEndianHexToInt',
    description: 'Parses a big-endian hexadecimal string to an integer.',
    signature: 'parseBigEndianHexToInt(hex: string): number',
    requiredArguments: ['hex'],
  },
  {
    name: 'parseHexToInt',
    description:
      'Parses a hexadecimal string to an integer, optionally specifying endianness.',
    signature: 'parseHexToInt(hex: string, bigEndian?: boolean): number',
    requiredArguments: ['hex'],
  },
  {
    name: 'parseBytesToInt',
    description: 'Parses a list or array of bytes to an integer.',
    signature:
      'parseBytesToInt(data: list | array, offset?: number, length?: number, bigEndian?: boolean): number',
    requiredArguments: ['data'],
  },
  {
    name: 'parseLittleEndianHexToLong',
    description: 'Parses a little-endian hexadecimal string to a long integer.',
    signature: 'parseLittleEndianHexToLong(hex: string): number',
    requiredArguments: ['hex'],
  },
  {
    name: 'parseBigEndianHexToLong',
    description: 'Parses a big-endian hexadecimal string to a long integer.',
    signature: 'parseBigEndianHexToLong(hex: string): number',
    requiredArguments: ['hex'],
  },
  {
    name: 'parseHexToLong',
    description:
      'Parses a hexadecimal string to a long integer, optionally specifying endianness.',
    signature: 'parseHexToLong(hex: string, bigEndian?: boolean): number',
    requiredArguments: ['hex'],
  },
  {
    name: 'parseBytesToLong',
    description: 'Parses a list or array of bytes to a long integer.',
    signature:
      'parseBytesToLong(data: list | array, offset?: number, length?: number, bigEndian?: boolean): number',
    requiredArguments: ['data'],
  },
  {
    name: 'parseLittleEndianHexToFloat',
    description:
      'Parses a little-endian hexadecimal string to a float using IEEE 754 format.',
    signature: 'parseLittleEndianHexToFloat(hex: string): number',
    requiredArguments: ['hex'],
  },
  {
    name: 'parseBigEndianHexToFloat',
    description:
      'Parses a big-endian hexadecimal string to a float using IEEE 754 format.',
    signature: 'parseBigEndianHexToFloat(hex: string): number',
    requiredArguments: ['hex'],
  },
  {
    name: 'parseHexToFloat',
    description:
      'Parses a hexadecimal string to a float using IEEE 754 format, optionally specifying endianness.',
    signature: 'parseHexToFloat(hex: string, bigEndian?: boolean): number',
    requiredArguments: ['hex'],
  },
  {
    name: 'parseBytesToFloat',
    description:
      'Parses a list or array of bytes to a float using IEEE 754 format.',
    signature:
      'parseBytesToFloat(data: list | array, offset?: number, length?: number, bigEndian?: boolean): number',
    requiredArguments: ['data'],
  },
  {
    name: 'parseBytesIntToFloat',
    description:
      'Parses a list or array of bytes to a float by first interpreting them as an integer.',
    signature:
      'parseBytesIntToFloat(data: list | array, offset?: number, length?: number, bigEndian?: boolean): number',
    requiredArguments: ['data'],
  },
  {
    name: 'parseLittleEndianHexToDouble',
    description:
      'Parses a little-endian hexadecimal string to a double using IEEE 754 format.',
    signature: 'parseLittleEndianHexToDouble(hex: string): number',
    requiredArguments: ['hex'],
  },
  {
    name: 'parseBigEndianHexToDouble',
    description:
      'Parses a big-endian hexadecimal string to a double using IEEE 754 format.',
    signature: 'parseBigEndianHexToDouble(hex: string): number',
    requiredArguments: ['hex'],
  },
  {
    name: 'parseHexToDouble',
    description:
      'Parses a hexadecimal string to a double using IEEE 754 format, optionally specifying endianness.',
    signature: 'parseHexToDouble(hex: string, bigEndian?: boolean): number',
    requiredArguments: ['hex'],
  },
  {
    name: 'parseBytesToDouble',
    description:
      'Parses a list or array of bytes to a double using IEEE 754 format.',
    signature:
      'parseBytesToDouble(data: list | array, offset?: number, length?: number, bigEndian?: boolean): number',
    requiredArguments: ['data'],
  },
  {
    name: 'parseBytesLongToDouble',
    description:
      'Parses a list or array of bytes to a double by first interpreting them as a long integer.',
    signature:
      'parseBytesLongToDouble(data: list | array, offset?: number, length?: number, bigEndian?: boolean): number',
    requiredArguments: ['data'],
  },
  {
    name: 'toFixed',
    description:
      'Rounds a floating-point number to a set precision using half-up rounding.',
    signature: 'toFixed(value: number, precision: number): number',
    requiredArguments: ['value', 'precision'],
  },
  {
    name: 'toInt',
    description:
      'Converts a floating-point number to an integer by half-up rounding.',
    signature: 'toInt(value: number): number',
    requiredArguments: ['value'],
  },
  {
    name: 'hexToBytes',
    description: 'Converts a hexadecimal string to a list of bytes.',
    signature: 'hexToBytes(hex: string): list',
    requiredArguments: ['hex'],
  },
  {
    name: 'hexToBytesArray',
    description: 'Converts a hexadecimal string to an array of bytes.',
    signature: 'hexToBytesArray(hex: string): array',
    requiredArguments: ['hex'],
  },
  {
    name: 'intToHex',
    description: 'Converts an integer to a hexadecimal string.',
    signature:
      'intToHex(value: number, bigEndian?: boolean, prefix?: boolean, length?: number): string',
    requiredArguments: ['value'],
  },
  {
    name: 'longToHex',
    description: 'Converts a long integer to a hexadecimal string.',
    signature:
      'longToHex(value: number, bigEndian?: boolean, prefix?: boolean, length?: number): string',
    requiredArguments: ['value'],
  },
  {
    name: 'intLongToRadixString',
    description: 'Converts a long integer to a string in the specified radix.',
    signature:
      'intLongToRadixString(value: number, radix?: number, bigEndian?: boolean, prefix?: boolean): string',
    requiredArguments: ['value'],
  },
  {
    name: 'floatToHex',
    description: 'Converts a float to its IEEE 754 hexadecimal representation.',
    signature: 'floatToHex(value: number, bigEndian?: boolean): string',
    requiredArguments: ['value'],
  },
  {
    name: 'doubleToHex',
    description:
      'Converts a double to its IEEE 754 hexadecimal representation.',
    signature: 'doubleToHex(value: number, bigEndian?: boolean): string',
    requiredArguments: ['value'],
  },
  {
    name: 'printUnsignedBytes',
    description:
      'Converts a list of signed bytes to a list of unsigned integer values.',
    signature: 'printUnsignedBytes(data: list): list',
    requiredArguments: ['data'],
  },
  {
    name: 'base64ToHex',
    description: 'Converts a Base64 string to a hexadecimal string.',
    signature: 'base64ToHex(str: string): string',
    requiredArguments: ['str'],
  },
  {
    name: 'hexToBase64',
    description: 'Converts a hexadecimal string to a Base64 string.',
    signature: 'hexToBase64(hex: string): string',
    requiredArguments: ['hex'],
  },
  {
    name: 'base64ToBytes',
    description: 'Converts a Base64 string to an array of bytes.',
    signature: 'base64ToBytes(str: string): array',
    requiredArguments: ['str'],
  },
  {
    name: 'base64ToBytesList',
    description: 'Converts a Base64 string to a list of bytes.',
    signature: 'base64ToBytesList(str: string): list',
    requiredArguments: ['str'],
  },
  {
    name: 'bytesToBase64',
    description: 'Converts an array of bytes to a Base64 string.',
    signature: 'bytesToBase64(data: array): string',
    requiredArguments: ['data'],
  },
  {
    name: 'bytesToHex',
    description: 'Converts a list or array of bytes to a hexadecimal string.',
    signature: 'bytesToHex(data: list | array): string',
    requiredArguments: ['data'],
  },
  {
    name: 'toFlatMap',
    description:
      'Converts a nested map to a flat map, with customizable key paths and exclusions',
    signature:
      'toFlatMap(json: object, excludeKeys?: list, pathInKey?: boolean): object',
    requiredArguments: ['json'],
  },
  {
    name: 'encodeURI',
    description:
      'Encodes a URI string, preserving certain characters as per MDN standards.',
    signature: 'encodeURI(str: string): string',
    requiredArguments: ['str'],
  },
  {
    name: 'decodeURI',
    description: 'Decodes a URI string previously encoded.',
    signature: 'decodeURI(str: string): string',
    requiredArguments: ['str'],
  },
  {
    name: 'raiseError',
    description: 'Throws an error with a custom message.',
    signature: 'raiseError(str: string): void',
    requiredArguments: ['str'],
  },
  {
    name: 'isBinary',
    description: 'Checks if a string is a binary number.',
    signature: 'isBinary(str: string): number',
    requiredArguments: ['str'],
  },
  {
    name: 'isOctal',
    description: 'Checks if a string is an octal number.',
    signature: 'isOctal(str: string): number',
    requiredArguments: ['str'],
  },
  {
    name: 'isDecimal',
    description: 'Checks if a string is a decimal number.',
    signature: 'isDecimal(str: string): number',
    requiredArguments: ['str'],
  },
  {
    name: 'isHexadecimal',
    description: 'Checks if a string is a hexadecimal number.',
    signature: 'isHexadecimal(str: string): number',
    requiredArguments: ['str'],
  },
  {
    name: 'bytesToExecutionArrayList',
    description: 'Converts an array of bytes to a list.',
    signature: 'bytesToExecutionArrayList(data: array): list',
    requiredArguments: ['data'],
  },
  {
    name: 'padStart',
    description:
      'Pads the start of a string with a character until it reaches the target length.',
    signature:
      'padStart(str: string, length: number, padString: string): string',
    requiredArguments: ['str', 'length', 'padString'],
  },
  {
    name: 'padEnd',
    description:
      'Pads the end of a string with a character until it reaches the target length.',
    signature: 'padEnd(str: string, length: number, padString: string): string',
    requiredArguments: ['str', 'length', 'padString'],
  },
  {
    name: 'parseByteToBinaryArray',
    description: 'Converts a byte to a binary array.',
    signature:
      'parseByteToBinaryArray(value: number, length?: number, bigEndian?: boolean): array',
    requiredArguments: ['value'],
  },
  {
    name: 'parseBytesToBinaryArray',
    description: 'Converts a list or array of bytes to a binary array.',
    signature:
      'parseBytesToBinaryArray(data: list | array, length?: number): array',
    requiredArguments: ['data'],
  },
  {
    name: 'parseLongToBinaryArray',
    description: 'Converts a long integer to a binary array.',
    signature: 'parseLongToBinaryArray(value: number, length?: number): array',
    requiredArguments: ['value'],
  },
  {
    name: 'parseBinaryArrayToInt',
    description: 'Converts a binary list or array to an integer.',
    signature:
      'parseBinaryArrayToInt(data: list | array, offset?: number, length?: number): number',
    requiredArguments: ['data'],
  },
  {
    name: 'isNaN',
    description: 'Checks if the given number is NaN (Not a Number).',
    signature: 'isNaN(value: number): boolean',
    requiredArguments: ['value'],
  },
  {
    name: 'isInsidePolygon',
    description: 'Checks if a given point is inside a polygon.',
    signature:
      'isInsidePolygon(latitude: number, longitude: number, perimeter: string): boolean',
    requiredArguments: ['latitude', 'longitude', 'perimeter'],
  },
  {
    name: 'isInsideCircle',
    description: 'Checks if a given point is inside a circular area.',
    signature:
      'isInsideCircle(latitude: number, longitude: number, perimeter: string): boolean',
    requiredArguments: ['latitude', 'longitude', 'perimeter'],
  },
];
