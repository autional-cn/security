'use client';

import React from 'react';
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Card, Row, Col, Statistic, Descriptions, Table, Badge, Spin, Alert, Tag } from 'antd';
import {
	SafetyOutlined,
	MobileOutlined,
	DesktopOutlined,
	ClockCircleOutlined,
	WarningOutlined,
	LockOutlined,
} from '@ant-design/icons';
import { getSecurityUserProfile } from '@/lib/api';
import { useTranslation } from 'react-i18next';

const deviceColumns = (t: (k: string) => string) => [
	{
		title: t('usersProfile.deviceName'),
		dataIndex: 'deviceName',
		key: 'deviceName',
		ellipsis: true,
	},
	{
		title: t('usersProfile.deviceType'),
		dataIndex: 'deviceType',
		key: 'deviceType',
		ellipsis: true,
	},
	{
		title: t('usersProfile.trusted'),
		dataIndex: 'trusted',
		key: 'trusted',
		render: (v: boolean) =>
			v ? <Tag color="green">{t('common.yes')}</Tag> : <Tag color="default">{t('common.no')}</Tag>,
	},
	{
		title: t('usersProfile.lastActive'),
		dataIndex: 'lastActive',
		key: 'lastActive',
		render: (v: string) => v || '-',
	},
];

const sessionColumns = (t: (k: string) => string) => [
	{ title: t('usersProfile.sessionId'), dataIndex: 'sessionId', key: 'sessionId', ellipsis: true },
	{
		title: t('usersProfile.ip'),
		dataIndex: 'ip',
		key: 'ip',
		render: (v: string) => v || (v as unknown as Record<string, unknown>)?.address || '-',
		ellipsis: true,
	},
	{ title: t('usersProfile.device'), dataIndex: 'device', key: 'device', ellipsis: true },
	{ title: t('usersProfile.browser'), dataIndex: 'browser', key: 'browser', ellipsis: true },
	{
		title: t('usersProfile.lastActive'),
		dataIndex: 'lastActive',
		key: 'lastActive',
		render: (v: string) => v || '-',
	},
];

