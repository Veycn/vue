/*
 * @Author: your name
 * @Date: 2022-01-13 20:14:29
 * @LastEditTime: 2022-01-14 16:39:36
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /vue/src/core/global-api/index.js
 */
/* @flow */

import config from '../config'
import { initUse } from './use'
import { initMixin } from './mixin'
import { initExtend } from './extend'
import { initAssetRegisters } from './assets'
import { set, del } from '../observer/index'
import { ASSET_TYPES } from 'shared/constants'
import builtInComponents from '../components/index'
import { observe } from 'core/observer/index'

import {
  warn,
  extend,
  nextTick,
  mergeOptions,
  defineReactive
} from '../util/index'

export function initGlobalAPI (Vue: GlobalAPI) {
  // config
  const configDef = {}
  configDef.get = () => config
  if (process.env.NODE_ENV !== 'production') {
    configDef.set = () => {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      )
    }
  }
  // 初始化 Vue 的 config 对象
  Object.defineProperty(Vue, 'config', configDef)

  // exposed util methods.
  // NOTE: these are not considered part of the public API - avoid relying on
  // them unless you are aware of the risk.
  // 注册一些内部使用的工具函数
  Vue.util = {
    warn,
    extend,
    mergeOptions,
    defineReactive
  }

  // 注册 Vue 上的 静态方法 $set, $delete, $nextTick
  Vue.set = set
  Vue.delete = del
  Vue.nextTick = nextTick

  // 2.6 explicit observable API
  // 响应式原理
  Vue.observable = <>(obj: T): T => {
    observe(obj)
    return obj
  }

  // ASSET_TYPES 注册全局的指令、组件、过滤器
  Vue.options = Object.create(null)
  ASSET_TYPES.forEach(type => {
    Vue.options[type + 's'] = Object.create(null)
  })

  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
  // 记录 Vue 的构造函数
  Vue.options._base = Vue

  // extend 方法在 shared/utils 中，作用是浅拷贝一个对象
  // builtInComponents 是 keep-alive 组件
  extend(Vue.options.components, builtInComponents)

  // 注册 Vue.use 用来注册插件
  initUse(Vue)
   // 注册 Vue.mixin, 实现混入
  initMixin(Vue)
   // 注册 Vue.extend，基于传入的 options 返回一个组件的构造函数
  initExtend(Vue)
   // 注册 Vue.component(), Vue.filter(), Vue.directive()
  initAssetRegisters(Vue)
}
