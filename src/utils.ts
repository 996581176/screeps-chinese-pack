/**
 * 递归获取该元素下所有包含内容的 text 元素
 * 
 * @param el 要进行查询的 html 节点
 * @return 包含内容的 text 元素数组
 */
export const getContentElement = function (el: Node): Text[] {
    if (el instanceof HTMLElement) {
        // 没有内容或者该元素被禁止翻译了
        if (!el.innerText || el.stopTranslateSearch) return []
        const contentElement: Text[] = []

        // 遍历所有子节点递归拿到内容节点
        for (const children of el.childNodes) {
            if (children.nodeType === Node.TEXT_NODE) {
                // Text 节点中有很多只有换行符或者空格的，这里将其剔除掉
                // 正则含义：包含除“换行”“回车”“空格”以外的其他字符
                if (!/[^(\n|\r| )]/g.test((children as Text).wholeText)) continue
                contentElement.push(children as Text)
            }
            // 元素节点的话就递归继续获取（不会搜索 script 标签）
            else if (children.nodeType === Node.ELEMENT_NODE && children.nodeName !== 'SCRIPT') {
                contentElement.push(...getContentElement(children))
            }
        }

        return contentElement
    }

    return []
}


/**
 * 去除 hash 中的 query 字符串
 * @param hash 可能包含 query 的 hash
 */
export const getNoQueryHash = function (hash: string): string {
    return hash.split('?')[0]
}


/**
 * 监听路由的变化
 * 
 * @param callback 在变更时执行的回调，入参为新的 hash（包含 query 字符串）
 */
export const onHashChange = function (callback: HashChangeCallback = () => {}) {
    // 在更新时触发回调
    const hashCallback = () => callback(document.location.hash)

    // pushState 和 replaceState 不会触发对应的回调，这里包装一下
    history.pushState = wapperHistory('pushState')
    history.replaceState = wapperHistory('replaceState')

    // 页面变更时触发回调
    window.addEventListener('replaceState', hashCallback)
    window.addEventListener('pushState', hashCallback)
    window.addEventListener('hashchange', hashCallback)
}


/**
 * 将指定方法包装上事件功能
 * 
 * @param type 要包装的方法名，会在该方法执行时发射同名的事件
 * @return 包装好的新方法
 */
const wapperHistory = function (type: string) {
    // 保存原始方法
    const originFunc = history[type]

    return function (...args) {
        const result = originFunc.apply(this, args)
        // 派发事件
        window.dispatchEvent(new Event(type))
        return result
    }
}


/**
 * 生成元素变更回调
 * 
 * MutationObserver 接受回调的入参不是单纯的 html 元素数组
 * 这里将其格式化后再执行业务回调
 * 
 * @param callback 要触发的实际回调
 */
const getMutationCallback = function (callback: ContentChangeCallback) {
    return function (mutationsList: MutationRecord[]) {
        // 获取发生变更的节点
        const changedNodes: Node[] = [].concat(...mutationsList.map(mutation => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) return [...mutation.addedNodes]
            else return [mutation.target]
        }))

        // 给所有需要处理的元素执行回调
        for (const node of changedNodes) {
            if (!(node instanceof HTMLElement)) continue

            callback(node)
        }
    }
}


/**
 * 回调 - 页面有新元素变更
 * 
 * @param callback 在变更时执行的回调，入参为发生变更的 HTMLElement（包括新增和修改，没有删除）
 */
export const onElementChange = function (callback: ContentChangeCallback = () => {}) {
    const observer = new MutationObserver(getMutationCallback(callback))

    // 启动监听
    observer.observe(document.body, {
        childList: true,
        characterData: true,
        subtree: true
    })
}

/**
 * 多行翻译
 * 
 * 当一个 css 选择器会选中多个元素时，就可以使用该函数快速生成一个翻译源
 * 会根据传入的数据源的键值对进行翻译
 * 
 * @param contents 多行翻译源
 */
export const translateMultiple = function (contents: MultipleMap) {
    return (el: HTMLElement) => {
        const newContent = contents[el.innerText]
        if (newContent) el.innerText = newContent
    }
}