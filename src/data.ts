import { ref } from 'vue'
export const template = ref(`<view wx:for="{{array}}">
  <view wx:if="item.name">
    {{index}}: {{item.message}}
  </view>
</view>
<button bindtap="changeName" getName="getName"> Click me! </button>`)
