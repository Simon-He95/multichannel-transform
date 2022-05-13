<script setup lang="ts">
const selected = ref("");
import { isDark } from "./useDark";

function toggleDark() {
  isDark.value = !isDark.value;
}
</script>

<template>
  <nav class="nav" :style="isDark ? 'color:rgb(229, 231, 235)' : 'rgb(55, 65, 81)'">
    <div class="spacer" />
    <div class="right">
      <a
        href="https://github.com/Simon-He95"
        target="_blank"
        title="GitHub"
        class="lt-md:hidden"
      >
        <div i-uil-github-alt />
      </a>
      <a class="select-none" title="Toggle Color Scheme" @click="toggleDark">
        <div v-if="isDark" i-carbon-moon />
        <div v-else class="i-carbon-sun" />
      </a>
    </div>
  </nav>

  <div flex="~" justify-center align-center m-t-10>
    <select v-model="selected" border-rd-1 p-2>
      <option disabled value="">请选择转换渠道</option>
      <option value="toAlipay">转支付宝</option>
      <option value="toXhs">转小红书</option>
      <option value="toKS">转快手</option>
      <option value="toBaidu">百度</option>
    </select>
  </div>
  <main flex="~" justify-between w-full h-full box-border p-5>
    <wx-template class="w-45%" flex="~" flex-col align-center></wx-template>
    <mutiple-channel
      class="w-45%"
      :selected="selected"
      flex="~"
      flex-col
      align-center
    ></mutiple-channel>
  </main>
</template>

<style scoped>
.nav {
  padding: 2rem;
  width: 100%;
  display: grid;
  grid-template-columns: auto max-content;
  box-sizing: border-box;
}

.nav > * {
  margin: auto;
}

.nav img {
  margin-bottom: 0;
}

.nav a {
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  transition: opacity 0.2s ease;
  opacity: 0.6;
  outline: none;
}

.nav a:hover {
  opacity: 1;
  text-decoration-color: inherit;
}

.nav .right {
  display: grid;
  grid-gap: 1.2rem;
  grid-auto-flow: column;
}

.nav .right > * {
  margin: auto;
}
</style>
