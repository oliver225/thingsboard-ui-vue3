<template>
  <div v-if="props.sidebar" :class="`${prefixCls}-sidebar md:hidden lg:block think gem`">
    <span :class="[prefixCls, `${prefixCls}--${props.theme}`]" class="flex">
      <img :class="`${prefixCls}__header`" :src="getUserInfo.avatarUrl" />
      <span :class="`${prefixCls}__info`">
        <span :class="`${prefixCls}__name`" class="truncate">
          {{ getUserInfo.firstName || '未命名' }}
        </span>
        <span :class="`${prefixCls}__btns`" class="block">
          <a class="online"><Icon icon="i-fa:circle" /> {{ t('layout.header.sidebarOnline') }}</a>
          <a class="logout" @click="handleLoginOut">
            <Icon icon="i-fa:sign-out" /> {{ t('layout.header.sidebarLogout') }}
          </a>
        </span>
      </span>
    </span>
  </div>
  <Dropdown v-else placement="bottom" :overlayClassName="`${prefixCls}-dropdown-overlay`">
    <span :class="[prefixCls, `${prefixCls}--${props.theme}`]" class="flex">
      <img :class="`${prefixCls}__header`" :src="getUserInfo.avatarUrl" />
      <span :class="`${prefixCls}__info  hidden md:block`">
        <span :class="`${prefixCls}__name`" class="truncate flex flex-col">
          <span :class="`${prefixCls}__name__title`">
            {{ getUserInfo.firstName || '未命名' }}
            <span :class="`${prefixCls}__name__tag`">
              {{ AUTHORITY_OPTIONS.filter((item) => item.value === getUserInfo.authority)[0]?.label }}
            </span>
          </span>
          <span :class="`${prefixCls}__name__subTitle`">
            {{ getUserInfo.email }}
          </span>
        </span>
      </span>
    </span>
    <template #overlay>
      <Menu @click="handleMenuClick">
        <MenuItem value="accountCenter" :text="t('sys.account.center')" icon="i-ion:person-outline" />
        <MenuItem value="modifyPwd" :text="t('sys.account.modifyPwd')" icon="i-ant-design:key-outlined" />
        <MenuDivider />
        <MenuItem
          value="doc"
          :text="t('layout.header.dropdownItemDoc')"
          icon="i-ion:document-text-outline"
          v-if="getShowDoc"
        />
        <MenuDivider v-if="getShowDoc" />
        <MenuItem
          v-if="getUseLockPage"
          value="lock"
          :text="t('layout.header.tooltipLock')"
          icon="i-ion:lock-closed-outline"
        />
        <MenuItem value="logout" :text="t('layout.header.dropdownItemLoginOut')" icon="i-ion:power-outline" />
      </Menu>
    </template>
  </Dropdown>
  <LockAction v-if="!props.sidebar" @register="registerModal" />
</template>
<script lang="ts">
  import { defineComponent, computed, ref, onMounted } from 'vue';
  import { Dropdown, Menu, Tag } from 'ant-design-vue';
  import { DOC_URL } from '/@/settings/siteSetting';
  import { useUserStore } from '/@/store/modules/user';
  import { useHeaderSetting } from '/@/hooks/setting/useHeaderSetting';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useDesign } from '/@/hooks/web/useDesign';
  import { useModal } from '/@/components/Modal';
  import { useGo } from '/@/hooks/web/usePage';
  import { propTypes } from '/@/utils/propTypes';
  import { openWindow } from '/@/utils';
  import { AUTHORITY_OPTIONS } from '/@/enums/authorityEnum';
  import { Icon } from '/@/components/Icon';
  import MenuItem from './DropMenuItem.vue';
  import LockAction from '../lock/LockModal.vue';

  type MenuEvent = 'accountCenter' | 'modifyPwd' | 'logout' | 'doc' | 'lock' | 'roleCode-';

  const props = {
    theme: propTypes.oneOf(['dark', 'light']),
    sidebar: propTypes.bool.def(false),
  };

  export default defineComponent({
    name: 'UserDropdown',
    components: {
      Dropdown,
      Menu,
      MenuItem,
      MenuDivider: Menu.Divider,
      LockAction,
      Icon,
      Tag,
    },
    props,
    setup(props: any) {
      const { prefixCls } = useDesign('header-user-dropdown');
      const { t } = useI18n();
      const { getShowDoc, getUseLockPage } = useHeaderSetting();
      const userStore = useUserStore();
      const go = useGo();

      const sysCodeRef = ref<string>('default');
      const sysListRef = ref<Recordable[]>([]);
      const roleCodeRef = ref<string>('');
      const postCodeRef = ref<string>('');

      const getUserInfo = computed(() => {
        const {
          firstName,
          authority,
          email,
          additionalInfo: { avatarUrl },
        } = userStore.getUserInfo || {};
        return {
          firstName,
          avatarUrl,
          email,
          authority,
        };
      });

      if (!props.sidebar) {
        onMounted(async () => {
          sysCodeRef.value = userStore.getPageCacheByKey('sysCode', 'default');
          roleCodeRef.value = userStore.getPageCacheByKey('roleCode', '');
          postCodeRef.value = userStore.getPageCacheByKey('postCode', '');
        });
      }

      const [registerModal, { openModal }] = useModal();

      function handleLoginOut() {
        userStore.confirmLoginOut();
      }

      function handleAccountCenter() {
        go('/account/center');
      }

      function handleModifyPwd() {
        go('/account/modPwd');
      }

      function handleOpenDoc() {
        openWindow(DOC_URL);
      }

      function handleLock() {
        openModal(true);
      }

      async function handleMenuClick(e: { key: MenuEvent } | any) {
        switch (e.key) {
          case 'accountCenter':
            handleAccountCenter();
            break;
          case 'modifyPwd':
            handleModifyPwd();
            break;
          case 'logout':
            handleLoginOut();
            break;
          case 'doc':
            handleOpenDoc();
            break;
          case 'lock':
            handleLock();
            break;
          default:
            break;
        }
      }

      return {
        AUTHORITY_OPTIONS,
        prefixCls,
        t,
        getUserInfo,
        handleMenuClick,
        getShowDoc,
        registerModal,
        getUseLockPage,
        handleLoginOut,
        sysCodeRef,
        sysListRef,
        roleCodeRef,
        postCodeRef,
        props,
      };
    },
  });
