// 枚举值 → 本地化标签的公共映射（S-16/S-38/S-43 英文混杂族收口）。
// BE 下发值为小写枚举（level: debug/info/warn/warning/error/critical/fatal；
// severity: critical/high/medium/low/info）。归一为小写后查 locale
// （扁平键，keySeparator:false），未知值回落原值——不隐藏数据。

type TFn = (key: string, options?: Record<string, unknown>) => string;

function enumLabel(t: TFn, prefix: string, value?: string | null): string {
	if (!value) return '-';
	const label = t(`${prefix}.${value.toLowerCase()}`, { defaultValue: '' });
	return label || value;
}

export function severityLabel(t: TFn, value?: string | null): string {
	return enumLabel(t, 'severity', value);
}

export function levelLabel(t: TFn, value?: string | null): string {
	return enumLabel(t, 'level', value);
}

// 异常类型标签（S-72 附表；与 anomalies 页同一 key 族 anomalyTypes.*）
export function anomalyTypeLabel(t: TFn, value?: string | null): string {
	return enumLabel(t, 'anomalyTypes', value);
}

export const SEVERITY_TAG_COLORS: Record<string, string> = {
	critical: 'red',
	high: 'orange',
	medium: 'gold',
	low: 'blue',
	info: 'default',
};

export const LEVEL_TAG_COLORS: Record<string, string> = {
	fatal: 'magenta',
	critical: 'red',
	error: 'red',
	warn: 'orange',
	warning: 'orange',
	info: 'blue',
	debug: 'default',
};

export function severityColor(value?: string | null): string {
	return SEVERITY_TAG_COLORS[(value || '').toLowerCase()] || 'default';
}

export function levelColor(value?: string | null): string {
	return LEVEL_TAG_COLORS[(value || '').toLowerCase()] || 'default';
}
