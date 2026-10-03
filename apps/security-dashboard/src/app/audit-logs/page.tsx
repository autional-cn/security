'use client';

import React, { useState, useMemo } from 'react';
import { DataTable } from '@autional-cn/ui/antd';
import type { DataTableColumns } from '@autional-cn/ui/antd';
import { ConsolePageHeader } from '@autional-cn/ui';
import { Card, Input, Select, DatePicker, Button, Tag, Spin, Empty, Space, Drawer, Descriptions, Segmented } from 'antd';
import { SearchOutlined, ReloadOutlined, ExportOutlined } from '@ant-design/icons';

import dayjs from 'dayjs';
import { useAuditLogs, useAuditLogDetail, useCreateExportJob } from '@/hooks/use-audit-logs';
import type { AuditLogFilters } from '@/hooks/use-audit-logs';
import { message } from '@/lib/antd-app';
import { useTranslation } from 'react-i18next';
import { Can } from '@/components/Can';

interface AuditLogItem {
	id: string;
	operatorId: string;
	operatorType: string;
	module: string;
	action: string;
	status: number;
	level: string;
	message: string;
	ip?: string;
	timestamp: number;
	tenantId: string;
	duration?: number;
	sequence?: number;
	metadata?: Record<string, unknown>;
}

const levelColors: Record<string, string> = {
	info: 'blue',
	warning: 'orange',
	error: 'red',
	critical: 'purple',
};

