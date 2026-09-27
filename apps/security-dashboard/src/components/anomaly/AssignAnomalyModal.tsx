'use client';

import React, { useState } from 'react';
import { Modal, Input, Button } from 'antd';
import { UserSwitchOutlined } from '@ant-design/icons';
import { assignAnomaly } from '@/lib/api.generated';
import { Can } from '@/components/Can';
import { message } from '@/lib/antd-app';
import { useTranslation } from 'react-i18next';

interface AssignAnomalyModalProps {
	anomalyId: string | null;
	visible: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

export default function AssignAnomalyModal({
	anomalyId,
	visible,
	onClose,
	onSuccess,
}: AssignAnomalyModalProps) {
	const { t } = useTranslation();
	const [assignee, setAssignee] = useState('');
	const [loading, setLoading] = useState(false);

	const handleAssign = async () => {
		if (!assignee.trim()) {
			message.warning(t('anomalies.assignInputWarning'));
			return;
		}
		if (!anomalyId) return;

		setLoading(true);
		try {
			await assignAnomaly(anomalyId, { assignee: assignee.trim() });
			message.success(t('anomalies.assignSuccess'));
			setAssignee('');
			onSuccess();
			onClose();
		} catch {
			message.error(t('anomalies.assignFailed'));
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = () => {
		setAssignee('');
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
				<div className="mb-2 text-sm text-gray-500">
					{t('anomalies.columnId')}: <span className="font-mono">{anomalyId || '-'}</span>
				</div>
				<Input
					placeholder={t('anomalies.assignModalPlaceholder')}
					value={assignee}
					onChange={(e) => setAssignee(e.target.value)}
					onPressEnter={handleAssign}
				/>
			</div>
		</Modal>
	);
}
