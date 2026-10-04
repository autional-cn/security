'use client';

import React, { useState } from 'react';
import { Modal, Select, Button, Spin } from 'antd';
import { UserSwitchOutlined } from '@ant-design/icons';
import { assignAnomaly } from '@/lib/api.generated';
import { Can } from '@/components/Can';
import { message } from '@/lib/antd-app';
import { useTranslation } from 'react-i18next';
import { useAdminUsers } from '@/hooks/use-security-queries';

interface AssignAnomalyModalProps {
	anomalyId: string | null;
	visible: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

// S-40（2026-10-04）：裸文本框手输用户 ID → 搜索式用户选择器（identity 管理面 /admin/users，
// 仅在该弹窗打开时拉取；输入 300ms 防抖）。
export default function AssignAnomalyModal({
	anomalyId,
	visible,
	onClose,
	onSuccess,
}: AssignAnomalyModalProps) {
	const { t } = useTranslation();
	const [assignee, setAssignee] = useState<string | undefined>(undefined);
	const [search, setSearch] = useState('');
	const [loading, setLoading] = useState(false);
	const searchTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

	const { data: usersData, isFetching: usersLoading } = useAdminUsers(search, visible);
	const userOptions = (((usersData as any)?.items || []) as any[]).map((u) => ({
		value: u.id as string,
		label: u.username ? `${u.username}${u.email ? ` · ${u.email}` : ''}` : u.email || u.id,
	}));

	const handleSearch = (value: string) => {
		clearTimeout(searchTimer.current);
		searchTimer.current = setTimeout(() => setSearch(value), 300);
	};

	const handleAssign = async () => {
		if (!assignee) {
			message.warning(t('anomalies.assignInputWarning'));
			return;
		}
		if (!anomalyId) return;

		setLoading(true);
		try {
			await assignAnomaly(anomalyId, { assignee });
			message.success(t('anomalies.assignSuccess'));
			setAssignee(undefined);
			setSearch('');
			onSuccess();
			onClose();
		} catch {
			message.error(t('anomalies.assignFailed'));
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = () => {
		setAssignee(undefined);
		setSearch('');
		onClose();
	};

	return (
		<Modal
			title={
				<span>
					<UserSwitchOutlined className="mr-2" />
					{t('anomalies.assignModalTitle')}
				</span>
			}
			open={visible}
			onCancel={handleCancel}
			footer={[
				<Button key="cancel" onClick={handleCancel}>
					{t('common.cancel')}
				</Button>,
				<Can denyAuditor key="assign-wrapper">
					<Button type="primary" loading={loading} onClick={handleAssign}>
						{t('anomalies.actionAssign')}
					</Button>
				</Can>,
			]}
		>
			<div className="py-4">
				<div className="mb-2 text-sm text-neutral-600">
					{t('anomalies.columnId')}: <span className="font-mono">{anomalyId || '-'}</span>
				</div>
				<Select
					showSearch
					allowClear
					style={{ width: '100%' }}
					placeholder={t('anomalies.assignModalPlaceholder')}
					value={assignee}
					onChange={(v) => setAssignee(v)}
					onSearch={handleSearch}
					filterOption={false}
					loading={usersLoading}
					options={userOptions}
					notFoundContent={usersLoading ? <Spin size="small" /> : undefined}
				/>
			</div>
		</Modal>
	);
}
