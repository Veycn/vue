/* @flow */

import Dep from './dep'
import VNode from '../vdom/vnode'
import { arrayMethods } from './array'
import {
  def,
  warn,
  hasOwn,
  hasProto,
  isObject,
  isPlainObject,
  isPrimitive,
  isUndef,
  isValidArrayIndex,
  isServerRendering
} from '../util/index'

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

/**
 * In some cases we may want to disable observation inside a component's
 * update computation.
 */
export let shouldObserve: boolean = true

export function toggleObserving (value: boolean) {
  shouldObserve = value
}

/**
 * Observer class that is attached to each observed
 * object. Once attached, the observer converts the target
 * object's property keys into getter/setters that
 * collect dependencies and dispatch updates.
 * 
 */
//  观察者类，它被附加到每个被观察的
//  对象。一旦附着，观察者就会将目标
//  对象的属性键转换成getter/setters，以
//  收集依赖关系并调度更新。
export class Observer {
  value: any;
  dep: Dep;
  vmCount: number; // number of vms that have this object as root $data

  constructor (value: any) {
    this.value = value
    this.dep = new Dep()
    this.vmCount = 0
    def(value, '__ob__', this)
    // 如果传入的是数组，劫持数组的方法
    // 对于有元素更改的方法，先调用数组本身的方法
    // 再给有插入的元素设置响应式
    // 最后调用 dep.notify 发送通知
    if (Array.isArray(value)) {
      if (hasProto) {
        protoAugment(value, arrayMethods)
      } else {
        // 不支持原型链，就把做了劫持之后的数组方法定义到数组对象上
        copyAugment(value, arrayMethods, arrayKeys)
      }
      // 劫持数组方法之后，给每一个数组元素做响应式处理
      this.observeArray(value)
    } else {
      // 如果是 对象，调用 walk 方法
      this.walk(value)
    }
  }

  /**
   * Walk through all properties and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   */

  //  ”走“ 过 所有的属性，并将它们转换为
  //  getter/setters。这个方法应该只在值类型是 Object 的情况下被调用
  //  。
  walk (obj: Object) {
    const keys = Object.keys(obj)
    // 给每一个属性定义 响应式
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i])
    }
  }

  /**
   * Observe a list of Array items.
   *  观察一个 Array。
   */
  observeArray (items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
  }
}

// helpers

/**
 * Augment a target Object or Array by intercepting
 * the prototype chain using __proto__
 */
function protoAugment (target, src: Object) {
  /* eslint-disable no-proto */
  target.__proto__ = src
  /* eslint-enable no-proto */
}

/**
 * Augment a target Object or Array by defining
 * hidden properties.
 */
/* istanbul ignore next */
function copyAugment (target: Object, src: Object, keys: Array<string>) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
    def(target, key, src[key])
  }
}

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 */
export function observe (value: any, asRootData: ?boolean): Observer | void {
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  let ob: Observer | void
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else if (
    shouldObserve &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    ob = new Observer(value)
  }
  if (asRootData && ob) {
    ob.vmCount++
  }
  return ob
}

/**
 * Define a reactive property on an Object.
 * 在一个对象上定义一个响应式属性。
 */
export function defineReactive (
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,
  shallow?: boolean
) {
  // 创建以来独享实例
  const dep = new Dep()

  const property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  // 用户可能传入了 getter/setters
  const getter = property && property.get
  const setter = property && property.set
  // 没有传入 value，则通过 key 获取 value
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key]
  }

  // 根据shallow 判断是否需要递归深入观察每一个属性
  let childOb = !shallow && observe(val)

  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      // 如果有 getter 用 getter 获取值，否则使用 key 获取的值
      const value = getter ? getter.call(obj) : val

      // 依赖收集 Dep.target 即 watcher 对象
      // 每个属性都有一个 dep 对象
      if (Dep.target) {
        dep.depend()
        if (childOb) {
          // 子对象中添加删除成员的时候，也需要发送通知
          // 所以也要给子对象添加依赖
          childOb.dep.depend()
          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
      // 返回值
      return value
    },
    set: function reactiveSetter (newVal) {
      // 如果有 getter 用 getter 获取值，否则使用 key 获取的值
      const value = getter ? getter.call(obj) : val
      /* eslint-disable no-self-compare */

      // newVal !== newVal && value !== value 这个判断是为了处理 NaN 的情况
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }
      // #7981: for accessor properties without setter
      // 这个判断成立说明这个属性是 readOnly
      if (getter && !setter) return

      // 如果 setter 存在，设置新的值
      // 否则直接赋新值
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      // 如果新的值是对象，观察子对象并返回 子对象 的 observer 对象
      childOb = !shallow && observe(newVal)
      // 发送通知
      dep.notify()
    }
  })
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
export function set (target: Array<any> | Object, key: any, val: any): any {
  // 不允许给 undefined 和 原始值 定义响应式属性
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot set reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  // 如果是数组，且索引是合法的
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key)
    // 调用 修改之后的 splice 方法，插入数据 ./array.js
    target.splice(key, 1, val)
    return val
  }

  // key 是否存在于目标对象，且这个 key 不是原型上的属性
  if (key in target && !(key in Object.prototype)) {
    target[key] = val
    return val
  }
  // 获取 target 的 observer 对象
  const ob = (target: any).__ob__
  // 如果 target 是 Vue 实例，或者 $data 会直接返回
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    )
    return val
  }
  // 如果 ob 不存在，说明 target 不是响应式的对象，直接赋值
  // 既然原来不是响应式的对象，也没有必要将其设置为响应式的，直接赋值之后返回
  if (!ob) {
    target[key] = val
    return val
  }
  // 把 key 设置为响应式的属性
  defineReactive(ob.value, key, val)
  // 发送通知，更新视图
  ob.dep.notify()
  return val
}

/**
 * Delete a property and trigger change if necessary.
 */
export function del (target: Array<any> | Object, key: any) {
  // 判断与 $set 一致
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot delete reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }

  // 如果是删除数组的某个元素，同样是调用 splice 方法
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1)
    return
  }
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    )
    return
  }
  // target 自身不存在 key， 直接返回
  if (!hasOwn(target, key)) {
    return
  }

  // 存在key 删除 key 属性
  delete target[key]
  // 如果不存在 ob  说明不是响应式对象，直接返回，不需要发送通知
  if (!ob) {
    return
  }
  // 删除了响应式数据，发送通知
  ob.dep.notify()
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 */
function dependArray (value: Array<any>) {
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i]
    e && e.__ob__ && e.__ob__.dep.depend()
    if (Array.isArray(e)) {
      dependArray(e)
    }
  }
}
