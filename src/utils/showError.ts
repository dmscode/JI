/**
 * 在指定容器中显示错误信息
 * @param container - HTML容器元素
 * @param msg - 要显示的消息内容
 * @param level - 消息级别：'info'(绿色)、'warning'(橙色)、'error'(红色)
 */
export function showError(container: HTMLElement, msg: string, level: 'info' | 'warning' | 'error') {
    // 创建新的div元素用于显示消息
    const errorEl = document.createElement('div');
    // 设置消息内容和颜色样式
    errorEl.textContent = `【${level}】： ${msg}`;
    // 将消息元素添加到容器中
    container.appendChild(errorEl);
}