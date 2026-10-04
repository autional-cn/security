import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

vi.mock('@/components/UserIdentity', () => ({
	UserIdentity: ({ userId }: { userId: string }) => <span>{userId}</span>,
}));

const mockGetRiskDashboard = vi.fn();
vi.mock('@/lib/api', () => ({
	getRiskDashboard: () => mockGetRiskDashboard(),
}));

import RiskDashboardPage from '../risk-dashboard/page';

function mockLoaded(overrides: Record<string, any> = {}) {
	mockGetRiskDashboard.mockResolvedValue({
		tenantId: 't1',
		todayTotal: 42,
		scoreRanges: [
			{ range: 'critical', count: 3 },
			{ range: 'high', count: 5 },
			{ range: 'medium', count: 9 },
		],
		topEventTypes: [{ eventType: 'login_failed', count: 12 }],
		topRiskUsers: [{ userId: 'u1', maxScore: 73.3333, avgScore: 0.3488, count: 43 }],
		dayCounts: [{ date: '2026-10-04', count: 7 }],
		...overrides,
	});
}

describe('RiskDashboardPage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	// S-30（fix-security-w5）：分数保留小数——原 Math.round 致 0.3488→0「高分低均」误读
	it('S-30：分数保留小数（0.3488→0.35 / 73.3333→73.33）', async () => {
		mockLoaded();
		render(<RiskDashboardPage />);
		expect(await screen.findByText('0.35')).toBeInTheDocument();
		expect(screen.getByText('73.33')).toBeInTheDocument();
	});

	// S-33（fix-security-w5）：「信号维度」实为非空评分桶计数 → 改名「评分档位」；全部卡片标注时间窗
	it('S-33：卡片命名与时间窗标注', async () => {
		mockLoaded();
		render(<RiskDashboardPage />);
		expect(await screen.findByText('严重事件（今日）')).toBeInTheDocument();
		expect(screen.getByText('高风险事件（今日）')).toBeInTheDocument();
		expect(screen.getByText('评分档位（今日）')).toBeInTheDocument();
		expect(screen.getByText('评分分布（今日）')).toBeInTheDocument();
		expect(screen.getByText('高频事件类型（近 7 天）')).toBeInTheDocument();
	});

	// S-29（fix-security-w5）：BE 加 max_score ≥ 60 阈值后低分用户不再占榜；
	// 空榜明示阈值，不再静默空表
	it('S-29：榜空态明示阈值（≥60）', async () => {
		mockLoaded({ topRiskUsers: [] });
		render(<RiskDashboardPage />);
		expect(
			await screen.findByText('近 7 天无高风险用户（最高分 ≥ 60）'),
		).toBeInTheDocument();
	});
});
