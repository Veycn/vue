/*
 * @Author: your name
 * @Date: 2022-01-13 20:14:29
 * @LastEditTime: 2022-01-14 16:38:01
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /vue/src/core/global-api/assets.js
 */
/* @flow */

import { ASSET_TYPES } from 'shared/constants'
import { isPlainObject, validateComponentName } from '../util/index'

export function initAssetRegisters (Vue: GlobalAPI) {
  /**
   * Create asset registration methods.
   */
  ASSET_TYPES.forEach(type => {
    Vue[type] = function (
      id: string,
      definition: Function | Object
    ): Function | Object | void {
      if (!definition) {
        // 直接返回这个 id 对应的 component 或者 filter 或者 directive
        return this.options[type + 's'][id]
      } else {
        /* istanbul ignore if */
        if (process.env.NODE_ENV !== 'production' && type === 'component') {
          validateComponentName(id)
        }
        // 添加组件
        // isPlainObject => Object.prototype.toString
        if (type === 'component' && isPlainObject(definition)) {
          definition.name = definition.name || id
          // this.options._base 是 Vue 构造函数
          definition = this.options._base.extend(definition)
        }
        // 添加指令，可以传函数，也可以传对象
        if (type === 'directive' && typeof definition === 'function') {
          // 传递函数需要把这个函数绑定给 bind 和 update，封装成对象保存
          definition = { bind: definition, update: definition }
        }
        // 过滤器是一个函数，只需要存储一下就可以了，使用的时候调用这个函数
        // 其他两种类型的定义需要 一点点转换过程，这个在上面已经完成了
        this.options[type + 's'][id] = definition
        return definition
      }
    }
  })
}
