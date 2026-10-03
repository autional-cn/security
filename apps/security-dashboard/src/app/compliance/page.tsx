'use client';

import React, { useState } from 'react';
import { DataTable } from '@autional-cn/ui/antd';
import type { DataTableColumns } from '@autional-cn/ui/antd';
import { ConsolePageHeader } from '@autional-cn/ui';
import { Card, Tag, Spin, Empty, Progress, Row, Col, Statistic, Tabs, Badge } from 'antd';
import {
	SafetyCertificateOutlined,
	CheckCircleOutlined,
	CloseCircleOutlined,
	FileTextOutlined,
	GlobalOutlined,
	DatabaseOutlined,
	BugOutlined,
} from '@ant-design/icons';

import dayjs from 'dayjs';
import {
	useComplianceDashboard,
	useDSARsTab,
	useRetentionPoliciesTab,
	useISOControlsTab,
	useSOXControlsTab,
	usePenTestReportsTab,
} from '@/hooks/use-security-queries';
import { useTranslation } from 'react-i18next';

interface ComplianceCheckItem {
	item: string;
	passed: boolean;
	status: string;
	description?: string;
	issues?: string[];
	severity?: string;
}

export default function CompliancePage() {
	const { t } = useTranslation();
	const [activeTab, setActiveTab] = useState('overview');

	const { data: compliance, isLoading: overviewLoading } = useComplianceDashboard();
	const { data: dsars, isLoading: dsarLoading } = useDSARsTab();
	const { data: retentionPolicies, isLoading: retentionLoading } = useRetentionPoliciesTab();
	const { data: isoControls, isLoading: isoLoading } = useISOControlsTab();
	const { data: soxControls, isLoading: soxLoading } = useSOXControlsTab();
	const { data: penTests, isLoading: penTestLoading } = usePenTestReportsTab();

	const tabLoadingMap: Record<string, boolean> = {
		overview: overviewLoading,
		dsar: dsarLoading,
		retention: retentionLoading,
		iso: isoLoading,
		sox: soxLoading,
		pentest: penTestLoading,
	};

	const checkColumns: DataTableColumns<ComplianceCheckItem> = [
		{ title: t('compliance.columnItem'), dataIndex: 'item' },
		{
			title: t('compliance.columnStatus'),
			dataIndex: 'status',
			width: 120,
			render: (_: string, record: ComplianceCheckItem) =>
				record.passed ? (
					<Badge status="success" text={t('status.passed')} />
				) : (
					<Badge status="error" text={t('status.failed')} />
				),
		},
		{ title: t('compliance.columnDescription'), dataIndex: 'description', ellipsis: true },
		{
			title: t('compliance.columnSeverity'),
			dataIndex: 'severity',
			width: 100,
			render: (v?: string) =>
				v ? <Tag color={v === 'high' ? 'red' : v === 'medium' ? 'orange' : 'blue'}>{v}</Tag> : '-',
		},
	];

	const passedCount =
		(compliance as any)?.checks?.filter((c: ComplianceCheckItem) => c.passed).length || 0;
	const totalChecks = (compliance as any)?.checks?.length || 0;

	const tabItems = [
		{
			key: 'overview',
			label: (
				<span>
					<SafetyCertificateOutlined /> {t('compliance.overviewTab')}
				</span>
			),
			children: compliance ? (
				<div>
					<Row gutter={[16, 16]} className="mb-4">
						<Col xs={24} sm={8}>
							<Card>
								<Statistic
									title={t('compliance.complianceScore')}
									value={(compliance as any).complianceScore || 0}
									suffix="/ 100"
								/>
								<Progress
									percent={(compliance as any).complianceScore || 0}
									status={
										(compliance as any).complianceScore >= 80
											? 'success'
											: (compliance as any).complianceScore >= 60
												? 'normal'
												: 'exception'
									}
									className="mt-2"
								/>
							</Card>
						</Col>
						<Col xs={24} sm={8}>
							<Card>
								<Statistic
									title={t('compliance.overallStatus')}
									value={
										(compliance as any).overallStatus === 'pass'
											? t('status.passed')
											: (compliance as any).overallStatus === 'warning'
												? t('status.failed')
												: t('status.failed')
									}
									prefix={
										(compliance as any).overallStatus === 'pass' ? (
											<CheckCircleOutlined className="text-success" />
										) : (
											<CloseCircleOutlined className="text-danger" />
										)
									}
								/>
							</Card>
						</Col>
						<Col xs={24} sm={8}>
							<Card>
								<Statistic
									title={t('compliance.checksPassed')}
									value={`${passedCount} / ${totalChecks}`}
									prefix={<FileTextOutlined className="text-info" />}
								/>
							</Card>
						</Col>
					</Row>

					<Card title={t('compliance.checkDetail')} className="mt-4">
						<DataTable
							columns={checkColumns}
							dataSource={(compliance as any).checks || []}
							rowKey="item"
							pagination={false}
							locale={{ emptyText: <Empty description={t('compliance.noChecks')} /> }}
						/>
					</Card>

					{(compliance as any).recommendations &&
						(compliance as any).recommendations.length > 0 && (
							<Card title={t('compliance.recommendations')} className="mt-4">
								<ul className="list-disc pl-5 space-y-1">
									{(compliance as any).recommendations.map((r: string, i: number) => (
										<li key={i} className="text-sm">
											{r}
										</li>
									))}
								</ul>
							</Card>
						)}
				</div>
			) : (
				<Empty description={t('compliance.noComplianceData')} />
			),
		},
		{
			key: 'dsar',
			label: (
				<span>
					<GlobalOutlined /> {t('compliance.dsarTab')}
				</span>
			),
			children: (
				<DataTable
					columns={[
						{ title: t('dsars.columnId'), dataIndex: 'id' },
						{ title: t('dsars.columnUserId'), dataIndex: 'userId' },
						{ title: t('dsars.columnType'), dataIndex: 'type' },
						{
							title: t('dsars.columnStatus'),
							dataIndex: 'status',
							render: (v: string) => <Tag>{v}</Tag>,
						},
						{
							title: t('dsars.columnCreatedAt'),
							dataIndex: 'createdAt',
							render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'),
						},
					]}
					dataSource={dsars || []}
					rowKey="id"
					pagination={{ pageSize: 10 }}
					locale={{ emptyText: <Empty description={t('compliance.noDsaRecords')} /> }}
				/>
			),
		},
		{
			key: 'retention',
			label: (
				<span>
					<DatabaseOutlined /> {t('compliance.retentionTab')}
				</span>
			),
			children: (
				<DataTable
					columns={[
						{ title: t('settings.retentionDays'), dataIndex: 'retentionPeriodDays' },
						{ title: t('settings.dataRetention'), dataIndex: 'dataType' },
						{ title: t('settings.autoArchive'), dataIndex: 'purpose' },
						{ title: t('settings.archiveTarget'), dataIndex: 'legalBasis' },
						{
							title: t('anomalies.columnStatus'),
							dataIndex: 'status',
							render: (v: string) => <Tag color="success">{v}</Tag>,
						},
					]}
					dataSource={retentionPolicies || []}
					rowKey="policyId"
					pagination={{ pageSize: 10 }}
					locale={{ emptyText: <Empty description={t('compliance.noRetentionPolicies')} /> }}
				/>
			),
		},
		{
			key: 'iso',
			label: (
				<span>
					<SafetyCertificateOutlined /> {t('compliance.isoTab')}
				</span>
			),
			children: (
				<DataTable
					columns={[
						{ title: t('evidence.columnControlId'), dataIndex: 'controlId' },
						{ title: t('settings.connectorName'), dataIndex: 'controlName' },
						{ title: t('anomalies.columnType'), dataIndex: 'category' },
						{
							title: t('anomalies.columnStatus'),
							dataIndex: 'status',
							render: (v: string) => <Tag>{v}</Tag>,
						},
						{
							title: t('auditFindings.columnStatus'),
							dataIndex: 'lastReviewed',
							render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD') : '-'),
						},
					]}
					dataSource={isoControls || []}
					rowKey="id"
					pagination={{ pageSize: 10 }}
					locale={{ emptyText: <Empty description={t('compliance.noIsoControls')} /> }}
				/>
			),
		},
		{
			key: 'sox',
			label: (
				<span>
					<FileTextOutlined /> {t('compliance.soxTab')}
				</span>
			),
			children: (
				<DataTable
					columns={[
						{ title: t('evidence.columnControlId'), dataIndex: 'controlId' },
						{ title: t('anomalies.columnDescription'), dataIndex: 'description' },
						{ title: t('anomalies.columnType'), dataIndex: 'controlType' },
						{
							title: t('anomalies.columnStatus'),
							dataIndex: 'status',
							render: (v: string) => <Tag>{v}</Tag>,
						},
						{ title: t('settings.test'), dataIndex: 'testResult' },
						{ title: t('archives.columnCreatedAt'), dataIndex: 'lastTestDate' },
					]}
					dataSource={soxControls || []}
					rowKey="controlId"
					pagination={{ pageSize: 10 }}
					locale={{ emptyText: <Empty description={t('compliance.noSoxControls')} /> }}
				/>
			),
		},
		{
			key: 'pentest',
			label: (
				<span>
					<BugOutlined /> {t('compliance.pentestTab')}
				</span>
			),
			children: (
				<DataTable
					columns={[
						{ title: t('reports.title'), dataIndex: 'reportId' },
						{ title: t('alerts.columnTitle'), dataIndex: 'title' },
						{
							title: t('alerts.columnSeverity'),
							dataIndex: 'severity',
							render: (v: string) => (
								<Tag color={v === 'critical' ? 'red' : v === 'high' ? 'orange' : 'blue'}>{v}</Tag>
							),
						},
						{ title: t('dsars.statTotal'), dataIndex: 'findings' },
						{ title: t('settings.test'), dataIndex: 'testedAt' },
						{ title: t('archives.columnCreatedAt'), dataIndex: 'nextTestDate' },
					]}
					dataSource={penTests || []}
					rowKey="reportId"
					pagination={{ pageSize: 10 }}
					locale={{ emptyText: <Empty description={t('compliance.noPentestReports')} /> }}
				/>
			),
		},
	];

	return (
		<div>
			<ConsolePageHeader title={t('compliance.title')} />

			<Spin spinning={tabLoadingMap[activeTab] || false}>
				<Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
			</Spin>
		</div>
	);
}
