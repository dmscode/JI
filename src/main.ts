import { Plugin, parseYaml, Component } from 'obsidian';
import { JISettingTab, JIPluginSettings, DEFAULT_SETTINGS } from './settings';
import { showError } from './utils/showError';
import { DailyView } from './views/daily';
import { WeeklyView } from './views/weekly';
import { YearView } from './views/year';

const views = {
    daily: DailyView,
    weekly: WeeklyView,
    year: YearView
}

export default class JIPlugin extends Plugin {
    settings: JIPluginSettings;

    async onload() {
		// 载入设置
        await this.loadSettings();
        /** 注册代码块处理器 */
        this.registerMarkdownCodeBlockProcessor("ji", (source, el, ctx) => {
            const conf = parseYaml(source)
			// 错误处理
			if(!conf.type) return showError(el, '未指定视图类型', 'error')
			// 渲染视图
			const view = views[conf.type as keyof typeof views]
			if(!view) return showError(el, '未知视图类型', 'error')
			if(view) new view(el, this, conf)
        });
        // 注册设置页面
        this.addSettingTab(new JISettingTab(this.app, this));
    }

    onunload() {

    }
    /** 载入设置 */
    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }
    /** 保存设置 */
    async saveSettings() {
        await this.saveData(this.settings);
    }
}