'use client';

import React, { useState } from 'react';
import { Card, Button, Space, message, Typography, Row, Col, Statistic, Modal, Form, DatePicker, Alert, Timeline } from 'antd';
import {
	HistoryOutlined,
	SafetyOutlined,
	FileZipOutlined,
	SyncOutlined,
	PlayCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '@autional-cn/shared';
import { useArchiveStatus, useTriggerArchive, useHashChain } from '@/hooks/use-security-queries';
import { useTranslation } from 'react-i18next';
import { Can } from '@/components/Can';

const { Title, Text } = Typography;

export default function ArchivesPage() {
	const { t } = useTranslation();

	const [modalVisible, setModalVisible] = useState(false);
	const [triggerLoading, setTriggerLoading] = useState(false);

	const { currentTenantId } = useAuth();
	// S-59（2026-10-04）：归档域无批次列表端点，只渲染状态端点（enabled/days/last_archive）。
	const { data: archiveStatus } = useArchiveStatus();
	// A1/S-01（2026-10-04）：链快照改本租户端点，不再消费全平台验证列表。
	const { data: chain } = useHashChain(currentTenantId);
	const triggerMutation = useTriggerArchive();

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

	return (
		<Can denyAuditor>
			<div>
				<Title level={3}>{t('archives.title')}</Title>
				<Text type="secondary">{t('archives.subtitle')}</Text>

				<Row gutter={16} className="mt-4 mb-4">
					<Col span={6}>
						<Card>
							<Statistic
								title={t('archives.statEnabled')}
								value={
									archiveStatus
										? archiveStatus.enabled
											? t('archives.enabled')
											: t('archives.disabled')
										: '-'
								}
								valueStyle={
									archiveStatus
										? {
												color: archiveStatus.enabled
													? 'var(--color-success)'
													: 'var(--color-warning)',
											}
										: undefined
								}
								prefix={<FileZipOutlined />}
							/>
						</Card>
					</Col>
					<Col span={6}>
						<Card>
							<Statistic
								title={t('archives.statRetentionDays')}
								value={archiveStatus?.days ?? '-'}
								suffix={archiveStatus ? t('archives.daysUnit') : undefined}
								prefix={<HistoryOutlined />}
							/>
						</Card>
					</Col>
					<Col span={6}>
						<Card>
							<Statistic
								title={t('archives.statLastArchive')}
								value={
									!archiveStatus
										? '-'
										: typeof archiveStatus.lastArchive === 'number' && archiveStatus.lastArchive > 0
											? new Date(archiveStatus.lastArchive).toLocaleString()
											: t('archives.neverArchived')
								}
								prefix={<SyncOutlined />}
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
					action={
						<Button
							type="primary"
							icon={<PlayCircleOutlined />}
							onClick={() => setModalVisible(true)}
						>
							{t('archives.triggerArchive')}
						</Button>
					}
				/>

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
