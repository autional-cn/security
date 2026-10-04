import { describe, it, expect } from 'vitest';
import { formatTimelineTime, normalizeTimestamp } from '@/lib/format';

describe('timeline 时间戳归一（S-67 回归）', () => {
	it('13 位毫秒级时间戳不得再 ×1000（曾整批渲染「58726/7/5」级荒诞年份）', () => {
		const ms = 1791062321033;
		expect(normalizeTimestamp(ms).getTime()).toBe(ms);
		expect(formatTimelineTime(ms)).toContain('2026');
	});

	it('10 位秒级时间戳 ×1000 归一，与毫秒级同刻解码一致', () => {
		expect(normalizeTimestamp(1791062321).getTime()).toBe(1791062321000);
		expect(normalizeTimestamp(1791062321000).getTime()).toBe(1791062321000);
	});

	it('ISO 字符串直转', () => {
		expect(normalizeTimestamp('2026-10-04T00:00:00Z').getTime()).toBe(
			Date.parse('2026-10-04T00:00:00Z'),
		);
	});

	it('空值/零值返回占位符', () => {
		expect(formatTimelineTime(0)).toBe('-');
		expect(formatTimelineTime(null)).toBe('-');
		expect(formatTimelineTime(undefined)).toBe('-');
		expect(formatTimelineTime('')).toBe('-');
	});
});
