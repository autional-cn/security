'use client';

import React, { useState } from 'react';
import { DataTable } from '@autional-cn/ui/antd';
import { Card, Row, Col, Statistic, Tag, Tabs, Button, Popconfirm, message } from 'antd';
import {
	RobotOutlined,
	WifiOutlined,
	ApiOutlined,
	CheckCircleOutlined,
	CloseCircleOutlined,
	SyncOutlined,
	MinusCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
	useAgents,
	useRobots,
	useIots,
	useDeleteAgent,
	useCommissionRobot,
	useDecommissionRobot,
	useDeleteRobot,
	useDeleteDevice,
} from '@/hooks/use-security-queries';
import NhiDetailDrawer from '@/components/nhi/NhiDetailDrawer';
import { Can } from '@/components/Can';
import { extractList } from '@autional-cn/shared';
import { ConsolePageHeader } from '@autional-cn/ui';

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

const STATUS_ICONS: Record<string, React.ReactNode> = {
	active: <CheckCircleOutlined />,
	provisioning: <SyncOutlined spin />,
	rotating: <SyncOutlined spin />,
	revoked: <CloseCircleOutlined />,
	commissioning: <SyncOutlined spin />,
	degraded: <MinusCircleOutlined />,
	decommissioned: <CloseCircleOutlined />,
	unpaired: <MinusCircleOutlined />,
	transferring: <SyncOutlined spin />,
};

function AgentTable({ onViewDetail }: { onViewDetail: (record: any) => void }) {
	const { t } = useTranslation();
	const { data, isLoading } = useAgents({ page_size: 100 });
	const deleteAgent = useDeleteAgent();
	const items = extractList(data) || [];

	const columns = [
		{ title: t('nhi.name', 'Name'), dataIndex: 'name', key: 'name', ellipsis: true },
		{
			title: t('nhi.status', 'Status'),
			dataIndex: 'status',
			key: 'status',
			render: (s: string) => (
				<Tag icon={STATUS_ICONS[s]} color={STATUS_COLORS[s] || 'default'}>
					{s || '-'}
				</Tag>
			),
		},
		{
			title: t('nhi.type', 'Type'),
			dataIndex: 'workloadSubtype',
			key: 'workloadSubtype',
			ellipsis: true,
		},
		{
			title: t('nhi.created', 'Created'),
			dataIndex: 'createdAt',
			key: 'createdAt',
			ellipsis: true,
		},
		{
			title: t('nhi.actions', 'Actions'),
			key: 'actions',
			width: 180,
			render: (_: unknown, record: any) => (
				<div style={{ display: 'flex', gap: 8 }}>
					{record.status === 'active' && (
						<Popconfirm
							title={t('nhi.revokeConfirm', 'Revoke this agent?')}
							onConfirm={() =>
								deleteAgent.mutate(record.id, {
									onSuccess: () => message.success(t('nhi.revokeSuccess', 'Agent revoked')),
									onError: () => message.error(t('nhi.revokeError', 'Failed to revoke agent')),
								})
							}
						>
							<Button size="small" danger loading={deleteAgent.isPending}>
								{t('nhi.revoke', 'Revoke')}
							</Button>
						</Popconfirm>
					)}
					<Button size="small" onClick={() => onViewDetail(record)}>
						{t('common.view', 'View')}
					</Button>
				</div>
			),
		},
	];

	return (
		<DataTable
			rowKey="id"
			columns={columns}
			dataSource={items}
			loading={isLoading}
			pagination={{ pageSize: 20 }}
			size="small"
			locale={{ emptyText: t('nhi.noAgents', 'No agents found') }}
		/>
	);
}

