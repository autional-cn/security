'use client';

import { useTranslation } from 'react-i18next';

// S-36/S-41/S-46/S-51/S-57（fix-security-w5）：统计卡当前仅对「当页 items」聚合，
// 全量聚合待后端统计端点族（OPEN-ITEMS U 项）；此标注明示口径，避免误读为全量。
export function PageScopeHint() {
	const { t } = useTranslation();
	return <span className="ml-1 text-xs font-normal text-neutral-500">{t('common.thisPage')}</span>;
}
