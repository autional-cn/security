'use client';

import React, { useState } from 'react';
import { DataTable } from '@autional-cn/ui/antd';
import type { DataTableColumns } from '@autional-cn/ui/antd';
import { Card, Tag, Button, Spin, Empty, Space, Badge, Modal, Form, Select, DatePicker, Input, Progress } from 'antd';
import { DownloadOutlined, PlusOutlined } from '@ant-design/icons';

import dayjs from 'dayjs';
import {
	useExportJobs,
	useExportJobStatus,
	useCreateExportJob,
	useDownloadExport,
} from '@/hooks/use-security-queries';
import { message } from '@/lib/antd-app';
import { useTranslation } from 'react-i18next';
import type { ExportJobResponse, ExportJobRequest } from '@autional-cn/shared/generated/types';
import { ConsolePageHeader } from '@autional-cn/ui';
import { Can } from '@/components/Can';

export default function ExportJobsPage() {
	const { t } = useTranslation();

	const statusLabels: Record<string, string> = {
		pending: t('exportJobs.statusPending'),
		processing: t('exportJobs.statusProcessing'),
		completed: t('exportJobs.statusCompleted'),
		failed: t('exportJobs.statusFailed'),
		cancelled: t('exportJobs.statusCancelled'),
	};

	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(20);
	const [createVisible, setCreateVisible] = useState(false);
	const [createForm] = Form.useForm();
	const [creating, setCreating] = useState(false);
	const [downloadJobId, setDownloadJobId] = useState<string | null>(null);

	const { data, isLoading } = useExportJobs({ page, pageSize });
	const { data: jobStatus } = useExportJobStatus(downloadJobId);
	const createMutation = useCreateExportJob();
	const downloadMutation = useDownloadExport();

	const items = (data as any)?.items || [];
	const total = (data as any)?.total || (data as any)?.pagination?.total || items.length;

	const handleCreate = async (values: any) => {
		setCreating(true);
		try {
			const req: ExportJobRequest = {
				format: values.format,
				startDate: values.startDate ? dayjs(values.startDate).format('YYYY-MM-DD') : undefined,
				endDate: values.endDate ? dayjs(values.endDate).format('YYYY-MM-DD') : undefined,
			};
			await createMutation.mutateAsync(req);
			message.success(t('exportJobs.createSuccess'));
			setCreateVisible(false);
			createForm.resetFields();
		} catch {
			message.error(t('exportJobs.createFailed'));
		} finally {
			setCreating(false);
		}
	};

	const handleDownload = async (jobId: string) => {
		setDownloadJobId(jobId);
		try {
			const status = (jobStatus as any)?.data || jobStatus;
			if (status?.status === 'completed') {
				await downloadMutation.mutateAsync(jobId);
				message.success(t('exportJobs.downloadStarted'));
			} else {
				message.warning(
					t('exportJobs.taskStatus', {
						status: statusLabels[status?.status || 'unknown'] || status?.status,
					}),
				);
			}
		} catch {
			message.error(t('exportJobs.fetchStatusFailed'));
		}
	};

	const columns: DataTableColumns<ExportJobResponse> = [
		{ title: t('exportJobs.columnJobId'), dataIndex: 'jobId', width: 200 },
		{
			title: t('exportJobs.columnStatus'),
			dataIndex: 'status',
			width: 110,
			render: (v: string) => (
				<Badge
					status={
						v === 'completed'
							? 'success'
							: v === 'failed'
								? 'error'
								: v === 'processing'
									? 'processing'
									: v === 'cancelled'
										? 'default'
										: 'default'
					}
					text={statusLabels[v] || v}
				/>
			),
		},
		{
			title: t('exportJobs.columnProgress'),
			width: 160,
			render: (_: any, record: ExportJobResponse) => {
				if (record.status === 'completed') return <Progress percent={100} size="small" />;
				if (record.status === 'failed' || record.status === 'cancelled')
					return <span className="text-neutral-600">—</span>;
				if (record.status === 'processing')
					return <Progress percent={50} size="small" status="active" />;
				if (record.status === 'pending') return <Progress percent={0} size="small" />;
				return <span className="text-neutral-600">—</span>;
			},
		},
		{ title: t('exportJobs.columnFilename'), dataIndex: 'filename', ellipsis: true },
		{
			title: t('exportJobs.columnRecordCount'),
			dataIndex: 'recordCount',
			width: 100,
			render: (v?: number) => v?.toLocaleString() || '-',
		},
		{
			title: t('exportJobs.columnFormat'),
			dataIndex: 'contentType',
			width: 120,
			render: (v?: string) => (
				<Tag>{v?.includes('csv') ? 'CSV' : v?.includes('json') ? 'JSON' : v}</Tag>
			),
		},
		{
			title: t('exportJobs.columnGeneratedAt'),
			dataIndex: 'generatedAt',
			width: 180,
			render: (v: number) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-'),
		},
		{
			title: t('common.actions'),
			width: 180,
			fixed: 'right',
			render: (_: any, record: ExportJobResponse) => (
				<Space size="small">
					<Button
						size="small"
						icon={<DownloadOutlined />}
						onClick={() => record.jobId && handleDownload(record.jobId)}
						disabled={record.status !== 'completed'}
					>
						{t('exportJobs.downloadBtn')}
					</Button>
				</Space>
			),
		},
	];

	return (
		<Can denyAuditor>
			<div>
				<ConsolePageHeader
					title={t('exportJobs.title')}
					actions={
						<>
							<Space>
								<Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateVisible(true)}>
									{t('exportJobs.newJob')}
								</Button>
							</Space>
						</>
					}
				/>

				<Spin spinning={isLoading}>
					<DataTable
						columns={columns}
						dataSource={items}
						rowKey="jobId"
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
						locale={{ emptyText: <Empty description={t('exportJobs.empty')} /> }}
					/>
				</Spin>

				<Modal
					title={t('exportJobs.createModalTitle')}
					open={createVisible}
					onCancel={() => setCreateVisible(false)}
					onOk={() => createForm.submit()}
					confirmLoading={creating}
				>
					<Form form={createForm} layout="vertical" onFinish={handleCreate}>
						<Form.Item
							name="format"
							label={t('exportJobs.createFormatLabel')}
							rules={[{ required: true }]}
							initialValue="csv"
						>
							<Select
								options={[
									{ label: 'CSV', value: 'csv' },
									{ label: 'JSON', value: 'json' },
								]}
							/>
						</Form.Item>
						<Form.Item name="startDate" label={t('exportJobs.createStartDateLabel')}>
							<DatePicker style={{ width: '100%' }} placeholder="YYYY-MM-DD" />
						</Form.Item>
						<Form.Item name="endDate" label={t('exportJobs.createEndDateLabel')}>
							<DatePicker style={{ width: '100%' }} placeholder="YYYY-MM-DD" />
						</Form.Item>
						<Form.Item name="tenantId" label={t('exportJobs.createTenantIdLabel')}>
							<Input placeholder={t('exportJobs.createTenantPlaceholder')} />
						</Form.Item>
					</Form>
				</Modal>
			</div>
		</Can>
	);
}
