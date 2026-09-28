'use client';

import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Spin, Typography } from 'antd';
import { WarningOutlined, SafetyOutlined, AlertOutlined, RiseOutlined } from '@ant-design/icons';
import { getRiskDashboard } from '@/lib/api';
import { PageHeader } from '@autional-cn/ui';

const { Title } = Typography;

interface RiskRange {
	range: string;
	count: number;
}

interface EventType {
	eventType: string;
	count: number;
}

interface RiskUser {
	userId: string;
	maxScore: number;
	avgScore: number;
	count: number;
}

interface DayCount {
	date: string;
	count: number;
}

interface DashboardData {
	tenantId: string;
	todayTotal: number;
	scoreRanges: RiskRange[];
	topEventTypes: EventType[];
	topRiskUsers: RiskUser[];
	dayCounts: DayCount[];
}

const levelColors: Record<string, string> = {
	critical: 'red',
	high: 'orange',
	medium: 'gold',
	low: 'green',
	normal: 'default',
};

const eventColumns = [
	{
		title: '事件类型',
		dataIndex: 'eventType',
		key: 'eventType',
		render: (t: string) => <Tag>{t}</Tag>,
	},
	{ title: '次数', dataIndex: 'count', key: 'count' },
];

const userColumns = [
	{
		title: '用户 ID',
		dataIndex: 'userId',
		key: 'userId',
		render: (id: string) => id.substring(0, 10) + '...',
	},
	{
		title: '最高分',
		dataIndex: 'maxScore',
		key: 'maxScore',
		render: (s: number) => <Tag color={s >= 80 ? 'red' : 'orange'}>{s}</Tag>,
	},
	{
		title: '平均分',
		dataIndex: 'avgScore',
		key: 'avgScore',
		render: (s: number) => Math.round(s),
	},
	{ title: '事件数', dataIndex: 'count', key: 'count' },
];

export default function RiskDashboardPage() {
	const [data, setData] = useState<DashboardData | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getRiskDashboard()
			.then(setData)
			.catch(() => {})
			.finally(() => setLoading(false));
	}, []);

	if (loading) return <Spin style={{ display: 'block', margin: '80px auto' }} />;

	const criticalCount = data?.scoreRanges.find((r) => r.range === 'critical')?.count || 0;
	const highCount = data?.scoreRanges.find((r) => r.range === 'high')?.count || 0;

	return (
		<div>
			<PageHeader
				title="风险仪表盘"
				subtitle="租户风险全景视图 — 今日事件 / 评分分布 / 高风险用户 Top 5"
			/>

			<Row gutter={16} style={{ marginBottom: 24 }}>
				<Col span={6}>
					<Card>
						<Statistic title="今日事件" value={data?.todayTotal || 0} prefix={<AlertOutlined />} />
					</Card>
				</Col>
				<Col span={6}>
					<Card>
						<Statistic
							title="严重事件"
							value={criticalCount}
							valueStyle={{ color: 'var(--color-danger-text)' }}
							prefix={<WarningOutlined />}
						/>
					</Card>
				</Col>
				<Col span={6}>
					<Card>
						<Statistic
							title="高风险事件"
							value={highCount}
							valueStyle={{ color: '#fa8c16' }}
							prefix={<RiseOutlined />}
						/>
					</Card>
				</Col>
				<Col span={6}>
					<Card>
						<Statistic
							title="信号维度"
							value={data?.scoreRanges.length || 0}
							prefix={<SafetyOutlined />}
						/>
					</Card>
				</Col>
			</Row>

			<Row gutter={16}>
				<Col span={12}>
					<Card title="评分分布" style={{ marginBottom: 16 }}>
						{(data?.scoreRanges || []).map((r) => (
							<div key={r.range} style={{ marginBottom: 8 }}>
								<Tag color={levelColors[r.range] || 'default'}>{r.range}</Tag>
								<span style={{ marginLeft: 8, fontWeight: 'bold' }}>{r.count}</span>
							</div>
						))}
					</Card>
				</Col>
				<Col span={12}>
					<Card title="高频事件类型" style={{ marginBottom: 16 }}>
						<Table
							dataSource={data?.topEventTypes || []}
							columns={eventColumns}
							rowKey="eventType"
							pagination={false}
							size="small"
						/>
					</Card>
				</Col>
			</Row>

			<Card title="高风险用户 Top 5 (近 7 天)" style={{ marginBottom: 16 }}>
				<Table
					dataSource={data?.topRiskUsers || []}
					columns={userColumns}
					rowKey="userId"
					pagination={false}
					size="small"
				/>
			</Card>

			<Card title="7 日趋势">
				<div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 120 }}>
					{(data?.dayCounts || []).map((d) => {
						const maxCount = Math.max(...(data?.dayCounts || []).map((x) => x.count), 1);
						const height = Math.max((d.count / maxCount) * 100, 4);
						const isToday = d.date === new Date().toISOString().split('T')[0];
						return (
							<div key={d.date} style={{ flex: 1, textAlign: 'center' }}>
								<div
									style={{
										height: `${height}px`,
										background: isToday ? '#1677ff' : '#91caff',
										borderRadius: '4px 4px 0 0',
										marginBottom: 4,
									}}
								/>
								<span style={{ fontSize: 10 }}>{d.date.substring(5)}</span>
							</div>
						);
					})}
					{!data?.dayCounts?.length && <span>暂无数据</span>}
				</div>
			</Card>
		</div>
	);
}
