'use client';

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
	DashboardOutlined,
	FileSearchOutlined,
	WarningOutlined,
	FileProtectOutlined,
	ClusterOutlined,
	FileTextOutlined,
	SettingOutlined,
	MenuFoldOutlined,
	MenuUnfoldOutlined,
	SecurityScanOutlined,
	ReloadOutlined,
	SafetyOutlined,
	SafetyCertificateOutlined,
	FileZipOutlined,
	FileDoneOutlined,
	ApiOutlined,
	FundOutlined,
	BugOutlined,
} from '@ant-design/icons';
import { Layout, Menu, Button, Typography, Breadcrumb } from 'antd';
import { useAuth, useLogout, usePortalCatalog, useTenantSlug } from '@autional-cn/shared';
import { LanguageSwitcher, PortalSwitcher, ThemeToggle, UserMenu } from '@autional-cn/ui';
import SSEEventStream from './SSEEventStream';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export default function AppLayout({ children }: { children: React.ReactNode }) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const pathname = location.pathname;
	const [collapsed, setCollapsed] = useState(false);
	const handleLogout = useLogout();
	const { user, currentTenantId } = useAuth();
	// basename 恒 "/" 后 pathname 含租户 slug（如 /acme-corp/audit-logs），
	// slug 用于导航拼接 + 内部路径匹配（菜单高亮/面包屑）剥离前缀。
	const slug = useTenantSlug();
	// 管理面平面（audiences [admin, platform]）：安全控制台走 admin 受众端点
	const { portals } = usePortalCatalog({ tenantId: currentTenantId, slug, audience: 'admin' });
	const internalPath = slug ? pathname.replace(new RegExp(`^/${slug}`), '') || '/' : pathname;

	const menuItems = [
		{ key: '/', icon: <DashboardOutlined />, label: t('nav.overview') },
		{
			key: 'audit',
			icon: <FileSearchOutlined />,
			label: t('nav.auditAndTracking'),
			children: [
				{ key: '/audit-logs', label: t('nav.auditLogs') },
				{ key: '/export-jobs', label: t('nav.exportJobs') },
				{ key: '/hash-chain', label: t('nav.hashChain') },
			],
		},
		{
			key: 'threats',
			icon: <WarningOutlined />,
			label: t('nav.threatDetection'),
			children: [
				{ key: '/risk-dashboard', label: t('nav.riskDashboard') },
				{ key: '/anomalies', label: t('nav.anomalies') },
				{ key: '/alerts', label: t('nav.alerts') },
				{ key: '/sessions', label: t('nav.sessionSecurity') },
				{ key: '/incidents', label: t('nav.incidents') },
			],
		},
		{
			key: 'identity',
			icon: <ApiOutlined />,
			label: t('nav.identityCenter', 'Identity Center'),
			children: [
				{ key: '/nhi', label: t('nav.nhi', 'NHI Monitoring') },
				{ key: '/soc-kpi', label: t('nav.socKpi', 'SOC KPIs') },
			],
		},
		{
			key: 'compliance',
			icon: <FileProtectOutlined />,
			label: t('nav.complianceCenter'),
			children: [
				{ key: '/compliance', label: t('nav.complianceDashboard') },
				{ key: '/dsars', label: t('nav.dsar') },
				{ key: '/breaches', label: t('nav.breaches') },
				{ key: '/evidence', label: t('nav.evidence') },
				{ key: '/audit-findings', label: t('nav.auditFindings') },
			],
		},
		{
			key: 'archives',
			icon: <FileZipOutlined />,
			label: t('nav.archiveMgmt'),
			children: [{ key: '/archives', label: t('nav.archives') }],
		},
		{
			key: 'reports',
			icon: <FileTextOutlined />,
			label: t('nav.reportCenter'),
			children: [
				{ key: '/reports', label: t('nav.reports') },
				{ key: '/notifications/delivery-stats', label: t('nav.deliveryStats') },
			],
		},
		{ key: '/settings', icon: <SettingOutlined />, label: t('nav.settings') },
	];

	function buildBreadcrumbs(): Array<{ title: React.ReactNode }> {
		const crumbs: Array<{ title: React.ReactNode }> = [{ title: <DashboardOutlined /> }];
		const pathMap: Record<string, string> = {
			'/': t('bc.overview'),
			'/audit-logs': t('bc.auditLogs'),
			'/export-jobs': t('bc.exportJobs'),
			'/hash-chain': t('bc.hashChain'),
			'/anomalies': t('bc.anomalies'),
			'/alerts': t('bc.alerts'),
			'/sessions': t('bc.sessions'),
			'/compliance': t('bc.compliance'),
			'/dsars': t('bc.dsar'),
			'/breaches': t('bc.breaches'),
			'/evidence': t('bc.evidence'),
			'/audit-findings': t('bc.auditFindings'),
			'/notifications/delivery-stats': t('bc.deliveryStats'),
			'/incidents': t('nav.incidents'),
			'/nhi': t('nav.nhi', 'NHI Monitoring'),
			'/soc-kpi': t('nav.socKpi', 'SOC KPIs'),
			'/archives': t('bc.archives'),
			'/reports': t('bc.reports'),
			'/settings': t('bc.settings'),
		};
		if (internalPath !== '/' && pathMap[internalPath]) {
			crumbs.push({ title: pathMap[internalPath] });
		}
		return crumbs;
	}

	return (
		<Layout className="min-h-screen">
			<Sider
				trigger={null}
				collapsible
				collapsed={collapsed}
				className="bg-white dark:bg-slate-800 border-r border-[var(--color-border)]"
			>
				<div className="flex h-16 items-center justify-center border-b border-[var(--color-border)]">
					<Text strong className="text-lg text-neutral-900 dark:text-neutral-100">
						{collapsed ? (
							t('app.titleShort')
						) : (
							<span className="flex items-center gap-2">
								<SecurityScanOutlined /> {t('app.title')}
							</span>
						)}
					</Text>
				</div>
				<Menu
					mode="inline"
					selectedKeys={[internalPath]}
					defaultOpenKeys={['audit', 'threats', 'identity', 'compliance', 'reports']}
					items={menuItems}
					onClick={({ key }) => {
						if (key.startsWith('/')) {
							// AC-005：basename 恒 "/" 后导航必须带 slug 前缀，否则落入顶层 * → 404。
							// key 均以 "/" 开头（menuItems 定义），`/${slug}${key}` 无双斜杠；
							// key === '/' 时 → `/${slug}/` 即租户首页。slug 兜底 ''（理论不可达，LayoutWrapper 仅在 /:tenantSlug 下渲染）。
							navigate(`/${slug ?? ''}${key}`);
						}
					}}
					className="border-r-0"
				/>
			</Sider>
			<Layout>
				<Header className="sticky top-0 z-10 flex items-center justify-between h-[var(--layout-header-height)] bg-[var(--color-bg-surface)] px-6 border-b border-[var(--color-border)]">
					<div className="flex items-center gap-4">
						<Button
							type="text"
							icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
							onClick={() => setCollapsed(!collapsed)}
						/>
						<Breadcrumb items={buildBreadcrumbs()} />
					</div>
					<div className="flex items-center gap-3">
						<PortalSwitcher portals={portals} currentPortal="security" />
						<SSEEventStream />
						<LanguageSwitcher />
						<ThemeToggle />
						<Button
							type="text"
							icon={<ReloadOutlined />}
							onClick={() => window.location.reload()}
							title={t('common.refresh')}
						/>
						<UserMenu
							user={user}
							items={[{ key: 'logout', type: 'logout', onClick: handleLogout }]}
						/>
					</div>
				</Header>
				<Content className="m-6 p-6 bg-[var(--color-bg-surface)] rounded-lg min-h-[calc(100vh-112px)]">
					{children}
				</Content>
			</Layout>
		</Layout>
	);
}
