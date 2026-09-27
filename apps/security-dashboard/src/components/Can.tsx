'use client';

import { usePermission, useCurrentRole } from '@autional-cn/shared';

interface CanProps {
	/** 资源:action 权限字符串，如 "anomaly:update" */
	permission?: string;
	/** 最低角色要求，如 'security_admin' */
	minRole?: 'super_admin' | 'security_admin';
	/** 无条件拒绝 auditor（最常用，用于所有写操作） */
	denyAuditor?: boolean;
	fallback?: React.ReactNode;
	children: React.ReactNode;
}

/**
 * 权限守卫组件。
 *
 * 规则（优先级从高到低）:
 * 1. `denyAuditor` → auditor 被拒绝（所有写操作都应设置）
 * 2. `minRole` → 要求最低角色
 * 3. `permission` → 要求具体权限字符串
 *
 * 用法:
 *   <Can denyAuditor>
 *     <Button onClick={handleDelete}>Delete</Button>
 *   </Can>
 */
export function Can({
	permission,
	minRole,
	denyAuditor = false,
	fallback = null,
	children,
}: CanProps) {
	const { can } = usePermission();
	const role = useCurrentRole();

	// Audit 禁止所有写操作
	if (denyAuditor && role === 'auditor') {
		return <>{fallback}</>;
	}

	// 角色门槛
	if (minRole === 'security_admin' && role === 'auditor') {
		return <>{fallback}</>;
	}

	// 具体权限
	if (permission && !can(permission)) {
		return <>{fallback}</>;
	}

	return <>{children}</>;
}
