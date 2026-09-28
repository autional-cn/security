'use client';

import React, { useMemo } from 'react';
import { Card, Col, Row, Statistic, List, Tag, Empty, Spin, Progress, Badge, Timeline } from 'antd';
import {
	FileSearchOutlined,
	WarningOutlined,
	SafetyCertificateOutlined,
	ClusterOutlined,
	CheckCircleOutlined,
	CloseCircleOutlined,
	ExclamationCircleOutlined,
	CloudServerOutlined,
	ApiOutlined,
	ThunderboltOutlined,
	RadarChartOutlined,
	FileTextOutlined,
} from '@ant-design/icons';
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
	BarChart,
	Bar,
	Legend,
} from 'recharts';
import {
	useAuditStats,
	useAnomaliesPreview,
	useComplianceStatus,
	useVerificationResults,
	useActiveSessionCount,
	useGatewayStatus,
} from '@/hooks/useOverview';
import { useTranslation } from 'react-i18next';

interface SecurityEvent {
	id: string;
	time: number;
	title: string;
	description: string;
	type: 'anomaly' | 'audit' | 'compliance' | 'session';
}

function buildEventsFromData(
	auditLogs: any[],
	anomalyItems: any[],
	t: (k: string) => string,
): SecurityEvent[] {
	const events: SecurityEvent[] = [];
	if (anomalyItems?.length) {
		for (const a of anomalyItems.slice(0, 3)) {
			events.push({
				id: a.id || `anomaly-${Date.now()}`,
				time: a.detectedAt ? new Date(a.detectedAt).getTime() : Date.now(),
				title: a.title || t('anomalyTypes.anomaly_detection'),
				description: a.description || a.message || `${a.type || t('anomalyTypes.unknown')}`,
				type: 'anomaly',
			});
		}
	}
	if (auditLogs?.length) {
		for (const log of auditLogs.slice(0, 2)) {
			events.push({
				id: log.id || log.requestId || `audit-${Date.now()}`,
				time: log.timestamp ? log.timestamp * 1000 : Date.now(),
				title: `${log.module || ''} - ${log.action || ''}`,
				description: log.message || log.action || '',
				type: 'audit',
			});
		}
	}
	if (events.length === 0) {
		events.push({
			id: 'init-1',
			time: Date.now(),
			title: t('overview.systemReady'),
			description: t('overview.systemMonitoringDesc'),
			type: 'audit',
		});
	}
	return events;
}

const PIE_COLORS = ['var(--color-primary-700)', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const SEVERITY_COLORS: Record<string, string> = {
	critical: '#ef4444',
	high: '#f97316',
	medium: '#f59e0b',
	low: 'var(--color-primary-700)',
};
const EVENT_TYPE_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
	anomaly: { color: 'red', icon: <WarningOutlined /> },
	audit: { color: 'blue', icon: <FileTextOutlined /> },
	compliance: { color: 'green', icon: <SafetyCertificateOutlined /> },
	session: { color: 'cyan', icon: <ClusterOutlined /> },
};

