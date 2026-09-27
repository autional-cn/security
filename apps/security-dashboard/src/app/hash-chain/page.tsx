'use client';

import React, { useState, useMemo } from 'react';
import {
	Card,
	Table,
	Button,
	Tag,
	Spin,
	Empty,
	Space,
	Row,
	Col,
	Statistic,
	Alert,
	Input,
	Tabs,
	Descriptions,
	Typography,
} from 'antd';
import {
	CheckCircleOutlined,
	CloseCircleOutlined,
	ReloadOutlined,
	SafetyCertificateOutlined,
	FileSearchOutlined,
	ClusterOutlined,
} from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import dayjs from 'dayjs';
import {
	useVerificationResults,
	useVerifyAuditChain,
	useMerkleRoot,
	useMerkleProof,
} from '@/hooks/useSecurityQueries';
import { message } from '@/lib/antd-app';
import { useTranslation } from 'react-i18next';

interface VerificationItem {
	tenantId: string;
	valid: boolean;
	lastSequence: number;
	lastHash: string;
	entriesChecked: number;
	errorMessage?: string;
	validatedAt: number;
}

export default function HashChainPage() {
	const { t } = useTranslation();
	const [tenantId, setTenantId] = useState('');
	const [activeTab, setActiveTab] = useState('hashchain');
	const [merkleProofId, setMerkleProofId] = useState('');
	const [merkleProofResult, setMerkleProofResult] = useState<any>(null);

	const { data: verificationItems = [], isLoading } = useVerificationResults();
	const verifyMutation = useVerifyAuditChain();
	const { data: merkleRoot, isLoading: merkleLoading, refetch: refetchMerkle } = useMerkleRoot();
	const proofMutation = useMerkleProof();

	const stats = useMemo(() => {
		const items = verificationItems as VerificationItem[];
		return {
			total: items.length,
			valid: items.filter((i) => i.valid).length,
			invalid: items.filter((i) => !i.valid).length,
		};
	}, [verificationItems]);

	const handleVerify = async () => {
		if (!tenantId.trim()) {
			message.warning(t('hashChain.verifyInputWarning'));
			return;
		}
		try {
			await verifyMutation.mutateAsync({ tenantId });
			message.success(t('hashChain.verifySubmitted'));
		} catch {
			message.error(t('hashChain.verifyFailed'));
		}
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
		try {
			const res = await proofMutation.mutateAsync({
				tenantId: tenantId || 'default',
				entryId: merkleProofId,
			});
			setMerkleProofResult(res);
			message.success(t('hashChain.merkleProofSuccess'));
		} catch {
			message.error(t('hashChain.merkleProofError'));
		}
	};

	const columns: TableColumnsType<VerificationItem> = [
		{ title: t('hashChain.columnTenantId'), dataIndex: 'tenantId', width: 200 },
		{
			title: t('hashChain.columnStatus'),
			dataIndex: 'valid',
			width: 120,
			render: (v: boolean) =>
				v ? (
					<Tag color="success" icon={<CheckCircleOutlined />}>
						{t('hashChain.statusValid')}
					</Tag>
				) : (
					<Tag color="error" icon={<CloseCircleOutlined />}>
						{t('hashChain.statusAbnormal')}
					</Tag>
				),
		},
		{ title: t('hashChain.columnLastSequence'), dataIndex: 'lastSequence', width: 140 },
		{ title: t('hashChain.columnLastHash'), dataIndex: 'lastHash', ellipsis: true },
		{ title: t('hashChain.columnEntriesChecked'), dataIndex: 'entriesChecked', width: 120 },
		{
			title: t('hashChain.columnValidatedAt'),
			dataIndex: 'validatedAt',
			width: 180,
			render: (v: number) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-'),
		},
		{
			title: t('hashChain.columnErrorMessage'),
			dataIndex: 'errorMessage',
			render: (v?: string) => (v ? <span className="text-red-500">{v}</span> : '-'),
		},
	];

	const hashChainTab = (
		<div>
			{stats.invalid > 0 && (
				<Alert
					message={t('hashChain.alertAbnormal', { count: stats.invalid })}
					type="error"
					showIcon
					className="mb-4"
				/>
			)}

			<Row gutter={[16, 16]} className="mb-4">
				<Col xs={24} sm={8}>
					<Card>
						<Statistic
							title={t('hashChain.statTotalTenants')}
							value={stats.total}
							prefix={<SafetyCertificateOutlined className="text-blue-500" />}
						/>
					</Card>
				</Col>
				<Col xs={24} sm={8}>
					<Card>
						<Statistic
							title={t('hashChain.statVerified')}
							value={stats.valid}
							prefix={<CheckCircleOutlined className="text-green-500" />}
						/>
					</Card>
				</Col>
				<Col xs={24} sm={8}>
					<Card>
						<Statistic
							title={t('hashChain.statAbnormal')}
							value={stats.invalid}
							prefix={<CloseCircleOutlined className="text-red-500" />}
						/>
					</Card>
				</Col>
			</Row>

			<Card className="mb-4">
				<Space>
					<Input
						placeholder={t('hashChain.verifyInputPlaceholder')}
						value={tenantId}
						onChange={(e) => setTenantId(e.target.value)}
						style={{ width: 300 }}
					/>
					<Button type="primary" loading={verifyMutation.isPending} onClick={handleVerify}>
						{t('hashChain.verifyBtn')}
					</Button>
				</Space>
			</Card>

			<Spin spinning={isLoading}>
				<Table
					columns={columns}
					dataSource={verificationItems as VerificationItem[]}
					rowKey="tenantId"
					pagination={{ pageSize: 20, showTotal: (cnt) => t('common.total', { count: cnt }) }}
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
			<div className="flex items-center justify-between mb-4">
				<h1 className="text-xl font-semibold">{t('hashChain.title')}</h1>
			</div>

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