function RobotTable({ onViewDetail }: { onViewDetail: (record: any) => void }) {
	const { t } = useTranslation();
	const { data, isLoading } = useRobots({ page_size: 100 });
	const commission = useCommissionRobot();
	const decommission = useDecommissionRobot();
	const deleteRobot = useDeleteRobot();
	const items = extractList(data) || [];

	const columns = [
		{ title: t('nhi.name', 'Name'), dataIndex: 'name', key: 'name', ellipsis: true },
		{
			title: t('nhi.status', 'Status'),
			dataIndex: 'status',
			key: 'status',
			render: (s: string) => (
				<Tag icon={STATUS_ICONS[s]} color={STATUS_COLORS[s] || 'default'}>
					{s || '-'}
				</Tag>
			),
		},
		{
			title: t('nhi.type', 'Type'),
			dataIndex: 'workloadSubtype',
			key: 'workloadSubtype',
			ellipsis: true,
		},
		{
			title: t('nhi.created', 'Created'),
			dataIndex: 'createdAt',
			key: 'createdAt',
			ellipsis: true,
		},
		{
			title: t('nhi.actions', 'Actions'),
			key: 'actions',
			width: 240,
			render: (_: unknown, record: any) => (
				<div style={{ display: 'flex', gap: 8 }}>
					{record.status === 'commissioning' && (
						<Popconfirm
							title={t('nhi.commissionConfirm', 'Commission this robot?')}
							onConfirm={() =>
								commission.mutate(record.id, {
									onSuccess: () =>
										message.success(t('nhi.commissionSuccess', 'Robot commissioned')),
									onError: () =>
										message.error(t('nhi.commissionError', 'Failed to commission robot')),
								})
							}
						>
							<Button size="small" type="primary" loading={commission.isPending}>
								{t('nhi.commission', 'Commission')}
							</Button>
						</Popconfirm>
					)}
					{record.status === 'active' && (
						<Popconfirm
							title={t('nhi.decommissionConfirm', 'Decommission this robot?')}
							onConfirm={() =>
								decommission.mutate(record.id, {
									onSuccess: () =>
										message.success(t('nhi.decommissionSuccess', 'Robot decommissioned')),
									onError: () =>
										message.error(t('nhi.decommissionError', 'Failed to decommission robot')),
								})
							}
						>
							<Button size="small" loading={decommission.isPending}>
								{t('nhi.decommission', 'Decommission')}
							</Button>
						</Popconfirm>
					)}
					<Popconfirm
						title={t('nhi.deleteConfirm', 'Delete this robot?')}
						onConfirm={() =>
							deleteRobot.mutate(record.id, {
								onSuccess: () => message.success(t('nhi.deleteSuccess', 'Robot deleted')),
								onError: () => message.error(t('nhi.deleteError', 'Failed to delete robot')),
							})
						}
					>
						<Button size="small" danger loading={deleteRobot.isPending}>
							{t('nhi.delete', 'Delete')}
						</Button>
					</Popconfirm>
					<Button size="small" onClick={() => onViewDetail(record)}>
						{t('common.view', 'View')}
					</Button>
				</div>
			),
		},
	];

	return (
		<DataTable
			rowKey="id"
			columns={columns}
			dataSource={items}
			loading={isLoading}
			pagination={{ pageSize: 20 }}
			size="small"
			locale={{ emptyText: t('nhi.noRobots', 'No robots found') }}
		/>
	);
}

function IotTable({ onViewDetail }: { onViewDetail: (record: any) => void }) {
	const { t } = useTranslation();
	const { data, isLoading } = useIots({ page_size: 100 });
	const deleteDevice = useDeleteDevice();
	const items = extractList(data) || [];

	const columns = [
		{ title: t('nhi.name', 'Name'), dataIndex: 'name', key: 'name', ellipsis: true },
		{
			title: t('nhi.status', 'Status'),
			dataIndex: 'status',
			key: 'status',
			render: (s: string) => (
				<Tag icon={STATUS_ICONS[s]} color={STATUS_COLORS[s] || 'default'}>
					{s || '-'}
				</Tag>
			),
		},
		{
			title: t('nhi.type', 'Type'),
			dataIndex: 'workloadSubtype',
			key: 'workloadSubtype',
			ellipsis: true,
		},
		{
			title: t('nhi.created', 'Created'),
			dataIndex: 'createdAt',
			key: 'createdAt',
			ellipsis: true,
		},
		{
			title: t('nhi.actions', 'Actions'),
			key: 'actions',
			width: 180,
			render: (_: unknown, record: any) => (
				<div style={{ display: 'flex', gap: 8 }}>
					{record.status === 'active' && (
						<Popconfirm
							title={t('nhi.deleteConfirm', 'Delete this device?')}
							onConfirm={() =>
								deleteDevice.mutate(record.id, {
									onSuccess: () => message.success(t('nhi.deleteSuccess', 'Device deleted')),
									onError: () => message.error(t('nhi.deleteError', 'Failed to delete device')),
								})
							}
						>
							<Button size="small" danger loading={deleteDevice.isPending}>
								{t('nhi.delete', 'Delete')}
							</Button>
						</Popconfirm>
					)}
					<Button size="small" onClick={() => onViewDetail(record)}>
						{t('common.view', 'View')}
					</Button>
				</div>
			),
		},
	];

	return (
		<DataTable
			rowKey="id"
			columns={columns}
			dataSource={items}
			loading={isLoading}
			pagination={{ pageSize: 20 }}
			size="small"
			locale={{ emptyText: t('nhi.noDevices', 'No devices found') }}
		/>
	);
}

