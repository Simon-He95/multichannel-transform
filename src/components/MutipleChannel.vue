<script setup lang="ts">
import { template } from "../data";
import { transform } from "../transform.js";
import { isDark } from "../useDark";

const type = defineProps<{ selected: string }>();
const result = ref("");
watchEffect(() => {
  if (!type.selected) {
    result.value = JSON.parse(JSON.stringify(template.value));
    return;
  }
  result.value = JSON.parse(JSON.stringify(transform[type.selected](template.value)));
});
</script>

<template>
  <div>
    <h1 :style="isDark ? 'color:rgb(229, 231, 235)' : 'rgb(55, 65, 81)'">Output:</h1>
    <textarea rows="30" cols="30" v-model="result" border-rd-1></textarea>
  </div>
</template>

<style scoped></style>
