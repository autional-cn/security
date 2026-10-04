'use client';

import React from 'react';
import { DataTable } from '@autional-cn/ui/antd';
import { ConsolePageHeader } from '@autional-cn/ui';
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Card, Timeline, Tag, Spin, Alert } from 'antd';
import {
	SafetyOutlined,
	FileTextOutlined,
	WarningOutlined,
	LoginOutlined,
	LogoutOutlined,
	KeyOutlined,
	SecurityScanOutlined,
} from '@ant-design/icons';
import { getSecurityUserTimeline } from '@/lib/api';
import { formatTimelineTime, normalizeTimestamp } from '@/lib/format';
import { useTranslation } from 'react-i18next';

const EVENT_ICON_MAP: Record<string, React.ReactNode> = {
	login: <LoginOutlined />,
	logout: <LogoutOutlined />,
	password_change: <KeyOutlined />,
	mfa_enroll: <SafetyOutlined />,
	mfa_challenge: <SafetyOutlined />,
	security_scan: <SecurityScanOutlined />,
	audit_log: <FileTextOutlined />,
	anomaly: <WarningOutlined />,
};

const severityColor = (severity: string) => {
	switch (severity) {
		case 'critical':
			return 'red';
		case 'high':
			return 'orange';
		case 'medium':
			return 'gold';
		case 'low':
			return 'blue';
		default:
			return 'default';
	}
};

const anomalyColumns = (t: (k: string) => string) => [
	{
		title: t('usersTimeline.anomalyType'),
		dataIndex: 'type',
		key: 'type',
		render: (v: string) => v || '-',
		ellipsis: true,
	},
	{
		title: t('usersTimeline.severity'),
		dataIndex: 'severity',
		key: 'severity',
		render: (v: string) => <Tag color={severityColor(v)}>{v || '-'}</Tag>,
		width: 100,
	},
	{
		title: t('usersTimeline.detectedAt'),
		dataIndex: 'detectedAt',
		key: 'detectedAt',
		render: (v: number) => (v ? normalizeTimestamp(v).toLocaleString() : '-'),
		width: 180,
	},
];

export default function UserSecurityTimelinePage() {
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();

	const { data, isLoading, error, isError } = useQuery({
		queryKey: ['users', 'timeline', id],
		queryFn: () => getSecurityUserTimeline(id!),
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
					message={t('usersTimeline.fetchError')}
					description={(error as Error)?.message || t('usersTimeline.unknownError')}
					showIcon
				/>
			</div>
		);
	}

	const timeline = data as Record<string, any>;
	const events: any[] = Array.isArray(timeline.events)
		? timeline.events
		: Array.isArray((timeline.events as any)?.items)
			? (timeline.events as any).items
			: [];
	const anomalies: any[] = Array.isArray(timeline.anomalies)
		? timeline.anomalies
		: Array.isArray((timeline.anomalies as any)?.items)
			? (timeline.anomalies as any).items
			: [];

	const getEventIcon = (action: string) => EVENT_ICON_MAP[action] || <FileTextOutlined />;
	const getEventColor = (action: string) => {
		if (action?.includes('anomaly')) return 'red';
		if (action?.includes('failed')) return 'red';
		if (action?.includes('password')) return 'orange';
		if (action?.includes('mfa')) return 'blue';
		if (action?.includes('login')) return 'green';
		return 'gray';
	};

	return (
		<div>
			<ConsolePageHeader
				title={<>{t('usersTimeline.title')} {id && <span className="text-sm text-neutral-600 ml-2">ID: {id}</span>}</>}
			/>

			<Card
				title={
					<span>
						<SafetyOutlined className="mr-2" />
						{t('usersTimeline.eventTimeline')}
					</span>
				}
				className="mb-4"
			>
				{events.length > 0 ? (
					<Timeline
						mode="left"
						items={events.map((evt: any, i: number) => {
							const action = evt.action || evt.type || evt.event || '';
							const message = evt.message || evt.description || evt.detail || '';
							const time = evt.timestamp || evt.createdAt || evt.time || '';
							return {
								key: evt.id || String(i),
								color: getEventColor(action),
								dot: getEventIcon(action),
								label: <span className="text-xs text-neutral-600">{formatTimelineTime(time)}</span>,
								children: (
									<div>
										<div className="text-sm font-medium capitalize">
											{action.replace(/_/g, ' ')}
										</div>
										{message && <div className="text-xs text-neutral-600">{message}</div>}
									</div>
								),
							};
						})}
					/>
				) : (
					<div className="text-center text-neutral-600 py-8">{t('usersTimeline.noEvents')}</div>
				)}
			</Card>

			<Card
				title={
					<span>
						<WarningOutlined className="mr-2" />
						{t('usersTimeline.anomalies')}
					</span>
				}
			>
				{anomalies.length > 0 ? (
					<DataTable
						dataSource={anomalies.map((a: any, i: number) => ({ ...a, key: a.id || String(i) }))}
						columns={anomalyColumns(t)}
						pagination={false}
						size="small"
						scroll={{ x: true }}
					/>
				) : (
					<div className="text-center text-neutral-600 py-4">{t('usersTimeline.noAnomalies')}</div>
				)}
			</Card>
		</div>
	);
}
