'use client';

import React, { useState, useMemo } from 'react';
import { DataTable } from '@autional-cn/ui/antd';
import type { DataTableColumns } from '@autional-cn/ui/antd';
import { Card, Select, Tag, Button, Spin, Empty, Space, Row, Col, Statistic, Drawer, Descriptions, Modal, Input, Tooltip } from 'antd';
import {
	WarningOutlined,
	CheckCircleOutlined,
	ExclamationCircleOutlined,
	ReloadOutlined,
	BellOutlined,
	RiseOutlined,
	StopOutlined,
	UserSwitchOutlined,
	EyeOutlined,
} from '@ant-design/icons';

import dayjs from 'dayjs';
import { useAlerts, useUpdateAlertStatus, useAssignAlert } from '@/hooks/use-security-queries';
import { message } from '@/lib/antd-app';
import { Can } from '@/components/Can';
import { useTranslation } from 'react-i18next';

interface AlertItem {
	id: string;
	type: string;
	severity: string;
	title: string;
	description: string;
	source?: string;
	tenant_id: string;
	status: string;
	assignee?: string;
	created_at: number;
	updated_at?: number;
	acknowledged_at?: number;
	escalated_at?: number;
	resolved_at?: number;
	resolved_by?: string;
}

const severityColors: Record<string, string> = {
	critical: 'red',
	high: 'orange',
	medium: 'gold',
	low: 'blue',
	info: 'default',
};

const severityIcons: Record<string, React.ReactNode> = {
	critical: <WarningOutlined className="text-red-500" />,
	high: <WarningOutlined className="text-orange-500" />,
	medium: <ExclamationCircleOutlined className="text-yellow-500" />,
	low: <ExclamationCircleOutlined className="text-blue-500" />,
	info: <ExclamationCircleOutlined className="text-gray-400" />,
};

const statusColorMap: Record<string, string> = {
	open: 'error',
	acknowledged: 'processing',
	escalated: 'warning',
	resolved: 'success',
	dismissed: 'default',
};

