import type { PluginOption } from 'vite';

import { EOL } from 'node:os';

import { dateUtil, readPackageJSON } from '@vben/node-utils';

/**
 * 用于注入版权信息
 * @returns
 */
async function viteLicensePlugin(
  root = process.cwd(),
): Promise<PluginOption | undefined> {
  const {
    description = '',
    homepage = '',
    license = '',
    name = '',
    version = '',
  } = await readPackageJSON(root);

  return {
    apply: 'build',
    enforce: 'post',
    generateBundle: {
      handler(_options, bundle) {
        const date = dateUtil().format('YYYY-MM-DD ');
        const copyrightText = `/*!
  * ${name}
  * Version: ${version}
  * Project License: ${license}
  * Includes Vben Admin code, Copyright (C) 2024-present Vben, under the MIT License.
  * Description: ${description}
  * Date Created: ${date}
  * Homepage: ${homepage}
*/
              `.trim();

        for (const [, fileContent] of Object.entries(bundle)) {
          if (fileContent.type === 'chunk' && fileContent.isEntry) {
            // 插入版权信息
            const content = fileContent.code;
            const updatedContent = `${copyrightText}${EOL}${content}`;
            // 更新bundle
            fileContent.code = updatedContent;
          }
        }
      },
      order: 'post',
    },
    name: 'vite:license',
  };
}

export { viteLicensePlugin };
