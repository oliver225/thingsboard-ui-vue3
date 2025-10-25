
<template>
  <div v-bind="$attrs" class="tbv3-form-group">
    <div class="title">
      <slot></slot>
    </div>
  </div>
</template>
<script lang="ts" setup name="TbV3FormGroup"></script>
<style lang="less">
  @prefix-cls: ~'tbv3-form-group';

  .@{prefix-cls} {
    .title {
      //width: 100%;
      font-size: 15px;
      //font-style: oblique;
      padding: 0 0 3px 3px;
      margin: 0 0 20px 20px;
      border-bottom: 1px solid @header-light-bottom-border-color;
      color: @primary-color;
    }
  }
</style>