</script>
<style lang="less">
  @prefix-cls: ~'jeesite-header-user-dropdown';
  @menu-dark-subsidiary-color: rgba(255, 255, 255, 0.7);

  .@{prefix-cls} {
    height: @header-height;
    padding: 0 0 0 10px;
    padding-right: 10px;
    overflow: hidden;
    font-size: 12px;
    cursor: pointer;
    align-items: center;

    img {
      width: 38px;
      height: 38px;
      margin-right: 10px;
      background: #eee;
    }

    &__header {
      border-radius: 50%;
    }

    &__name {
      font-size: 14px;
      line-height: 1.25rem;
    }
    &__name__tag {
      color: #fff;
      font-size: 10px;
      padding: 0 4px;
      background-color: @success-color;
      border-radius: 4px;
      margin-left: 6px;
    }

    &__name__title {
      font-weight: 500;
      display: flex;
      align-items: center;
    }
    &__name__subTitle {
      font-size: 12px;
    }

    &--dark {
      &:hover {
        background-color: @header-dark-bg-hover-color;
      }

      .@{prefix-cls}__info {
        color: @menu-dark-subsidiary-color;
      }

      .@{prefix-cls}__desc {
        color: @menu-dark-subsidiary-color;
      }
    }

    &--light {
      &:hover {
        background-color: @header-light-bg-hover-color;
      }

      .@{prefix-cls}__info {
        color: @text-color-base;
      }

      .@{prefix-cls}__desc {
        color: @header-light-desc-color;
      }
    }

    &-dropdown-overlay {
      .ant-dropdown-menu-item {
        min-width: 115px;
      }
    }

    &-menu-subtitle {
      line-height: 13px;

      span {
        font-weight: bold;
        opacity: 0.7;

        svg {
          padding-top: 3px;
        }
      }
    }

    &-sidebar {
      .@{prefix-cls} {
        height: auto;
        cursor: default;
        padding: 8px 10px 10px;

        img {
          width: 45px;
          height: 45px;
          transition: all 0.1s;
        }

        &__name {
          font-weight: bold;
        }

        &__btns {
          padding-top: 3px;
          font-size: 11px;
          white-space: nowrap;

          .anticon {
            padding-right: 2px;
          }

          .online {
            padding-right: 9px;

            .anticon {
              color: #3c763d;
            }
          }

          .logout {
            .anticon {
              color: #a94442;
            }
          }
        }

        &--dark {
          color: @menu-dark-subsidiary-color;

          a {
            color: @menu-dark-subsidiary-color;
          }

          &:hover {
            background-color: transparent;
          }
        }

        &--light {
          color: @text-color-base;

          a {
            color: @text-color-base;
          }

          &:hover {
            background-color: transparent;
          }
        }
      }
    }
  }

  .ant-layout-sider-collapsed {
    .@{prefix-cls} {
      padding: 10px 0;
      justify-content: center;

      img {
        width: 38px;
        height: 38px;
        margin: 0;
      }

      &__info {
        display: none;
      }
    }
  }
</style>
