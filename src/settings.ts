import { App, PluginSettingTab, Setting } from 'obsidian';
import JIPlugin from './main';

interface FragmentItem {
    tag: string;
    attr: {
        href?: string;
        target?: string;
        rel?: string;
        text?: string;
        cls?: string;
    };
}

/** 创建文档片段 */
const createFragment = (config: Array<string | FragmentItem>) => {
    const fragment = document.createDocumentFragment()
    config.forEach(item => {
        if (typeof item === 'string') {
            fragment.appendChild(document.createTextNode(item))
        } else {
            fragment.createEl(item.tag as keyof HTMLElementTagNameMap, item.attr)
        }
    })
    return fragment
}
/** 渲染 Moment 字符串 */
const renderMoment = (str: string): string => {
    try {
        return str.replace(/\$\{\{(.*?)\}\}/g, (match, format) => {
            if (!format.trim()) {
                console.warn('Empty moment format pattern detected');
                return match;
            }
            try {
                return window.moment().format(format.trim());
            } catch (e) {
                console.error(`Invalid moment format pattern: ${format}`, e);
                return match;
            }
        });
    } catch (e) {
        console.error('Error rendering moment string:', e);
        return str;
    }
};

export interface JIPluginSettings {
    dailyNotePath: string;
    dailyNoteTitle: string;
    dailyContentLineCount: number;
    weekNotePath: string;
    dailyStartDate: string;
    [key: string]: string | number;
}

interface MomentSetting {
	key: keyof JIPluginSettings;
	name: string;
	placeholder: string;
	desc: Array<string | FragmentItem>;
}

export const DEFAULT_SETTINGS: JIPluginSettings = {
    dailyNotePath: 'Daily/${{MM}}/${{MM}}-${{DD}}.md',
    dailyNoteTitle: '${{YYYY}}-${{MM}}-${{DD}} ${{dddd}}',
    dailyContentLineCount: 5,
    weekNotePath: 'Week/${{YYYY}}/Week${{ww}}.md',
    dailyStartDate: window.moment().format('YYYY-MM-DD'),
}

export class JISettingTab extends PluginSettingTab {
    plugin: JIPlugin;

    constructor(app: App, plugin: JIPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    private createMomentSetting = (config: MomentSetting) => {
        // 验证配置参数
        if (!config.key || !config.name) {
            console.error('Invalid moment setting configuration');
            return;
        }

        // 构建默认描述片段
        const defaultDesc: Array<string | FragmentItem> = [
            '${{}} 中的内容会被替换。可使用 ',
            {
                tag: 'a',
                attr: {
                    href: 'https://momentjs.com/docs/#/displaying/format/',
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    text: 'moment.js 变量'
                }
            },
            ' 当前渲染效果：',
            {
                tag: 'strong',
                attr: {
                    cls: 'moment-sample',
                    text: renderMoment(String(this.plugin.settings[config.key]))
                }
            }
        ];

        // 合并自定义描述和默认描述
        const descFragment = createFragment(config.desc.concat(defaultDesc));
        const sampleEl = descFragment.querySelector('strong.moment-sample');

        // 创建设置项
        new Setting(this.containerEl)
            .setName(config.name)
            .setDesc(descFragment)
            .addText(text => {
                text.setPlaceholder(config.placeholder)
                    .setValue(String(this.plugin.settings[config.key]))
                    .onChange(async (value) => {
                        try {
                            this.plugin.settings[config.key] = value;
                            await this.plugin.saveSettings();
                            if (sampleEl) {
                                sampleEl.textContent = renderMoment(value);
                            }
                        } catch (e) {
                            console.error('Error saving settings:', e);
                        }
                    });
                return text;
            });
    }

    display(): void {
        const {containerEl} = this;

        containerEl.empty();

        new Setting(containerEl)
            .setHeading()
            .setName('日记');

        this.createMomentSetting({
            key: 'dailyNotePath',
            name: '日记路径',
            placeholder: 'Your daily note path',
            desc: ['描述末尾的示例，应该和今日笔记的文件路径相同。'],
        });
        this.createMomentSetting({
            key: 'dailyNoteTitle',
            name: '日记标题',
            placeholder: 'Your daily note title',
            desc: ['描述末尾的示例，应该和今日笔记的小节标题相同。'],
        });

        new Setting(containerEl)
            .setName('日记内容行数')
            .setDesc('日记视图中内容的行数')
            .addSlider(slider => slider
                .setLimits(1,20,1)
                .setValue(this.plugin.settings.dailyContentLineCount)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.dailyContentLineCount = value;
                    await this.plugin.saveSettings();
            }))

        new Setting(containerEl)
            .setHeading()
            .setName('周记');

            this.createMomentSetting({
                key: 'weekNotePath',
                name: '周记路径',
                placeholder: 'Your week note path',
                desc: ['描述末尾的示例，应该和今日所在周的周记文件路径相同。'],
            });

        new Setting(containerEl)
            .setName('起始日期')
            .setDesc('日记的起始日期，主要用作判断从哪一年开始进行显示。格式为 YYYY-MM-DD')
            .addText(text => text
                .setPlaceholder('YYYY-MM-DD')
                .setValue(this.plugin.settings.dailyStartDate)
                .onChange(async (value) => {
                    this.plugin.settings.dailyStartDate = value;
                    await this.plugin.saveSettings();
            }))
    }
}
