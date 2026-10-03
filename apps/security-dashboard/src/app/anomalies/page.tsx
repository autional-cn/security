'use client';

import React, { useState, useMemo } from 'react';
import { DataTable } from '@autional-cn/ui/antd';
import type { DataTableColumns } from '@autional-cn/ui/antd';
import { ConsolePageHeader } from '@autional-cn/ui';
import { Card, Select, Tag, Button, Spin, Empty, Space, Badge, Row, Col, Statistic, Segmented } from 'antd';
import {
	WarningOutlined,
	CheckCircleOutlined,
	ExclamationCircleOutlined,
	ReloadOutlined,
} from '@ant-design/icons';

import dayjs from 'dayjs';
import { useAnomalies, useUpdateAnomalyStatus } from '@/hooks/use-security-queries';
import { message } from '@/lib/antd-app';
import { useTranslation } from 'react-i18next';
import AnomalyDetailDrawer from '@/components/anomaly/AnomalyDetailDrawer';
import AssignAnomalyModal from '@/components/anomaly/AssignAnomalyModal';
import { Can } from '@/components/Can';

interface AnomalyItem {
	id: string;
	type: string;
	severity: 'low' | 'medium' | 'high' | 'critical';
	description: string;
	userId: string;
	tenantId: string;
	status: 'open' | 'investigating' | 'resolved' | 'false_positive';
	detectedAt: number;
}

const severityColors: Record<string, string> = {
	low: 'blue',
	medium: 'gold',
	high: 'orange',
	critical: 'red',
};

