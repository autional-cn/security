// S-74（fix-security-w5）：会话静默过期降级 → 恢复链的共享标记协议。
// SSEEventStream 在 401+刷新失败（静默清会话）时 mark；AppLayout 在重新认证后
// consume（一次性）并 toast「会话已恢复」、关闭降级提示。

/** 降级提示的 antd notification key（恢复时按 key 关闭）。 */
export const SESSION_DEGRADED_NOTICE_KEY = 'session-degraded';

const SESSION_DEGRADED_FLAG = 'autional-session-degraded';

export function markSessionDegraded(): void {
	try {
		sessionStorage.setItem(SESSION_DEGRADED_FLAG, '1');
	} catch {
		/* 存储受限（隐私模式/配额）：降级为仅本次提示，恢复 toast 缺失 */
	}
}

/** 读取并清除降级标记（只消费一次，避免重复 toast）。 */
export function consumeSessionDegraded(): boolean {
	try {
		const flagged = sessionStorage.getItem(SESSION_DEGRADED_FLAG) === '1';
		if (flagged) sessionStorage.removeItem(SESSION_DEGRADED_FLAG);
		return flagged;
	} catch {
		return false;
	}
}
