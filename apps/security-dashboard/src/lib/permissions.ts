/**
 * security-dashboard 权限清单。
 *
 * 每项对应一个按钮级写操作。auditor 对所有写操作（denyAuditor=true）不可访问。
 * 安全管理员（security_admin）拥有全部权限。
 *
 * 用法:
 *   import { PERMISSIONS } from '@/lib/permissions';
 *   import { Can } from '@/components/Can';
 *
 *   <Can denyAuditor={PERMISSIONS.SESSION_TERMINATE.denyAuditor}>
 *     <Button danger>Terminate</Button>
 *   </Can>
 *
 * @see document/architecture/decisions/007-security-dashboard-audit.md
 */

export const PERMISSIONS = {
	// ── 会话 ──
	SESSION_TERMINATE: { key: 'session:terminate', denyAuditor: true },

	// ── 异常 ──
	ANOMALY_UPDATE_STATUS: { key: 'anomaly:update_status', denyAuditor: true },
	ANOMALY_ASSIGN: { key: 'anomaly:assign', denyAuditor: true },
	ANOMALY_COMMENT: { key: 'anomaly:comment', denyAuditor: true },

	// ── 告警 ──
	ALERT_ACTION: { key: 'alert:action', denyAuditor: true },
	ALERT_ASSIGN: { key: 'alert:assign', denyAuditor: true },

	// ── 设置 ──
	SETTINGS_SIEM_WRITE: {
		key: 'settings:siem:write',
		denyAuditor: true,
		minRole: 'security_admin' as const,
	},
	SETTINGS_RETENTION: {
		key: 'settings:retention',
		denyAuditor: true,
		minRole: 'security_admin' as const,
	},

	// ── NHI ──
	NHI_AGENT_REVOKE: { key: 'nhi:agent:revoke', denyAuditor: true },
	NHI_ROBOT_COMMISSION: { key: 'nhi:robot:commission', denyAuditor: true },
	NHI_ROBOT_DECOMMISSION: { key: 'nhi:robot:decommission', denyAuditor: true },
	NHI_ROBOT_DELETE: { key: 'nhi:robot:delete', denyAuditor: true },
	NHI_DEVICE_DELETE: { key: 'nhi:device:delete', denyAuditor: true },

	// ── 归档 ──
	ARCHIVE_TRIGGER: { key: 'archive:trigger', denyAuditor: true },

	// ── 导出 ──
	EXPORT_CREATE: { key: 'export:create', denyAuditor: true },
	EXPORT_CANCEL: { key: 'export:cancel', denyAuditor: true },
	EXPORT_DOWNLOAD: { key: 'export:download', denyAuditor: true },

	// ── 数据泄露 ──
	BREACH_UPDATE: { key: 'breach:update', denyAuditor: true },

	// ── DSAR ──
	DSAR_UPDATE: { key: 'dsar:update', denyAuditor: true },

	// ── 审计发现 ──
	FINDING_UPDATE: { key: 'finding:update', denyAuditor: true },

	// ── 审计日志 ──
	AUDIT_EXPORT: { key: 'audit:export', denyAuditor: true },
} as const;
