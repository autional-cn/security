'use client';

import React from 'react';
import { Drawer, Tabs, Spin, Descriptions, Tag, Empty, Alert } from 'antd';
import { SafetyOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAgentById, useRobotById, useDeviceById } from '@/hooks/useSecurityQueries';

interface NhiDetailDrawerProps {
	entityType: 'agent' | 'robot' | 'device';
	entityId: string | null;
	visible: boolean;
	onClose: () => void;
}

const STATUS_COLORS: Record<string, string> = {
	active: 'green',
	provisioning: 'blue',
	rotating: 'orange',
	revoked: 'red',
	commissioning: 'blue',
	degraded: 'orange',
	decommissioned: 'red',
	unpaired: 'default',
	transferring: 'purple',
};

export default function NhiDetailDrawer({
	entityType,
	entityId,
	visible,
	onClose,
}: NhiDetailDrawerProps) {
	const { t } = useTranslation();

	const agentId = entityType === 'agent' && visible ? entityId : null;
	const robotId = entityType === 'robot' && visible ? entityId : null;
	const deviceId = entityType === 'device' && visible ? entityId : null;

	const { data: agentData, isLoading: agentLoading, isError: agentError } = useAgentById(agentId);
	const { data: robotData, isLoading: robotLoading, isError: robotError } = useRobotById(robotId);
	const {
		data: deviceData,
		isLoading: deviceLoading,
		isError: deviceError,
	} = useDeviceById(deviceId);

	const detail: any =
		entityType === 'agent'
			? (agentData as any)?.data || agentData
			: entityType === 'robot'
				? (robotData as any)?.data || robotData
				: (deviceData as any)?.data || deviceData;

	const loading =
		entityType === 'agent' ? agentLoading : entityType === 'robot' ? robotLoading : deviceLoading;

	const hasError =
		entityType === 'agent' ? agentError : entityType === 'robot' ? robotError : deviceError;

	const titleLabel =
		entityType === 'agent'
			? t('nhi.agents', 'Agent')
			: entityType === 'robot'
				? t('nhi.robots', 'Robot')
				: t('nhi.devices', 'IoT Device');

	const statusLabel = (s: string) => t(`nhi.status${s.charAt(0).toUpperCase()}${s.slice(1)}`, s);

	const renderAgentOverview = () => (
		<Descriptions bordered column={1} size="small">
			<Descriptions.Item label={t('nhi.name', 'Name')}>{detail.name || '-'}</Descriptions.Item>
			<Descriptions.Item label={t('nhi.identityId', 'Identity ID')}>
				{detail.identity_id || detail.identityId || '-'}
			</Descriptions.Item>
			<Descriptions.Item label={t('nhi.status', 'Status')}>
				<Tag color={STATUS_COLORS[detail.status] || 'default'}>
					{statusLabel(detail.status) || detail.status || '-'}
				</Tag>
			</Descriptions.Item>
			<Descriptions.Item label={t('nhi.workloadSubtype', 'Workload Subtype')}>
				{detail.workload_subtype || detail.workloadSubtype || '-'}
			</Descriptions.Item>
			<Descriptions.Item label={t('nhi.ownerId', 'Owner ID')}>
				{detail.owner_id || detail.ownerId || '-'}
			</Descriptions.Item>
			<Descriptions.Item label={t('nhi.callbackUrl', 'Callback URL')}>
				{detail.callback_url || detail.callbackUrl || '-'}
			</Descriptions.Item>
			<Descriptions.Item label={t('nhi.rotationDays', 'Rotation Days')}>
				{detail.rotation_days ?? detail.rotationDays ?? '-'}
			</Descriptions.Item>
			<Descriptions.Item label={t('nhi.jitTtl', 'JIT TTL')}>
				{detail.jit_ttl || detail.jitTtl || '-'}
			</Descriptions.Item>
			<Descriptions.Item label={t('nhi.lastRotatedAt', 'Last Rotated At')}>
				{detail.last_rotated_at || detail.lastRotatedAt || '-'}
			</Descriptions.Item>
			<Descriptions.Item label={t('nhi.description', 'Description')}>
				{detail.description || '-'}
			</Descriptions.Item>
		</Descriptions>
	);

	const renderRobotOverview = () => (
		<Descriptions bordered column={1} size="small">
			<Descriptions.Item label={t('nhi.name', 'Name')}>{detail.name || '-'}</Descriptions.Item>
			<Descriptions.Item label={t('nhi.identityId', 'Identity ID')}>
				{detail.identity_id || detail.identityId || '-'}
			</Descriptions.Item>
			<Descriptions.Item label={t('nhi.status', 'Status')}>
				<Tag color={STATUS_COLORS[detail.status] || 'default'}>
					{statusLabel(detail.status) || detail.status || '-'}
				</Tag>
			</Descriptions.Item>
			<Descriptions.Item label={t('nhi.workloadSubtype', 'Workload Subtype')}>
				{detail.workload_subtype || detail.workloadSubtype || '-'}
			</Descriptions.Item>
			<Descriptions.Item label={t('nhi.model', 'Model')}>{detail.model || '-'}</Descriptions.Item>
			<Descriptions.Item label={t('nhi.firmwareVer', 'Firmware Version')}>
				{detail.firmware_ver || detail.firmwareVer || '-'}
			</Descriptions.Item>
			<Descriptions.Item label={t('nhi.location', 'Location')}>
				{detail.location || '-'}
			</Descriptions.Item>
			<Descriptions.Item label={t('nhi.safetyPolicy', 'Safety Policy')}>
				{detail.safety_policy || detail.safetyPolicy || '-'}
			</Descriptions.Item>
			<Descriptions.Item label={t('nhi.lastHealthAt', 'Last Health At')}>
				{detail.last_health_at || detail.lastHealthAt || '-'}
			</Descriptions.Item>
			<Descriptions.Item label={t('nhi.description', 'Description')}>
				{detail.description || '-'}
			</Descriptions.Item>
		</Descriptions>
	);

	const renderDeviceOverview = () => (
		<Descriptions bordered column={1} size="small">
			<Descriptions.Item label={t('nhi.name', 'Name')}>{detail.name || '-'}</Descriptions.Item>
			<Descriptions.Item label={t('nhi.identityId', 'Identity ID')}>
				{detail.identity_id || detail.identityId || '-'}
			</Descriptions.Item>
			<Descriptions.Item label={t('nhi.status', 'Status')}>
				<Tag color={STATUS_COLORS[detail.status] || 'default'}>
					{statusLabel(detail.status) || detail.status || '-'}
				</Tag>
			</Descriptions.Item>
			<Descriptions.Item label={t('nhi.workloadSubtype', 'Workload Subtype')}>
				{detail.workload_subtype || detail.workloadSubtype || '-'}
			</Descriptions.Item>
			<Descriptions.Item label={t('nhi.hardwareId', 'Hardware ID')}>
				{detail.hardware_id || detail.hardwareId || '-'}
			</Descriptions.Item>
			<Descriptions.Item label={t('nhi.manufacturer', 'Manufacturer')}>
				{detail.manufacturer || '-'}
			</Descriptions.Item>
			<Descriptions.Item label={t('nhi.firmwareVer', 'Firmware Version')}>
				{detail.firmware_ver || detail.firmwareVer || '-'}
			</Descriptions.Item>
			<Descriptions.Item label={t('nhi.pairingCode', 'Pairing Code')}>
				{detail.pairing_code || detail.pairingCode || '-'}
			</Descriptions.Item>
			<Descriptions.Item label={t('nhi.description', 'Description')}>
				{detail.description || '-'}
			</Descriptions.Item>
		</Descriptions>
	);

	const renderOverview = () => {
		if (!detail) return <Empty description={t('nhi.noDetailData', 'No detail data')} />;

		if (entityType === 'agent') return renderAgentOverview();
		if (entityType === 'robot') return renderRobotOverview();
		return renderDeviceOverview();
	};

	const tabItems = [
		{
			key: 'overview',
			label: (
				<span>
					<SafetyOutlined /> {t('nhi.overviewTab', 'Overview')}
				</span>
			),
			children: renderOverview(),
		},
	];

	return (
		<Drawer
			title={`${t('nhi.detailTitle', 'NHI Detail')} — ${titleLabel}`}
			width={520}
			open={visible}
			onClose={onClose}
			destroyOnClose
		>
			{hasError && (
				<Alert
					message={t('nhi.fetchDetailFailed', 'Failed to fetch detail')}
					type="error"
					showIcon
					style={{ marginBottom: 16 }}
				/>
			)}
			<Spin spinning={loading}>
				<Tabs items={tabItems} />
			</Spin>
		</Drawer>
	);
}
