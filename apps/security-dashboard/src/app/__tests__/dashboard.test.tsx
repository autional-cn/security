import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

vi.mock('recharts', () => ({
	LineChart: () => <div data-testid="line-chart" />,
	Line: () => null,
	XAxis: () => null,
	YAxis: () => null,
	CartesianGrid: () => null,
	Tooltip: () => null,
	ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
	PieChart: () => <div data-testid="pie-chart" />,
	Pie: () => null,
	Cell: () => null,
	BarChart: () => <div data-testid="bar-chart" />,
	Bar: () => null,
	Legend: () => null,
}));

vi.mock('@/hooks/use-overview', () => ({
	useAuditStats: vi.fn(),
	useAnomaliesPreview: vi.fn(),
	useComplianceStatus: vi.fn(),
	useVerificationResults: vi.fn(),
	useActiveSessionCount: vi.fn(),
	useGatewayStatus: vi.fn(),
}));

vi.mock('@autional-cn/shared', () => ({
	useAuthStore: vi.fn(() => ({
		user: { tenant_id: 'test-tenant' },
		currentTenantId: 'test-tenant',
		isAuthenticated: true,
		tenants: [{ id: 'test-tenant', role: 'security_admin' }],
	})),
	usePermission: vi.fn(() => ({
		can: vi.fn(() => true),
		canAny: vi.fn(() => true),
		canAll: vi.fn(() => true),
		isSuperAdmin: false,
		isTenantAdmin: false,
		isAuditor: false,
		isDeveloper: false,
		isEndUser: false,
	})),
	AuthService: {
		getAccessToken: vi.fn(() => 'mock-token'),
		getPermissions: vi.fn(() => []),
		subscribe: vi.fn(() => vi.fn()),
	},
	useCurrentRole: () => 'security_admin',
}));

import * as useOverview from '@/hooks/use-overview';
import OverviewPage from '../page';

function mockAllLoading() {
	const hooks = [
		'useAuditStats',
		'useAnomaliesPreview',
		'useComplianceStatus',
		'useVerificationResults',
		'useActiveSessionCount',
		'useGatewayStatus',
	] as const;
	for (const h of hooks) {
		vi.mocked(useOverview[h]).mockReturnValue({ data: null, isLoading: true } as any);
	}
}

function mockAllLoaded() {
	vi.mocked(useOverview.useAuditStats).mockReturnValue({
		data: {
			totalLogs: 5000,
			trend: [{ timestamp: Date.now(), count: 100 }],
			byModule: { identity: 2000, session: 1500 },
		},
		isLoading: false,
	} as any);
	vi.mocked(useOverview.useAnomaliesPreview).mockReturnValue({
		data: { items: [], total: 0 },
		isLoading: false,
	} as any);
	vi.mocked(useOverview.useComplianceStatus).mockReturnValue({
		data: { complianceScore: 85, checks: [] },
		isLoading: false,
	} as any);
	vi.mocked(useOverview.useVerificationResults).mockReturnValue({
		data: { items: [] },
		isLoading: false,
	} as any);
	vi.mocked(useOverview.useActiveSessionCount).mockReturnValue({
		data: { count: 42 },
		isLoading: false,
	} as any);
	vi.mocked(useOverview.useGatewayStatus).mockReturnValue({
		data: { services: [] },
		isLoading: false,
	} as any);
}

describe('DashboardPage (overview)', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders dashboard heading', () => {
		mockAllLoaded();
		render(<OverviewPage />);
		expect(screen.getByText('安全运营总览')).toBeInTheDocument();
	});

	it('renders dashboard KPIs when data loaded', () => {
		mockAllLoaded();
		render(<OverviewPage />);
		expect(screen.getByText('审计日志总数')).toBeInTheDocument();
		expect(screen.getByText('待处理异常')).toBeInTheDocument();
		expect(screen.getByText('活跃会话')).toBeInTheDocument();
		expect(screen.getByText('合规评分')).toBeInTheDocument();
	});

	it('shows loading state', () => {
		mockAllLoading();
		render(<OverviewPage />);
		expect(document.querySelector('.ant-spin')).toBeTruthy();
	});

	it('renders service health grid', () => {
		mockAllLoaded();
		vi.mocked(useOverview.useGatewayStatus).mockReturnValue({
			data: {
				services: [
					{ name: 'identity-service', status: 'healthy', latency: '12ms' },
					{ name: 'session-service', status: 'degraded', latency: '230ms' },
				],
			},
			isLoading: false,
		} as any);
		render(<OverviewPage />);
		expect(screen.getByText('服务健康状态')).toBeInTheDocument();
	});

	it('handles missing gateway data', () => {
		mockAllLoaded();
		vi.mocked(useOverview.useGatewayStatus).mockReturnValue({
			data: { services: [] },
			isLoading: false,
		} as any);
		render(<OverviewPage />);
		expect(screen.getByText('无法获取服务状态')).toBeInTheDocument();
	});
});
