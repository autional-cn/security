'use client';

import React, { useState } from 'react';
import { DataTable } from '@autional-cn/ui/antd';
import { ConsolePageHeader } from '@autional-cn/ui';
import { Card, Select, Button, Spin, Empty, Tag, Row, Col, Statistic, List, Space, Progress } from 'antd';
import {
	FileTextOutlined,
	WarningOutlined,
	SafetyCertificateOutlined,
	ReloadOutlined,
} from '@ant-design/icons';
import { useSecurityReport, useComplianceReport } from '@/hooks/use-security-queries';
import { useTranslation } from 'react-i18next';

export default function ReportsPage() {
	const { t } = useTranslation();
	const [reportType, setReportType] = useState<'security' | 'compliance'>('security');
	const [period, setPeriod] = useState('7d');
	const [standard, setStandard] = useState('GDPR');

	const { data: securityReport, isLoading: securityLoading } = useSecurityReport(period);
	const { data: complianceReport, isLoading: complianceLoading } = useComplianceReport(
		standard,
		period,
	);

	const loading = reportType === 'security' ? securityLoading : complianceLoading;
	const currentReport = reportType === 'security' ? securityReport : complianceReport;

	return (
		<div>
			<ConsolePageHeader
				title={t('reports.title')}
				actions={
					<>
						<Space>
							<Select
								value={reportType}
								onChange={(v) => setReportType(v)}
								style={{ width: 140 }}
								options={[
									{ label: t('reports.securityReport'), value: 'security' },
									{ label: t('reports.complianceReport'), value: 'compliance' },
								]}
							/>
							{reportType === 'security' ? (
								<Select
									value={period}
									onChange={(v) => setPeriod(v)}
									style={{ width: 120 }}
									options={[
										{ label: t('reports.period7d'), value: '7d' },
										{ label: t('reports.period30d'), value: '30d' },
										{ label: t('reports.period90d'), value: '90d' },
									]}
								/>
							) : (
								<Select
									value={standard}
									onChange={(v) => setStandard(v)}
									style={{ width: 140 }}
									options={[
										{ label: 'GDPR', value: 'GDPR' },
										{ label: 'ISO 27001', value: 'ISO27001' },
										{ label: 'SOX', value: 'SOX' },
									]}
								/>
							)}
						</Space>
					</>
				}
			/>

			<Spin spinning={loading}>
				{reportType === 'security' && securityReport && (
					<div>
						<Row gutter={[16, 16]} className="mb-4">
							<Col xs={24} sm={12} lg={8}>
								<Card>
									<Statistic
										title={t('reports.statTotalEvents')}
										value={securityReport.summary?.totalEvents || 0}
										prefix={<FileTextOutlined className="text-blue-500" />}
									/>
								</Card>
							</Col>
							<Col xs={24} sm={12} lg={8}>
								<Card>
									<Statistic
										title={t('reports.statFailedLogins')}
										value={securityReport.summary?.failedLogins || 0}
										prefix={<WarningOutlined className="text-orange-500" />}
									/>
								</Card>
							</Col>
							<Col xs={24} sm={12} lg={8}>
								<Card>
									<Statistic
										title={t('reports.statAnomaliesDetected')}
										value={securityReport.summary?.anomaliesDetected || 0}
										prefix={<WarningOutlined className="text-red-500" />}
									/>
								</Card>
							</Col>
						</Row>

						<Card title={t('reports.topRisks')} className="mb-4">
							{securityReport.topRisks && securityReport.topRisks.length > 0 ? (
								<List
									dataSource={securityReport.topRisks}
									renderItem={(item: any) => (
										<List.Item className="flex justify-between">
											<div className="flex items-center gap-2">
												<Tag
													color={
														item.severity === 'high'
															? 'red'
															: item.severity === 'medium'
																? 'orange'
																: 'blue'
													}
												>
													{item.severity}
												</Tag>
												<span className="font-medium">{item.type}</span>
												<span className="text-neutral-600 text-sm">{item.description}</span>
											</div>
											<span className="text-sm font-semibold">
												{item.count} {t('reports.countSuffix')}
											</span>
										</List.Item>
									)}
								/>
							) : (
								<Empty description={t('reports.noRiskData')} />
							)}
						</Card>

						<Card title={t('reports.securityRecommendations')}>
							{securityReport.recommendations && securityReport.recommendations.length > 0 ? (
								<ul className="list-disc pl-5 space-y-1">
									{securityReport.recommendations.map((r: string, i: number) => (
										<li key={i} className="text-sm">
											{r}
										</li>
									))}
								</ul>
							) : (
								<Empty description={t('reports.noRecommendations')} />
							)}
						</Card>
					</div>
				)}

				{reportType === 'compliance' && complianceReport && (
					<div>
						<Row gutter={[16, 16]} className="mb-4">
							<Col xs={24} sm={8}>
								<Card>
									<Statistic
										title={t('reports.complianceStandard')}
										value={complianceReport.standard || standard}
										prefix={<SafetyCertificateOutlined className="text-blue-500" />}
									/>
								</Card>
							</Col>
							<Col xs={24} sm={8}>
								<Card>
									<Statistic
										title={t('reports.complianceScore')}
										value={complianceReport.complianceScore || 0}
										suffix="/ 100"
									/>
									<Progress percent={complianceReport.complianceScore || 0} className="mt-2" />
								</Card>
							</Col>
							<Col xs={24} sm={8}>
								<Card>
									<Statistic
										title={t('reports.overallStatus')}
										value={
											complianceReport.overallStatus === 'pass'
												? t('reports.statusPass')
												: complianceReport.overallStatus === 'warning'
													? t('reports.statusWarning')
													: t('reports.statusFail')
										}
										valueStyle={{
											color: complianceReport.overallStatus === 'pass' ? 'var(--color-success)' : '#f5222d',
										}}
									/>
								</Card>
							</Col>
						</Row>

						<Card title={t('reports.checkResults')} className="mb-4">
							<DataTable
								columns={[
									{ title: t('reports.columnItem'), dataIndex: 'item' },
									{
										title: t('reports.columnStatus'),
										dataIndex: 'passed',
										render: (v: boolean) =>
											v ? (
												<Tag color="success">{t('status.passed')}</Tag>
											) : (
												<Tag color="error">{t('status.failed')}</Tag>
											),
									},
									{ title: t('reports.columnDescription'), dataIndex: 'description' },
									{
										title: t('reports.columnIssues'),
										dataIndex: 'issues',
										render: (v?: string[]) => v?.join(', ') || '-',
									},
								]}
								dataSource={complianceReport.checks || []}
								rowKey="item"
								pagination={false}
							/>
						</Card>

						<Card title={t('reports.improvementRecommendations')}>
							{complianceReport.recommendations && complianceReport.recommendations.length > 0 ? (
								<ul className="list-disc pl-5 space-y-1">
									{complianceReport.recommendations.map((r: string, i: number) => (
										<li key={i} className="text-sm">
											{r}
										</li>
									))}
								</ul>
							) : (
								<Empty description={t('reports.noRecommendations')} />
							)}
						</Card>
					</div>
				)}
			</Spin>
		</div>
	);
}
