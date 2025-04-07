import styles from "../styles/styles.less";

/**
 * NotePager配置接口
 * @interface NotePagerConfig
 * @property {string[]} clsName - 自定义类名数组
 * @property {Array} topTools - 顶部工具栏配置
 * @property {Array} bottomTools - 底部工具栏配置
 */
export interface NotePagerConfig {
    clsName: string[];
    topTools: {
        name: string;
        class: string;
        title: string;
    }[],
    bottomTools: {
        name: string;
        class: string;
        title: string;
    }[]
}

/**
 * NotePager类 - 笔记页面管理器
 */
export class NotePager {
    container: HTMLElement;
    config: NotePagerConfig;
    root: ShadowRoot;
    els: {
        [key:string]: HTMLElement;
    }
    /**
     * @param {HTMLElement} container - 容器元素
     * @param {Object} config - 配置对象
     */
    constructor (container: HTMLElement, config: NotePagerConfig) {
        this.container = container;
        // 合并默认配置和用户配置
        this.config = Object.assign({
            clsName: [],
            topTools: [],
            bottomTools: [],
        }, config as NotePagerConfig);
        // 创建Shadow DOM
        this.root = container.attachShadow({mode: "open"});
        this.render();
    }

    /**
     * 渲染组件
     */
    render () {
        this.initializeLayout();
        this.getEls();
        this.setStyle();
    }

    /**
     * 获取组件类名列表
     * @returns {string} 合并后的类名字符串
     */
    private getClassNames() {
        return ['ji-notepaper-view', ...this.config.clsName].join(' ');
    }

    /**
     * 生成工具栏HTML
     * @param {any[]} tools - 工具配置数组
     * @returns {string} 工具栏HTML字符串
     */
    private getToolsHtml(tools: any[]) {
        return tools.map(tool => `<div class="${tool.class}">${tool.title}</div>`).join('\n');
    }

    /**
     * 获取工具栏DOM元素
     * @param {any[]} tools - 工具配置数组
     */
    private getToolsEl(tools: any[]) {
        tools.forEach(tool => {
            this.els[tool.name] = this.root.querySelector(`.${tool.class}`) as HTMLElement;
        });
    }

    /**
     * 初始化页面布局
     */
    initializeLayout() {
        const template = `
        <style class='ji-notepaper-style'></style>
        <div class="${this.getClassNames()}">
            <div class="ji-notepaper-main">
                <div class="ji-notepaper-left">
                    <div class="ji-notepaper-top-tools">
                        ${this.getToolsHtml(this.config.topTools)}
                    </div>
                    <div class="ji-notepaper-content"></div>
                    <div class="ji-notepaper-bottom-tools">
                        ${this.getToolsHtml(this.config.bottomTools)}
                    </div>
                </div>
                <div class="ji-notepaper-inpaper-selectors"></div>
            </div>
            <div class="ji-notepaper-outpaper-selectors"></div>
        </div>
        `;
        this.root.innerHTML = template;
    }

    /**
     * 获取并存储所有DOM元素引用
     */
    getEls() {
        // 获取主要DOM元素
        this.els = {
            style: this.root.querySelector(".ji-notepaper-style") as HTMLStyleElement,
            view: this.root.querySelector(".ji-notepaper-view") as HTMLElement,
            main: this.root.querySelector(".ji-notepaper-main") as HTMLElement,
            left: this.root.querySelector(".ji-notepaper-left") as HTMLElement,
            inpaper: this.root.querySelector(".ji-notepaper-inpaper-selectors") as HTMLElement,
            outpaper: this.root.querySelector(".ji-notepaper-outpaper-selectors") as HTMLElement,
            topTools: this.root.querySelector(".ji-notepaper-top-tools") as HTMLElement,
            content: this.root.querySelector(".ji-notepaper-content") as HTMLElement,
            bottomTools: this.root.querySelector(".ji-notepaper-bottom-tools") as HTMLElement,
        }
        // 获取工具栏元素
        this.getToolsEl(this.config.topTools);
        this.getToolsEl(this.config.bottomTools);
    }

    /**
     * 设置组件样式
     */
    setStyle () {
        this.els.style.textContent = styles;
    }
}