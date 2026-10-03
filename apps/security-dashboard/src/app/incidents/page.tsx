'use client';

import React, { useState } from 'react';
import { DataTable } from '@autional-cn/ui/antd';
import { ConsolePageHeader } from '@autional-cn/ui';
import { Card, Tag, Button, Space, Modal, Input, Select } from 'antd';
import { PlusOutlined, SearchOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface IncidentRecord {
	id: string;
	title: string;
	severity: string;
	status: string;
	assignee: string;
	createdAt: string;
	updatedAt: string;
}

const SEVERITY_COLORS: Record<string, string> = {
	critical: 'red',
	high: 'orange',
	medium: 'gold',
	low: 'blue',
};

const STATUS_COLORS: Record<string, string> = {
	open: 'blue',
	investigating: 'orange',
	contained: 'purple',
	resolved: 'green',
	closed: 'default',
};

const MOCK_INCIDENTS: IncidentRecord[] = [];

export default function IncidentsPage() {
	const { t } = useTranslation();
	const [searchText, setSearchText] = useState('');
	const [isCreateOpen, setIsCreateOpen] = useState(false);

	const columns = [
		{
			title: t('incidents.title', 'Title'),
			dataIndex: 'title',
			key: 'title',
			ellipsis: true,
		},
		{
			title: t('incidents.severity', 'Severity'),
			dataIndex: 'severity',
			key: 'severity',
			render: (s: string) => <Tag color={SEVERITY_COLORS[s] || 'default'}>{s || '-'}</Tag>,
		},
		{
			title: t('incidents.status', 'Status'),
			dataIndex: 'status',
			key: 'status',
			render: (s: string) => <Tag color={STATUS_COLORS[s] || 'default'}>{s || '-'}</Tag>,
		},
		{
			title: t('incidents.assignee', 'Assignee'),
			dataIndex: 'assignee',
			key: 'assignee',
			ellipsis: true,
		},
		{
			title: t('incidents.created', 'Created'),
			dataIndex: 'createdAt',
			key: 'createdAt',
		},
		{
			title: t('incidents.updated', 'Updated'),
			dataIndex: 'updatedAt',
			key: 'updatedAt',
		},
	];

	const filtered = MOCK_INCIDENTS.filter((i) =>
		i.title.toLowerCase().includes(searchText.toLowerCase()),
	);

	return (
		<div>
			<ConsolePageHeader
				title={t('incidents.title', 'Incident Management')}
				actions={
					<>
						<Space>
							<Input
								placeholder={t('incidents.search', 'Search incidents...')}
								prefix={<SearchOutlined />}
								value={searchText}
								onChange={(e) => setSearchText(e.target.value)}
								style={{ width: 240 }}
								allowClear
							/>
							<Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateOpen(true)}>
								{t('incidents.create', 'New Incident')}
							</Button>
						</Space>
					</>
				}
			/>

			<Card>
				{filtered.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-20 text-center">
						<ExclamationCircleOutlined className="text-4xl text-neutral-300 mb-4" />
						<h2 className="text-lg font-semibold text-neutral-600">
							{t('incidents.noIncidents', 'No Incidents')}
						</h2>
						<p className="mt-2 text-sm text-neutral-500 max-w-md">
							{t(
								'incidents.noIncidentsDesc',
								'Incident management is available in the audit-service. Backend endpoint integration is pending — incidents will sync automatically once the API is connected.',
							)}
						</p>
						<Button
							type="primary"
							className="mt-4"
							icon={<PlusOutlined />}
							onClick={() => setIsCreateOpen(true)}
						>
							{t('incidents.createFirst', 'Create First Incident')}
						</Button>
					</div>
				) : (
					<DataTable
						rowKey="id"
						columns={columns}
						dataSource={filtered}
						pagination={{ pageSize: 20 }}
						size="small"
					/>
				)}
			</Card>

			<Modal
				title={t('incidents.create', 'New Incident')}
				open={isCreateOpen}
				onCancel={() => setIsCreateOpen(false)}
				onOk={() => setIsCreateOpen(false)}
				okText={t('common.create', 'Create')}
				cancelText={t('common.cancel', 'Cancel')}
			>
				<p className="text-sm text-neutral-500 mb-4">
					{t(
						'incidents.createDesc',
						'Incident backend API is being integrated. For now, incidents can be managed through the audit-service admin endpoints.',
					)}
				</p>
				<p className="text-sm">
					<strong>{t('incidents.titleField', 'Title')}:</strong>
					<Input
						placeholder={t('incidents.titlePlaceholder', 'Enter incident title')}
						className="mt-1"
					/>
				</p>
				<p className="text-sm mt-3">
					<strong>{t('incidents.severity', 'Severity')}:</strong>
					<Select className="mt-1 w-full" defaultValue="medium">
						<Select.Option value="critical">
							{t('incidents.severityCritical', 'Critical')}
						</Select.Option>
						<Select.Option value="high">{t('incidents.severityHigh', 'High')}</Select.Option>
						<Select.Option value="medium">{t('incidents.severityMedium', 'Medium')}</Select.Option>
						<Select.Option value="low">{t('incidents.severityLow', 'Low')}</Select.Option>
					</Select>
				</p>
			</Modal>
		</div>
	);
}
