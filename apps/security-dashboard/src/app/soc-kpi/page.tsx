'use client';

import React from 'react';
import { DataTable } from '@autional-cn/ui/antd';
import { Card, Row, Col, Statistic, Spin } from 'antd';
import {
	ClockCircleOutlined,
	AlertOutlined,
	WarningOutlined,
	BugOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuditStats, useAnomalies, useAlerts } from '@/hooks/use-security-queries';

export default function SocKpiPage() {
	const { t } = useTranslation();

	const { data: statsData, isLoading: statsLoading } = useAuditStats();
	const { data: anomaliesData } = useAnomalies({ page: 1, pageSize: 1 });
	const { data: alertsData } = useAlerts({ page: 1, page_size: 1 });

	const stats = (statsData as any)?.data || statsData || {};
	const anomalyCount = ((anomaliesData as any)?.total || 0) as number;
	const alertCount = ((alertsData as any)?.total || 0) as number;

	const statCards = [
		{
			key: 'totalLogs',
			title: t('socKpi.totalLogs', 'Total Logs'),
			value: stats?.totalLogs ?? stats?.total ?? 0,
			icon: <ClockCircleOutlined />,
			color: '#1677ff',
		},
		{
			key: 'totalAnomalies',
			title: t('socKpi.totalAnomalies', 'Total Anomalies'),
			value: anomalyCount,
			icon: <WarningOutlined />,
			color: '#fa8c16',
		},
		{
			key: 'totalAlerts',
			title: t('socKpi.totalAlerts', 'Total Alerts'),
			value: alertCount,
			icon: <AlertOutlined />,
			color: 'var(--color-danger)',
		},
		{
			key: 'mttd',
			title: t('socKpi.mttd', 'MTTD (est.)'),
			value: stats?.mttd_minutes ? `${stats.mttd_minutes}m` : 'N/A',
			icon: <BugOutlined />,
			color: 'var(--color-chart-7)',
		},
	];

	return (
		<div>
			<div className="mb-4">
				<h1 className="text-xl font-semibold">{t('socKpi.title', 'SOC KPIs')}</h1>
			</div>

			<Row gutter={[16, 16]} className="mb-4">
				{statCards.map((c) => (
					<Col xs={24} sm={12} md={6} key={c.key}>
						<Card>
							{statsLoading ? (
								<div className="text-center py-4">
									<Spin />
								</div>
							) : (
								<Statistic
									title={c.title}
									value={c.value}
									prefix={<span style={{ color: c.color }}>{c.icon}</span>}
								/>
							)}
						</Card>
					</Col>
				))}
			</Row>

			<Card title={t('socKpi.auditStats', 'Audit Statistics')}>
				<DataTable
					rowKey="key"
					dataSource={[
						{
							key: 'total_entries',
							label: t('socKpi.totalEntries', 'Total Audit Entries'),
							value: stats?.totalLogs ?? stats?.total ?? '-',
						},
						{
							key: 'today_entries',
							label: t('socKpi.todayEntries', 'Today Entries'),
							value: stats?.today ?? '-',
						},
						{
							key: 'active_tenants',
							label: t('socKpi.activeTenants', 'Active Tenants'),
							value: stats?.active_tenants ?? '-',
						},
						{
							key: 'avg_response',
							label: t('socKpi.avgResponse', 'Avg Response Time (est.)'),
							value: stats?.avg_response_ms ? `${stats.avg_response_ms}ms` : '-',
						},
					]}
					columns={[
						{ title: t('socKpi.metric', 'Metric'), dataIndex: 'label', key: 'label' },
						{ title: t('socKpi.value', 'Value'), dataIndex: 'value', key: 'value' },
					]}
					pagination={false}
					size="small"
					loading={statsLoading}
				/>
			</Card>
		</div>
	);
}
