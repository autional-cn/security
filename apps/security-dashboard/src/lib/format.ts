// 时间戳统一归一：10 位秒级 ×1000 转毫秒，13 位毫秒级原样。
// 毫秒级再 ×1000 会溢出成荒诞年份（S-67：42 项事件曾全部渲染「58726 年」级）。
export function normalizeTimestamp(ts: number | string): Date {
	return new Date(typeof ts === 'number' && ts < 1e12 ? ts * 1000 : ts);
}

export function formatTimelineTime(ts: number | string | null | undefined): string {
	if (!ts) return '-';
	return normalizeTimestamp(ts).toLocaleString();
}