export default function AnomaliesPage() {
	const { t } = useTranslation();

	const statusLabels: Record<string, string> = {
		open: t('anomalies.statusOpen'),
		investigating: t('anomalies.statusInvestigating'),
		resolved: t('anomalies.statusResolved'),
		false_positive: t('anomalies.statusFalsePositive'),
	};

	const typeLabels: Record<string, string> = {
		brute_force: t('anomalyTypes.brute_force'),
		impossible_travel: t('anomalyTypes.impossible_travel'),
		unusual_location: t('anomalyTypes.unusual_location'),
		unusual_time: t('anomalyTypes.unusual_time'),
		privilege_escalation: t('anomalyTypes.privilege_escalation'),
	};

	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(20);
	const [filters, setFilters] = useState<Record<string, any>>({});
	const [selectedAnomalyId, setSelectedAnomalyId] = useState<string | null>(null);
	const [drawerVisible, setDrawerVisible] = useState(false);
	const [assignModalVisible, setAssignModalVisible] = useState(false);

	const { data, isLoading, refetch } = useAnomalies({ page, pageSize, filters });
	const updateMutation = useUpdateAnomalyStatus();

	const items = useMemo(() => (data as any)?.items || [], [data]);
	const total = useMemo(
		() => (data as any)?.total || (data as any)?.pagination?.total || items.length,
		[data, items.length],
	);

	const stats = useMemo(() => {
		const open = items.filter((i: AnomalyItem) => i.status === 'open').length;
		const investigating = items.filter((i: AnomalyItem) => i.status === 'investigating').length;
		const resolved = items.filter((i: AnomalyItem) => i.status === 'resolved').length;
		const critical = items.filter((i: AnomalyItem) => i.severity === 'critical').length;
		return { open, investigating, resolved, critical };
	}, [items]);

	const handleStatusChange = async (id: string, status: string) => {
		try {
			await updateMutation.mutateAsync({ id, status });
			message.success(t('anomalies.statusUpdated'));
		} catch {
			message.error(t('anomalies.updateFailed'));
		}
	};

	const openDetail = (id: string) => {
		setSelectedAnomalyId(id);
		setDrawerVisible(true);
	};

	const openAssign = (id: string) => {
		setSelectedAnomalyId(id);
		setAssignModalVisible(true);
	};

	const handleQuickRange = (value: string) => {
		const newFilters = value ? { ...filters, timeRange: value } : { ...filters };
		if (!value) delete newFilters.timeRange;
		setFilters(newFilters);
		setPage(1);
	};

	const quickRanges = [
		{ label: t('anomalies.rangeAll'), value: '' },
		{ label: t('anomalies.range1h'), value: '1h' },
		{ label: t('anomalies.range24h'), value: '24h' },
		{ label: t('anomalies.range7d'), value: '7d' },
		{ label: t('anomalies.range30d'), value: '30d' },
	];

	const columns: DataTableColumns<AnomalyItem> = [
		{ title: t('anomalies.columnId'), dataIndex: 'id', width: 180 },
		{
			title: t('anomalies.columnType'),
			dataIndex: 'type',
			width: 130,
			render: (v: string) => typeLabels[v] || v,
		},
		{
			title: t('anomalies.columnSeverity'),
			dataIndex: 'severity',
			width: 110,
			render: (v: string) => <Tag color={severityColors[v]}>{v}</Tag>,
		},
		{ title: t('anomalies.columnDescription'), dataIndex: 'description', ellipsis: true },
		{ title: t('anomalies.columnUser'), dataIndex: 'userId', width: 140 },
		{ title: t('anomalies.columnTenant'), dataIndex: 'tenantId', width: 120 },
		{
			title: t('anomalies.columnStatus'),
			dataIndex: 'status',
			width: 110,
			render: (v: string) => (
				<Badge
					status={v === 'open' ? 'error' : v === 'investigating' ? 'warning' : 'success'}
					text={statusLabels[v] || v}
				/>
			),
		},
		{
			title: t('anomalies.columnDetectedAt'),
			dataIndex: 'detectedAt',
			width: 180,
			render: (v: number) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-'),
		},
		{
			title: t('common.actions'),
			width: 200,
			fixed: 'right',
			render: (_: any, record: AnomalyItem) => (
				<Space size="small">
					<Button size="small" onClick={() => openDetail(record.id)}>
						{t('anomalies.actionDetail')}
					</Button>
					<Can denyAuditor>
						{record.status === 'open' && (
							<>
								<Button size="small" onClick={() => handleStatusChange(record.id, 'investigating')}>
									{t('anomalies.actionInvestigate')}
								</Button>
								<Button size="small" onClick={() => openAssign(record.id)}>
									{t('anomalies.actionAssign')}
								</Button>
							</>
						)}
						{(record.status === 'open' || record.status === 'investigating') && (
							<Button
								size="small"
								type="primary"
								onClick={() => handleStatusChange(record.id, 'resolved')}
							>
								{t('anomalies.actionResolve')}
							</Button>
						)}
						<Button
							size="small"
							danger
							onClick={() => handleStatusChange(record.id, 'false_positive')}
						>
							{t('anomalies.actionFalsePositive')}
						</Button>
					</Can>
				</Space>
			),
		},
	];

	return (
		<div>
			<ConsolePageHeader
				title={t('anomalies.title')}
				actions={
					<>
						<Button icon={<ReloadOutlined />} onClick={() => refetch()}>
							{t('common.refresh')}
						</Button>
					</>
				}
			/>

			<Row gutter={[16, 16]} className="mb-4">
				<Col xs={12} sm={6}>
					<Card>
						<Statistic
							title={t('anomalies.statsOpen')}
							value={stats.open}
							prefix={<WarningOutlined className="text-red-500" />}
						/>
					</Card>
				</Col>
				<Col xs={12} sm={6}>
					<Card>
						<Statistic
							title={t('anomalies.statsInvestigating')}
							value={stats.investigating}
							prefix={<ExclamationCircleOutlined className="text-orange-500" />}
						/>
					</Card>
				</Col>
				<Col xs={12} sm={6}>
					<Card>
						<Statistic
							title={t('anomalies.statsResolved')}
							value={stats.resolved}
							prefix={<CheckCircleOutlined className="text-green-500" />}
						/>
					</Card>
				</Col>
				<Col xs={12} sm={6}>
					<Card>
						<Statistic
							title={t('anomalies.statsCritical')}
							value={stats.critical}
							prefix={<WarningOutlined className="text-purple-500" />}
						/>
					</Card>
				</Col>
			</Row>

			<Card className="mb-4">
				<Space direction="vertical" className="w-full" size="middle">
					<Segmented
						options={quickRanges}
						value={filters.timeRange || ''}
						onChange={(v) => handleQuickRange(v as string)}
					/>
					<Space wrap>
						<Select
							placeholder={t('anomalies.filterSeverity')}
							allowClear
							value={filters.severity || undefined}
							onChange={(v) => setFilters({ ...filters, severity: v })}
							style={{ width: 130 }}
							options={[
								{ label: 'Low', value: 'low' },
								{ label: 'Medium', value: 'medium' },
								{ label: 'High', value: 'high' },
								{ label: 'Critical', value: 'critical' },
							]}
						/>
						<Select
							placeholder={t('anomalies.filterStatus')}
							allowClear
							value={filters.status || undefined}
							onChange={(v) => setFilters({ ...filters, status: v })}
							style={{ width: 130 }}
							options={[
								{ label: t('anomalies.statusOpen'), value: 'open' },
								{ label: t('anomalies.statusInvestigating'), value: 'investigating' },
								{ label: t('anomalies.statusResolved'), value: 'resolved' },
								{ label: t('anomalies.statusFalsePositive'), value: 'false_positive' },
							]}
						/>
						<Button
							type="primary"
							onClick={() => {
								setPage(1);
							}}
						>
							{t('common.search')}
						</Button>
						<Button
							onClick={() => {
								setFilters({});
								setPage(1);
							}}
						>
							{t('common.reset')}
						</Button>
					</Space>
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
					scroll={{ x: 1200 }}
					locale={{ emptyText: <Empty description={t('anomalies.empty')} /> }}
				/>
			</Spin>

			<AnomalyDetailDrawer
				anomalyId={selectedAnomalyId}
				visible={drawerVisible}
				onClose={() => setDrawerVisible(false)}
				onStatusChange={refetch}
			/>

			<AssignAnomalyModal
				anomalyId={selectedAnomalyId}
				visible={assignModalVisible}
				onClose={() => setAssignModalVisible(false)}
				onSuccess={refetch}
			/>
		</div>
	);
}