export default function NhiPage() {
	const { t } = useTranslation();
	const [activeTab, setActiveTab] = useState<string>('agents');
	const [selectedEntity, setSelectedEntity] = useState<{
		type: 'agent' | 'robot' | 'device';
		id: string;
	} | null>(null);

	const { data: agentsData } = useAgents({ page_size: 100 });
	const { data: robotsData } = useRobots({ page_size: 100 });
	const { data: iotsData } = useIots({ page_size: 100 });

	const agentCount = ((agentsData as any)?.total || 0) as number;
	const robotCount = ((robotsData as any)?.total || 0) as number;
	const iotCount = ((iotsData as any)?.total || 0) as number;

	const countActive = (data: any): number => {
		const items = extractList(data) || [];
		return items.filter((i: any) => i.status === 'active').length;
	};

	const agentActive = countActive(agentsData);
	const robotActive = countActive(robotsData);
	const iotActive = countActive(iotsData);

	return (
		<Can denyAuditor>
			<div>
				<ConsolePageHeader title={t('nhi.title', 'NHI Monitoring')} />

				<Row gutter={[16, 16]} className="mb-4">
					<Col xs={12} sm={6}>
						<Card>
							<Statistic
								title={t('nhi.totalAgents', 'Total Agents')}
								value={agentCount}
								prefix={<ApiOutlined />}
							/>
						</Card>
					</Col>
					<Col xs={12} sm={6}>
						<Card>
							<Statistic
								title={t('nhi.activeAgents', 'Active Agents')}
								value={agentActive}
								valueStyle={{ color: 'var(--color-success)' }}
								prefix={<CheckCircleOutlined />}
							/>
						</Card>
					</Col>
					<Col xs={12} sm={6}>
						<Card>
							<Statistic
								title={t('nhi.totalRobots', 'Total Robots')}
								value={robotCount}
								prefix={<RobotOutlined />}
							/>
						</Card>
					</Col>
					<Col xs={12} sm={6}>
						<Card>
							<Statistic
								title={t('nhi.totalDevices', 'Total Devices')}
								value={iotCount}
								prefix={<WifiOutlined />}
							/>
						</Card>
					</Col>
				</Row>

				<Card>
					<Tabs
						activeKey={activeTab}
						onChange={setActiveTab}
						items={[
							{
								key: 'agents',
								label: `${t('nhi.agents', 'Agents')} (${agentCount})`,
								children: (
									<AgentTable
										onViewDetail={(record: any) =>
											setSelectedEntity({ type: 'agent', id: record.id })
										}
									/>
								),
							},
							{
								key: 'robots',
								label: `${t('nhi.robots', 'Robots')} (${robotCount})`,
								children: (
									<RobotTable
										onViewDetail={(record: any) =>
											setSelectedEntity({ type: 'robot', id: record.id })
										}
									/>
								),
							},
							{
								key: 'iots',
								label: `${t('nhi.devices', 'IoT Devices')} (${iotCount})`,
								children: (
									<IotTable
										onViewDetail={(record: any) =>
											setSelectedEntity({ type: 'device', id: record.id })
										}
									/>
								),
							},
						]}
					/>
				</Card>
				<NhiDetailDrawer
					entityType={selectedEntity?.type || 'agent'}
					entityId={selectedEntity?.id || null}
					visible={selectedEntity !== null}
					onClose={() => setSelectedEntity(null)}
				/>
			</div>
		</Can>
	);
}
