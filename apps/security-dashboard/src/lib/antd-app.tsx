/**
 * Ant Design v6 兼容层 + Theme Provider
 * - v6 移除了 message.* / Modal.confirm() 等静态方法，通过 App 组件 + 全局变量提供向后兼容 API
 * - Theme: 读取 localStorage 持久化主题偏好，同步 data-theme 属性并配置 Ant Design 暗色/亮色算法
 */

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { App as AntdApp, ConfigProvider, theme } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';
import type { NotificationInstance } from 'antd/es/notification/interface';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import { useTheme } from '@/hooks/useTheme';
// antd 主题由设计系统下发，不在这里手写色值。
// 此前这里只设了 algorithm、没有 token，因此 antd 组件渲染的是出厂配色
// （实测侧边栏选中项 .ant-menu-item-selected 是 antd 出厂蓝 rgb(22,119,255)），
// 而 admin 控制台是品牌蓝——同一个产品两个控制台主色不是一个（ui 仓库 KI-011）。
import antdTheme from '@autional-cn/tokens/antd-theme';

export let message: MessageInstance;
export let modal: any;
export let notification: NotificationInstance;

export function AntdAppProvider({ children }: { children: React.ReactNode }) {
	const { appTheme } = useTheme();
	const { i18n } = useTranslation();

	const antdLocale = i18n.language === 'en-US' ? enUS : zhCN;

	return (
		<ConfigProvider
			locale={antdLocale}
			theme={{
				algorithm: appTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
				token: (appTheme === 'dark' ? antdTheme.dark : antdTheme.light).token,
			}}
		>
			<AntdApp>
				<AntdAppInit />
				{children}
			</AntdApp>
		</ConfigProvider>
	);
}

function AntdAppInit() {
	const app = AntdApp.useApp();
	useEffect(() => {
		message = app.message;
		modal = app.modal;
		notification = app.notification;
	}, [app]);
	return null;
}
