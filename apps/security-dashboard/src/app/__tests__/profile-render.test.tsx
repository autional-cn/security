import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

const dict: Record<string, string> = {
	'common.yes': '是',
	'common.no': '否',
	'usersProfile.statusActive': '正常',
	'usersProfile.statusLocked': '锁定',
	'usersProfile.statusDisabled': '禁用',
	'usersProfile.statusUnknown': '未知',
};

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string, fallback?: string) => dict[key] ?? fallback ?? key,
		i18n: { language: 'zh-CN', changeLanguage: vi.fn() },
	}),
}));

vi.mock('react-router', () => ({
	useParams: () => ({ id: 'user-test-1' }),
}));

const { profileRef } = vi.hoisted(() => ({ profileRef: { current: null as any } }));

vi.mock('@tanstack/react-query', () => ({
	useQuery: () => ({ data: profileRef.current, isLoading: false, error: null, isError: false }),
}));

import UserSecurityProfilePage from '../users/profile/page';

function profileFixture() {
	return {
		userId: 'user-test-1',
		securityStatus: {
			isLocked: false,
			canLogin: true,
			maxAttempts: 5,
			loginFailCount: 3,
			lockoutDurationMinutes: 30,
			mfaEnabled: true,
			emailVerified: true,
			phoneVerified: true,
		},
		passwordPolicy: {
			requireUpper: true,
			requireSpecial: true,
			expiryDays: 90,
			historyCount: 7,
		},
		devices: [],
		sessions: [],
		anomalyCount: 999,
		partialErrors: [],
	};
}

describe('UserSecurityProfilePage 契约回归（S-69）', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		profileRef.current = profileFixture();
	});

	it('渲染 security_status camelCase 真值：失败次数/最大尝试/锁定时长', () => {
		render(<UserSecurityProfilePage />);
		expect(screen.getByText('3')).toBeInTheDocument();
		expect(screen.getByText('5')).toBeInTheDocument();
		expect(screen.getByText('30')).toBeInTheDocument();
	});

	it('渲染 password_policy camelCase 真值：过期天数/历史条数', () => {
		render(<UserSecurityProfilePage />);
		expect(screen.getByText('90')).toBeInTheDocument();
		expect(screen.getByText('7')).toBeInTheDocument();
	});

	it('账户状态由 isLocked/canLogin 推导，不再渲染原文 unknown', () => {
		render(<UserSecurityProfilePage />);
		expect(screen.getByText('正常')).toBeInTheDocument();
		expect(screen.queryByText('unknown')).toBeNull();
	});

	it('requireUpper/requireSpecial 真值渲染为「是」', () => {
		render(<UserSecurityProfilePage />);
		expect(screen.getAllByText('是').length).toBeGreaterThanOrEqual(3);
	});
});
