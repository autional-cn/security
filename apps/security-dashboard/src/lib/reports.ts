// 报告内容本地化映射（S-60）：BE 报告内容为英文硬编码 + 机器键
// （service-audit aggregate_repository.go：runComplianceChecks / buildSecurityRisks /
//   buildSecurityRecommendations / generateComplianceRecommendations 全为有限枚举）。
// FE 侧补映射表：item 机器键 → 本地文案、英文描述/建议 → 本地文案、风险 type/severity 归一；
// 未知值一律原样回落（不隐藏数据）。

type TFn = (key: string, options?: Record<string, unknown>) => string;

function translated(t: TFn, key: string, options?: Record<string, unknown>): string | null {
	const label = t(key, options);
	return label && label !== key ? label : null;
}

// ---- 合规检查项（9 键；phi_access_logged / access_controls_verified 仅 HIPAA 标准产生）----

export function complianceItemLabel(t: TFn, item?: string | null): string {
	if (!item) return '-';
	return translated(t, `reports.item_${item}`) ?? item;
}

export function complianceDescription(
	t: TFn,
	item: string | undefined,
	description?: string | null,
): string {
	if (item) {
		const label = translated(t, `reports.desc_${item}`);
		if (label) return label;
	}
	return description || '-';
}

// ---- 安全建议（6 条有限枚举 + 默认条）----

const SECURITY_REC_MAP: Record<string, string> = {
	'Enable IP rate limiting': 'reports.recSecIpRateLimit',
	'Configure login failure lockout policy': 'reports.recSecLockout',
	'Enforce MFA': 'reports.recSecMfa',
	'Enable real-time alerts': 'reports.recSecRealtimeAlerts',
	'Review blocked IP list': 'reports.recSecReviewBlocked',
	'Continue current security policy': 'reports.recSecContinue',
};

export function securityRecommendation(t: TFn, rec: string): string {
	const key = SECURITY_REC_MAP[rec];
	if (!key) return rec;
	return translated(t, key) ?? rec;
}

// ---- 合规改进建议（4 条有限枚举）----

const COMPLIANCE_REC_MAP: Record<string, string> = {
	'Ensure all data access is logged': 'reports.recCompDataAccess',
	'Ensure all user activity is tracked': 'reports.recCompUserActivity',
	'Review log retention settings': 'reports.recCompRetention',
	'Compliance status is good': 'reports.recCompGood',
};

export function complianceRecommendation(t: TFn, rec: string): string {
	const key = COMPLIANCE_REC_MAP[rec];
	if (!key) return rec;
	return translated(t, key) ?? rec;
}

// ---- 安全风险（type 有限枚举；brute_force 描述含 IP 动态值）----

const RISK_TYPE_MAP: Record<string, string> = {
	brute_force: 'reports.riskTypeBruteForce',
	distributed_attack: 'reports.riskTypeDistributed',
};

export function securityRiskType(t: TFn, type?: string | null): string {
	if (!type) return '';
	return RISK_TYPE_MAP[type] ? (translated(t, RISK_TYPE_MAP[type]) ?? type) : type;
}

export function securityRiskDescription(
	t: TFn,
	risk: { type?: string | null; description?: string | null },
): string {
	const raw = risk.description || '';
	const type = (risk.type || '').toLowerCase();
	if (type === 'distributed_attack') {
		const label = translated(t, 'reports.riskDescDistributed');
		if (label) return label;
	}
	if (type === 'brute_force') {
		const ip = raw.match(/^IP fingerprint (.+) has many failed login attempts$/)?.[1];
		if (ip) {
			const label = translated(t, 'reports.riskDescBruteForce', { ip });
			if (label) return label;
		}
	}
	return raw || '-';
}
