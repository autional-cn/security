'use client';

import React, { useState } from 'react';
import { DataTable } from '@autional-cn/ui/antd';
import type { DataTableColumns } from '@autional-cn/ui/antd';
import { ConsolePageHeader } from '@autional-cn/ui';
import { Card, Button, Tag, Spin, Empty, Space, Row, Col, Statistic, Alert, Input, Tabs, Descriptions, Typography } from 'antd';
import {
	CheckCircleOutlined,
	CloseCircleOutlined,
	ReloadOutlined,
	SafetyCertificateOutlined,
	FileSearchOutlined,
	ClusterOutlined,
} from '@ant-design/icons';

import dayjs from 'dayjs';
import { useAuth } from '@autional-cn/shared';
import {
	useHashChain,
	useMerkleRoot,
	useMerkleProof,
} from '@/hooks/use-security-queries';
import type { HashChainSnapshot } from '@/hooks/use-security-queries';
import { message } from '@/lib/antd-app';
import { useTranslation } from 'react-i18next';

// A1/S-01（2026-10-04）：本页只呈现当前租户的链快照；
// 全平台聚合视图（GET /verifications）为平台面端点，租户面不再调取。
export default function HashChainPage() {
	const { t } = useTranslation();
	const { currentTenantId } = useAuth();
	const [activeTab, setActiveTab] = useState('hashchain');
	const [merkleProofId, setMerkleProofId] = useState('');
	const [merkleProofResult, setMerkleProofResult] = useState<any>(null);

	const { data: chain, isLoading, isFetching, refetch } = useHashChain(currentTenantId);
	const { data: merkleRoot, isLoading: merkleLoading, refetch: refetchMerkle } = useMerkleRoot();
	const proofMutation = useMerkleProof();

	const chainRows: HashChainSnapshot[] = chain ? [chain] : [];

	const handleRefresh = async () => {
		const res = await refetch();
		if (res.isError) {
			message.error(t('hashChain.verifyFailed'));
			return;
		}
		message.success(t('hashChain.refreshDone'));
	};

	const fetchMerkleRoot = async () => {
		try {
			await refetchMerkle();
		} catch {
			message.error(t('hashChain.merkleRootError'));
		}
	};

	const fetchMerkleProof = async () => {
		if (!merkleProofId.trim()) {
			message.warning(t('hashChain.merkleProofInputWarning'));
			return;
		}
		if (!currentTenantId) {
			message.warning(t('hashChain.tenantMissing'));
			return;
		}
		try {
			const res = await proofMutation.mutateAsync({
				tenantId: currentTenantId,
				entryId: merkleProofId,
			});
			setMerkleProofResult(res);
			message.success(t('hashChain.merkleProofSuccess'));
		} catch {
			message.error(t('hashChain.merkleProofError'));
		}
	};

	const columns: DataTableColumns<HashChainSnapshot> = [
		{ title: t('hashChain.columnTenantId'), dataIndex: 'tenantId', width: 200, ellipsis: true },
		{
			title: t('hashChain.columnChainId'),
			dataIndex: 'chainId',
			width: 180,
			ellipsis: true,
			render: (v?: string) => v || '-',
		},
		{
			title: t('hashChain.columnStatus'),
			dataIndex: 'isValid',
			width: 120,
			render: (v?: boolean) =>
				v === undefined ? (
					'-'
				) : v ? (
					<Tag color="success" icon={<CheckCircleOutlined />}>
						{t('hashChain.statusValid')}
					</Tag>
				) : (
					<Tag color="error" icon={<CloseCircleOutlined />}>
						{t('hashChain.statusAbnormal')}
					</Tag>
				),
		},
		{
			title: t('hashChain.statLogCount'),
			dataIndex: 'logCount',
			width: 120,
			render: (v?: number) => v ?? '-',
		},
		{
			title: t('hashChain.columnLastHash'),
			dataIndex: 'endHash',
			ellipsis: true,
			render: (v?: string) => v || '-',
		},
		{
			title: t('hashChain.columnValidatedAt'),
			dataIndex: 'verifiedAt',
			width: 180,
			render: (v?: number) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-'),
		},
		{
			title: t('hashChain.columnErrorMessage'),
			dataIndex: 'message',
			render: (v?: string) => (v ? <span className="text-danger-text">{v}</span> : '-'),
		},
	];

	const hashChainTab = (
		<div>
			{chain?.isValid === false && (
				<Alert
					message={t('hashChain.alertBroken')}
					description={chain.message}
					type="error"
					showIcon
					className="mb-4"
				/>
			)}

			<Row gutter={[16, 16]} className="mb-4">
				<Col xs={24} sm={8}>
					<Card>
						<Statistic
							title={t('hashChain.statChainState')}
							value={
								chain?.isValid === undefined
									? '-'
									: chain.isValid
										? t('hashChain.statusValid')
										: t('hashChain.statusAbnormal')
							}
							prefix={
								chain?.isValid === false ? (
									<CloseCircleOutlined className="text-danger" />
								) : (
									<CheckCircleOutlined className="text-success" />
								)
							}
						/>
					</Card>
				</Col>
				<Col xs={24} sm={8}>
					<Card>
						<Statistic
							title={t('hashChain.statLogCount')}
							value={chain?.logCount ?? '-'}
							prefix={<SafetyCertificateOutlined className="text-info" />}
						/>
					</Card>
				</Col>
				<Col xs={24} sm={8}>
					<Card>
						<Statistic
							title={t('hashChain.statVerifiedAt')}
							value={
								chain?.verifiedAt ? dayjs(chain.verifiedAt).format('YYYY-MM-DD HH:mm:ss') : '-'
							}
						/>
					</Card>
				</Col>
			</Row>

			<Card className="mb-4">
				<Space>
					<Typography.Text type="secondary">
						{t('hashChain.currentTenant', { tenant: currentTenantId || '-' })}
					</Typography.Text>
					<Button icon={<ReloadOutlined />} loading={isFetching} onClick={handleRefresh}>
						{t('hashChain.refreshBtn')}
					</Button>
				</Space>
			</Card>

			<Spin spinning={isLoading}>
				<DataTable
					columns={columns}
					dataSource={chainRows}
					rowKey="tenantId"
					pagination={false}
					locale={{ emptyText: <Empty description={t('hashChain.empty')} /> }}
				/>
			</Spin>
		</div>
	);

	const merkleTab = (
		<div>
			<Row gutter={[16, 16]} className="mb-4">
				<Col xs={24} lg={12}>
					<Card
						title={t('hashChain.merkleRootTitle')}
						extra={
							<Button icon={<ReloadOutlined />} loading={merkleLoading} onClick={fetchMerkleRoot}>
								{t('hashChain.merkleFetchBtn')}
							</Button>
						}
					>
						<Typography.Paragraph copyable className="font-mono text-sm break-all">
							{merkleRoot || t('hashChain.merkleRootPlaceholder')}
						</Typography.Paragraph>
					</Card>
				</Col>
				<Col xs={24} lg={12}>
					<Card title={t('hashChain.merkleProofTitle')}>
						<Space direction="vertical" className="w-full">
							<Input
								placeholder={t('hashChain.merkleProofInputPlaceholder')}
								value={merkleProofId}
								onChange={(e) => setMerkleProofId(e.target.value)}
							/>
							<Button
								type="primary"
								icon={<FileSearchOutlined />}
								loading={proofMutation.isPending}
								onClick={fetchMerkleProof}
							>
								{t('hashChain.merkleProofBtn')}
							</Button>
						</Space>
						{merkleProofResult && (
							<Descriptions column={1} bordered className="mt-4" size="small">
								<Descriptions.Item label={t('hashChain.merkleProofLogId')}>
									{merkleProofResult.logId || merkleProofId}
								</Descriptions.Item>
								<Descriptions.Item label={t('hashChain.merkleProofRootHash')}>
									{merkleProofResult.rootHash || '-'}
								</Descriptions.Item>
								<Descriptions.Item label={t('hashChain.merkleProofLeafHash')}>
									{merkleProofResult.leafHash || '-'}
								</Descriptions.Item>
								<Descriptions.Item label={t('hashChain.merkleProofResult')}>
									{merkleProofResult.valid !== undefined ? (
										merkleProofResult.valid ? (
											<Tag color="success">{t('hashChain.merkleProofPassed')}</Tag>
										) : (
											<Tag color="error">{t('hashChain.merkleProofFailed')}</Tag>
										)
									) : (
										'-'
									)}
								</Descriptions.Item>
							</Descriptions>
						)}
					</Card>
				</Col>
			</Row>

			<Alert
				message={t('hashChain.merkleAlertTitle')}
				description={t('hashChain.merkleAlertDescription')}
				type="info"
				showIcon
				icon={<ClusterOutlined />}
			/>
		</div>
	);

	return (
		<div>
			<ConsolePageHeader title={t('hashChain.title')} />

			<Tabs
				activeKey={activeTab}
				onChange={setActiveTab}
				items={[
					{ key: 'hashchain', label: t('hashChain.hashChainTab'), children: hashChainTab },
					{ key: 'merkle', label: t('hashChain.merkleTab'), children: merkleTab },
				]}
			/>
		</div>
	);
}
