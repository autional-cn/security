import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/en';

export function setDayjsLocale(lang: string) {
	const localeMap: Record<string, string> = { 'zh-CN': 'zh-cn', 'en-US': 'en' };
	dayjs.locale(localeMap[lang] || 'zh-cn');
}

export default dayjs;
