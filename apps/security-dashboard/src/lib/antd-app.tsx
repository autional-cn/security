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
