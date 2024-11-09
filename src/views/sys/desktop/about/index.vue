<template>
  <PageWrapper title="关于">
    <template #headerContent>
      <div class="flex items-center justify-between">
        <span class="flex-1">
        </span>
      </div>
    </template>
    <Description @register="infoRegister" class="enter-y" />
    <Description @register="register" class="enter-y my-4" />
    <Description @register="registerDev" class="enter-y" />
  </PageWrapper>
</template>
<script lang="ts" setup name="AboutPage">
  import { h } from 'vue';
  import { Tag } from 'ant-design-vue';
  import { PageWrapper } from '/@/components/Page';
  import { Description, DescItem, useDescription } from '/@/components/Description';

  const { pkg, lastBuildTime } = __APP_INFO__;

  const { dependencies, devDependencies, version } = pkg;

  const schema: DescItem[] = [];
  const devSchema: DescItem[] = [];

  const commonTagRender = (color: string) => (curVal) => h(Tag, { color }, () => curVal);
  const commonLinkRender = (text: string) => (href) => h('a', { href, target: '_blank' }, text);

  const infoSchema: DescItem[] = [
    {
      label: '版本',
      field: 'version',
      render: commonTagRender('blue'),
    },
    {
      label: '最后编译时间',
      field: 'lastBuildTime',
      render: commonTagRender('blue'),
    },
    {
      label: '文档地址',
      field: 'docs',
      render: commonLinkRender('https://thingsboard.io/docs/'),
    },
    {
      label: '官方网站',
      field: 'website',
      render: commonLinkRender('https://thingsboard.io'),
    },
    {
      label: '下载地址',
      field: 'download',
      render: commonLinkRender('https://gitee.com/oliver225/thingsboard-ui-vue3'),
    },
  ];

  const infoData = {
    version,
    lastBuildTime,
    docs: 'https://thingsboard.io/docs/',
    website: 'https://thingsboard.io',
    download: 'https://gitee.com/oliver225/thingsboard-ui-vue3',
  };

  const [infoRegister] = useDescription({
    title: '项目信息',
    data: infoData,
    schema: infoSchema,
    column: 2,
  });

  let register: any;
  if (dependencies) {
    Object.keys(dependencies).forEach((key) => {
      schema.push({ field: key, label: key });
    });
    register = useDescription({
      title: '生产环境依赖',
      data: dependencies,
      schema: schema,
      column: 3,
    });
  }

  let registerDev: any;
  if (devDependencies) {
    Object.keys(devDependencies).forEach((key) => {
      devSchema.push({ field: key, label: key });
    });
    registerDev = useDescription({
      title: '开发环境依赖',
      data: devDependencies,
      schema: devSchema,
      column: 3,
    });
  }
</script>
