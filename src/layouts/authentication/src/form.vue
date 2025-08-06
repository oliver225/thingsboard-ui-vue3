<script setup lang="ts">
  defineOptions({
    name: 'AuthenticationFormView',
  });
</script>

<template>
  <div class="flex-col-center auth-bg relative px-6 py-10 lg:flex-initial lg:px-8">
    <slot></slot>
    <!-- Router View with Transition and KeepAlive -->
    <RouterView v-slot="{ Component, route }">
      <Transition appear mode="out-in" name="slide-right">
        <KeepAlive :include="['Login']">
          <component :is="Component" :key="route.fullPath" class="enter-x mt-6 w-full sm:mx-auto md:max-w-md" />
        </KeepAlive>
      </Transition>
    </RouterView>

    <!-- Footer Copyright -->

    <div class="text-muted-foreground absolute bottom-3 flex text-center text-xs">
      <slot name="copyright"> </slot>
    </div>
  </div>
</template>

<style lang="less">
  html[data-theme='dark'] {
    .auth-bg {
      background-color: hsl(222.2 84% 4.9%);
    }
  }
  .auth-bg {
    background-color: #fff;
  }
</style>
