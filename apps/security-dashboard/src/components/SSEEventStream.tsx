'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { notification } from '@/lib/antd-app';
import { Badge } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import {
	getAccessToken,
	getRefreshToken,
	loginWithTokens,
	logout,
	getAUTH_PAGES_URL,
} from '@autional-cn/shared';
import { authRefreshPost } from '@autional-cn/shared/generated/api';
import { useTranslation } from 'react-i18next';

interface RealtimeEvent {
	id: string;
	type: string;
	severity: 'info' | 'warning' | 'critical';
	message: string;
	tenantId: string;
	timestamp: string;
}

const MAX_RETRIES = 20;
const BASE_DELAY = 1000;

export default function SSEEventStream() {
	const { t } = useTranslation();
	const [connected, setConnected] = useState(false);
	const [eventCount, setEventCount] = useState(0);
	const abortRef = useRef<AbortController | null>(null);
	const retryCountRef = useRef(0);
	const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	async function attemptTokenRefresh(): Promise<string | null> {
		const refreshToken = getRefreshToken();
		if (!refreshToken) return null;
		try {
			const data = await authRefreshPost({ refresh_token: refreshToken } as any);
			const newAccess = data.accessToken;
			const newRefresh = data.refreshToken;
			if (newAccess) {
				loginWithTokens(newAccess, newRefresh || refreshToken, {
					id: '',
					email: '',
					username: '',
					status: 'active',
				});
				return newAccess;
			}
		} catch {
			/* refresh failed */
		}
		return null;
	}

	const connect = useCallback(async () => {
		const token = getAccessToken();
		if (!token) return;

		abortRef.current?.abort();
		const controller = new AbortController();
		abortRef.current = controller;

		try {
			// @generated-api-exempt: Server-Sent Events (SSE) streaming cannot use
			// axios/apiClient — fetch() with AbortController is required for stream
			// reading. Gateway registers the handler at
			// /bff/gateway/api/v1/stream/security-events (BFF scheme with JWT required),
			// so use the absolute API path directly.
			const res = await fetch(`/bff/gateway/api/v1/stream/security-events`, {
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: 'text/event-stream',
				},
				signal: controller.signal,
			});

			if (res.status === 401) {
				const newToken = await attemptTokenRefresh();
				if (newToken) {
					retryCountRef.current = 0;
					connect();
					return;
				}
				// U350 接通后复查落点：本站无 /login 路由（此前相对路径接通即 404）；
				// 改走 auth 站入口路由（?redirect= 由入口三分支解析租户并发起登录，成功后原路返回）。
				logout(`${getAUTH_PAGES_URL()}/login?redirect=${encodeURIComponent(window.location.href)}`);
				return;
			}

			if (!res.ok) {
				setConnected(false);
				scheduleReconnect();
				return;
			}

			setConnected(true);
			retryCountRef.current = 0;
			const reader = res.body?.getReader();
			if (!reader) return;

			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() || '';

				let eventData = '';
				for (const line of lines) {
					if (line.startsWith('data:')) {
						eventData = line.slice(5).trim();
					} else if (line === '' && eventData) {
						try {
							const data: RealtimeEvent = JSON.parse(eventData);
							setEventCount((c) => c + 1);

							if (data.severity === 'critical' || data.severity === 'warning') {
								notification.open({
									message: t('sse.realtimeEvent'),
									description: data.message,
									icon: (
										<ThunderboltOutlined
											style={{ color: data.severity === 'critical' ? 'var(--color-danger)' : 'var(--color-warning)' }}
										/>
									),
									placement: 'bottomRight',
								});
							}
						} catch {
							/* ignore parse errors */
						}
						eventData = '';
					}
				}
			}
			setConnected(false);
			scheduleReconnect();
		} catch {
			setConnected(false);
			scheduleReconnect();
		}
	}, [t]);

	function scheduleReconnect() {
		if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
		if (retryCountRef.current >= MAX_RETRIES) return;
		const delay = Math.min(BASE_DELAY * Math.pow(2, retryCountRef.current), 30000);
		retryTimerRef.current = setTimeout(() => {
			retryCountRef.current++;
			connect();
		}, delay);
	}

	useEffect(() => {
		connect();
		return () => {
			abortRef.current?.abort();
			if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
		};
	}, [connect]);

	return (
		<Badge
			count={eventCount}
			overflowCount={99}
			style={{ backgroundColor: connected ? 'var(--color-success)' : 'var(--color-neutral-300)' }}
		>
			<ThunderboltOutlined
				style={{ color: connected ? 'var(--color-success)' : 'var(--color-neutral-300)', fontSize: 16 }}
				title={connected ? t('sse.connected') : t('sse.disconnected')}
			/>
		</Badge>
	);
}
