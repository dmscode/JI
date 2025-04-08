/**
 * NotePager配置接口
 * @interface NotePagerConfig
 * @property {string[]} clsName - 自定义类名数组
 * @property {Array} topTools - 顶部工具栏配置
 * @property {Array} bottomTools - 底部工具栏配置
 */
export interface NotePagerConfig {
    clsName: string[];
    topTools?: {
        name: string;
        class: string;
        title: string;
    }[],
    bottomTools?: {
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
    els: {
        [key:string]: HTMLElement;
    } = {};
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
            bottomTools: [
                {
                    name: 'Date',
                    class: 'ji-notepaper-bottom-date',
                    title: window.moment().format('YYYY-MM-DD')
                }
            ],
        }, config as NotePagerConfig);
        this.init();
    }

    /**
     * 初始化页面布局
     */
    private init() {
        // 创建根元素
        this.els.view = document.createElement('div');
        this.els.view.classList.add('ji-notepaper-view', ...this.config.clsName);
        this.els.view.setAttribute('data-element-mark', 'dms-ji-plugin');
            // 创建主要内容区域
            this.els.main = this.els.view.createEl('div', { cls: 'ji-notepaper-main' });
                // 创建左侧区域
                this.els.left = this.els.main.createEl('div', { cls: 'ji-notepaper-left' });
                    // 创建顶部工具栏区域
                    this.els.topTools = this.els.left.createEl('div', { cls: 'ji-notepaper-top-tools' });
                    // 创建内容区域
                    this.els.content = this.els.left.createEl('div', { cls: 'ji-notepaper-content' });
                    // 创建底部工具栏区域
                    this.els.bottomTools = this.els.left.createEl('div', { cls: 'ji-notepaper-bottom-tools' });
                // 创建内部选择器区域
                this.els.inpaper = this.els.main.createEl('div', { cls: 'ji-notepaper-inpaper-selectors' });
                // 创建外部选择器区域
            this.els.outpaper = this.els.view.createEl('div', { cls: 'ji-notepaper-outpaper-selectors' });
        // 创建工具按钮
        this.initTools();
        // 将根元素插入容器
        this.container.empty();
        this.container.appendChild(this.els.view);
    }
    /**
     * 初始化顶部和底部工具栏
     * @private
     */
    private initTools () {
        // 如果存在顶部工具配置且不为空，则创建顶部工具栏
        if (this.config.topTools && this.config.topTools.length) {
            this.createTools(this.config.topTools, 'top');
        }
        // 如果存在底部工具配置且不为空，则创建底部工具栏
        if (this.config.bottomTools && this.config.bottomTools.length) {
            this.createTools(this.config.bottomTools, 'bottom'); 
        }
    }
    /**
     * 创建工具栏元素
     * @param {any[]} tools - 工具配置数组
     * @param {'top'|'bottom'} type - 工具栏位置类型
     * @private
     */
    private createTools (tools: any[], type: 'top'|'bottom') {
        // 根据类型选择对应的工具栏容器
        const toolsContainer = type === 'top' ? this.els.topTools : this.els.bottomTools;
        // 遍历工具配置数组，为每个工具创建DOM元素并存储引用
        tools.forEach(tool => {
            this.els[tool.name] = toolsContainer.createEl('div', { cls: tool.class, text: tool.title });
        });
    }
}