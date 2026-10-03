'use client';

import React, { useState } from 'react';
import { DataTable } from '@autional-cn/ui/antd';
import type { DataTableColumns } from '@autional-cn/ui/antd';
import { Card, Button, Tag, Spin, Empty, Space, Row, Col, Statistic, Input, Modal } from 'antd';
import {
	ClusterOutlined,
	StopOutlined,
	SearchOutlined,
	ReloadOutlined,
	ExclamationCircleOutlined,
} from '@ant-design/icons';

import dayjs from 'dayjs';
import { useSessions, useActiveSessions, useTerminateSession } from '@/hooks/use-security-queries';
import { message } from '@/lib/antd-app';
import { useTranslation } from 'react-i18next';
import { Can } from '@/components/Can';

interface SessionItem {
	id: string;
	userId: string;
	username: string;
	ipAddress: string;
	device: string;
	browser: string;
	location: string;
	riskScore: number;
	createdAt: string;
	lastActiveAt: string;
}

export default function SessionsPage() {
	const { t } = useTranslation();
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(20);
	const [keyword, setKeyword] = useState('');

	const { data, isLoading, refetch } = useSessions({ page, pageSize, keyword });
	const { data: activeCountData, refetch: refetchActive } = useActiveSessions();
	const terminateMutation = useTerminateSession();

	const items = (data as any)?.items || [];
	const total = (data as any)?.total || (data as any)?.pagination?.total || items.length;
	const activeCount = (activeCountData as any)?.count || (activeCountData as any)?.data?.count || 0;

	const handleTerminate = async (id: string) => {
		Modal.confirm({
			title: t('sessions.confirmTitle'),
			icon: <ExclamationCircleOutlined />,
			content: t('sessions.confirmContent'),
			okText: t('sessions.confirmOk'),
			cancelText: t('common.cancel'),
			okButtonProps: { danger: true },
			onOk: async () => {
				try {
					await terminateMutation.mutateAsync({ id });
					message.success(t('sessions.successTerminate'));
				} catch {
					message.error(t('sessions.failTerminate'));
				}
			},
		});
	};

	const riskColor = (score: number) => {
		if (score >= 80) return 'red';
		if (score >= 50) return 'orange';
		if (score >= 20) return 'gold';
		return 'green';
	};

	const columns: DataTableColumns<SessionItem> = [
		{ title: t('sessions.columnId'), dataIndex: 'id', width: 200 },
		{ title: t('sessions.columnUser'), dataIndex: 'username', width: 140 },
		{ title: t('sessions.columnUserId'), dataIndex: 'userId', width: 140 },
		{ title: t('sessions.columnIp'), dataIndex: 'ipAddress', width: 140 },
		{ title: t('sessions.columnDevice'), dataIndex: 'device', width: 140 },
		{ title: t('sessions.columnBrowser'), dataIndex: 'browser', width: 140 },
		{ title: t('sessions.columnLocation'), dataIndex: 'location', width: 140 },
		{
			title: t('sessions.columnRiskScore'),
			dataIndex: 'riskScore',
			width: 110,
			render: (v: number) => <Tag color={riskColor(v)}>{v}</Tag>,
		},
		{
			title: t('sessions.columnCreatedAt'),
			dataIndex: 'createdAt',
			width: 180,
			render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-'),
		},
		{
			title: t('sessions.columnLastActive'),
			dataIndex: 'lastActiveAt',
			width: 180,
			render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-'),
		},
		{
			title: t('sessions.columnActions'),
			width: 120,
			fixed: 'right',
			render: (_: any, record: SessionItem) => (
				<Button
					size="small"
					danger
					icon={<StopOutlined />}
					onClick={() => handleTerminate(record.id)}
				>
					{t('sessions.terminate')}
				</Button>
			),
		},
	];

	return (
		<Can denyAuditor>
			<div>
				<div className="flex items-center justify-between mb-4">
					<h1 className="text-xl font-semibold">{t('sessions.title')}</h1>
					<Button
						icon={<ReloadOutlined />}
						onClick={() => {
							refetch();
							refetchActive();
						}}
					>
						{t('common.refresh')}
					</Button>
				</div>

				<Row gutter={[16, 16]} className="mb-4">
					<Col xs={24} sm={8}>
						<Card>
							<Statistic
								title={t('sessions.activeSessions')}
								value={activeCount}
								prefix={<ClusterOutlined className="text-cyan-500" />}
							/>
						</Card>
					</Col>
					<Col xs={24} sm={8}>
						<Card>
							<Statistic
								title={t('sessions.highRiskSessions')}
								value={items.filter((s: any) => s.riskScore >= 80).length}
								prefix={<StopOutlined className="text-red-500" />}
							/>
						</Card>
					</Col>
					<Col xs={24} sm={8}>
						<Card>
							<Statistic
								title={t('sessions.totalSessions')}
								value={total}
								prefix={<ClusterOutlined className="text-blue-500" />}
							/>
						</Card>
					</Col>
				</Row>

				<Card className="mb-4">
					<Space>
						<Input
							placeholder={t('sessions.searchPlaceholder')}
							value={keyword}
							onChange={(e) => setKeyword(e.target.value)}
							style={{ width: 280 }}
							onPressEnter={() => setPage(1)}
						/>
						<Button type="primary" icon={<SearchOutlined />} onClick={() => setPage(1)}>
							{t('common.search')}
						</Button>
						<Button
							onClick={() => {
								setKeyword('');
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
						scroll={{ x: 1400 }}
						locale={{ emptyText: <Empty description={t('sessions.empty')} /> }}
					/>
				</Spin>
			</div>
		</Can>
	);
}