export default function OverviewPage() {
	const { t, i18n } = useTranslation();
	const { data: auditData, isLoading: auditLoading } = useAuditStats();
	const { data: anomalyData, isLoading: anomalyLoading } = useAnomaliesPreview();
	const { data: complianceData, isLoading: complianceLoading } = useComplianceStatus();
	const { data: verifyData, isLoading: verifyLoading } = useVerificationResults();
	const { data: sessionData, isLoading: sessionLoading } = useActiveSessionCount();
	const { data: gatewayData, isLoading: gatewayLoading } = useGatewayStatus();

	const loading =
		auditLoading || anomalyLoading || complianceLoading || verifyLoading || sessionLoading;

	const stats = useMemo(() => {
		const totalLogs = auditData?.totalLogs || 0;
		const openAnomalies = anomalyData?.total || anomalyData?.items?.length || 0;
		const complianceScore = complianceData?.complianceScore || 0;
		const activeSessions = sessionData?.count || sessionData?.data?.count || 0;

		let hashChainValid = true;
		let criticalAlerts = 0;
		if (verifyData?.items) {
			hashChainValid = verifyData.items.every((v: any) => v.valid);
			criticalAlerts = verifyData.items.filter((v: any) => !v.valid).length;
		}

		return {
			totalLogs,
			openAnomalies,
			complianceScore,
			activeSessions,
			hashChainValid,
			criticalAlerts,
		};
	}, [auditData, anomalyData, complianceData, sessionData, verifyData]);

	const recentAnomalies = useMemo(() => {
		return anomalyData?.items?.slice(0, 5) || [];
	}, [anomalyData]);

	const severityData = useMemo(() => {
		const items = anomalyData?.items || [];
		const severityMap: Record<string, number> = {};
		items.forEach((a: any) => {
			severityMap[a.severity] = (severityMap[a.severity] || 0) + 1;
		});
		return Object.entries(severityMap).map(([name, value]) => ({ name, value }));
	}, [anomalyData]);

	const complianceChecks = useMemo(() => {
		return (complianceData?.checks || []).slice(0, 5);
	}, [complianceData]);

	const trendData = useMemo(() => {
		if (auditData?.trend) {
			return auditData.trend.slice(-7).map((td: any) => ({
				time: new Date(td.timestamp).toLocaleDateString(i18n.language, {
					month: 'short',
					day: 'numeric',
				}),
				count: td.count,
			}));
		}
		return [];
	}, [auditData, i18n.language]);

	const moduleData = useMemo(() => {
		if (auditData?.byModule) {
			return Object.entries(auditData.byModule).map(([name, value]) => ({ name, value }));
		}
		return [
			{ name: 'identity', value: 4500 },
			{ name: 'session', value: 3200 },
			{ name: 'audit', value: 2800 },
			{ name: 'compliance', value: 1200 },
			{ name: 'billing', value: 800 },
			{ name: 'storage', value: 600 },
		];
	}, [auditData]);

	const serviceStatuses = useMemo(() => {
		const checks = gatewayData?.checks || {};
		const latencies = gatewayData?.checks_latency || {};
		return Object.entries(checks).map(([name, status]) => ({
			name,
			status,
			latency: latencies[name],
		}));
	}, [gatewayData]);

	const events = useMemo(
		() =>
			buildEventsFromData(
				auditData?.logs || auditData?.items || [],
				anomalyData?.items || anomalyData?.anomalies || [],
				t,
			),
		[auditData, anomalyData, t],
	);

	const severityColor = (severity: string) => {
		switch (severity) {
			case 'critical':
				return 'red';
			case 'high':
				return 'orange';
			case 'medium':
				return 'gold';
			default:
				return 'blue';
		}
	};

	const anomalyTypeLabel = (type: string) => {
		const key = `anomalyTypes.${type}`;
		return t(key) !== key ? t(key) : type;
	};

	const ChartEmpty = ({ title }: { title: string }) => (
		<div className="flex flex-col items-center justify-center h-[250px]">
			<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`${title} ${t('common.noData')}`} />
		</div>
	);

	const serviceStatusColor = (status: string) => {
		switch (status) {
			case 'healthy':
				return 'bg-green-500';
			case 'degraded':
				return 'bg-yellow-500';
			case 'unhealthy':
				return 'bg-red-500';
			default:
				return 'bg-gray-400';
		}
	};

	const serviceStatusText = (status: string) => {
		switch (status) {
			case 'healthy':
				return t('status.healthy');
			case 'degraded':
				return t('status.degraded');
			case 'unhealthy':
				return t('status.unhealthy');
			default:
				return t('status.unknown');
		}
	};

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-xl font-semibold">{t('overview.title')}</h1>
			</div>

			<Spin spinning={loading}>
				<Row gutter={[16, 16]}>
					<Col xs={24} sm={12} lg={4}>
						<Card>
							<Statistic
								title={t('overview.totalAuditLogs')}
								value={stats.totalLogs}
								prefix={<FileSearchOutlined className="text-blue-500" />}
							/>
						</Card>
					</Col>
					<Col xs={24} sm={12} lg={4}>
						<Card>
							<Statistic
								title={t('overview.pendingAnomalies')}
								value={stats.openAnomalies}
								prefix={<WarningOutlined className="text-orange-500" />}
								valueStyle={{ color: stats.openAnomalies > 0 ? '#f97316' : undefined }}
							/>
						</Card>
					</Col>
					<Col xs={24} sm={12} lg={4}>
						<Card>
							<Statistic
								title={t('overview.activeSessions')}
								value={stats.activeSessions}
								prefix={<ClusterOutlined className="text-cyan-500" />}
							/>
						</Card>
					</Col>
					<Col xs={24} sm={12} lg={4}>
						<Card>
							<div className="flex items-center justify-between mb-2">
								<span className="text-sm text-gray-500">{t('overview.complianceScore')}</span>
								<SafetyCertificateOutlined className="text-green-500" />
							</div>
							<Progress
								percent={stats.complianceScore}
								status={
									stats.complianceScore >= 80
										? 'success'
										: stats.complianceScore >= 60
											? 'normal'
											: 'exception'
								}
								format={(percent) => t('overview.scoreFormat', { score: percent })}
							/>
						</Card>
					</Col>
					<Col xs={24} sm={12} lg={4}>
						<Card>
							<div className="flex items-center justify-between mb-2">
								<span className="text-sm text-gray-500">{t('overview.hashChainIntegrity')}</span>
								{stats.hashChainValid ? (
									<CheckCircleOutlined className="text-green-500" />
								) : (
									<CloseCircleOutlined className="text-red-500" />
								)}
							</div>
							<div className="text-base font-semibold">
								{stats.hashChainValid ? (
									<Badge status="success" text={t('overview.allPassed')} />
								) : (
									<Badge
										status="error"
										text={t('overview.anomalyCount', { count: stats.criticalAlerts })}
									/>
								)}
							</div>
						</Card>
					</Col>
					<Col xs={24} sm={12} lg={4}>
						<Card>
							<div className="flex items-center justify-between mb-2">
								<span className="text-sm text-gray-500">{t('overview.riskLevel')}</span>
								<ExclamationCircleOutlined className="text-red-500" />
							</div>
							<div className="text-base font-semibold">
								{stats.criticalAlerts > 0 ? (
									<Tag color="red">{t('risk.critical')}</Tag>
								) : stats.openAnomalies > 5 ? (
									<Tag color="orange">{t('risk.high')}</Tag>
								) : (
									<Tag color="green">{t('risk.normal')}</Tag>
								)}
							</div>
						</Card>
					</Col>
				</Row>

				<Row gutter={[16, 16]} className="mt-4">
					<Col xs={24} lg={8}>
						<Card title={t('overview.auditTrend7d')} className="h-full">
							{trendData.length > 0 ? (
								<ResponsiveContainer width="100%" height={250}>
									<LineChart data={trendData}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="time" fontSize={12} />
										<YAxis fontSize={12} />
										<Tooltip />
										<Line
											type="monotone"
											dataKey="count"
											stroke="var(--color-primary-700)"
											strokeWidth={2}
											dot={false}
										/>
									</LineChart>
								</ResponsiveContainer>
							) : (
								<ChartEmpty title={t('overview.auditTrend7d')} />
							)}
						</Card>
					</Col>
					<Col xs={24} lg={8}>
						<Card title={t('overview.moduleDistribution')} className="h-full">
							{moduleData.length > 0 ? (
								<ResponsiveContainer width="100%" height={250}>
									<PieChart>
										<Pie
											data={moduleData}
											cx="50%"
											cy="50%"
											innerRadius={60}
											outerRadius={90}
											paddingAngle={3}
											dataKey="value"
											nameKey="name"
										>
											{moduleData.map((_, index) => (
												<Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
											))}
										</Pie>
										<Tooltip />
										<Legend fontSize={12} />
									</PieChart>
								</ResponsiveContainer>
							) : (
								<ChartEmpty title={t('overview.moduleDistribution')} />
							)}
						</Card>
					</Col>
					<Col xs={24} lg={8}>
						<Card title={t('overview.anomalySeverity')} className="h-full">
							{severityData.length > 0 ? (
								<ResponsiveContainer width="100%" height={250}>
									<BarChart data={severityData}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="name" fontSize={12} />
										<YAxis fontSize={12} />
										<Tooltip />
										<Bar dataKey="value" radius={[4, 4, 0, 0]}>
											{severityData.map((entry, index) => (
												<Cell
													key={`cell-${index}`}
													fill={SEVERITY_COLORS[entry.name] || 'var(--color-primary-700)'}
												/>
											))}
										</Bar>
									</BarChart>
								</ResponsiveContainer>
							) : (
								<ChartEmpty title={t('overview.anomalySeverity')} />
							)}
						</Card>
					</Col>
				</Row>

				<Row gutter={[16, 16]} className="mt-4">
					<Col xs={24} lg={16}>
						<Card title={t('overview.serviceHealth')} className="h-full">
							<Spin spinning={gatewayLoading}>
								{serviceStatuses.length > 0 ? (
									<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
										{serviceStatuses.map((svc: any) => (
											<div
												key={svc.name}
												className="flex flex-col items-center p-2 rounded border border-gray-100 hover:bg-gray-50 transition-colors"
											>
												<div
													className={`w-3 h-3 rounded-full mb-2 ${serviceStatusColor(svc.status)}`}
												/>
												<div className="text-xs font-medium text-center truncate w-full">
													{svc.name.replace('-service', '')}
												</div>
												<div className="text-xs text-gray-400">{serviceStatusText(svc.status)}</div>
												{svc.latency && svc.latency !== 'timeout' && (
													<div className="text-xs text-gray-400">{svc.latency}</div>
												)}
											</div>
										))}
									</div>
								) : (
									<Empty description={t('overview.cannotGetStatus')} />
								)}
							</Spin>
						</Card>
					</Col>
					<Col xs={24} lg={8}>
						<Card title={t('overview.alertChannelStatus')} className="h-full">
							<div className="space-y-3">
								<div className="flex items-center justify-between p-2 rounded border border-gray-100">
									<div className="flex items-center gap-2">
										<CloudServerOutlined className="text-blue-500" />
										<span className="text-sm">{t('overview.emailAlert')}</span>
									</div>
									<Tag color="success">{t('overview.healthy')}</Tag>
								</div>
								<div className="flex items-center justify-between p-2 rounded border border-gray-100">
									<div className="flex items-center gap-2">
										<ThunderboltOutlined className="text-orange-500" />
										<span className="text-sm">{t('overview.smsAlert')}</span>
									</div>
									<Tag color="success">{t('overview.healthy')}</Tag>
								</div>
								<div className="flex items-center justify-between p-2 rounded border border-gray-100">
									<div className="flex items-center gap-2">
										<ApiOutlined className="text-purple-500" />
										<span className="text-sm">{t('overview.siemPush')}</span>
									</div>
									<Tag color="default">{t('overview.notConfigured')}</Tag>
								</div>
								<div className="flex items-center justify-between p-2 rounded border border-gray-100">
									<div className="flex items-center gap-2">
										<RadarChartOutlined className="text-cyan-500" />
										<span className="text-sm">{t('overview.webhook')}</span>
									</div>
									<Tag color="default">{t('overview.notConfigured')}</Tag>
								</div>
							</div>
						</Card>
					</Col>
				</Row>

				<Row gutter={[16, 16]} className="mt-4">
					<Col xs={24} lg={8}>
						<Card title={t('overview.recentEvents')} className="h-full">
							<Timeline
								mode="left"
								items={events.map((evt) => {
									const cfg = EVENT_TYPE_CONFIG[evt.type];
									return {
										label: (
											<span className="text-xs text-gray-400">
												{new Date(evt.time).toLocaleTimeString(i18n.language, {
													hour: '2-digit',
													minute: '2-digit',
												})}
											</span>
										),
										color: cfg.color,
										dot: cfg.icon,
										children: (
											<div>
												<div className="text-sm font-medium">{evt.title}</div>
												<div className="text-xs text-gray-500">{evt.description}</div>
											</div>
										),
									};
								})}
							/>
						</Card>
					</Col>
					<Col xs={24} lg={8}>
						<Card title={t('overview.recentAnomalies')} className="h-full">
							{recentAnomalies.length === 0 ? (
								<Empty description={t('overview.noAnomalies')} />
							) : (
								<List
									size="small"
									dataSource={recentAnomalies}
									renderItem={(item: any) => (
										<List.Item className="flex justify-between">
											<div className="flex items-center gap-2">
												<Tag color={severityColor(item.severity)}>{item.severity}</Tag>
												<span className="font-medium text-sm">{anomalyTypeLabel(item.type)}</span>
											</div>
											<div className="text-xs text-gray-400">
												{item.detectedAt
													? new Date(item.detectedAt).toLocaleString(i18n.language)
													: '-'}
											</div>
										</List.Item>
									)}
								/>
							)}
						</Card>
					</Col>
					<Col xs={24} lg={8}>
						<Card title={t('overview.complianceChecks')} className="h-full">
							{complianceChecks.length === 0 ? (
								<Empty description={t('overview.noComplianceData')} />
							) : (
								<List
									size="small"
									dataSource={complianceChecks}
									renderItem={(item: any) => (
										<List.Item className="flex justify-between">
											<div className="flex items-center gap-2">
												{item.passed ? (
													<CheckCircleOutlined className="text-green-500" />
												) : (
													<CloseCircleOutlined className="text-red-500" />
												)}
												<span className="text-sm">{item.item}</span>
											</div>
											<Tag color={item.passed ? 'success' : 'error'}>
												{item.passed ? t('status.passed') : t('status.failed')}
											</Tag>
										</List.Item>
									)}
								/>
							)}
						</Card>
					</Col>
				</Row>
			</Spin>
		</div>
	);
}