export default function UserSecurityProfilePage() {
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();

	const { data, isLoading, error, isError } = useQuery({
		queryKey: ['users', 'profile', id],
		queryFn: () => getSecurityUserProfile(id!),
		enabled: !!id,
	});

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<Spin size="large" tip={t('common.loading')} />
			</div>
		);
	}

	if (isError || !data) {
		return (
			<div className="p-4">
				<Alert
					type="error"
					message={t('usersProfile.fetchError')}
					description={(error as Error)?.message || t('usersProfile.unknownError')}
					showIcon
				/>
			</div>
		);
	}

	const profile = data as Record<string, any>;
	const securityStatus = profile.securityStatus || {};
	const devices = Array.isArray(profile.devices)
		? profile.devices
		: Array.isArray((profile.devices as any)?.items)
			? (profile.devices as any).items
			: [];
	const sessions = Array.isArray(profile.sessions)
		? profile.sessions
		: Array.isArray((profile.sessions as any)?.items)
			? (profile.sessions as any).items
			: [];
	const anomalyCount = typeof profile.anomalyCount === 'number' ? profile.anomalyCount : 0;
	const passwordPolicy = profile.passwordPolicy || {};
	const partialErrors = (profile.partialErrors as string[]) || [];

	const statusBadge = (status: string) => {
		switch (status) {
			case 'active':
				return <Badge status="success" text={t('usersProfile.statusActive')} />;
			case 'locked':
				return <Badge status="error" text={t('usersProfile.statusLocked')} />;
			case 'disabled':
				return <Badge status="default" text={t('usersProfile.statusDisabled')} />;
			case 'pending':
				return <Badge status="processing" text={t('usersProfile.statusPending')} />;
			default:
				return <Badge status="processing" text={status || t('usersProfile.statusUnknown')} />;
		}
	};

	return (
		<div>
			<div className="flex items-center justify-between mb-4">
				<h1 className="text-xl font-semibold">
					{t('usersProfile.title')}
					{id && <span className="text-sm text-gray-400 ml-2">ID: {id}</span>}
				</h1>
			</div>

			{partialErrors.length > 0 && (
				<Alert
					type="warning"
					message={t('usersProfile.partialErrors')}
					description={partialErrors.join('; ')}
					showIcon
					className="mb-4"
					closable
				/>
			)}

			<Row gutter={[16, 16]}>
				<Col xs={24} lg={12}>
					<Card
						title={
							<span>
								<SafetyOutlined className="mr-2" />
								{t('usersProfile.securityStatus')}
							</span>
						}
					>
						<div className="mb-4">
							<div className="text-sm text-gray-500 mb-2">{t('usersProfile.accountStatus')}</div>
							{statusBadge(securityStatus.status || securityStatus.account_status || 'unknown')}
						</div>
						<Descriptions column={1} size="small" bordered>
							<Descriptions.Item label={t('usersProfile.mfaEnabled')}>
								{securityStatus.mfaEnabled != null ? (
									securityStatus.mfaEnabled ? (
										<Tag color="green">{t('common.yes')}</Tag>
									) : (
										<Tag color="red">{t('common.no')}</Tag>
									)
								) : (
									'-'
								)}
							</Descriptions.Item>
							<Descriptions.Item label={t('usersProfile.lastLogin')}>
								{securityStatus.lastLogin || securityStatus.last_login || '-'}
							</Descriptions.Item>
							<Descriptions.Item label={t('usersProfile.lastFailedLogin')}>
								{securityStatus.lastFailedLogin || securityStatus.last_failed_login || '-'}
							</Descriptions.Item>
							<Descriptions.Item label={t('usersProfile.failedLoginCount')}>
								{securityStatus.failedLoginCount ?? securityStatus.failed_login_count ?? 0}
							</Descriptions.Item>
							<Descriptions.Item label={t('usersProfile.passwordChangedAt')}>
								{securityStatus.passwordChangedAt || securityStatus.password_changed_at || '-'}
							</Descriptions.Item>
							<Descriptions.Item label={t('usersProfile.loginCount')}>
								{securityStatus.loginCount ?? securityStatus.login_count ?? '-'}
							</Descriptions.Item>
						</Descriptions>
					</Card>
				</Col>

				<Col xs={24} lg={12}>
					<Card
						title={
							<span>
								<WarningOutlined className="mr-2" />
								{t('usersProfile.anomalyCount')}
							</span>
						}
					>
						<Statistic
							value={anomalyCount}
							suffix={<span className="text-sm">{t('usersProfile.anomalyCountSuffix')}</span>}
							valueStyle={{ color: anomalyCount > 0 ? 'var(--color-danger)' : 'var(--color-success)', fontSize: 32 }}
						/>
					</Card>
				</Col>
			</Row>

			<Row gutter={[16, 16]} className="mt-4">
				<Col xs={24} lg={12}>
					<Card
						title={
							<span>
								<MobileOutlined className="mr-2" />
								{t('usersProfile.devices')}
							</span>
						}
					>
						{devices.length > 0 ? (
							<Table
								dataSource={devices.map((d: any, i: number) => ({
									...d,
									key: d.deviceId || d.id || String(i),
								}))}
								columns={deviceColumns(t)}
								pagination={false}
								size="small"
								scroll={{ x: true }}
							/>
						) : (
							<div className="text-center text-gray-400 py-4">{t('usersProfile.noDevices')}</div>
						)}
					</Card>
				</Col>

				<Col xs={24} lg={12}>
					<Card
						title={
							<span>
								<ClockCircleOutlined className="mr-2" />
								{t('usersProfile.activeSessions')}
							</span>
						}
					>
						{sessions.length > 0 ? (
							<Table
								dataSource={sessions.map((s: any, i: number) => ({
									...s,
									key: s.sessionId || s.id || String(i),
								}))}
								columns={sessionColumns(t)}
								pagination={false}
								size="small"
								scroll={{ x: true }}
							/>
						) : (
							<div className="text-center text-gray-400 py-4">{t('usersProfile.noSessions')}</div>
						)}
					</Card>
				</Col>
			</Row>

			<Row gutter={[16, 16]} className="mt-4">
				<Col xs={24}>
					<Card
						title={
							<span>
								<LockOutlined className="mr-2" />
								{t('usersProfile.passwordPolicy')}
							</span>
						}
					>
						<Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="small" bordered>
							<Descriptions.Item label={t('usersProfile.minLength')}>
								{passwordPolicy.minLength ?? passwordPolicy.min_length ?? '-'}
							</Descriptions.Item>
							<Descriptions.Item label={t('usersProfile.requireUppercase')}>
								{passwordPolicy.requireUppercase != null ||
								passwordPolicy.require_uppercase != null ? (
									passwordPolicy.requireUppercase || passwordPolicy.require_uppercase ? (
										<Tag color="green">{t('common.yes')}</Tag>
									) : (
										<Tag color="default">{t('common.no')}</Tag>
									)
								) : (
									'-'
								)}
							</Descriptions.Item>
							<Descriptions.Item label={t('usersProfile.requireDigit')}>
								{passwordPolicy.requireDigit != null || passwordPolicy.require_digit != null ? (
									passwordPolicy.requireDigit || passwordPolicy.require_digit ? (
										<Tag color="green">{t('common.yes')}</Tag>
									) : (
										<Tag color="default">{t('common.no')}</Tag>
									)
								) : (
									'-'
								)}
							</Descriptions.Item>
							<Descriptions.Item label={t('usersProfile.requireSpecialChar')}>
								{passwordPolicy.requireSpecialChar != null ||
								passwordPolicy.require_special_char != null ? (
									passwordPolicy.requireSpecialChar || passwordPolicy.require_special_char ? (
										<Tag color="green">{t('common.yes')}</Tag>
									) : (
										<Tag color="default">{t('common.no')}</Tag>
									)
								) : (
									'-'
								)}
							</Descriptions.Item>
							<Descriptions.Item label={t('usersProfile.maxAgeDays')}>
								{passwordPolicy.maxAgeDays ?? passwordPolicy.max_age_days ?? '-'}
							</Descriptions.Item>
							<Descriptions.Item label={t('usersProfile.maxFailedAttempts')}>
								{passwordPolicy.maxFailedAttempts ?? passwordPolicy.max_failed_attempts ?? '-'}
							</Descriptions.Item>
							<Descriptions.Item label={t('usersProfile.lockoutDurationMin')}>
								{passwordPolicy.lockoutDurationMin ?? passwordPolicy.lockout_duration_min ?? '-'}
							</Descriptions.Item>
							<Descriptions.Item label={t('usersProfile.passwordHistoryCount')}>
								{passwordPolicy.passwordHistoryCount ??
									passwordPolicy.password_history_count ??
									'-'}
							</Descriptions.Item>
						</Descriptions>
					</Card>
				</Col>
			</Row>
		</div>
	);
}