export default function AuditLogsPage() {
	const { t } = useTranslation();
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(20);
	const [filters, setFilters] = useState<AuditLogFilters>({});
	const [drawerVisible, setDrawerVisible] = useState(false);
	const [detailId, setDetailId] = useState<string | null>(null);

	const { data, isLoading } = useAuditLogs({ page, pageSize, filters });
	const { data: detail, isLoading: detailLoading } = useAuditLogDetail(detailId);
	const exportMutation = useCreateExportJob();

	const items = useMemo(() => data?.items || [], [data]);
	const total = useMemo(
		() => data?.total || data?.pagination?.total || items.length,
		[data, items.length],
	);

	const handleSearch = () => {
		setPage(1);
	};

	const handleReset = () => {
		setFilters({});
		setPage(1);
	};

	const handleQuickRange = (value: string) => {
		const now = dayjs();
		let start: dayjs.Dayjs | null = null;
		let end: dayjs.Dayjs | null = now;

		switch (value) {
			case 'today':
				start = now.startOf('day');
				break;
			case 'yesterday':
				start = now.subtract(1, 'day').startOf('day');
				end = now.subtract(1, 'day').endOf('day');
				break;
			case '7d':
				start = now.subtract(7, 'day').startOf('day');
				break;
			case '30d':
				start = now.subtract(30, 'day').startOf('day');
				break;
		}

		setFilters({
			...filters,
			startTime: start ? start.valueOf() : undefined,
			endTime: end ? end.valueOf() : undefined,
		});
		setPage(1);
	};

	const handleExport = async () => {
		try {
			await exportMutation.mutateAsync({
				format: 'csv',
				startDate: filters.startTime ? dayjs(filters.startTime).format('YYYY-MM-DD') : undefined,
				endDate: filters.endTime ? dayjs(filters.endTime).format('YYYY-MM-DD') : undefined,
			});
			message.success(t('auditLogs.exportSubmitted'));
		} catch {
			message.error(t('auditLogs.exportFailed'));
		}
	};

	const showDetail = (id: string) => {
		setDetailId(id);
		setDrawerVisible(true);
	};

	const handleDrawerClose = () => {
		setDrawerVisible(false);
		setDetailId(null);
	};

	const quickRanges = [
		{ label: t('auditLogs.rangeToday'), value: 'today' },
		{ label: t('auditLogs.rangeYesterday'), value: 'yesterday' },
		{ label: t('auditLogs.range7d'), value: '7d' },
		{ label: t('auditLogs.range30d'), value: '30d' },
	];

	const columns: DataTableColumns<AuditLogItem> = [
		{
			title: t('auditLogs.columnTime'),
			dataIndex: 'timestamp',
			width: 180,
			render: (v: number) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-'),
		},
		{ title: t('auditLogs.columnTenant'), dataIndex: 'tenantId', width: 120 },
		{ title: t('auditLogs.columnOperator'), dataIndex: 'operatorId', width: 140 },
		{ title: t('auditLogs.columnModule'), dataIndex: 'module', width: 100 },
		{ title: t('auditLogs.columnAction'), dataIndex: 'action', width: 140 },
		{
			title: t('auditLogs.columnLevel'),
			dataIndex: 'level',
			width: 90,
			render: (v: string) => <Tag color={levelColors[v] || 'default'}>{v}</Tag>,
		},
		{
			title: t('auditLogs.columnStatus'),
			dataIndex: 'status',
			width: 80,
			render: (v: number) =>
				v === 0 ? (
					<Tag color="success">{t('status.success')}</Tag>
				) : (
					<Tag color="error">{t('status.failure')}</Tag>
				),
		},
		{ title: t('auditLogs.columnIp'), dataIndex: 'ip', width: 130 },
		{ title: t('auditLogs.columnMessage'), dataIndex: 'message', ellipsis: true },
		{
			title: t('common.actions'),
			width: 100,
			fixed: 'right',
			render: (_: any, record: AuditLogItem) => (
				<Button type="link" size="small" onClick={() => showDetail(record.id)}>
					{t('common.detail')}
				</Button>
			),
		},
	];

	return (
		<Can denyAuditor>
			<div>
				<ConsolePageHeader title={t('auditLogs.title')} />

				<Card className="mb-4">
					<Space direction="vertical" className="w-full" size="middle">
						<Segmented options={quickRanges} onChange={(v) => handleQuickRange(v as string)} />
						<Space wrap>
							<Input
								placeholder={t('auditLogs.keywordPlaceholder')}
								value={filters.keyword || ''}
								onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
								style={{ width: 200 }}
								onPressEnter={handleSearch}
							/>
							<Select
								placeholder={t('auditLogs.filterLevel')}
								allowClear
								value={filters.level || undefined}
								onChange={(v) => setFilters({ ...filters, level: v })}
								style={{ width: 120 }}
								options={[
									{ label: 'Info', value: 'info' },
									{ label: 'Warning', value: 'warning' },
									{ label: 'Error', value: 'error' },
									{ label: 'Critical', value: 'critical' },
								]}
							/>
							<Select
								placeholder={t('auditLogs.filterStatus')}
								allowClear
								value={filters.status !== undefined ? filters.status : undefined}
								onChange={(v) => setFilters({ ...filters, status: v })}
								style={{ width: 120 }}
								options={[
									{ label: t('status.success'), value: 0 },
									{ label: t('status.failure'), value: 1 },
								]}
							/>
							<DatePicker
								placeholder={t('auditLogs.startTime')}
								value={filters.startTime ? dayjs(filters.startTime) : null}
								onChange={(d) => setFilters({ ...filters, startTime: d ? d.valueOf() : undefined })}
							/>
							<DatePicker
								placeholder={t('auditLogs.endTime')}
								value={filters.endTime ? dayjs(filters.endTime) : null}
								onChange={(d) => setFilters({ ...filters, endTime: d ? d.valueOf() : undefined })}
							/>
							<Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
								{t('common.search')}
							</Button>
							<Button icon={<ReloadOutlined />} onClick={handleReset}>
								{t('common.reset')}
							</Button>
							<Button icon={<ExportOutlined />} onClick={handleExport}>
								{t('common.export')}
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
						locale={{ emptyText: <Empty description={t('auditLogs.empty')} /> }}
					/>
				</Spin>

				<Drawer
					title={t('auditLogs.detailTitle')}
					width={600}
					open={drawerVisible}
					onClose={handleDrawerClose}
					destroyOnClose
				>
					<Spin spinning={detailLoading}>
						{detail && (
							<Descriptions bordered column={1} size="small">
								<Descriptions.Item label={t('auditLogs.detailId')}>
									{(detail as any).id}
								</Descriptions.Item>
								<Descriptions.Item label={t('auditLogs.detailTime')}>
									{(detail as any).timestamp
										? dayjs((detail as any).timestamp).format('YYYY-MM-DD HH:mm:ss')
										: '-'}
								</Descriptions.Item>
								<Descriptions.Item label={t('auditLogs.detailTenantId')}>
									{(detail as any).tenantId}
								</Descriptions.Item>
								<Descriptions.Item label={t('auditLogs.detailOperator')}>
									{(detail as any).operatorId}
								</Descriptions.Item>
								<Descriptions.Item label={t('auditLogs.detailOperatorType')}>
									{(detail as any).operatorType}
								</Descriptions.Item>
								<Descriptions.Item label={t('auditLogs.detailModule')}>
									{(detail as any).module}
								</Descriptions.Item>
								<Descriptions.Item label={t('auditLogs.detailAction')}>
									{(detail as any).action}
								</Descriptions.Item>
								<Descriptions.Item label={t('auditLogs.detailStatus')}>
									{(detail as any).status === 0 ? t('status.success') : t('status.failure')}
								</Descriptions.Item>
								<Descriptions.Item label={t('auditLogs.detailLevel')}>
									<Tag color={levelColors[(detail as any).level]}>{(detail as any).level}</Tag>
								</Descriptions.Item>
								<Descriptions.Item label={t('auditLogs.detailIp')}>
									{(detail as any).ip || '-'}
								</Descriptions.Item>
								<Descriptions.Item label={t('auditLogs.detailDuration')}>
									{(detail as any).duration} ms
								</Descriptions.Item>
								<Descriptions.Item label={t('auditLogs.detailSequence')}>
									{(detail as any).sequence}
								</Descriptions.Item>
								<Descriptions.Item label={t('auditLogs.detailMessage')}>
									{(detail as any).message}
								</Descriptions.Item>
								<Descriptions.Item label={t('auditLogs.detailMetadata')}>
									<pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-60">
										{JSON.stringify((detail as any).metadata || {}, null, 2)}
									</pre>
								</Descriptions.Item>
							</Descriptions>
						)}
					</Spin>
				</Drawer>
			</div>
		</Can>
	);
}
