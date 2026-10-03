'use client';

import React, { useState } from 'react';
import { DataTable } from '@autional-cn/ui/antd';
import { Card, Tag, Button, Space, message, Typography, Row, Col, Statistic, Modal, Form, DatePicker, Alert, Timeline } from 'antd';
import {
	HistoryOutlined,
	SafetyOutlined,
	FileZipOutlined,
	CloudUploadOutlined,
	SyncOutlined,
	PlayCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAuth } from '@autional-cn/shared';
import { useArchives, useTriggerArchive, useHashChain } from '@/hooks/use-security-queries';
import { useTranslation } from 'react-i18next';
import { Can } from '@/components/Can';

const { Title, Text } = Typography;

type ArchiveRecord = {
	id: string;
	tenantId: string;
	dateRange: string;
	recordsCount: number;
	storagePath?: string;
	status: string;
	createdAt: string;
	completedAt?: string;
	hash?: string;
};

export default function ArchivesPage() {
	const { t } = useTranslation();

	const statusMap: Record<string, { color: string; label: string }> = {
		pending: { color: 'orange', label: t('archives.statusPending') },
		processing: { color: 'blue', label: t('archives.statusProcessing') },
		archived: { color: 'green', label: t('archives.statusArchived') },
		failed: { color: 'red', label: t('archives.statusFailed') },
	};

	const [modalVisible, setModalVisible] = useState(false);
	const [triggerLoading, setTriggerLoading] = useState(false);

	const { currentTenantId } = useAuth();
	const { data: archives = [], isLoading } = useArchives();
	// A1/S-01（2026-10-04）：链快照改本租户端点，不再消费全平台验证列表。
	const { data: chain } = useHashChain(currentTenantId);
	const triggerMutation = useTriggerArchive();

	const archivedCount = archives.filter((a: any) => a.status === 'archived').length;
	const totalRecords = archives.reduce((sum: number, a: any) => sum + (a.recordsCount || 0), 0);

	const handleTriggerArchive = async (values: any) => {
		setTriggerLoading(true);
		try {
			const beforeDate = values.beforeDate?.format('YYYY-MM-DD');
			await triggerMutation.mutateAsync({ beforeDate });
			message.success(t('archives.triggerSuccess'));
			setModalVisible(false);
		} catch (err: any) {
			message.error(err?.message || t('archives.triggerFailed'));
		} finally {
			setTriggerLoading(false);
		}
	};

	const columns: ColumnsType<ArchiveRecord> = [
		{ title: t('archives.columnId'), dataIndex: 'id', width: 120 },
		{ title: t('archives.columnTenantId'), dataIndex: 'tenantId', ellipsis: true },
		{ title: t('archives.columnDateRange'), dataIndex: 'dateRange' },
		{
			title: t('archives.columnRecordsCount'),
			dataIndex: 'recordsCount',
			width: 100,
			render: (v: number) => v?.toLocaleString() || 0,
		},
		{
			title: t('archives.columnStatus'),
			dataIndex: 'status',
			width: 100,
			render: (v: string) => {
				const s = statusMap[v] || { color: 'default', label: v };
				return <Tag color={s.color}>{s.label}</Tag>;
			},
		},
		{
			title: t('archives.columnCreatedAt'),
			dataIndex: 'createdAt',
			width: 180,
			render: (v: string) => new Date(v).toLocaleString(),
		},
		{
			title: t('archives.columnCompletedAt'),
			dataIndex: 'completedAt',
			width: 180,
			render: (v: string) => (v ? new Date(v).toLocaleString() : '-'),
		},
		{
			title: t('archives.columnHash'),
			dataIndex: 'hash',
			width: 160,
			ellipsis: true,
			render: (v: string) => v || '-',
		},
	];

	return (
		<Can denyAuditor>
			<div>
				<Title level={3}>{t('archives.title')}</Title>
				<Text type="secondary">{t('archives.subtitle')}</Text>

				<Row gutter={16} className="mt-4 mb-4">
					<Col span={6}>
						<Card>
							<Statistic
								title={t('archives.statArchivedBatches')}
								value={archivedCount}
								valueStyle={{ color: 'var(--color-success)' }}
								prefix={<FileZipOutlined />}
							/>
						</Card>
					</Col>
					<Col span={6}>
						<Card>
							<Statistic
								title={t('archives.statTotalRecords')}
								value={totalRecords}
								prefix={<HistoryOutlined />}
							/>
						</Card>
					</Col>
					<Col span={6}>
						<Card>
							<Statistic
								title={t('archives.statPending')}
								value={archives.filter((a: any) => a.status === 'pending').length}
								valueStyle={{ color: 'var(--color-warning)' }}
								prefix={<CloudUploadOutlined />}
							/>
						</Card>
					</Col>
					<Col span={6}>
						<Card>
							<Statistic
								title={t('archives.statVerificationPassed')}
								value={chain?.isValid === undefined ? '-' : chain.isValid ? 1 : 0}
								valueStyle={{ color: 'var(--color-success)' }}
								prefix={<SafetyOutlined />}
							/>
						</Card>
					</Col>
				</Row>

				<Alert
					message={t('archives.alertTitle')}
					description={t('archives.alertDescription')}
					type="info"
					showIcon
					className="mb-4"
				/>

				<Card
					title={t('archives.listTitle')}
					extra={
						<Space>
							<Button
								type="primary"
								icon={<PlayCircleOutlined />}
								onClick={() => setModalVisible(true)}
							>
								{t('archives.triggerArchive')}
							</Button>
						</Space>
					}
				>
					<DataTable
						rowKey="id"
						columns={columns}
						dataSource={archives}
						loading={isLoading}
						pagination={{
							showSizeChanger: true,
							showTotal: (cnt) => t('common.total', { count: cnt }),
						}}
						scroll={{ x: 900 }}
					/>
				</Card>

				{chain && (
					<Card title={t('archives.recentVerifications')} className="mt-4">
						<Timeline
							items={[
								{
									color: chain.isValid === false ? 'red' : 'green',
									children: (
										<div>
											<Text strong>
												{chain.isValid === false
													? t('archives.verificationFailed')
													: t('archives.verificationPassed')}
											</Text>
											<div className="text-xs text-neutral-600">
												{chain.verifiedAt
													? new Date(chain.verifiedAt).toLocaleString()
													: '-'}{' '}
												· {t('archives.columnTenantId')}{' '}
												{chain.tenantId || currentTenantId || '-'}
											</div>
											{chain.message && (
												<div className="text-xs mt-1">{chain.message}</div>
											)}
										</div>
									),
								},
							]}
						/>
					</Card>
				)}

				<Modal
					title={t('archives.triggerModalTitle')}
					open={modalVisible}
					onCancel={() => setModalVisible(false)}
					footer={null}
				>
					<Form layout="vertical" onFinish={handleTriggerArchive}>
						<Form.Item
							name="beforeDate"
							label={t('archives.triggerDateLabel')}
							rules={[{ required: true, message: t('archives.triggerDateRequired') }]}
						>
							<DatePicker
								style={{ width: '100%' }}
								placeholder={t('archives.triggerDatePlaceholder')}
							/>
						</Form.Item>
						<Form.Item>
							<Space>
								<Button
									type="primary"
									htmlType="submit"
									loading={triggerLoading}
									icon={<PlayCircleOutlined />}
								>
									{t('archives.confirmTrigger')}
								</Button>
								<Button onClick={() => setModalVisible(false)}>{t('common.cancel')}</Button>
							</Space>
						</Form.Item>
					</Form>
				</Modal>
			</div>
		</Can>
	);
}
