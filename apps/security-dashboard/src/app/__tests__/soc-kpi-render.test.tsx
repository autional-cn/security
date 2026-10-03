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

function mockKpiLoaded(statsOverrides: Record<string, any> = {}) {
	mockUseAuditStats.mockReturnValue({
		data: {
			total_logs: 5000,
			today: 120,
			active_tenants: 15,
			avg_response_ms: 45,
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

	it('shows loading spinner when data is loading', () => {
		mockKpiLoading();
		render(<SocKpiPage />);
		expect(document.querySelector('.ant-spin')).toBeTruthy();
	});
});
