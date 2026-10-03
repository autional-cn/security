import { useQuery } from '@tanstack/react-query';
import {
	getAuditStats,
	getAnomalies,
	getComplianceStatus,
	getActiveSessionCount,
	fetchGatewayStatusRaw,
} from '@/lib/api.generated';

export function useAuditStats() {
	return useQuery({
		queryKey: ['overview', 'auditStats'],
		queryFn: getAuditStats,
	});
}

export function useAnomaliesPreview() {
	return useQuery({
		queryKey: ['overview', 'anomalies'],
		queryFn: () => getAnomalies({ page: 1, pageSize: 5 } as any),
	});
}

export function useComplianceStatus() {
	return useQuery({
		queryKey: ['overview', 'complianceStatus'],
		queryFn: getComplianceStatus,
	});
}

export function useActiveSessionCount() {
	return useQuery({
		queryKey: ['overview', 'activeSessionCount'],
		queryFn: getActiveSessionCount,
	});
}

export function useGatewayStatus() {
	return useQuery({
		queryKey: ['overview', 'gatewayStatus'],
		queryFn: fetchGatewayStatusRaw,
		refetchInterval: 30 * 1000,
	});
}
