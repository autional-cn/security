import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuditLogs, getAuditLogDetail, createExportJob } from '@/lib/api.generated';

export interface AuditLogFilters {
	keyword?: string;
	level?: string;
	/** 状态语义类（BE 契约 status_class，跨双管道展开：success={0}∪2xx，failure={1}∪4xx/5xx） */
	statusClass?: 'success' | 'failure';
	/** 起止时间一律 Unix 秒（BE 按秒解析；毫秒会被后端归一，但 FE 一律发秒） */
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
			if (filters.statusClass) req.status_class = filters.statusClass;
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
