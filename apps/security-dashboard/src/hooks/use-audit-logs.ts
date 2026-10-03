import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuditLogs, getAuditLogDetail, createExportJob } from '@/lib/api.generated';

export interface AuditLogFilters {
	keyword?: string;
	level?: string;
	status?: number;
	startTime?: number;
	endTime?: number;
	module?: string;
	action?: string;
}

export function useAuditLogs(params: {
	page?: number;
	pageSize?: number;
	filters?: AuditLogFilters;
}) {
	const { page = 1, pageSize = 20, filters = {} } = params;

	return useQuery({
		queryKey: ['audit-logs', { page, pageSize, filters }],
		queryFn: async () => {
			const req: Record<string, any> = {
				page,
				page_size: pageSize,
			};
			if (filters.keyword) req.keyword = filters.keyword;
			if (filters.level) req.level = filters.level;
			if (filters.status !== undefined) req.status = filters.status;
			if (filters.startTime) req.start_time = filters.startTime;
			if (filters.endTime) req.end_time = filters.endTime;
			if (filters.module) req.module = filters.module;
			if (filters.action) req.action = filters.action;
			return getAuditLogs(req);
		},
		staleTime: 10_000,
	});
}

export function useAuditLogDetail(id: string | null) {
	return useQuery({
		queryKey: ['audit-log', id],
		queryFn: () => getAuditLogDetail(id!),
		enabled: !!id,
	});
}

export function useCreateExportJob() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: createExportJob,
		onSuccess: () => qc.invalidateQueries({ queryKey: ['export-jobs'] }),
	});
}
