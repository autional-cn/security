import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string, fallback?: string) => fallback ?? key,
		i18n: { language: 'en', changeLanguage: vi.fn() },
	}),
}));

const mockUseAuditStats = vi.fn();
const mockUseAnomalies = vi.fn();
const mockUseAlerts = vi.fn();

vi.mock('@/hooks/use-security-queries', () => ({
	useAuditStats: (...args: any[]) => mockUseAuditStats(...args),
	useAnomalies: (...args: any[]) => mockUseAnomalies(...args),
	useAlerts: (...args: any[]) => mockUseAlerts(...args),
}));

import SocKpiPage from '../soc-kpi/page';

// 夹具键名必须与共享 client 解包后的 camelCase 契约一致（S-52）——
// 若再退回 snake_case，页面读值将回落 '-'，下方数值断言即失败。
function mockKpiLoaded(statsOverrides: Record<string, any> = {}) {
	mockUseAuditStats.mockReturnValue({
		data: {
			totalLogs: 5000,
			todayEntries: 216,
			activeTenants: 315,
			avgResponseMs: 45,
			...statsOverrides,
		},
		isLoading: false,
	});
	mockUseAnomalies.mockReturnValue({
		data: { total: 10 },
		isLoading: false,
	});
	mockUseAlerts.mockReturnValue({
		data: { total: 5 },
		isLoading: false,
	});
}

function mockKpiLoading() {
	mockUseAuditStats.mockReturnValue({ data: null, isLoading: true });
	mockUseAnomalies.mockReturnValue({ data: null, isLoading: false });
	mockUseAlerts.mockReturnValue({ data: null, isLoading: false });
}

describe('SocKpiPage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders SOC KPIs heading', () => {
		mockKpiLoaded();
		render(<SocKpiPage />);
		expect(screen.getByText('SOC KPIs')).toBeInTheDocument();
	});

	it('shows KPI cards', () => {
		mockKpiLoaded();
		render(<SocKpiPage />);
		expect(screen.getByText('Total Logs')).toBeInTheDocument();
		expect(screen.getByText('Total Anomalies')).toBeInTheDocument();
		expect(screen.getByText('Total Alerts')).toBeInTheDocument();
		expect(screen.getByText('MTTD (est.)')).toBeInTheDocument();
	});

	it('renders Today Entries / Active Tenants values from camelCase fields (S-52)', () => {
		mockKpiLoaded();
		render(<SocKpiPage />);
		expect(screen.getByText('Today Entries')).toBeInTheDocument();
		expect(screen.getByText('216')).toBeInTheDocument();
		expect(screen.getByText('Active Tenants')).toBeInTheDocument();
		expect(screen.getByText('315')).toBeInTheDocument();
	});

	it('shows loading spinner when data is loading', () => {
		mockKpiLoading();
		render(<SocKpiPage />);
		expect(document.querySelector('.ant-spin')).toBeTruthy();
	});
});
