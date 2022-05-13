import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Pages from 'vite-plugin-pages'
import Components from 'unplugin-vue-components/vite'
import Unocss from 'unocss/vite'
import presetIcons from '@unocss/preset-icons'
import Icons from 'unplugin-icons/vite'



export default defineConfig({
  plugins: [
    Vue({
      reactivityTransform: true,
    }),
    Pages({
      importMode: 'sync',
    }),
    Unocss({
      theme: {
        fontFamily: {
          sans: '"Inter", Inter var,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji',
        },
      },
      presets: [
        presetIcons({
          extraProperties: {
            'display': 'inline-block',
            'vertical-align': 'middle',
          }
        }),
      ],
    }),
    AutoImport({
      imports: [
        'vue',
        'vue/macros',
        'vue-router',
        '@vueuse/core',
      ],
      dts: true,
    }),
    Components({
      dts: true,
      types: [
        {
          from: 'vue-router',
          names: [
            'RouterView',
            'RouterLink',
          ],
        },
      ],
    }),
    Icons({
      defaultClass: 'inline',
      defaultStyle: 'vertical-align: sub;',
    }),
  ]
})
