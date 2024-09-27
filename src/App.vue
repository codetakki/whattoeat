<template>
  <v-app>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
  import { useAppStore } from '@/stores/app'
  const appStore = useAppStore()
</script>
