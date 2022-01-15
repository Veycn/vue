/*
 * @Author: your name
 * @Date: 2022-01-13 20:14:29
 * @LastEditTime: 2022-01-15 12:32:18
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /vue/src/core/instance/index.js
 */
import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

// 注册 _init 方法，初始化 vm
initMixin(Vue)

// 给 Vue 身上挂载 数据状态 相关的方法
// $data, $props, $set, $delete, $watch
stateMixin(Vue)

// 注册事件相关的方法。
// $on, $once, $off, $emit
eventsMixin(Vue)

// 注册生命周期相关方法
// _update, $forceUpdate, $destroy
lifecycleMixin(Vue)

// 注册渲染相关的方法
// _render, $nextTick
renderMixin(Vue)

export default Vue
