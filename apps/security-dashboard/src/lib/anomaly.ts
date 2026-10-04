// 异常描述本地化（S-38/S-05）：BE 按 type 生成英文模板描述
// （service-audit anomaly_repository.go）：
//   brute_force:  "Detected %d failed login attempts from IP fingerprint %s"
//   unusual_time: "User has %d off-hours access events"
// 按 type 键提取数字/IP 重排为当前语言；解析失败回落原文（不隐藏数据）。

type TFn = (key: string, options?: Record<string, unknown>) => string;

export function anomalyDescription(
	t: TFn,
	anomaly: { type?: string | null; description?: string | null }
): string {
	const raw = anomaly.description || '';
	if (!raw) return '-';
	const type = (anomaly.type || '').toLowerCase();
	if (type === 'brute_force') {
		const count = raw.match(/(\d+)/)?.[1];
		const ip = raw.match(/fingerprint\s+(\S+)/i)?.[1];
		if (count && ip) {
			const label = t('anomalyDesc.bruteForce', { count, ip });
			if (label && !label.startsWith('anomalyDesc.')) return label;
		}
	}
	if (type === 'unusual_time') {
		const count = raw.match(/(\d+)/)?.[1];
		if (count) {
			const label = t('anomalyDesc.unusualTime', { count });
			if (label && !label.startsWith('anomalyDesc.')) return label;
		}
	}
	return raw;
}
