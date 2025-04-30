import { MarkdownPostProcessorContext, setTooltip } from "obsidian";
import JIPlugin from "../main";
import type { Moment } from 'moment';
import { NotePagerConfig, NotePager } from "../utils/notepaper";

export class YearView {
    // 当前年份
    year: string = window.moment().format('YYYY');
    // 视图容器
    container: HTMLElement;
    paper: NotePager;
    // 插件对象
    plugin: JIPlugin;
    // 今天
    today: Moment = window.moment();
    // 周容器
    weekContainer: HTMLElement|null = null;
    constructor(el: HTMLElement, plugin: JIPlugin) {
        this.container = el;
        this.plugin = plugin;
        el.empty();
        /** 中创建视图 */
        this.initPaper();
        /** 添加点击事件 */
        this.initEvents();
        /** 初始化 */
        this.update();
    }
    private initPaper() {
       this.paper = new NotePager(this.container, {
           clsName: ['ji-year-view']
       })
    }
    /**
     * 初始化事件监听
     * 为年份视图添加点击事件处理
     */
    private initEvents() {
        this.plugin.registerDomEvent(this.paper.els.view, 'click', (e:MouseEvent) => {
            const target = e.target as HTMLElement
            // 点击年份选项时，更新当前选中的年份
            if (target.classList.contains('year-option')) {
                this.setYear(target.dataset.value!)
                this.update();
            }
            // 点击日期时，显示该日期的详细信息
            if (target.classList.contains('ji-year-day')) {
                this.setToolTips(target.dataset.dayInfo!)
            }
        })
    }
    /**
     * 设置工具提示信息
     * @param info - 要显示的提示信息
     */
    private setToolTips(info: string) {
        // 更新顶部工具栏的文本内容
        this.paper.els.topTools!.textContent = info;
        // 更新底部工具栏的文本内容
        this.paper.els.bottomTools!.textContent = info;
    }
    private setYear(year: string) {
        this.year = year;
        this.update();
    }
    /** 刷新日期选择器 */
    private refreshDateSelector = () => {
        const thisYear = new Date().getFullYear();
        const startYear = Math.min(new Date(this.plugin.settings.dailyStartDate).getFullYear(), thisYear-5);
        const endYear = Math.max(startYear+10, thisYear);
        this.paper.els.outpaper!.empty();
        for (let year = startYear; year <= endYear; year++) {
            this.paper.els.outpaper!.createEl('div', {
                text: year.toString(),
                cls: `year-option${+this.year === year ? ' active' : ''}`,
                attr: {
                    'data-value': year.toString()
                }
            })
        }
    }
    private async update() {
        this.refreshDateSelector();
        await this.render();
    }
    /**
     * 渲染年份视图
     * 创建包含所有月份和日期的年历视图
     */
    private async render() {
        // 获取并清空笔记容器
        const notesContainer = this.container.querySelector('.ji-notepaper-content')!;
        notesContainer.empty();
        // 创建文档片段用于批量添加元素
        const content = document.createDocumentFragment();
        // 遍历12个月
        for (let i = 0; i < 12; i++) {
            const thisMonth = String(i+1).padStart(2, '0');
            // 遍历当月的每一天
            for (let j = 1; j <= window.moment(`${this.year}-${thisMonth}-01`).daysInMonth(); j++) {
                this.renderDay(thisMonth, j, content);
            }
        }
        // 将所有内容添加到容器中
        notesContainer.appendChild(content);
    }
    private async renderDay(month:string, day:number, content: DocumentFragment) {
        const thisDate = String(day).padStart(2, '0');
        const thisDay = window.moment(`${this.year}-${month}-${thisDate}`)

        // 在每周开始时创建新的周容器
        if(!this.weekContainer || thisDay.day() === 0) {
            this.weekContainer = content.createEl('div', { cls: 'ji-year-week' });
            this.weekContainer.dataset.weekIndex = `${thisDay.weekYear()}Week${thisDay.week().toString()}`;
        }

        // 处理月份标题
        const isOddMonth = (+month % 2);
        if(day===1) {
            const monthClasses = ["ji-year-item", "ji-year-month-title"];
            /** 奇数月 */
            if (isOddMonth) monthClasses.push("ji-year-month-title-odd");
            /** 过去 */
            if(thisDay.format('YYYY-MM') < this.today.format('YYYY-MM')) monthClasses.push("ji-year-month-passed");
            this.weekContainer.createEl('div', {
                text: window.moment(`${this.year}-${month}`).format('MMMM'),
                cls: monthClasses.join(" "),
                attr: { 'data-month-value': `${month}` }
            });
        }

        // 设置日期单元格的样式类
        const dayClasses = ["ji-year-item", "ji-year-day"];
        /** 奇数月 */
        if (isOddMonth) dayClasses.push("ji-year-month-odd");
        /** 今天 */
        if (thisDay.format('YYYY-MM-DD') === this.today.format('YYYY-MM-DD')) dayClasses.push("ji-year-day-active");
        /** 过去 */
        if (this.today.diff(thisDay, 'days') > 0) dayClasses.push("ji-year-day-passed");
        // 生成日期信息代码
        const dayInfoCode = `${month}-${thisDate} 第${thisDay.week().toString()}周 ${thisDay.format("dddd")}`;

        // 创建日期单元格
        const thisDayContent = this.weekContainer.createEl("div", {
            text: thisDate,
            cls: dayClasses.join(" "),
            attr: {
                "data-month-value": `${month}`,
                "data-day-value": `${thisDate}`,
                "data-day-info": dayInfoCode,
            },
        });
        const marks = thisDayContent.createEl("div", { cls: "ji-year-day-marks" });
        /** 是月初 */
        if(thisDay.date() === 1) marks.createEl("div", { cls: "ji-year-day-mark ji-year-day-monthStart" });
        /** 是周一 */
        if(thisDay.day() === 1) marks.createEl("div", { cls: "ji-year-day-mark ji-year-day-weekStart" });

        // 设置工具提示
        const Tooltip = `${thisDay.format("YYYY-MM-DD")}\n第 ${thisDay.week().toString()} 周 ${thisDay.format("dddd")}`;
        setTooltip(thisDayContent, Tooltip);
        setTooltip(thisDayContent, Tooltip);
    }
}