<script setup lang="ts">
import { template } from "../data";
import { isDark } from "../useDark";
</script>

<template>
  <div>
    <h1 :style="isDark ? 'color:rgb(229, 231, 235)' : 'rgb(55, 65, 81)'">Input:</h1>
    <textarea
      rows="30"
      cols="30"
      v-model="template"
      placeholder="请输入wxml"
      border-rd-1
    ></textarea>
  </div>
</template>

<style scoped></style>
