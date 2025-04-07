import { MarkdownRenderer } from "obsidian";
import JIPlugin from "../main";
import { NotePagerConfig, NotePager } from "../utils/notepaper";

/** 日记视图类，用于管理和渲染日记内容 */
export class DailyView {
    // 当前显示的日期
    month: number = new Date().getMonth();
    day: number = new Date().getDate();
    // 视图容器
    container: HTMLElement;
    paper: NotePager;
    // 插件对象
    plugin: JIPlugin;
    // 日记相关属性
    notePath: string;
    noteSource: string;
    // 是否折叠内容
    isFolding: boolean = true;

    /**
     * 构造函数：初始化日记视图
     * @param el - 容器元素
     * @param plugin - 插件实例
     */
    constructor(el: HTMLElement, plugin: JIPlugin, conf: any) {
        this.container = el;
        this.plugin = plugin;
        el.empty();
        // 初始化视图结构
        this.initPaper();
        // 注册视图交互事件
        this.initEvents();
        // 初始化视图内容
        this.update();
    }
    /**
     * 初始化笔记页面组件
     * @private
     */
    private initPaper() {
        // 创建NotePager实例，配置视图样式和工具按钮
        this.paper = new NotePager(this.container, {
            // 设置视图的CSS类名
            clsName: ['ji-daily-view'],
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
                }
            ],
        })
    }

    /**
     * 初始化视图事件监听
     * 注册点击事件处理器，用于处理日期选择、内容折叠和日期跳转等交互
     * @private
     */
    private initEvents () {
        this.plugin.registerDomEvent(this.paper.els.view, 'click', async (e:MouseEvent) => {
            const target = e.target as HTMLElement
            // if(target.tagName === 'A' && target.classList.contains('internal-link')) {
            //     await this.plugin.app.workspace.openLinkText(
            //         target.dataset.path!,
            //         this.plugin.app.workspace.getActiveFile()?.path ?? ""
            //     );
            // }
            // 点击月份选项时，更新选中的月份
            if (target.classList.contains('month-option')) {
                this.setMonth(Number(target.dataset.value!))
            }
            
            // 点击日期选项时，更新选中的日期
            if (target.classList.contains('day-option')) {
                this.setDay(Number(target.dataset.value!))
            }
            
            // 点击折叠按钮时，切换内容的折叠状态并更新显示文本
            if (target.classList.contains('ji-notepaper-toggle-fold')) {
                this.isFolding = !this.isFolding;
                target.textContent = this.isFolding ? 'Unfold' : 'Fold';
                this.update();
            }
            
            // 点击"今天"按钮时，将日期重置为当前日期
            if (target.classList.contains('ji-notepaper-goto-today')) {
                this.month = new Date().getMonth();
                this.day = new Date().getDate();
                this.update();
            }
        })
    }

    /** 设置当前月份并更新视图 */
    private setMonth(month: number) {
        this.month = month;
        this.update();
    }

    /** 设置当前日期并更新视图 */
    private setDay(day: number) {
        this.day = day;
        this.update();
    }

    /**
     * 生成日期选择器的选项HTML
     * @param option - 选项配置对象
     * @param option.type - 选择器类型，可选值：'month' | 'day'
     * @param option.value - 选项值
     * @param option.title - 选项显示文本
     * @param option.active - 是否为激活状态
     * @returns 返回选项的HTML字符串
     */
    private getSelectorOption (option: {
        type: 'month' | 'day',
        value: string,
        title: string,
        active?: boolean,
    }) {
        // 返回带有类名、数据属性和激活状态的选项div元素
        return `
            <div class="${option.type}-option${option.active?' active':''}" data-value="${option.value}">${option.title}</div>
        `
    }
    /** 更新日期选择器的显示状态 */
    private refreshDateSelector () {
        const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一', '十二']
        // 生成月份选择器HTML
        const monthSelectorsCode = Array.from({ length: 12 }, (_, i) => {
            return this.getSelectorOption({
                type: 'month',
                value: String(i),
                title: months[i],
                active: this.month === i
            });
        }).join('');
        
        // 生成日期选择器HTML
        const monthDayCount = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        const daySelectorsCode = Array.from({ length: monthDayCount[this.month] }, (_, i) => {
            const day = (i + 1).toString().padStart(2, '0');
            return this.getSelectorOption({
                type:'day',
                value: day,
                title: day,
                active: this.day === (i + 1)
            })
        }).join('');

        // 更新选择器显示
        this.paper.els.outpaper!.innerHTML = monthSelectorsCode;
        this.paper.els.inpaper!.innerHTML = daySelectorsCode;
    }

    /** 更新视图内容 */
    private async update() {
        this.refreshDateSelector();
        // 根据设置生成笔记路径
        this.notePath = this.plugin.settings.dailyNotePath.replace(/\$\{\{(.*?)\}\}/g, (m, s)=> {
            if (s === 'MM') {
                return (this.month + 1).toString().padStart(2, '0');
            } else if (s === 'DD') {
                return this.day.toString().padStart(2, '0');
            } else {
                return window.moment().format(s);
            }
        });
        await this.getNoteSource();
        await this.render();
    }

    /** 获取笔记内容 */
    private async getNoteSource(){
        const noteTFile = this.plugin.app.vault.getFileByPath(this.notePath);
        if(noteTFile) {
            this.noteSource = await this.plugin.app.vault.cachedRead(noteTFile)
            return
        }
        this.noteSource = ''
    }
    private getWeekNoteCode (dateStr: string|undefined) {
        const dateMoment = dateStr && window.moment(dateStr, 'YYYY-MM-DD');
        const weekNotePath = dateStr && this.plugin.settings.weekNotePath.replace(/\$\{\{(.*?)\}\}/g, (m, s)=> dateMoment!.format(s));
        const hasWeekNote = weekNotePath && this.plugin.app.vault.getAbstractFileByPath(weekNotePath);
        const weekTitle = dateMoment ? `${dateMoment!.format('YYYY')} Week ${dateMoment!.format('ww')}` : '';
        return hasWeekNote ? `<a href="${weekNotePath}" data-path="${weekNotePath}" class="internal-link ji-week-link" target="_blank" rel="noopener">${weekTitle}</a>` : `<span class="ji-week-link">${weekTitle}</span>`;
    }
    /** 渲染笔记内容 */
    private async render() {
        // 解析日记内容分组
        const dailyContentGroup = Array.from(this.noteSource.matchAll(/^##+\s+(.*)\n((?:^[^#\n].*(?:\n|$)|^\s*\n)+)/gm))
        const notesContainer = this.paper.els.view.querySelector('.ji-notepaper-content')!;
        
        // 处理空内容情况
        if(!dailyContentGroup.length) {
            notesContainer.innerHTML = '（此日记无内容）'
            return
        }

        // 清空并重新渲染内容
        notesContainer.innerHTML = ''
        dailyContentGroup.forEach(async dayNote => {
            // 提取笔记信息
            const title = dayNote[1]
            const content = dayNote[2]
            const dateStr = title.match(/^(\d{4}-\d{2}-\d{2})\s+/)?.[1]

            // 处理周记链接
            const weekLinkCode = this.getWeekNoteCode(dateStr);
            // 渲染笔记HTML结构
            notesContainer.innerHTML += `
                <div class="ji-daily-note">
                    <div class="ji-note-subtitle ji-daily-title">
                        <a href="${this.notePath}#${title}" data-path="${this.notePath}#${title}" class="internal-link ji-daily-link" target="_blank" rel="noopener">${title}</a>
                        ${weekLinkCode}
                    </div>
                    <div class="ji-note-content ji-daily-content" data-title="${title}" ${this.isFolding ? `style="line-clamp: ${this.plugin.settings.dailyContentLineCount}; -webkit-line-clamp: ${this.plugin.settings.dailyContentLineCount};"` : ''}></div>
                </div>
            `
            // 渲染Markdown内容
            await MarkdownRenderer.render(this.plugin.app, content, notesContainer.querySelector(`.ji-daily-content[data-title="${title}"]`)!, "", this.plugin);
        })
    }
}