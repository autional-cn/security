import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string, fallback?: string) => fallback ?? key,
		i18n: { language: 'en', changeLanguage: vi.fn() },
	}),
}));

vi.mock('@/components/nhi/NhiDetailDrawer', () => ({
	default: () => null,
}));

vi.mock('@autional-cn/shared', () => ({
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
	extractList: (data: any) => data?.items ?? data ?? [],
	extractItem: (data: any) => data,
}));

const mockUseAgents = vi.fn();
const mockUseRobots = vi.fn();
const mockUseIots = vi.fn();

vi.mock('@/hooks/useSecurityQueries', () => ({
	useAgents: (...args: any[]) => mockUseAgents(...args),
	useRobots: (...args: any[]) => mockUseRobots(...args),
	useIots: (...args: any[]) => mockUseIots(...args),
	useDeleteAgent: () => ({ mutate: vi.fn(), isPending: false }),
	useCommissionRobot: () => ({ mutate: vi.fn(), isPending: false }),
	useDecommissionRobot: () => ({ mutate: vi.fn(), isPending: false }),
	useDeleteRobot: () => ({ mutate: vi.fn(), isPending: false }),
	useDeleteDevice: () => ({ mutate: vi.fn(), isPending: false }),
	useAgentById: () => ({ data: null, isLoading: false }),
	useRobotById: () => ({ data: null, isLoading: false }),
	useDeviceById: () => ({ data: null, isLoading: false }),
}));

import NhiPage from '../nhi/page';

function mockLoaded(agents: any[] = [], robots: any[] = [], iots: any[] = []) {
	mockUseAgents.mockReturnValue({
		data: { items: agents, total: agents.length },
		isLoading: false,
	});
	mockUseRobots.mockReturnValue({
		data: { items: robots, total: robots.length },
		isLoading: false,
	});
	mockUseIots.mockReturnValue({
		data: { items: iots, total: iots.length },
		isLoading: false,
	});
}

describe('NhiPage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders NHI heading', () => {
		mockLoaded();
		render(<NhiPage />);
		expect(screen.getByText('NHI Monitoring')).toBeInTheDocument();
	});

	it('shows tab labels with counts', () => {
		mockLoaded(
			[
				{ id: 'a1', name: 'Agent1', status: 'active' },
				{ id: 'a2', name: 'Agent2', status: 'provisioning' },
			],
			[{ id: 'r1', name: 'Robot1', status: 'active' }],
			[
				{ id: 'd1', name: 'Device1', status: 'active' },
				{ id: 'd2', name: 'Device2', status: 'unpaired' },
				{ id: 'd3', name: 'Device3', status: 'transferring' },
			],
		);
		render(<NhiPage />);
		expect(screen.getByText('Agents (2)')).toBeInTheDocument();
		expect(screen.getByText('Robots (1)')).toBeInTheDocument();
		expect(screen.getByText('IoT Devices (3)')).toBeInTheDocument();
	});

	it('shows statistics cards', () => {
		mockLoaded(
			[
				{ id: 'a1', name: 'Agent1', status: 'active' },
				{ id: 'a2', name: 'Agent2', status: 'revoked' },
			],
			[{ id: 'r1', name: 'Robot1', status: 'active' }],
			[],
		);
		render(<NhiPage />);
		expect(screen.getByText('Total Agents')).toBeInTheDocument();
		expect(screen.getByText('Active Agents')).toBeInTheDocument();
		expect(screen.getByText('Total Robots')).toBeInTheDocument();
		expect(screen.getByText('Total Devices')).toBeInTheDocument();
		const statValues = document.querySelectorAll('.ant-statistic-content-value');
		expect(statValues.length).toBeGreaterThanOrEqual(4);
	});

	it('shows empty state when no data', () => {
		mockLoaded([], [], []);
		render(<NhiPage />);
		expect(screen.getByText('NHI Monitoring')).toBeInTheDocument();
		expect(screen.getByText('Agents (0)')).toBeInTheDocument();
		expect(screen.getByText('Robots (0)')).toBeInTheDocument();
		expect(screen.getByText('IoT Devices (0)')).toBeInTheDocument();
	});
});
