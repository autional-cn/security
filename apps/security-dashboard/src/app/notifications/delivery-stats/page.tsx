import React, { useMemo, useState } from 'react';
import { Card, Col, Row, Statistic, Spin, Empty, Button, Tag } from 'antd';
import {
	BellOutlined,
	CheckCircleOutlined,
	CloseCircleOutlined,
	ClockCircleOutlined,
	ReloadOutlined,
	MailOutlined,
	MessageOutlined,
	SendOutlined,
} from '@ant-design/icons';
import {
	PieChart,
	Pie,
	Cell,
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	BarChart,
	Bar,
	Legend,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { GeneratedApi } from '@autional-cn/shared';
import { ConsolePageHeader } from '@autional-cn/ui';

const {
	adminNotificationsPlatformStats,
	notificationsReadReport,
	adminCommunicationPlatformStats,
} = GeneratedApi;

// delivered / failed / pending 是语义分类，不是并列数据系列 —— 按 $chart-note 的规矩用语义色
const PIE_COLORS = ['var(--color-success)', 'var(--color-danger)', 'var(--color-warning)'];
const CHANNEL_COLORS: Record<string, string> = {
	email: 'var(--color-chart-1)',
	sms: 'var(--color-chart-2)',
	push: 'var(--color-chart-3)',
};

export default function DeliveryStatsPage() {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(false);
	const [notifStats, setNotifStats] = useState<any>(null);
	const [readReport, setReadReport] = useState<any>(null);
	const [commStats, setCommStats] = useState<any>(null);

	const fetchData = async () => {
		setLoading(true);
		try {
			const res = await adminNotificationsPlatformStats();
			setNotifStats(res?.data || res);
		} catch {
			setNotifStats(null);
		}
		try {
			const res = await notificationsReadReport();
			setReadReport(res?.data || res);
		} catch {
			setReadReport(null);
		}
		try {
			const res = await adminCommunicationPlatformStats();
			setCommStats(res?.data || res);
		} catch {
			setCommStats(null);
		}
		setLoading(false);
	};

	React.useEffect(() => {
		fetchData();
	}, []);

	const deliveryData = useMemo(() => {
		const total = notifStats?.total_sent || notifStats?.totalSent || 0;
		const delivered = notifStats?.delivered || 0;
		const failed = notifStats?.failed || 0;
		const pending = Math.max(0, total - delivered - failed);
		if (total === 0 && delivered === 0) return [];
		return [
			{ name: t('notification.delivered'), value: delivered, color: 'var(--color-success)' },
			{ name: t('notification.failed'), value: failed, color: 'var(--color-danger)' },
			{ name: t('notification.pending'), value: pending, color: 'var(--color-warning)' },
		].filter((d) => d.value > 0);
	}, [notifStats, t]);

	const readTrendData = useMemo(() => {
		const timeline = readReport?.timeline || readReport?.read_timeline || [];
		return timeline.map((pt: any) => ({
			date: pt.date || pt.timestamp || '',
			readRate: pt.read_rate || pt.readRate || 0,
		}));
	}, [readReport]);

	const channelBreakdown = useMemo(() => {
		const channels = commStats?.by_channel || commStats?.byChannel || {};
		return Object.entries(channels).map(([name, value]) => ({
			name,
			value: value as number,
			// 兜底色改用设计系统的弱化文字色（原来的 #6b7280 是 Tailwind gray-500，
			// 与设计系统里任何一档都不对应——中性灰正好落在颜色闸门的取舍之外）。
			fill: CHANNEL_COLORS[name] || 'var(--color-text-muted)',
		}));
	}, [commStats]);

	const notifTotal = notifStats?.total_sent || notifStats?.totalSent || 0;
	const readCount = readReport?.read_count || readReport?.readCount || 0;
	const readRateVal = readReport?.read_rate || readReport?.readRate || 0;
	const unreadCount = readReport?.unread_count || readReport?.unreadCount || 0;

	const channelLabels: Record<string, string> = {
		email: t('common.email'),
		sms: t('common.sms'),
		push: t('common.push'),
	};

	const channelIcons: Record<string, React.ReactNode> = {
		email: <MailOutlined />,
		sms: <MessageOutlined />,
		push: <SendOutlined />,
	};

	return (
		<div>
			<ConsolePageHeader
				title={t('notification.deliveryStats')}
				actions={
					<>
						<Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
							{t('common.refresh')}
						</Button>
					</>
				}
			/>

			<Spin spinning={loading}>
				<Row gutter={[16, 16]}>
					<Col xs={24} sm={12} lg={6}>
						<Card>
							<Statistic
								title={t('notification.totalSent')}
								value={notifTotal}
								prefix={<BellOutlined className="text-blue-500" />}
							/>
						</Card>
					</Col>
					<Col xs={24} sm={12} lg={6}>
						<Card>
							<Statistic
								title={t('notification.totalRead')}
								value={readCount}
								prefix={<CheckCircleOutlined className="text-emerald-500" />}
							/>
						</Card>
					</Col>
					<Col xs={24} sm={12} lg={6}>
						<Card>
							<Statistic
								title={t('notification.totalUnread')}
								value={unreadCount}
								prefix={<ClockCircleOutlined className="text-amber-500" />}
							/>
						</Card>
					</Col>
					<Col xs={24} sm={12} lg={6}>
						<Card>
							<div className="flex items-center justify-between mb-2">
								<span className="text-sm text-neutral-600">{t('notification.readRate')}</span>
								<CheckCircleOutlined className="text-blue-500" />
							</div>
							<div className="text-2xl font-semibold text-neutral-900 dark:text-white">
								{readRateVal != null ? `${(Number(readRateVal) * 100).toFixed(1)}%` : '--'}
							</div>
							<div className="mt-2">
								<Tag
									color={
										Number(readRateVal) >= 0.5
											? 'success'
											: Number(readRateVal) >= 0.2
												? 'warning'
												: 'error'
									}
								>
									{Number(readRateVal) >= 0.5
										? t('notification.excellent')
										: Number(readRateVal) >= 0.2
											? t('notification.average')
											: t('notification.needsAttention')}
								</Tag>
							</div>
						</Card>
					</Col>
				</Row>

				<Row gutter={[16, 16]} className="mt-4">
					<Col xs={24} lg={8}>
						<Card title={t('notification.deliveryStatus')} className="h-full">
							{deliveryData.length > 0 ? (
								<ResponsiveContainer width="100%" height={280}>
									<PieChart>
										<Pie
											data={deliveryData}
											cx="50%"
											cy="50%"
											innerRadius={55}
											outerRadius={90}
											paddingAngle={3}
											dataKey="value"
											nameKey="name"
											label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
										>
											{deliveryData.map((entry, idx) => (
												<Cell key={`cell-${idx}`} fill={entry.color} />
											))}
										</Pie>
										<Tooltip />
									</PieChart>
								</ResponsiveContainer>
							) : (
								<Empty description={t('common.noData')} />
							)}
						</Card>
					</Col>
					<Col xs={24} lg={8}>
						<Card title={t('notification.readTrend')} className="h-full">
							{readTrendData.length > 0 ? (
								<ResponsiveContainer width="100%" height={280}>
									<LineChart data={readTrendData}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="date" fontSize={12} />
										<YAxis
											fontSize={12}
											tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
										/>
										<Tooltip formatter={(value) => `${((value as number) * 100).toFixed(1)}%`} />
										<Line
											type="monotone"
											dataKey="readRate"
											stroke="var(--color-primary-700)"
											strokeWidth={2}
											dot={false}
											name={t('notification.readRate')}
										/>
									</LineChart>
								</ResponsiveContainer>
							) : (
								<Empty description={t('common.noData')} />
							)}
						</Card>
					</Col>
					<Col xs={24} lg={8}>
						<Card title={t('notification.channelBreakdown')} className="h-full">
							{channelBreakdown.length > 0 ? (
								<ResponsiveContainer width="100%" height={280}>
									<BarChart data={channelBreakdown} layout="vertical">
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis type="number" fontSize={12} />
										<YAxis
											type="category"
											dataKey="name"
											fontSize={12}
											tickFormatter={(v) => channelLabels[v] || v}
										/>
										<Tooltip
											formatter={(value, name) => [
												value,
												channelLabels[name as string] || (name as string),
											]}
										/>
										<Bar dataKey="value" radius={[0, 4, 4, 0]}>
											{channelBreakdown.map((entry, idx) => (
												<Cell key={`cell-${idx}`} fill={entry.fill} />
											))}
										</Bar>
									</BarChart>
								</ResponsiveContainer>
							) : (
								<Empty description={t('common.noData')} />
							)}
						</Card>
					</Col>
				</Row>

				{commStats && (
					<Row gutter={[16, 16]} className="mt-4">
						<Col xs={24}>
							<Card title={t('notification.communicationPlatform')}>
								<Row gutter={[16, 16]}>
									{Object.entries(commStats.by_channel || commStats.byChannel || {}).map(
										([ch, count]) => (
											<Col xs={24} sm={8} lg={4} key={ch}>
												<Card size="small" className="text-center">
													<div className="text-2xl mb-1">
														{channelIcons[ch] || <SendOutlined />}
													</div>
													<div className="text-xs text-neutral-600">{channelLabels[ch] || ch}</div>
													<div className="text-xl font-bold mt-1">{count as number}</div>
												</Card>
											</Col>
										),
									)}
									<Col xs={24} sm={8} lg={4}>
										<Card size="small" className="text-center">
											<div className="text-2xl mb-1">
												<CheckCircleOutlined className="text-emerald-500" />
											</div>
											<div className="text-xs text-neutral-600">{t('notification.delivered')}</div>
											<div className="text-xl font-bold mt-1">{commStats.delivered || 0}</div>
										</Card>
									</Col>
									<Col xs={24} sm={8} lg={4}>
										<Card size="small" className="text-center">
											<div className="text-2xl mb-1">
												<CloseCircleOutlined className="text-red-500" />
											</div>
											<div className="text-xs text-neutral-600">{t('notification.failed')}</div>
											<div className="text-xl font-bold mt-1">{commStats.failed || 0}</div>
										</Card>
									</Col>
								</Row>
								{commStats.delivery_rate != null && (
									<div className="mt-4 flex items-center gap-2">
										<span className="text-sm text-neutral-600">{t('notification.deliveryRate')}:</span>
										<Tag color={commStats.delivery_rate >= 0.95 ? 'success' : 'warning'}>
											{(commStats.delivery_rate * 100).toFixed(1)}%
										</Tag>
									</div>
								)}
							</Card>
						</Col>
					</Row>
				)}
			</Spin>
		</div>
	);
}