export default function AlertsPage() {
	const { t } = useTranslation();

	const statusLabels: Record<string, string> = {
		open: t('alerts.statusOpen'),
		acknowledged: t('alerts.statusAcknowledged'),
		escalated: t('alerts.statusEscalated'),
		resolved: t('alerts.statusResolved'),
		dismissed: t('alerts.statusDismissed'),
	};

	const typeLabels: Record<string, string> = {
		threshold: t('alerts.typeThreshold'),
		anomaly: t('alerts.typeAnomaly'),
		compliance: t('alerts.typeCompliance'),
		security: t('alerts.typeSecurity'),
	};

	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(20);
	const [filters, setFilters] = useState<Record<string, any>>({});
	const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
	const [drawerVisible, setDrawerVisible] = useState(false);
	const [assignModalVisible, setAssignModalVisible] = useState(false);
	const [assigneeInput, setAssigneeInput] = useState('');

	const { data, isLoading, refetch } = useAlerts({ page, pageSize, filters });
	const statusMutation = useUpdateAlertStatus();
	const assignMutation = useAssignAlert();

	const items = useMemo(() => (data as any)?.items || [], [data]);
	const total = useMemo(
		() => (data as any)?.total || (data as any)?.pagination?.total || items.length,
		[data, items.length],
	);

	const stats = useMemo(() => {
		const open = items.filter((i: AlertItem) => i.status === 'open').length;
		const acknowledged = items.filter((i: AlertItem) => i.status === 'acknowledged').length;
		const escalated = items.filter((i: AlertItem) => i.status === 'escalated').length;
		const resolvedToday = items.filter((i: AlertItem) => {
			if (i.status !== 'resolved') return false;
			if (!i.resolved_at) return false;
			return dayjs(i.resolved_at).isSame(dayjs(), 'day');
		}).length;
		return { open, acknowledged, escalated, resolvedToday };
	}, [items]);

	const handleAction = async (id: string, action: string) => {
		try {
			await statusMutation.mutateAsync({ id, status: action });
			message.success(t('alerts.successAction'));
			setDrawerVisible(false);
		} catch {
			message.error(t('alerts.failAction'));
		}
	};

	const handleAssign = async () => {
		if (!selectedAlert || !assigneeInput.trim()) return;
		try {
			await assignMutation.mutateAsync({ id: selectedAlert.id, assignee: assigneeInput.trim() });
			message.success(t('alerts.successAssign'));
			setAssignModalVisible(false);
			setAssigneeInput('');
			setDrawerVisible(false);
		} catch {
			message.error(t('alerts.failAssign'));
		}
	};

	const openDetail = (alert: AlertItem) => {
		setSelectedAlert(alert);
		setDrawerVisible(true);
	};

	const openAssign = (alert: AlertItem) => {
		setSelectedAlert(alert);
		setAssigneeInput(alert.assignee || '');
		setAssignModalVisible(true);
	};

	const columns: DataTableColumns<AlertItem> = [
		{
			title: t('alerts.columnSeverity'),
			dataIndex: 'severity',
			width: 100,
			render: (v: string) => <Tag color={severityColors[v]}>{v}</Tag>,
			filters: [
				{ text: 'Critical', value: 'critical' },
				{ text: 'High', value: 'high' },
				{ text: 'Medium', value: 'medium' },
				{ text: 'Low', value: 'low' },
				{ text: 'Info', value: 'info' },
			],
		},
		{
			title: t('alerts.columnType'),
			dataIndex: 'type',
			width: 110,
			render: (v: string) => typeLabels[v] || v,
		},
		{
			title: t('alerts.columnTitle'),
			dataIndex: 'title',
			ellipsis: true,
		},
		{
			title: t('alerts.columnStatus'),
			dataIndex: 'status',
			width: 100,
			render: (v: string) => <Tag color={statusColorMap[v]}>{statusLabels[v] || v}</Tag>,
		},
		{
			title: t('alerts.columnAssignee'),
			dataIndex: 'assignee',
			width: 120,
			render: (v: string) => v || '-',
		},
		{
			title: t('alerts.columnCreatedAt'),
			dataIndex: 'created_at',
			width: 170,
			render: (v: number) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-'),
		},
		{
			title: t('common.actions'),
			width: 280,
			fixed: 'right',
			render: (_: any, record: AlertItem) => (
				<Space size="small">
					<Tooltip title={t('alerts.actionDetail')}>
						<Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(record)}>
							{t('alerts.actionDetail')}
						</Button>
					</Tooltip>
					<Can denyAuditor>
						{record.status === 'open' && (
							<>
								<Button size="small" onClick={() => handleAction(record.id, 'acknowledge')}>
									<CheckCircleOutlined /> {t('alerts.actionAcknowledge')}
								</Button>
								<Button size="small" onClick={() => handleAction(record.id, 'escalate')}>
									<RiseOutlined /> {t('alerts.actionEscalate')}
								</Button>
							</>
						)}
						{record.status === 'acknowledged' && (
							<>
								<Button size="small" onClick={() => handleAction(record.id, 'escalate')}>
									<RiseOutlined /> {t('alerts.actionEscalate')}
								</Button>
								<Button
									size="small"
									type="primary"
									onClick={() => handleAction(record.id, 'resolve')}
								>
									{t('alerts.actionResolve')}
								</Button>
							</>
						)}
						{record.status === 'escalated' && (
							<Button
								size="small"
								type="primary"
								onClick={() => handleAction(record.id, 'resolve')}
							>
								{t('alerts.actionResolve')}
							</Button>
						)}
						{(record.status === 'open' || record.status === 'acknowledged') && (
							<Button size="small" danger onClick={() => handleAction(record.id, 'dismiss')}>
								<StopOutlined /> {t('alerts.actionDismiss')}
							</Button>
						)}
						<Button size="small" icon={<UserSwitchOutlined />} onClick={() => openAssign(record)}>
							{t('alerts.actionAssign')}
						</Button>
					</Can>
				</Space>
			),
		},
	];

	return (
		<div>
			<div className="flex items-center justify-between mb-4">
				<h1 className="text-xl font-semibold">
					<BellOutlined className="mr-2" />
					{t('alerts.title')}
				</h1>
				<Button icon={<ReloadOutlined />} onClick={() => refetch()}>
					{t('common.refresh')}
				</Button>
			</div>

			<Row gutter={[16, 16]} className="mb-4">
				<Col xs={12} sm={6}>
					<Card>
						<Statistic
							title={t('alerts.statsOpen')}
							value={stats.open}
							prefix={<WarningOutlined className="text-red-500" />}
							valueStyle={{ color: stats.open > 0 ? 'var(--color-danger-text)' : undefined }}
						/>
					</Card>
				</Col>
				<Col xs={12} sm={6}>
					<Card>
						<Statistic
							title={t('alerts.statsAcknowledged')}
							value={stats.acknowledged}
							prefix={<CheckCircleOutlined className="text-blue-500" />}
						/>
					</Card>
				</Col>
				<Col xs={12} sm={6}>
					<Card>
						<Statistic
							title={t('alerts.statsEscalated')}
							value={stats.escalated}
							prefix={<RiseOutlined className="text-orange-500" />}
						/>
					</Card>
				</Col>
				<Col xs={12} sm={6}>
					<Card>
						<Statistic
							title={t('alerts.statsResolvedToday')}
							value={stats.resolvedToday}
							prefix={<CheckCircleOutlined className="text-green-500" />}
						/>
					</Card>
				</Col>
			</Row>

			<Card className="mb-4">
				<Space wrap>
					<Select
						placeholder={t('alerts.filterStatus')}
						allowClear
						value={filters.status || undefined}
						onChange={(v) => {
							setFilters({ ...filters, status: v });
							setPage(1);
						}}
						style={{ width: 130 }}
						options={[
							{ label: statusLabels.open, value: 'open' },
							{ label: statusLabels.acknowledged, value: 'acknowledged' },
							{ label: statusLabels.escalated, value: 'escalated' },
							{ label: statusLabels.resolved, value: 'resolved' },
							{ label: statusLabels.dismissed, value: 'dismissed' },
						]}
					/>
					<Select
						placeholder={t('alerts.filterSeverity')}
						allowClear
						value={filters.severity || undefined}
						onChange={(v) => {
							setFilters({ ...filters, severity: v });
							setPage(1);
						}}
						style={{ width: 130 }}
						options={[
							{ label: 'Critical', value: 'critical' },
							{ label: 'High', value: 'high' },
							{ label: 'Medium', value: 'medium' },
							{ label: 'Low', value: 'low' },
							{ label: 'Info', value: 'info' },
						]}
					/>
					<Select
						placeholder={t('alerts.filterType')}
						allowClear
						value={filters.type || undefined}
						onChange={(v) => {
							setFilters({ ...filters, type: v });
							setPage(1);
						}}
						style={{ width: 130 }}
						options={[
							{ label: typeLabels.threshold, value: 'threshold' },
							{ label: typeLabels.anomaly, value: 'anomaly' },
							{ label: typeLabels.compliance, value: 'compliance' },
							{ label: typeLabels.security, value: 'security' },
						]}
					/>
					<Button
						onClick={() => {
							setFilters({});
							setPage(1);
						}}
					>
						{t('common.reset')}
					</Button>
				</Space>
			</Card>

			<Spin spinning={isLoading}>
				<DataTable
					columns={columns}
					dataSource={items}
					rowKey="id"
					pagination={{
						current: page,
						pageSize,
						total,
						showSizeChanger: true,
						showTotal: (cnt) => t('common.total', { count: cnt }),
						onChange: (p, ps) => {
							setPage(p);
							setPageSize(ps);
						},
					}}
					scroll={{ x: 1300 }}
					locale={{ emptyText: <Empty description={t('alerts.empty')} /> }}
				/>
			</Spin>

			<Drawer
				title={t('alerts.detailTitle')}
				placement="right"
				width={600}
				open={drawerVisible}
				onClose={() => setDrawerVisible(false)}
				extra={
					selectedAlert && (
						<Space>
							<Can denyAuditor>
								{selectedAlert.status === 'open' && (
									<>
										<Button
											type="primary"
											onClick={() => handleAction(selectedAlert.id, 'acknowledge')}
										>
											<CheckCircleOutlined /> {t('alerts.actionAcknowledge')}
										</Button>
										<Button onClick={() => handleAction(selectedAlert.id, 'escalate')}>
											<RiseOutlined /> {t('alerts.actionEscalate')}
										</Button>
									</>
								)}
								{selectedAlert.status === 'acknowledged' && (
									<>
										<Button onClick={() => handleAction(selectedAlert.id, 'escalate')}>
											<RiseOutlined /> {t('alerts.actionEscalate')}
										</Button>
										<Button
											type="primary"
											onClick={() => handleAction(selectedAlert.id, 'resolve')}
										>
											{t('alerts.actionResolve')}
										</Button>
									</>
								)}
								{selectedAlert.status === 'escalated' && (
									<Button type="primary" onClick={() => handleAction(selectedAlert.id, 'resolve')}>
										{t('alerts.actionResolve')}
									</Button>
								)}
								{(selectedAlert.status === 'open' || selectedAlert.status === 'acknowledged') && (
									<Button danger onClick={() => handleAction(selectedAlert.id, 'dismiss')}>
										<StopOutlined /> {t('alerts.actionDismiss')}
									</Button>
								)}
								<Button icon={<UserSwitchOutlined />} onClick={() => openAssign(selectedAlert)}>
									{t('alerts.actionAssign')}
								</Button>
							</Can>
						</Space>
					)
				}
			>
				{selectedAlert && (
					<Descriptions column={1} bordered size="small" labelStyle={{ width: 120 }}>
						<Descriptions.Item label={t('alerts.detailId')}>
							<code>{selectedAlert.id}</code>
						</Descriptions.Item>
						<Descriptions.Item label={t('alerts.columnType')}>
							<Tag>{typeLabels[selectedAlert.type] || selectedAlert.type}</Tag>
						</Descriptions.Item>
						<Descriptions.Item label={t('alerts.columnSeverity')}>
							<Tag color={severityColors[selectedAlert.severity]}>{selectedAlert.severity}</Tag>
						</Descriptions.Item>
						<Descriptions.Item label={t('alerts.columnStatus')}>
							<Tag color={statusColorMap[selectedAlert.status]}>
								{statusLabels[selectedAlert.status] || selectedAlert.status}
							</Tag>
						</Descriptions.Item>
						<Descriptions.Item label={t('alerts.columnTitle')}>
							{selectedAlert.title}
						</Descriptions.Item>
						<Descriptions.Item label={t('alerts.detailDescription')}>
							{selectedAlert.description}
						</Descriptions.Item>
						{selectedAlert.source && (
							<Descriptions.Item label={t('alerts.detailSource')}>
								{selectedAlert.source}
							</Descriptions.Item>
						)}
						<Descriptions.Item label={t('alerts.detailTenant')}>
							{selectedAlert.tenant_id}
						</Descriptions.Item>
						<Descriptions.Item label={t('alerts.columnAssignee')}>
							{selectedAlert.assignee || '-'}
						</Descriptions.Item>
						<Descriptions.Item label={t('alerts.detailCreatedAt')}>
							{selectedAlert.created_at
								? dayjs(selectedAlert.created_at).format('YYYY-MM-DD HH:mm:ss')
								: '-'}
						</Descriptions.Item>
						{selectedAlert.updated_at && selectedAlert.updated_at > 0 && (
							<Descriptions.Item label={t('alerts.detailUpdatedAt')}>
								{dayjs(selectedAlert.updated_at).format('YYYY-MM-DD HH:mm:ss')}
							</Descriptions.Item>
						)}
						{selectedAlert.acknowledged_at && (
							<Descriptions.Item label={t('alerts.detailConfirmedAt')}>
								{dayjs(selectedAlert.acknowledged_at).format('YYYY-MM-DD HH:mm:ss')}
							</Descriptions.Item>
						)}
						{selectedAlert.escalated_at && (
							<Descriptions.Item label={t('alerts.detailEscalatedAt')}>
								{dayjs(selectedAlert.escalated_at).format('YYYY-MM-DD HH:mm:ss')}
							</Descriptions.Item>
						)}
						{selectedAlert.resolved_at && (
							<Descriptions.Item label={t('alerts.detailResolvedAt')}>
								{dayjs(selectedAlert.resolved_at).format('YYYY-MM-DD HH:mm:ss')}
							</Descriptions.Item>
						)}
						{selectedAlert.resolved_by && (
							<Descriptions.Item label={t('alerts.detailResolvedBy')}>
								{selectedAlert.resolved_by}
							</Descriptions.Item>
						)}
					</Descriptions>
				)}
			</Drawer>

			<Modal
				title={t('alerts.assignTitle')}
				open={assignModalVisible}
				onOk={handleAssign}
				onCancel={() => setAssignModalVisible(false)}
				okText={t('alerts.confirmAssign')}
				cancelText={t('common.cancel')}
			>
				<div className="py-4">
					<label className="block mb-2 font-medium">{t('alerts.assignLabel')}</label>
					<Input
						placeholder={t('alerts.assignPlaceholder')}
						value={assigneeInput}
						onChange={(e) => setAssigneeInput(e.target.value)}
						onPressEnter={handleAssign}
					/>
				</div>
			</Modal>
		</div>
	);
}
