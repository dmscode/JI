import { App, MarkdownPostProcessorContext, MarkdownRenderer } from "obsidian";
import JIPlugin from "../main";
import type { Moment } from 'moment';
import { NotePagerConfig, NotePager } from "../utils/notepaper";

export class WeeklyView {
    // 当前显示日期
    year: string = window.moment().format('YYYY');
    weekIndex: string = window.moment().format('ww');
    // 视图容器
    container: HTMLElement;
    paper: NotePager;
    // 插件对象
    plugin: JIPlugin;
    // 是否折叠内容
    isFolding: boolean = true;
    // 周记笔记路径
    weeklyNotePath: string;
    weekStartDate: Moment;
    // 是否为周记视图
    isWeeklyView: boolean = false;
    constructor(el: HTMLElement, plugin: JIPlugin) {
        this.container = el;
        this.plugin = plugin;
        el.empty();
        // 初始化视图结构
        this.initPaper();
        /** 添加点击事件 */
        this.initEvents();
        /** 初始化 */
        this.update();
    }
    /**
     * 初始化笔记页面结构
     * 创建笔记容器并配置工具栏
     */
    private initPaper() {
        // 创建NotePager实例并配置基本参数
        this.paper = new NotePager(this.container, {
            // 设置视图的CSS类名
            clsName: ['ji-weekly-view'],
            // 配置顶部工具栏按钮
            topTools: [
                {
                    name: 'Unfold',
                    class: 'ji-notepaper-toggle-fold',
                    title: 'Unfold'
                },
                {
                    name: 'Today',
                    class: 'ji-notepaper-goto-today',
                    title: 'Today'
                },
                {
                    name: 'Weekly',
                    class: 'ji-notepaper-toggle-view',
                    title: 'Weekly'
                },
            ],
        })
        // 创建并插入周记内容容器
        const weeklyContainer = document.createElement('div');
        weeklyContainer.classList.add('ji-notepaper-weekly-content');
        this.paper.els.content!.after(weeklyContainer);
        this.paper.els.weekly = weeklyContainer;
    }
    /**
     * 初始化事件监听
     * 为视图添加点击事件处理，包含年份选择、周数选择、折叠切换、返回今日和视图切换功能
     */
    private initEvents() {
        this.plugin.registerDomEvent(this.paper.els.view, 'click', (e:MouseEvent) => {
            const target = e.target as HTMLElement
            // 处理年份选择
            if (target.classList.contains('year-option')) {
                this.setYear(target.dataset.value!)
            }
            // 处理周数选择
            if (target.classList.contains('week-option')) {
                this.setWeek(target.dataset.value!)
            }
            // 处理内容折叠/展开切换
            if (target.classList.contains('ji-notepaper-toggle-fold')) {
                this.isFolding = !this.isFolding;
                target.textContent = this.isFolding ? 'Unfold' : 'Fold';
                this.update();
            }
            // 处理返回今日功能
            if (target.classList.contains('ji-notepaper-goto-today')) {
                this.year = window.moment().format('YYYY')
                this.weekIndex = window.moment().format('ww')
                this.update();
            }
            // 处理周记/日记视图切换
            if (target.classList.contains('ji-notepaper-toggle-view')) {
                this.isWeeklyView = !this.isWeeklyView;
                target.textContent = this.isWeeklyView ? 'Daily' : 'Weekly';
                this.paper.els.left?.classList.toggle('ji-weekly-note-view', this.isWeeklyView);
            }
        })
    }
    private setYear(year: string) {
        this.year = year;
        this.update();
    }
    private setWeek(week: string) {
        this.weekIndex = week;
        this.update();
    }
    /**
     * 刷新日期选择器
     * 生成年份和周数选择器的HTML内容并更新到视图中
     */
    private refreshDateSelector = () => {
        // 获取配置中的起始年份和当前年份作为年份选择范围
        const startYear = new Date(this.plugin.settings.dailyStartDate).getFullYear();
        const endYear = new Date().getFullYear();
        
        // 生成年份选择器
        this.paper.els.outpaper!.empty();
        for (let year = startYear; year <= endYear; year++) {
            this.paper.els.outpaper!.createEl('div', {
                cls: `year-option${+this.year === year?' active':''}`,
                text: year.toString(),
                attr: {
                    'data-value': year.toString(),
                }
            })
        }
        
        // 生成周数选择器
        this.paper.els.inpaper!.empty();
        for (let week = 1; week <= window.moment(this.year, 'YYYY').weeksInYear(); week++) {
            const weekStr = week.toString().padStart(2, '0');
            this.paper.els.inpaper!.createEl('div', {
                cls: `week-option${+this.weekIndex === week?' active':''}`,
                text: weekStr,
                attr: {
                    'data-value': weekStr,
                }
            })
        }
    }
    /**
     * 更新周视图的日期和内容
     * 包括更新日期选择器、计算周起始日期和周记笔记路径
     */
    private async update() {
        // 刷新年份和周数选择器的显示
        this.refreshDateSelector();
        
        /** Note: 这里加入日期是为了确保计算的是这一年中的星期，而不会因为时间点处在年初或者年末而计算的是其他年份的星期 */
        // 计算当前选中周的起始日期
        this.weekStartDate = window.moment(this.year+'-06-01').week(+this.weekIndex).startOf('week');
        
        // 根据设置模板生成周记笔记路径
        this.weeklyNotePath = this.plugin.settings.weekNotePath.replace(/\$\{\{(.*?)\}\}/g, (m, s)=> {
            /** 时间格式中不应该有具体的日期，而是只有年份和第几周这样 */
            return this.weekStartDate.format(s);
        })

        // 渲染更新后的视图内容
        await this.render();
    }
    /**
     * 获取指定路径笔记的内容
     * @param notePath - 笔记文件路径
     * @returns 返回笔记内容，如果笔记不存在则返回空字符串
     */
    private async getNoteSource(notePath: string) {
        // 通过路径获取笔记文件对象
        const noteTFile = this.plugin.app.vault.getFileByPath(notePath);
        // 如果笔记存在，读取并返回其缓存内容
        if(noteTFile) {
            return await this.plugin.app.vault.cachedRead(noteTFile)
        }
        // 笔记不存在时返回空字符串
        return ''
    }
    private async render() {
        /** 渲染日记 */
        await this.renderDaily();
        /** 渲染周报 */
        await this.renderWeekly();
    }
    /**
     * 渲染周报视图
     * 创建周报容器并渲染周报内容
     */
    private async renderWeekly() {
        // 获取周报容器元素
        const weeklyContainer = this.paper.els.weekly!;
        // 清空容器内容
        weeklyContainer.empty();
        // 创建周报标题容器
        weeklyContainer.createEl('div', {
            cls: 'ji-note-subtitle ji-weekly-title',
        }).createEl('a', {
            text: `${this.year}Week${this.weekIndex}`,
            href: this.weeklyNotePath,
            cls: 'internal-link ji-weekly-link',
            attr: {
                target: '_blank',
                rel: 'noopener',
            }
        })
        // 创建周报内容容器
        const weeklyContentContainer = weeklyContainer.createEl('div', {
            cls: 'ji-note-content ji-weekly-content',
        })
        // 获取周报内容，如果不存在则显示默认文本
        const weeklySource = await this.getNoteSource(this.weeklyNotePath) || '（此周并无总结）';
        // 将Markdown内容渲染到周报容器中
        await MarkdownRenderer.render(this.plugin.app, weeklySource, weeklyContentContainer, "", this.plugin);
    }
    /**
     * 渲染每日笔记内容
     * 遍历一周内的每一天，获取并渲染对应的日记内容
     */
    private async renderDaily() {
        // 获取并清空笔记容器
        const notesContainer = this.paper.els.content!;
        notesContainer.empty();

        // 遍历一周七天
        for await (const i of [0, 1, 2, 3, 4, 5, 6]) {
            // 计算当前遍历日期
            const thisDate = this.weekStartDate.clone().add(i, 'days');
            // 生成日记文件路径
            const dailyNotePath = this.plugin.settings.dailyNotePath.replace(/\$\{\{(.*?)\}\}/g, (m, s)=> thisDate.format(s));
            // 获取日记内容
            const dailySource = await this.getNoteSource(dailyNotePath);
            // 生成日记标题
            const thisDailyTitle = this.plugin.settings.dailyNoteTitle.replace(/\$\{\{(.*?)\}\}/g, (m, s)=> thisDate.format(s));
            // 设置默认内容
            let thisDailyContent = '（此日无事记录）'
            
            // 从日记内容中匹配对应标题的部分
            Array.from(dailySource.matchAll(/^##+\s+(.*)\n((?:^[^#\n].*\n|^\s*\n)+)/gm)).forEach(dayNote => {
                if(dayNote[1] === thisDailyTitle) {
                    thisDailyContent = dayNote[2]
                }
            })
            const dailyNoteContainer = notesContainer.createEl('div', {
                cls: 'ji-daily-note',
            })
            // 创建日记标题
            dailyNoteContainer.createEl('div', {
                cls: 'ji-note-subtitle ji-daily-title',
            }).createEl('a', {
                text: thisDailyTitle,
                href: dailyNotePath,
                cls: 'internal-link ji-daily-link',
                attr: {
                    target: '_blank',
                    rel: 'noopener',
                }
            })
            // 创建日记内容
            const dailyNoteContentContainer =  dailyNoteContainer.createEl('div', {
                cls: 'ji-note-content ji-daily-content',
                attr: {
                    'data-title': thisDailyTitle,
                    'style': this.isFolding? `line-clamp: ${this.plugin.settings.dailyContentLineCount}; -webkit-line-clamp: ${this.plugin.settings.dailyContentLineCount};` : '',
                },
            })
            // 渲染Markdown内容
            await MarkdownRenderer.render(this.plugin.app, thisDailyContent, dailyNoteContentContainer, "", this.plugin);
        }
    }
}