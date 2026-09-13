import { useState, useCallback, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient, useQuery } from '@tanstack/react-query';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import {
  Activity,
  ArrowRight,
  BatteryCharging,
  Check,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  Clock3,
  Cpu,
  Filter,
  Gauge,
  Grid3X3,
  Info,
  Layers,
  LayoutDashboard,
  LineChart,
  MapPin,
  Menu,
  Network,
  Plus,
  Radio,
  RefreshCw,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  SunMedium,
  Tag,
  TrendingUp,
  UserRound,
  X,
  Zap,
} from 'lucide-react';
import {
  getListDemandsQueryKey,
  getListListingsQueryKey,
  getListSolarSystemsQueryKey,
  useCancelDemand,
  useCancelListing,
  useCloseListing,
  useCreateDemand,
  useCreateListing,
  useCreateSolarSystem,
  useExecuteTrade,
  useGetActivityFeed,
  useGetAuthSession,
  useGetCurrentPricing,
  useGetDashboardSummary,
  useGetEnergyOverview,
  useGetGridStatus,
  useGetMatchRecommendations,
  useGetTradePreview,
  useHealthCheck,
  useListDemands,
  useListListings,
  useListSolarSystems,
  useListTransactions,
  useRecommendMatches,
  useVerifyLedger,
  useVerifyTransaction,
  setAuthTokenGetter,
} from '@workspace/api-client-react';
import type { Demand, Listing, MatchRecommendation, TradePreview } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { DemoPanel } from '@/components/DemoPanel';
import NotFound from '@/pages/not-found';

const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

const queryClient = new QueryClient();

let activeAuthToken = localStorage.getItem('gridtrade_auth_token') || 'demo:prosumer';
setAuthTokenGetter(() => activeAuthToken);

export function updateAuthToken(token: string) {
  activeAuthToken = token;
  localStorage.setItem('gridtrade_auth_token', token);
  queryClient.invalidateQueries();
}

export function getRoleBadgeClass(role?: string) {
  switch (role?.toUpperCase()) {
    case 'PROSUMER':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    case 'CONSUMER':
      return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    case 'UTILITY':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    case 'REGULATOR':
      return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    case 'ADMIN':
      return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    default:
      return 'bg-secondary text-muted-foreground border-border';
  }
}

const PRESET_ACCOUNTS = [
  { role: 'PROSUMER', token: 'demo:prosumer', name: 'Aarav Sharma', desc: 'Solar asset owner with 12.5 kWp generation capacity', area: 'KA_BLR_01' },
  { role: 'CONSUMER', token: 'demo:consumer', name: 'Priya Nair', desc: 'Clean energy consumer buying green tariff power', area: 'KA_BLR_01' },
  { role: 'UTILITY', token: 'demo:utility', name: 'BESCOM Grid Controller', desc: 'DISCOM distribution operator & grid congestion control', area: 'KA_BLR_01' },
  { role: 'REGULATOR', token: 'demo:regulator', name: 'KERC Regulatory Inspector', desc: 'Statutory compliance & SHA-256 ledger integrity oversight', area: 'KA_BLR_01' },
  { role: 'ADMIN', token: 'demo:admin', name: 'System Administrator', desc: 'Full infrastructure, security safeguards & platform governance', area: 'GLOBAL' },
];

function AccountSwitcherModal({ open, onClose, currentToken, onSelectToken }: {
  open: boolean;
  onClose: () => void;
  currentToken: string;
  onSelectToken: (token: string) => void;
}) {
  const [customToken, setCustomToken] = useState('');

  if (!open) return null;

  const handleSelect = (token: string) => {
    onSelectToken(token);
    onClose();
  };

  const handleCustomSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (customToken.trim()) {
      onSelectToken(customToken.trim());
      setCustomToken('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="gt-card max-w-lg w-full p-6 space-y-5 border-[hsl(var(--border))] shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-3">
          <div>
            <div className="gt-label text-[hsl(var(--accent))]">Role-Based Access Control</div>
            <h2 className="text-lg font-black tracking-[-.03em]">Switch Active Persona / Auth</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-2.5">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Preset Persona Accounts</div>
          {PRESET_ACCOUNTS.map((acc) => {
            const isActive = currentToken === acc.token;
            return (
              <button
                key={acc.role}
                onClick={() => handleSelect(acc.token)}
                className={`w-full flex items-start gap-3 p-3.5 rounded-xl border transition-all text-left ${
                  isActive
                    ? 'border-[hsl(var(--accent))] bg-[hsl(var(--accent)/.08)] shadow-sm'
                    : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:bg-[hsl(var(--secondary)/.5)]'
                }`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--secondary))] font-black text-xs">
                  {acc.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-sm">{acc.name}</span>
                    <span className={`gt-badge text-[10px] font-mono font-bold px-2 py-0.5 border ${getRoleBadgeClass(acc.role)}`}>
                      {acc.role}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{acc.desc}</p>
                </div>
                {isActive && <Check size={16} className="text-[hsl(var(--accent))] shrink-0 mt-1" />}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleCustomSubmit} className="pt-2 border-t border-[hsl(var(--border))] space-y-2">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Custom Auth Token</div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. demo:custom or Bearer JWT..."
              value={customToken}
              onChange={(e) => setCustomToken(e.target.value)}
              className="gt-input flex-1 text-xs font-mono"
            />
            <button type="submit" className="gt-button gt-button-primary text-xs px-4">
              Apply Token
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type IconType = typeof LayoutDashboard;

const navItems: { href: string; label: string; icon: IconType; detail: string; requiredRole?: string }[] = [
  { href: '/', label: 'Operating picture', icon: LayoutDashboard, detail: 'Live system view' },
  { href: '/marketplace', label: 'Marketplace', icon: Network, detail: 'Buy and publish' },
  { href: '/utility', label: 'Utility Control Room', icon: Gauge, detail: 'DISCOM grid operations', requiredRole: 'UTILITY' },
  { href: '/regulator', label: 'Regulator Portal', icon: ShieldCheck, detail: 'Oversight & audit', requiredRole: 'REGULATOR' },
  { href: '/admin', label: 'Admin Control Room', icon: SlidersHorizontal, detail: 'System health & RBAC', requiredRole: 'ADMIN' },
  { href: '/solar', label: 'Solar systems', icon: SunMedium, detail: 'Owned assets' },
  { href: '/grid', label: 'Grid conditions', icon: Grid3X3, detail: 'Decisions and signals' },
  { href: '/ai', label: 'AI Cockpit', icon: Sparkles, detail: 'Forecasts & assistant' },
  { href: '/ledger', label: 'SHA-256 Ledger', icon: ShieldCheck, detail: 'Cryptographic audit' },
  { href: '/activity', label: 'Activity', icon: Activity, detail: 'Persisted events' },
  { href: '/audit', label: 'Audit Explorer', icon: Clock3, detail: 'Complete event log' },
];

function AccessDeniedPage({ requiredRole, currentRole }: { requiredRole: string; currentRole: string }) {
  const [, setLocation] = useLocation();

  const handleSwitchToRequiredRole = () => {
    const tokenMap: Record<string, string> = {
      ADMIN: 'demo:admin',
      UTILITY: 'demo:utility',
      REGULATOR: 'demo:regulator',
      PROSUMER: 'demo:prosumer',
      CONSUMER: 'demo:consumer',
    };
    const targetToken = tokenMap[requiredRole] || 'demo:admin';
    updateAuthToken(targetToken);
  };

  return (
    <div className="mx-auto max-w-2xl py-12 px-4 text-center space-y-6 animate-in fade-in duration-200" data-testid="access-denied-page">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shadow-xl">
        <ShieldCheck size={40} />
      </div>

      <div className="space-y-2">
        <div className="gt-label text-rose-400 uppercase tracking-widest font-mono">403 Restricted Access Control</div>
        <h1 className="text-3xl font-black tracking-tight">{requiredRole} Authorization Required</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          This portal contains restricted operational controls reserved strictly for <span className="font-extrabold text-foreground">{requiredRole}</span> role sessions.
        </p>
      </div>

      <div className="gt-card p-5 border border-rose-500/30 bg-rose-500/5 max-w-md mx-auto space-y-3 text-left">
        <div className="flex items-center justify-between text-xs border-b border-[hsl(var(--border))] pb-2">
          <span className="text-muted-foreground font-bold">Your Active Role:</span>
          <span className={`gt-badge text-[10px] font-mono font-bold px-2 py-0.5 border ${getRoleBadgeClass(currentRole)}`}>
            {currentRole}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-bold">Required Portal Role:</span>
          <span className={`gt-badge text-[10px] font-mono font-bold px-2 py-0.5 border ${getRoleBadgeClass(requiredRole)}`}>
            {requiredRole}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          onClick={handleSwitchToRequiredRole}
          className="gt-button gt-button-primary w-full sm:w-auto px-6 py-2.5 text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white"
          data-testid="button-switch-required-role"
        >
          <UserRound size={15} /> Switch to {requiredRole} Persona (`demo:{requiredRole.toLowerCase()}`)
        </button>
        <button
          onClick={() => setLocation('/')}
          className="gt-button gt-button-quiet w-full sm:w-auto px-5 py-2.5 text-xs font-extrabold"
          data-testid="button-return-home"
        >
          Return to Overview
        </button>
      </div>
    </div>
  );
}

function formatNumber(value: number | undefined, digits = 1) {
  return typeof value === 'number'
    ? new Intl.NumberFormat('en-IN', { maximumFractionDigits: digits }).format(value)
    : '—';
}

function formatCurrency(value: number | undefined) {
  return typeof value === 'number' ? `₹${value.toFixed(2)}` : '—';
}

function formatWhen(value?: string) {
  if (!value) return 'No timestamp';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }).format(date);
}

function ensureArray<T>(val: unknown): T[] {
  if (Array.isArray(val)) return val as T[];
  if (val && typeof val === 'object' && 'data' in val && Array.isArray((val as any).data)) {
    return (val as any).data as T[];
  }
  return [];
}

function decisionTone(decision?: string) {
  if (decision === 'APPROVED') return 'approved';
  if (decision === 'RESTRICTED') return 'restricted';
  return 'adjusted';
}

function DataState({ loading, error, empty, children, onRetry, label }: {
  loading?: boolean;
  error?: boolean;
  empty?: boolean;
  children: ReactNode;
  onRetry?: () => void;
  label?: string;
}) {
  if (loading) {
    return <div className="space-y-3" data-testid={`loading-${label ?? 'data'}`}>
      <div className="gt-skeleton h-24 w-full" />
      <div className="gt-skeleton h-24 w-full" />
    </div>;
  }
  if (error) {
    return <div className="gt-card flex min-h-36 flex-col items-center justify-center gap-3 p-6 text-center" data-testid={`error-${label ?? 'data'}`}>
      <CircleAlert size={19} className="text-[hsl(var(--destructive))]" />
      <div><p className="text-sm font-extrabold">Signal unavailable</p><p className="mt-1 text-xs text-muted-foreground">The latest {label ?? 'data'} could not be loaded.</p></div>
      {onRetry && <button className="gt-button gt-button-quiet" onClick={onRetry} data-testid={`button-retry-${label ?? 'data'}`}><RefreshCw size={13} /> Retry</button>}
    </div>;
  }
  if (empty) {
    return <div className="gt-card flex min-h-36 flex-col items-center justify-center p-6 text-center" data-testid={`empty-${label ?? 'data'}`}>
      <CircleDashed size={20} className="mb-2 text-muted-foreground" />
      <p className="text-sm font-extrabold">No {label ?? 'records'} yet</p>
      <p className="mt-1 text-xs text-muted-foreground">New records will appear here as the network moves.</p>
    </div>;
  }
  return <>{children}</>;
}

function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { data: session, isLoading: sessionLoading } = useGetAuthSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const displayName = session?.displayName || 'Control room';
  const role = session?.role || 'PROSUMER';
  const currentToken = activeAuthToken;

  const handleSelectToken = (token: string) => {
    updateAuthToken(token);
  };

  return (
    <div className="gt-shell flex">
      <aside className="gt-sidebar hidden w-[238px] shrink-0 flex-col border-r border-[hsl(var(--sidebar-border))] lg:flex">
        <div className="flex h-[78px] items-center gap-3 border-b border-[hsl(var(--sidebar-border))] px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]">
            <Zap size={18} strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-[15px] font-extrabold tracking-[-.04em]">GridTrade</div>
            <div className="gt-label !text-[hsl(var(--sidebar-foreground)/.45)]">Local energy network</div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-5 py-5">
          <span className="gt-status-dot" />
          <div className="text-[11px] font-bold text-[hsl(var(--sidebar-foreground)/.72)]">Network live</div>
          <div className="ml-auto gt-mono text-[10px] text-[hsl(var(--sidebar-foreground)/.42)]">24 / 7</div>
        </div>
        <nav className="flex-1 space-y-1 pr-4">
          <div className="px-5 pb-2 pt-1 text-[9px] font-extrabold uppercase tracking-[.2em] text-[hsl(var(--sidebar-foreground)/.35)]">
            Workspace
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location === item.href;
            const isRestricted = item.requiredRole && role !== item.requiredRole && role !== 'ADMIN';
            return (
              <Link
                href={item.href}
                key={item.href}
                className={`gt-nav-item ${active ? 'gt-nav-active' : ''} ${isRestricted ? 'opacity-75' : ''}`}
                data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                {isRestricted ? (
                  <span className="ml-auto text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-rose-500/30 bg-rose-500/10 text-rose-400">
                    {item.requiredRole}
                  </span>
                ) : (
                  active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[hsl(var(--sidebar-primary))]" />
                )}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-[hsl(var(--sidebar-border))] p-4 space-y-2">
          <button
            onClick={() => setAuthModalOpen(true)}
            className="w-full flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-[hsl(var(--sidebar-accent))]"
            data-testid="button-nav-account"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--sidebar-primary)/.18)] text-[11px] font-extrabold text-[hsl(var(--sidebar-primary))]">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="truncate text-[11px] font-extrabold">{sessionLoading ? 'Loading...' : displayName}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`gt-badge text-[9px] font-mono font-bold px-1.5 py-0 border ${getRoleBadgeClass(role)}`}>
                  {role}
                </span>
              </div>
            </div>
            <UserRound size={14} className="text-[hsl(var(--sidebar-foreground)/.4)] shrink-0" />
          </button>
        </div>
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-[hsl(var(--sidebar)/.55)] lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <aside
        className={`gt-sidebar fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col border-r border-[hsl(var(--sidebar-border))] transition-transform lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-[78px] items-center justify-between border-b border-[hsl(var(--sidebar-border))] px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]">
              <Zap size={18} />
            </div>
            <span className="font-extrabold">GridTrade</span>
          </div>
          <button onClick={() => setMobileOpen(false)} aria-label="Close navigation" data-testid="button-close-navigation">
            <X size={18} />
          </button>
        </div>
        <nav className="space-y-1 pr-4 pt-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link href={item.href} key={item.href} onClick={() => setMobileOpen(false)} className="gt-nav-item">
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <Link href="/settings" onClick={() => setMobileOpen(false)} className="gt-nav-item">
            <Settings2 size={16} />
            <span>Settings</span>
          </Link>
        </nav>
      </aside>
      <main className="gt-main flex min-h-[100dvh] flex-1 flex-col">
        <header className="gt-topbar sticky top-0 z-30 flex h-[64px] items-center justify-between px-4 sm:px-7">
          <div className="flex items-center gap-3">
            <button
              className="rounded-md p-2 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              data-testid="button-open-navigation"
            >
              <Menu size={19} />
            </button>
            <div className="lg:hidden text-sm font-extrabold">GridTrade</div>
            <div className="hidden items-center gap-2 text-[11px] text-muted-foreground sm:flex">
              <Radio size={13} className="text-[hsl(var(--accent))]" /> Local dispatch /{' '}
              <span className="font-bold text-foreground">South Bengaluru (KA_BLR_01)</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold text-emerald-400 sm:flex">
              <span className="gt-status-dot" /> SSE Realtime <span className="gt-mono text-emerald-300">Connected</span>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1 text-xs font-bold transition-colors hover:bg-[hsl(var(--secondary))]"
                data-testid="button-header-profile"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--accent)/.2)] text-[10px] font-extrabold text-[hsl(var(--accent))]">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-xs font-extrabold">{displayName}</span>
                <span className={`gt-badge text-[9px] font-mono font-bold px-1.5 py-0.5 border ${getRoleBadgeClass(role)}`}>
                  {role}
                </span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 shadow-xl z-50 space-y-2 animate-in fade-in duration-150">
                  <div className="px-2 pb-2 border-b border-[hsl(var(--border))]">
                    <div className="text-xs font-extrabold">{displayName}</div>
                    <div className="text-[11px] text-muted-foreground">Role: {role}</div>
                    <div className="text-[10px] font-mono text-muted-foreground truncate mt-0.5">Token: {currentToken}</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase px-2">Quick Persona Switch</div>
                    {PRESET_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.role}
                        onClick={() => {
                          handleSelectToken(acc.token);
                          setUserMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between rounded-lg px-2 py-1.5 text-xs text-left transition-colors ${
                          currentToken === acc.token ? 'bg-[hsl(var(--accent)/.12)] text-[hsl(var(--accent))] font-bold' : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <span className="truncate">{acc.name}</span>
                        <span className={`gt-badge text-[9px] px-1 py-0 border ${getRoleBadgeClass(acc.role)}`}>{acc.role}</span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-[hsl(var(--border))]">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        setAuthModalOpen(true);
                      }}
                      className="w-full gt-button gt-button-quiet text-xs justify-center"
                    >
                      <SlidersHorizontal size={13} /> Switch Persona / Custom Auth
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="gt-page-enter flex-1 px-4 py-6 sm:px-7 sm:py-8">{children}</div>
      </main>
      <FloatingChatbotWidget />
      <AccountSwitcherModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentToken={currentToken}
        onSelectToken={handleSelectToken}
      />
    </div>
  );
}

function FloatingChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    sources?: string[];
    confidence?: number;
    actions?: Array<{ label: string; action: string; targetUrl?: string }>;
  }>>([
    {
      id: 'init-1',
      role: 'assistant',
      content: 'Hello! I am your **GridTrade AI Energy Assistant**. How can I help with your energy strategy or grid conditions today?',
      sources: ['GRIDTRADE_SYSTEM_CONTEXT'],
      confidence: 0.95,
      actions: [
        { label: 'Why was my trade adjusted?', action: 'QUERY' },
        { label: 'Should I buy energy now?', action: 'QUERY' },
        { label: 'Explain current price', action: 'QUERY' },
      ],
    },
  ]);

  const starterPrompts = [
    'Explain my current grid status',
    'Should I buy energy now?',
    'Why was my trade adjusted?',
    'Explain the current price',
    'How much surplus can I sell?',
    'Why is GridTrade different?',
  ];

  const handleSend = async (queryText?: string) => {
    const text = queryText || input;
    if (!text.trim() || loading) return;

    const userMsgId = `usr-${Date.now()}`;
    setMessages((prev) => [...prev, { id: userMsgId, role: 'user', content: text }]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: `asst-${Date.now()}`,
            role: 'assistant',
            content: data.answer,
            sources: data.sources,
            confidence: data.confidence,
            actions: data.suggestedActions,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: 'The AI Assistant is currently operating in offline mode. Marketplace and grid dispatch remain 100% operational.',
            confidence: 0.5,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Connection to AI Assistant service interrupted. Standard trading features remain available.',
          confidence: 0.5,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end" data-testid="floating-chatbot-widget">
      {open ? (
        <div className="gt-card flex h-[540px] w-[92vw] max-w-[420px] flex-col overflow-hidden shadow-2xl border border-[hsl(var(--accent)/.4)] bg-[hsl(var(--card))]">
          <div className="flex items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--sidebar))] px-4 py-3 text-[hsl(var(--sidebar-foreground))]">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(var(--accent)/.2)] text-[hsl(var(--accent))]">
                <Sparkles size={15} />
              </div>
              <div>
                <div className="text-xs font-extrabold">GridTrade AI Energy Assistant</div>
                <div className="text-[9px] text-[hsl(var(--sidebar-foreground)/.6)]">Context-Grounded Copilot</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="gt-badge border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-[9px] font-bold">LIVE</span>
              <button className="rounded p-1 hover:bg-[hsl(var(--border))]" onClick={() => setOpen(false)} aria-label="Minimize chatbot" data-testid="button-minimize-chatbot">
                <X size={15} />
              </button>
            </div>
          </div>

          <div className="flex gap-1.5 overflow-x-auto border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/.2)] p-2 text-[10px]">
            {starterPrompts.map((p) => (
              <button
                key={p}
                className="shrink-0 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2.5 py-1 font-semibold text-muted-foreground hover:border-[hsl(var(--accent))] hover:text-[hsl(var(--accent))] transition-colors"
                onClick={() => handleSend(p)}
                data-testid={`prompt-chip-${p.substring(0, 10).toLowerCase().replaceAll(' ', '-')}`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-3.5 text-xs">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`rounded-xl px-3.5 py-2.5 max-w-[90%] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] font-semibold'
                      : 'bg-[hsl(var(--muted)/.35)] border border-[hsl(var(--border))] text-foreground'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1 border-t border-[hsl(var(--border)/.4)] pt-1.5">
                      <span className="text-[9px] text-muted-foreground font-bold">Data Sources:</span>
                      {msg.sources.map((src) => (
                        <span key={src} className="rounded bg-black/40 px-1.5 py-0.5 text-[8.5px] font-mono text-emerald-300">
                          {src}
                        </span>
                      ))}
                    </div>
                  )}

                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5 pt-1">
                      {msg.actions.map((act) => (
                        <button
                          key={act.label}
                          className="rounded bg-[hsl(var(--accent)/.18)] px-2 py-1 text-[10px] font-bold text-[hsl(var(--accent))] hover:bg-[hsl(var(--accent)/.3)] transition-colors flex items-center gap-1"
                          onClick={() => {
                            if (act.action === 'NAVIGATE' && act.targetUrl) setLocation(act.targetUrl);
                            else handleSend(act.label);
                          }}
                        >
                          {act.label} <ArrowRight size={10} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground p-2">
                <RefreshCw size={13} className="animate-spin text-[hsl(var(--accent))]" /> AI Assistant analyzing current grid telemetry…
              </div>
            )}
          </div>

          <div className="border-t border-[hsl(var(--border))] p-3 bg-[hsl(var(--card))]">
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="gt-input flex-1 text-xs"
                placeholder="Ask about grid status, prices, surplus…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                data-testid="input-floating-chatbot"
              />
              <button
                className="gt-button gt-button-primary !py-2 !px-3 text-xs"
                onClick={() => handleSend()}
                disabled={loading}
                data-testid="button-send-floating-chatbot"
              >
                Send
              </button>
            </div>
            <div className="mt-2 text-[9px] text-center text-muted-foreground">
              Read-only AI decision support — cannot execute state mutations directly.
            </div>
          </div>
        </div>
      ) : (
        <button
          className="gt-button gt-button-accent flex items-center gap-2 shadow-xl hover:scale-105 transition-transform"
          onClick={() => setOpen(true)}
          data-testid="button-open-floating-chatbot"
        >
          <Sparkles size={16} />
          <span className="font-extrabold text-xs">AI Energy Assistant</span>
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      )}
    </div>
  );
}

function PageHeader({ eyebrow, title, detail, action }: { eyebrow: string; title: string; detail: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><div className="gt-label mb-2 text-[hsl(var(--accent))]">{eyebrow}</div><h1 className="text-[26px] font-extrabold tracking-[-.055em] sm:text-[32px]">{title}</h1><p className="mt-2 max-w-[640px] text-[13px] leading-6 text-muted-foreground">{detail}</p></div>{action}</div>;
}

function KpiCard({ label, value, sub, icon: Icon, accent = 'primary' }: { label: string; value: string; sub: string; icon: IconType; accent?: 'primary' | 'accent' }) {
  return <div className="gt-card gt-kpi p-4 sm:p-5" data-testid={`kpi-${label.toLowerCase().replaceAll(' ', '-')}`}><div className="mb-5 flex items-start justify-between"><span className="gt-label">{label}</span><div className={`rounded-lg p-2 ${accent === 'accent' ? 'bg-[hsl(var(--accent)/.12)] text-[hsl(var(--accent))]' : 'bg-[hsl(var(--primary)/.16)] text-[hsl(var(--primary))]'}`}><Icon size={15} /></div></div><div className="gt-mono relative z-10 text-[25px] font-medium tracking-[-.06em]">{value}</div><div className="relative z-10 mt-2 text-[11px] text-muted-foreground">{sub}</div></div>;
}

function Sparkline({ observations }: { observations: { generationKwh: number; consumptionKwh: number }[] }) {
  const points = observations.length ? observations : Array.from({ length: 8 }, (_, i) => ({ generationKwh: 20 + i * 2, consumptionKwh: 12 + i }));
  const max = Math.max(...points.flatMap((point) => [point.generationKwh, point.consumptionKwh]), 1);
  const makeLine = (key: 'generationKwh' | 'consumptionKwh') => points.map((point, index) => `${(index / Math.max(points.length - 1, 1)) * 100},${92 - (point[key] / max) * 72}`).join(' ');
  return <div className="relative h-[190px] w-full overflow-hidden rounded-lg bg-[hsl(var(--muted)/.38)] p-3" data-testid="chart-energy-trend">
    <div className="absolute inset-0 gt-grid-lines opacity-50" />
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="relative h-full w-full overflow-visible"><polyline points={makeLine('generationKwh')} fill="none" stroke="hsl(var(--accent))" strokeWidth="1.25" vectorEffect="non-scaling-stroke" /><polyline points={makeLine('consumptionKwh')} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.25" vectorEffect="non-scaling-stroke" strokeDasharray="3 2" /></svg>
    <div className="absolute bottom-3 left-3 flex gap-4 text-[10px] font-bold"><span className="flex items-center gap-1.5"><i className="h-1.5 w-5 rounded bg-[hsl(var(--accent))]" /> Generation</span><span className="flex items-center gap-1.5"><i className="h-1.5 w-5 rounded bg-[hsl(var(--primary))]" /> Consumption</span></div>
  </div>;
}

function ActivityList({ events, compact = false }: { events: any[]; compact?: boolean }) {
  const list = ensureArray<any>(events);
  return <div className="divide-y divide-[hsl(var(--border))]">{list.map((event, index) => <div className={`flex gap-3 ${compact ? 'py-3' : 'py-4'}`} key={event.id ?? index} data-testid={`row-activity-${event.id ?? index}`}><div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${event.status === 'positive' ? 'bg-[hsl(var(--accent)/.12)] text-[hsl(var(--accent))]' : event.status === 'warning' ? 'bg-[hsl(var(--destructive)/.1)] text-[hsl(var(--destructive))]' : 'bg-[hsl(var(--primary)/.14)] text-[hsl(var(--primary))]'}`}><Activity size={13} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"><p className="text-[12px] font-extrabold">{event.title}</p><span className="gt-mono text-[9px] text-muted-foreground">{formatWhen(event.occurredAt)}</span></div><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{event.detail}</p></div></div>)}</div>;
}

function HomePage() {
  const summary = useGetDashboardSummary();
  const activity = useGetActivityFeed({ limit: 6 });
  const energy = useGetEnergyOverview({ window: '24h' });
  const recommendations = useGetMatchRecommendations();
  const grid = useGetGridStatus();
  const summaryData = summary.data;
  const trend = ensureArray<any>(energy.data ?? summaryData?.energyTrend);
  const recList = ensureArray<any>(recommendations.data);
  const actList = ensureArray<any>(activity.data);
  const loading = summary.isLoading || grid.isLoading;
  return <div className="mx-auto max-w-[1450px]">
    <PageHeader eyebrow="Operating picture / live" title="The network, right now." detail="A decision surface for local energy flows. Watch the surplus, read the grid, then move with confidence." action={<div className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-[10px] font-bold"><span className="gt-status-dot" /> South Bengaluru <ChevronRight size={12} className="text-muted-foreground" /></div>} />
    <DataState loading={loading} error={summary.isError || grid.isError} onRetry={() => { void summary.refetch(); void grid.refetch(); }} label="operating picture">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Marketable surplus" value={`${formatNumber(summaryData?.marketableSurplusKwh)} kWh`} sub="Available in your zone" icon={BatteryCharging} />
        <KpiCard label="Active listings" value={formatNumber(summaryData?.activeListings, 0)} sub={`${formatNumber(summaryData?.activeProsumers, 0)} active prosumers`} icon={Network} accent="accent" />
        <KpiCard label="Live price" value={`${formatCurrency(summaryData?.currentPriceInrPerKwh)} / kWh`} sub="Weighted zone average" icon={TrendingUp} />
        <KpiCard label="Carbon avoided" value={`${formatNumber(summaryData?.carbonAvoidedKg)} kg`} sub="Today through local matching" icon={Sparkles} accent="accent" />
      </div>
      <div className="mt-3 grid gap-3 xl:grid-cols-[1.55fr_1fr]">
        <section className="gt-card p-4 sm:p-5"><div className="mb-5 flex items-start justify-between"><div><div className="gt-label">Energy trend / 24 hours</div><h2 className="mt-1 text-base font-extrabold">Supply is outpacing load</h2></div><Link href="/solar" className="gt-button gt-button-quiet" data-testid="link-view-energy-detail">Inspect <ChevronRight size={13} /></Link></div><Sparkline observations={trend} /></section>
        <section className="gt-card relative overflow-hidden bg-[hsl(var(--sidebar))] p-5 text-[hsl(var(--sidebar-foreground))]"><div className="absolute -right-12 -top-14 h-48 w-48 rounded-full border border-[hsl(var(--sidebar-primary)/.18)]" /><div className="relative"><div className="flex items-center justify-between"><div className="gt-label !text-[hsl(var(--sidebar-foreground)/.52)]">Grid decision</div><Gauge size={17} className="text-[hsl(var(--sidebar-primary))]" /></div><div className="mt-8 flex items-end justify-between"><div><div className="text-[25px] font-extrabold tracking-[-.06em]">{summaryData?.gridLabel ?? grid.data?.label ?? 'Assessing'}</div><div className="mt-2 flex items-center gap-2 text-[11px] text-[hsl(var(--sidebar-foreground)/.6)]"><span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--sidebar-primary))]" /> {summaryData?.gridDecision ?? grid.data?.decision ?? '—'} · stable operating band</div></div><div className="gt-mono text-[31px] text-[hsl(var(--sidebar-primary))]">{grid.data?.frequencyHz?.toFixed(2) ?? '—'}<span className="ml-1 text-[10px] text-[hsl(var(--sidebar-foreground)/.5)]">Hz</span></div></div><div className="mt-8 border-t border-[hsl(var(--sidebar-border))] pt-3 text-[10px] text-[hsl(var(--sidebar-foreground)/.55)]">Decision model updated {formatWhen(grid.data?.updatedAt)} <Link href="/grid" className="ml-2 font-bold text-[hsl(var(--sidebar-primary))]" data-testid="link-inspect-grid">Inspect rationale</Link></div></div></section>
      </div>
      <div className="mt-3 grid gap-3 xl:grid-cols-[1.15fr_1fr]">
        <section className="gt-card p-4 sm:p-5"><div className="mb-3 flex items-center justify-between"><div><div className="gt-label">Recommended actions</div><h2 className="mt-1 text-base font-extrabold">Best matches in your zone</h2></div><Link href="/marketplace" className="text-[11px] font-extrabold text-[hsl(var(--accent))]" data-testid="link-view-marketplace">Open marketplace <ChevronRight size={12} className="ml-1 inline" /></Link></div><DataState loading={recommendations.isLoading} error={recommendations.isError} empty={!recommendations.isLoading && !recList.length} onRetry={() => void recommendations.refetch()} label="recommendations"><div className="divide-y divide-[hsl(var(--border))]">{recList.slice(0, 3).map((match) => <div key={match.id} className="flex items-center gap-3 py-3" data-testid={`row-recommendation-${match.id}`}><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]"><SunMedium size={16} /></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate text-[12px] font-extrabold">{match.sellerName}</p><span className="gt-mono text-[11px] font-medium">{formatCurrency(match.priceInrPerKwh)}</span></div><div className="mt-1 flex gap-3 text-[10px] text-muted-foreground"><span>{match.location}</span><span>{formatNumber(match.quantityKwh)} kWh</span></div></div><div className="rounded-full bg-[hsl(var(--accent)/.12)] px-2 py-1 gt-mono text-[10px] font-medium text-[hsl(var(--accent))]">{match.score}%</div></div>)}</div></DataState></section>
        <section className="gt-card p-4 sm:p-5"><div className="mb-3 flex items-center justify-between"><div><div className="gt-label">Activity stream</div><h2 className="mt-1 text-base font-extrabold">What just moved</h2></div><Link href="/activity" className="text-[11px] font-extrabold text-[hsl(var(--accent))]" data-testid="link-view-activity">View all <ChevronRight size={12} className="ml-1 inline" /></Link></div><DataState loading={activity.isLoading} error={activity.isError} empty={!activity.isLoading && !actList.length} onRetry={() => void activity.refetch()} label="activity"><ActivityList events={actList} compact /></DataState></section>
      </div>
    </DataState>
  </div>;
}

function MatchBreakdownModal({ match, onClose, onPreviewTrade }: { match: any; onClose: () => void; onPreviewTrade: (listingId: string) => void }) {
  const b = match.breakdown ?? {};
  const reasons = match.reasons ?? [];
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[hsl(var(--sidebar)/.55)] p-3 sm:items-center">
    <div className="gt-card w-full max-w-[560px] p-5 sm:p-6" role="dialog" aria-modal="true" data-testid="dialog-match-breakdown">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <div className="gt-label text-[hsl(var(--accent))]">Intelligent Match Breakdown</div>
          <h2 className="mt-1 text-xl font-extrabold tracking-[-.04em]">{match.sellerName} · {match.score}% Match</h2>
        </div>
        <button onClick={onClose} data-testid="button-close-breakdown"><X size={18} /></button>
      </div>
      <div className="space-y-4">
        <div className="rounded-lg bg-[hsl(var(--muted)/.4)] p-3 text-xs text-muted-foreground leading-5">
          <span className="font-extrabold text-foreground">Rationale:</span> {match.rationale}
        </div>
        <div>
          <div className="gt-label mb-2">6-Factor Weighted Scoring Model</div>
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <FactorBar label="Price Fit (25%)" score={b.priceScore ?? 85} />
            <FactorBar label="Availability (15%)" score={b.availabilityScore ?? 90} />
            <FactorBar label="Quantity Fit (15%)" score={b.quantityFitScore ?? 80} />
            <FactorBar label="Proximity (15%)" score={b.proximityScore ?? 95} />
            <FactorBar label="Reliability (15%)" score={b.reliabilityScore ?? 88} />
            <FactorBar label="Grid Suitability (15%)" score={b.gridSuitabilityScore ?? 92} />
          </div>
        </div>
        {reasons.length > 0 && <div>
          <div className="gt-label mb-2">Key Drivers</div>
          <div className="space-y-2">
            {reasons.map((r: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2 rounded-md border border-[hsl(var(--border))] px-3 py-2 text-xs">
                {r.impact === 'positive' ? <CircleCheck size={14} className="text-[hsl(var(--accent))]" /> : <CircleAlert size={14} className="text-[hsl(var(--primary))]" />}
                <span className="font-bold">{r.code}:</span>
                <span className="text-muted-foreground">{r.description}</span>
              </div>
            ))}
          </div>
        </div>}
        <div className="flex justify-end gap-2 pt-3 border-t border-[hsl(var(--border))]">
          <button className="gt-button gt-button-quiet" onClick={onClose} data-testid="button-dismiss-breakdown">Close</button>
          <button className="gt-button gt-button-primary" onClick={() => { onClose(); onPreviewTrade(match.listingId); }} data-testid="button-preview-trade-from-breakdown">
            <ShoppingBag size={14} /> Preview & Buy Trade
          </button>
        </div>
      </div>
    </div>
  </div>;
}

function FactorBar({ label, score }: { label: string; score: number }) {
  return <div className="rounded-md border border-[hsl(var(--border))] p-2.5 bg-[hsl(var(--card))]">
    <div className="flex justify-between text-[11px] font-bold mb-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="gt-mono text-[hsl(var(--accent))]">{score}%</span>
    </div>
    <div className="h-1.5 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
      <div className="h-full rounded-full bg-[hsl(var(--accent))]" style={{ width: `${Math.max(4, Math.min(100, score))}%` }} />
    </div>
  </div>;
}

function TradePreviewModal({ listingId, demandId, onClose }: { listingId: string; demandId?: string; onClose: () => void }) {
  const [requestedKwh, setRequestedKwh] = useState('10');
  const [executionResult, setExecutionResult] = useState<any>(null);
  const previewMutation = useGetTradePreview();
  const executeTradeMutation = useExecuteTrade();
  const queryClient = useQueryClient();

  const p: any = (previewMutation.data as any)?.data || previewMutation.data;

  const calculatePreview = (vol: string) => {
    setRequestedKwh(vol);
    const kwh = Number(vol) || 1;
    previewMutation.mutate({ data: { listingId, demandId, requestedKwh: kwh } });
  };

  const handleConfirmTrade = async () => {
    if (!p) return;
    const finalQuantity = p.maximumTradableEnergyKwh ?? Number(requestedKwh);
    try {
      const res: any = await executeTradeMutation.mutateAsync({
        data: { listingId, demandId, requestedKwh: finalQuantity, energyAmountKwh: finalQuantity }
      });
      setExecutionResult(res);
      void queryClient.invalidateQueries({ queryKey: getListListingsQueryKey() });
      void queryClient.invalidateQueries({ queryKey: getListDemandsQueryKey() });
    } catch (err: any) {
      alert(`Trade Execution Error: ${err?.response?.data?.message || err?.message || 'Failed to execute trade'}`);
    }
  };

  const gridStatus = p?.gridDecision?.status || p?.gridDecision || 'APPROVED';
  const isRestricted = gridStatus === 'RESTRICTED';
  const isAdjusted = gridStatus === 'ADJUSTED';

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[hsl(var(--sidebar)/.55)] p-3 sm:items-center">
    <div className="gt-card w-full max-w-[540px] p-5 sm:p-6" role="dialog" aria-modal="true" data-testid="dialog-trade-preview">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="gt-label text-[hsl(var(--accent))]">Pre-Execution Dynamic Settlement</div>
          <h2 className="mt-1 text-xl font-extrabold tracking-[-.04em]">Grid-Aware Trade Preview</h2>
        </div>
        <button onClick={onClose} data-testid="button-close-trade-preview"><X size={18} /></button>
      </div>

      {executionResult ? (
        <div className="space-y-4 rounded-xl border border-[hsl(var(--accent)/.4)] bg-[hsl(var(--accent)/.08)] p-5">
          <div className="flex items-center gap-2.5 text-[hsl(var(--accent))]">
            <ShieldCheck size={22} />
            <h3 className="font-extrabold text-base">Trade Executed & Settled</h3>
          </div>
          <p className="text-xs text-muted-foreground">Energy allocation committed to PostgreSQL ledger with SHA-256 hash record.</p>
          <div className="space-y-2 rounded-lg bg-[hsl(var(--card))] p-3 text-xs border border-[hsl(var(--border))] font-mono">
            <div className="flex justify-between"><span>Trade ID:</span><span className="font-bold">{executionResult.id}</span></div>
            <div className="flex justify-between"><span>Volume Allocated:</span><span className="font-bold">{executionResult.quantityKwh} kWh</span></div>
            <div className="flex justify-between"><span>Agreed Price:</span><span className="font-bold">{formatCurrency(executionResult.agreedPriceInrPerKwh)}/kWh</span></div>
            <div className="flex justify-between"><span>Net Amount:</span><span className="font-bold text-[hsl(var(--accent))]">{formatCurrency(executionResult.netAmountInr)}</span></div>
            <div className="flex justify-between border-t border-[hsl(var(--border))] pt-2">
              <span>SHA-256 Hash:</span>
              <span className="truncate max-w-[200px] text-[10px] text-muted-foreground">{executionResult.ledgerHash}</span>
            </div>
          </div>
          <button className="gt-button gt-button-primary w-full justify-center" onClick={onClose} data-testid="button-close-success">
            Done
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <label className="block">
            <span className="gt-label mb-1.5 block">Requested Volume (kWh)</span>
            <div className="flex gap-2">
              <input className="gt-input flex-1" type="number" min="0.1" step="0.1" value={requestedKwh} onChange={(e) => calculatePreview(e.target.value)} data-testid="input-trade-volume" />
              <button className="gt-button gt-button-quiet text-xs" onClick={() => calculatePreview(requestedKwh)}>
                Calculate
              </button>
            </div>
          </label>

          <DataState loading={previewMutation.isPending} error={previewMutation.isError} label="trade preview">
            {p ? (
              <div className="space-y-3">
                {/* Dynamic Price Breakdown Card */}
                {p.pricing && (
                  <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.3)] p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="gt-label text-muted-foreground">Dynamic Rate</span>
                      <span className="gt-mono text-sm font-extrabold text-[hsl(var(--accent))]">
                        {formatCurrency(p.unitPriceInr)} / kWh
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {p.pricing.explanation?.factors?.map((f: any, idx: number) => (
                        <span key={idx} className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          f.direction === 'UP' ? 'bg-amber-500/15 text-amber-500' :
                          f.direction === 'DOWN' ? 'bg-emerald-500/15 text-emerald-500' :
                          'bg-slate-500/15 text-slate-400'
                        }`}>
                          {f.direction === 'UP' ? '↑' : f.direction === 'DOWN' ? '↓' : '•'} {f.key} {f.impactPercent ? `${f.impactPercent > 0 ? '+' : ''}${f.impactPercent}%` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grid Decision Status Banner */}
                <div className={`rounded-lg p-3 text-xs border ${
                  isRestricted ? 'border-red-500/40 bg-red-500/10 text-red-400' :
                  isAdjusted ? 'border-amber-500/40 bg-amber-500/10 text-amber-300' :
                  'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                }`}>
                  <div className="flex items-center gap-2 font-extrabold uppercase tracking-wide text-[10px]">
                    {isRestricted ? <CircleAlert size={14} /> : isAdjusted ? <Info size={14} /> : <Check size={14} />}
                    Grid Decision: {gridStatus}
                  </div>
                  <div className="mt-1 text-[11px] leading-relaxed">
                    {p.gridDecision?.explanation || (isRestricted ? 'Trade execution blocked by severe local feeder congestion.' : isAdjusted ? `Quantity adjusted to ${p.maximumTradableEnergyKwh} kWh due to grid congestion.` : 'Grid operating within safe parameters. Trade approved.')}
                  </div>
                </div>

                {/* Settlement Table */}
                <div className="space-y-2 rounded-lg border border-[hsl(var(--border))] p-3.5 bg-[hsl(var(--muted)/.2)] text-xs">
                  <div className="flex justify-between pb-1.5 border-b border-[hsl(var(--border))]">
                    <span className="text-muted-foreground">Seller / Origin</span>
                    <span className="font-extrabold">{p.sellerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Grid-Approved Volume</span>
                    <span className="gt-mono font-bold">{p.maximumTradableEnergyKwh ?? p.energyKwh} kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dynamic Unit Price</span>
                    <span className="gt-mono">{formatCurrency(p.unitPriceInr)} / kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Energy Subtotal</span>
                    <span className="gt-mono">{formatCurrency(p.settlement?.energyCostInr ?? p.totalCostInr)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Grid Wheeling Fee ({p.settlement?.wheelingFeePercent || 2}%)</span>
                    <span className="gt-mono">{formatCurrency(p.settlement?.wheelingFeeInr ?? p.gridFeeInr)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold border-t border-[hsl(var(--border))] pt-2">
                    <span>Net Payable Amount</span>
                    <span className="gt-mono text-[hsl(var(--accent))] text-base">{formatCurrency(p.settlement?.netPayableInr ?? p.netCostInr)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[hsl(var(--accent))] pt-1">
                    <Sparkles size={13} /> Carbon Savings: {formatNumber(p.settlement?.estimatedCarbonSavingsKg ?? p.estimatedCarbonSavingsKg)} kg CO₂
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-xs text-center text-muted-foreground border border-dashed border-[hsl(var(--border))] rounded-lg">
                Click "Calculate" or adjust volume to generate live trade preview details.
              </div>
            )}
          </DataState>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" className="gt-button gt-button-quiet" onClick={onClose} data-testid="button-cancel-trade">
              Cancel
            </button>
            <button
              type="button"
              className={`gt-button ${isRestricted ? 'bg-red-500/20 text-red-400 cursor-not-allowed' : 'gt-button-primary'}`}
              disabled={isRestricted || executeTradeMutation.isPending || !p}
              aria-disabled={isRestricted}
              onClick={handleConfirmTrade}
              data-testid="button-confirm-trade"
            >
              {executeTradeMutation.isPending ? 'Executing Trade…' : isRestricted ? 'Trade Restricted by Grid' : isAdjusted ? `Confirm Adjusted Trade (${p?.maximumTradableEnergyKwh} kWh)` : <><Check size={14} /> Confirm & Execute Trade</>}
            </button>
          </div>
        </div>
      )}
    </div>
  </div>;
}

function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<'listings' | 'demands'>('listings');
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');
  const [demandStatusFilter, setDemandStatusFilter] = useState<string>('OPEN');
  
  const listings = useListListings({ status: statusFilter as any, limit: 50 });
  const demands = useListDemands({ status: demandStatusFilter as any, limit: 50 });
  const systems = useListSolarSystems();
  const createListing = useCreateListing();
  const createDemand = useCreateDemand();
  const closeListing = useCloseListing();
  const cancelListing = useCancelListing();
  const cancelDemand = useCancelDemand();
  const client = useQueryClient();

  const [publishingListing, setPublishingListing] = useState(false);
  const [postingDemand, setPostingDemand] = useState(false);
  const [selectedMatchForBreakdown, setSelectedMatchForBreakdown] = useState<any>(null);
  const [selectedListingForTrade, setSelectedListingForTrade] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  const [listingForm, setListingForm] = useState({ solarSystemId: '', quantityKwh: '', priceInrPerKwh: '', energyType: 'Solar', availableFrom: '', availableUntil: '' });
  const [demandForm, setDemandForm] = useState({ quantityKwh: '', maxPriceInrPerKwh: '', preferredSource: 'Solar', requiredFrom: '', requiredUntil: '' });

  const submitListing = (event: FormEvent) => {
    event.preventDefault();
    setFeedback('');
    createListing.mutate({
      data: {
        solarSystemId: listingForm.solarSystemId,
        quantityKwh: Number(listingForm.quantityKwh),
        priceInrPerKwh: Number(listingForm.priceInrPerKwh),
        energyType: listingForm.energyType,
        availableFrom: new Date(listingForm.availableFrom).toISOString(),
        availableUntil: new Date(listingForm.availableUntil).toISOString(),
      }
    }, {
      onSuccess: () => {
        setPublishingListing(false);
        setFeedback('Listing published to the local market with grid safety validation.');
        setListingForm({ solarSystemId: '', quantityKwh: '', priceInrPerKwh: '', energyType: 'Solar', availableFrom: '', availableUntil: '' });
        void client.invalidateQueries({ queryKey: getListListingsQueryKey() });
      },
      onError: () => setFeedback('Could not publish this listing. Check fields and try again.')
    });
  };

  const submitDemand = (event: FormEvent) => {
    event.preventDefault();
    setFeedback('');
    createDemand.mutate({
      data: {
        quantityKwh: Number(demandForm.quantityKwh),
        maxPriceInrPerKwh: Number(demandForm.maxPriceInrPerKwh),
        preferredSource: demandForm.preferredSource,
        requiredFrom: new Date(demandForm.requiredFrom).toISOString(),
        requiredUntil: new Date(demandForm.requiredUntil).toISOString(),
      }
    }, {
      onSuccess: () => {
        setPostingDemand(false);
        setFeedback('Energy demand posted successfully. Matching engine active.');
        setDemandForm({ quantityKwh: '', maxPriceInrPerKwh: '', preferredSource: 'Solar', requiredFrom: '', requiredUntil: '' });
        void client.invalidateQueries({ queryKey: getListDemandsQueryKey() });
      },
      onError: () => setFeedback('Could not post demand order. Check fields and try again.')
    });
  };

  const handleCloseListing = (id: string) => {
    closeListing.mutate({ id }, {
      onSuccess: () => {
        setFeedback('Listing closed.');
        void client.invalidateQueries({ queryKey: getListListingsQueryKey() });
      }
    });
  };

  const handleCancelDemand = (id: string) => {
    cancelDemand.mutate({ id }, {
      onSuccess: () => {
        setFeedback('Demand cancelled.');
        void client.invalidateQueries({ queryKey: getListDemandsQueryKey() });
      }
    });
  };

  return <div className="mx-auto max-w-[1450px]">
    <PageHeader
      eyebrow="Marketplace / peer-to-peer"
      title="Move surplus & secure green power."
      detail="Browse active prosumer listings, post consumer energy demands, and execute grid-balanced renewable transactions."
      action={<div className="flex gap-2">
        <button className="gt-button gt-button-quiet" onClick={() => setPostingDemand(true)} data-testid="button-post-demand">
          <ShoppingBag size={15} /> Post energy demand
        </button>
        <button className="gt-button gt-button-primary" onClick={() => setPublishingListing(true)} data-testid="button-publish-listing">
          <Plus size={15} /> Publish surplus
        </button>
      </div>}
    />

    {feedback && <div className={`mb-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold ${feedback.includes('Could not') ? 'border-[hsl(var(--destructive)/.3)] bg-[hsl(var(--destructive)/.08)] text-[hsl(var(--destructive))]' : 'border-[hsl(var(--accent)/.35)] bg-[hsl(var(--accent)/.08)] text-[hsl(var(--accent))]'}`} data-testid="status-marketplace-feedback">
      <CircleCheck size={14} /> {feedback}
    </div>}

    {/* Tab Navigation & Market Filters */}
    <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-[hsl(var(--border))] pb-3">
      <div className="flex gap-2">
        <button className={`gt-button text-xs font-extrabold ${activeTab === 'listings' ? 'gt-button-primary' : 'gt-button-quiet'}`} onClick={() => setActiveTab('listings')} data-testid="tab-listings">
          <SunMedium size={14} /> Surplus Listings ({listings.data?.length ?? 0})
        </button>
        <button className={`gt-button text-xs font-extrabold ${activeTab === 'demands' ? 'gt-button-primary' : 'gt-button-quiet'}`} onClick={() => setActiveTab('demands')} data-testid="tab-demands">
          <ShoppingBag size={14} /> Consumer Demands ({demands.data?.length ?? 0})
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <Filter size={13} className="text-muted-foreground" />
        <span className="gt-label text-[10px]">Filter Status:</span>
        {activeTab === 'listings' ? (
          <select className="gt-input !py-1 !px-2 text-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} data-testid="select-status-filter">
            <option value="ACTIVE">ACTIVE</option>
            <option value="PARTIALLY_MATCHED">PARTIALLY MATCHED</option>
            <option value="FULLY_MATCHED">FULLY MATCHED</option>
            <option value="CLOSED">CLOSED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        ) : (
          <select className="gt-input !py-1 !px-2 text-xs" value={demandStatusFilter} onChange={(e) => setDemandStatusFilter(e.target.value)} data-testid="select-demand-status-filter">
            <option value="OPEN">OPEN</option>
            <option value="PARTIALLY_MATCHED">PARTIALLY MATCHED</option>
            <option value="FULLY_MATCHED">FULLY MATCHED</option>
            <option value="CLOSED">CLOSED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        )}
      </div>
    </div>

    {activeTab === 'listings' ? (
      <DataState loading={listings.isLoading} error={listings.isError} empty={!listings.isLoading && !ensureArray(listings.data).length} onRetry={() => void listings.refetch()} label="listings">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ensureArray<Listing>(listings.data).map((listing: Listing) => <article key={listing.id} className="gt-card gt-card-hover p-4" data-testid={`card-listing-${listing.id}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--secondary))]">
                  <SunMedium size={15} className="text-[hsl(var(--accent))]" />
                </div>
                <div>
                  <div className="text-[12px] font-extrabold">{listing.sellerName}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground"><MapPin size={10} /> {listing.location}</div>
                </div>
              </div>
              <span className={`rounded-full px-2 py-1 text-[9px] font-extrabold uppercase tracking-[.08em] ${decisionTone(listing.gridDecision) === 'approved' ? 'bg-[hsl(var(--accent)/.12)] text-[hsl(var(--accent))]' : 'bg-[hsl(var(--primary)/.15)] text-[hsl(var(--primary))]'}`}>{listing.gridDecision}</span>
            </div>
            <div className="my-5 flex items-end justify-between">
              <div>
                <div className="gt-label">Available Volume</div>
                <div className="gt-mono mt-1 text-[25px]">{formatNumber(listing.quantityKwh)} <span className="text-[11px] text-muted-foreground">kWh</span></div>
                {listing.allocatedKwh && listing.allocatedKwh > 0 ? <div className="text-[10px] text-[hsl(var(--accent))] font-bold mt-0.5">{formatNumber(listing.allocatedKwh)} kWh allocated</div> : null}
              </div>
              <div className="text-right">
                <div className="gt-label">Ask Rate</div>
                <div className="gt-mono mt-1 text-[18px] font-medium">{formatCurrency(listing.priceInrPerKwh)}<span className="text-[10px] text-muted-foreground"> / kWh</span></div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-[hsl(var(--border))] pt-3 text-[10px]">
              <span className="flex items-center gap-1 text-muted-foreground"><Clock3 size={11} /> {formatWhen(listing.availableFrom)}</span>
              <div className="flex gap-2">
                {listing.status === 'ACTIVE' && <button className="text-[10px] font-bold text-[hsl(var(--primary))] hover:underline" onClick={() => handleCloseListing(listing.id)} data-testid={`button-close-listing-${listing.id}`}>Close</button>}
                <button className="gt-button gt-button-primary !py-1 !px-2.5 text-[10px]" onClick={() => setSelectedListingForTrade(listing.id)} data-testid={`button-preview-trade-${listing.id}`}>
                  Trade Preview
                </button>
              </div>
            </div>
          </article>)}
        </div>
      </DataState>
    ) : (
      <DataState loading={demands.isLoading} error={demands.isError} empty={!demands.isLoading && !ensureArray(demands.data).length} onRetry={() => void demands.refetch()} label="demands">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ensureArray<Demand>(demands.data).map((d: Demand) => <article key={d.id} className="gt-card gt-card-hover p-4" data-testid={`card-demand-${d.id}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--accent)/.12)]">
                  <ShoppingBag size={15} className="text-[hsl(var(--accent))]" />
                </div>
                <div>
                  <div className="text-[12px] font-extrabold">{d.consumerName}</div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">Preferred: {d.preferredSource || 'Renewable'}</div>
                </div>
              </div>
              <span className="rounded-full bg-[hsl(var(--accent)/.12)] px-2 py-1 text-[9px] font-extrabold uppercase tracking-[.08em] text-[hsl(var(--accent))]">{d.status}</span>
            </div>
            <div className="my-5 flex items-end justify-between">
              <div>
                <div className="gt-label">Required Volume</div>
                <div className="gt-mono mt-1 text-[25px]">{formatNumber(d.quantityKwh)} <span className="text-[11px] text-muted-foreground">kWh</span></div>
                {d.allocatedKwh && d.allocatedKwh > 0 ? <div className="text-[10px] text-[hsl(var(--accent))] font-bold mt-0.5">{formatNumber(d.allocatedKwh)} kWh matched</div> : null}
              </div>
              <div className="text-right">
                <div className="gt-label">Max Price Limit</div>
                <div className="gt-mono mt-1 text-[18px] font-medium">{formatCurrency(d.maxPriceInrPerKwh)}<span className="text-[10px] text-muted-foreground"> / kWh</span></div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-[hsl(var(--border))] pt-3 text-[10px]">
              <span className="flex items-center gap-1 text-muted-foreground"><Clock3 size={11} /> Required by {formatWhen(d.requiredUntil)}</span>
              {d.status === 'OPEN' && <button className="text-[10px] font-bold text-[hsl(var(--destructive))] hover:underline" onClick={() => handleCancelDemand(d.id)} data-testid={`button-cancel-demand-${d.id}`}>Cancel Order</button>}
            </div>
          </article>)}
        </div>
      </DataState>
    )}

    {/* Publish Listing Dialog */}
    {publishingListing && <div className="fixed inset-0 z-50 flex items-end justify-center bg-[hsl(var(--sidebar)/.55)] p-3 sm:items-center">
      <div className="gt-card w-full max-w-[520px] p-5 sm:p-6" role="dialog" aria-modal="true" data-testid="dialog-publish-listing">
        <div className="mb-5 flex items-start justify-between">
          <div><div className="gt-label text-[hsl(var(--accent))]">New listing</div><h2 className="mt-1 text-xl font-extrabold tracking-[-.04em]">Publish surplus energy</h2></div>
          <button onClick={() => setPublishingListing(false)} data-testid="button-close-publish"><X size={18} /></button>
        </div>
        <form onSubmit={submitListing} className="space-y-4">
          <label className="block">
            <span className="gt-label mb-1.5 block">Solar system</span>
            <select className="gt-input" value={listingForm.solarSystemId} onChange={(e) => setListingForm({ ...listingForm, solarSystemId: e.target.value })} required data-testid="select-listing-system">
              <option value="">Select a registered system</option>
              {ensureArray<any>(systems.data).map((system) => <option value={system.id} key={system.id}>{system.name} · {system.location}</option>)}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label><span className="gt-label mb-1.5 block">Quantity (kWh)</span><input className="gt-input" type="number" min="0.1" step="0.1" value={listingForm.quantityKwh} onChange={(e) => setListingForm({ ...listingForm, quantityKwh: e.target.value })} required data-testid="input-listing-quantity" /></label>
            <label><span className="gt-label mb-1.5 block">Price (₹ / kWh)</span><input className="gt-input" type="number" min="0.1" step="0.01" value={listingForm.priceInrPerKwh} onChange={(e) => setListingForm({ ...listingForm, priceInrPerKwh: e.target.value })} required data-testid="input-listing-price" /></label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label><span className="gt-label mb-1.5 block">Available from</span><input className="gt-input" type="datetime-local" value={listingForm.availableFrom} onChange={(e) => setListingForm({ ...listingForm, availableFrom: e.target.value })} required data-testid="input-listing-from" /></label>
            <label><span className="gt-label mb-1.5 block">Available until</span><input className="gt-input" type="datetime-local" value={listingForm.availableUntil} onChange={(e) => setListingForm({ ...listingForm, availableUntil: e.target.value })} required data-testid="input-listing-until" /></label>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" className="gt-button gt-button-quiet" onClick={() => setPublishingListing(false)} data-testid="button-cancel-publish">Cancel</button>
            <button type="submit" className="gt-button gt-button-primary" disabled={createListing.isPending} data-testid="button-submit-listing">{createListing.isPending ? 'Publishing…' : <><Check size={14} /> Publish listing</>}</button>
          </div>
        </form>
      </div>
    </div>}

    {/* Post Demand Dialog */}
    {postingDemand && <div className="fixed inset-0 z-50 flex items-end justify-center bg-[hsl(var(--sidebar)/.55)] p-3 sm:items-center">
      <div className="gt-card w-full max-w-[520px] p-5 sm:p-6" role="dialog" aria-modal="true" data-testid="dialog-post-demand">
        <div className="mb-5 flex items-start justify-between">
          <div><div className="gt-label text-[hsl(var(--accent))]">Consumer Order</div><h2 className="mt-1 text-xl font-extrabold tracking-[-.04em]">Post energy demand</h2></div>
          <button onClick={() => setPostingDemand(false)} data-testid="button-close-demand"><X size={18} /></button>
        </div>
        <form onSubmit={submitDemand} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label><span className="gt-label mb-1.5 block">Quantity Required (kWh)</span><input className="gt-input" type="number" min="0.1" step="0.1" value={demandForm.quantityKwh} onChange={(e) => setDemandForm({ ...demandForm, quantityKwh: e.target.value })} required data-testid="input-demand-quantity" /></label>
            <label><span className="gt-label mb-1.5 block">Max Price Limit (₹ / kWh)</span><input className="gt-input" type="number" min="0.1" step="0.01" value={demandForm.maxPriceInrPerKwh} onChange={(e) => setDemandForm({ ...demandForm, maxPriceInrPerKwh: e.target.value })} required data-testid="input-demand-max-price" /></label>
          </div>
          <label className="block">
            <span className="gt-label mb-1.5 block">Preferred Energy Source</span>
            <select className="gt-input" value={demandForm.preferredSource} onChange={(e) => setDemandForm({ ...demandForm, preferredSource: e.target.value })} data-testid="select-demand-source">
              <option value="Solar">Solar Generation</option>
              <option value="Wind">Wind Generation</option>
              <option value="Hybrid">Hybrid Clean Energy</option>
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label><span className="gt-label mb-1.5 block">Required From</span><input className="gt-input" type="datetime-local" value={demandForm.requiredFrom} onChange={(e) => setDemandForm({ ...demandForm, requiredFrom: e.target.value })} required data-testid="input-demand-from" /></label>
            <label><span className="gt-label mb-1.5 block">Required Until</span><input className="gt-input" type="datetime-local" value={demandForm.requiredUntil} onChange={(e) => setDemandForm({ ...demandForm, requiredUntil: e.target.value })} required data-testid="input-demand-until" /></label>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" className="gt-button gt-button-quiet" onClick={() => setPostingDemand(false)} data-testid="button-cancel-demand-form">Cancel</button>
            <button type="submit" className="gt-button gt-button-primary" disabled={createDemand.isPending} data-testid="button-submit-demand">{createDemand.isPending ? 'Posting…' : <><Check size={14} /> Submit Demand Order</>}</button>
          </div>
        </form>
      </div>
    </div>}

    {/* Intelligent Breakdown Modal */}
    {selectedMatchForBreakdown && <MatchBreakdownModal match={selectedMatchForBreakdown} onClose={() => setSelectedMatchForBreakdown(null)} onPreviewTrade={(id) => setSelectedListingForTrade(id)} />}

    {/* Trade Preview Modal */}
    {selectedListingForTrade && <TradePreviewModal listingId={selectedListingForTrade} onClose={() => setSelectedListingForTrade(null)} />}
  </div>;
}

function SolarPage() {
  const systems = useListSolarSystems();
  const create = useCreateSolarSystem();
  const { data: session } = useGetAuthSession();
  const userRole = session?.role || 'PROSUMER';
  const isProsumerOrAdmin = userRole === 'PROSUMER' || userRole === 'ADMIN';

  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [form, setForm] = useState({ name: '', capacityKw: '', location: '' });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!isProsumerOrAdmin) {
      setFeedback(`Solar registration requires PROSUMER or ADMIN role permissions. (Current Role: ${userRole})`);
      return;
    }
    create.mutate(
      { data: { name: form.name, capacityKw: Number(form.capacityKw), location: form.location } },
      {
        onSuccess: () => {
          setOpen(false);
          setFeedback('✅ Solar system registered successfully.');
          setForm({ name: '', capacityKw: '', location: '' });
          void client.invalidateQueries({ queryKey: getListSolarSystemsQueryKey() });
        },
        onError: (err: any) => {
          const msg = err?.message || '';
          if (msg.includes('403') || msg.includes('permission')) {
            setFeedback(`❌ Permission Denied: Solar system registration requires PROSUMER or ADMIN role. Active role is ${userRole}.`);
          } else {
            setFeedback('❌ Could not register this system. Check all required fields and network connection.');
          }
        },
      }
    );
  };

  const systemList = ensureArray<any>(systems.data);
  const totalGeneration = systemList.reduce((sum, system) => sum + (system.todayGenerationKwh || 0), 0);
  const totalConsumption = systemList.reduce((sum, system) => sum + (system.todayConsumptionKwh || 0), 0);

  return (
    <div className="mx-auto max-w-[1450px] space-y-4">
      <PageHeader
        eyebrow="Solar systems / owned assets"
        title="Know every panel in the network."
        detail="Keep your generation assets current so the marketplace and grid model can make better calls."
        action={
          <button
            className="gt-button gt-button-primary"
            onClick={() => {
              setFeedback('');
              setOpen(true);
            }}
            data-testid="button-add-solar"
          >
            <Plus size={15} /> Register system
          </button>
        }
      />

      {!isProsumerOrAdmin && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs">
          <div className="flex items-center gap-2 text-amber-300">
            <CircleAlert size={18} className="shrink-0" />
            <div>
              <span className="font-bold">Active Persona Role: {userRole}</span> — Solar asset registration requires <span className="font-bold underline">PROSUMER</span> or <span className="font-bold underline">ADMIN</span> role permissions.
            </div>
          </div>
          <button
            onClick={() => updateAuthToken('demo:prosumer')}
            className="gt-button gt-button-primary !py-1.5 !px-3 text-xs bg-amber-500 text-black hover:bg-amber-400 shrink-0"
          >
            Switch to PROSUMER (`demo:prosumer`)
          </button>
        </div>
      )}

      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold ${
            feedback.includes('✅')
              ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-400'
              : 'border-rose-500/35 bg-rose-500/10 text-rose-400'
          }`}
          data-testid="status-solar-feedback"
        >
          <CircleCheck size={14} /> {feedback}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Registered systems" value={formatNumber(systemList.length, 0)} sub="Assets in your account" icon={SunMedium} />
        <KpiCard label="Generation today" value={`${formatNumber(totalGeneration)} kWh`} sub="Across all systems" icon={SunMedium} accent="accent" />
        <KpiCard label="Local consumption" value={`${formatNumber(totalConsumption)} kWh`} sub="Behind-the-meter load" icon={BatteryCharging} />
      </div>

      <DataState loading={systems.isLoading} error={systems.isError} empty={!systems.isLoading && !systemList.length} onRetry={() => void systems.refetch()} label="solar systems">
        <div className="grid gap-3 md:grid-cols-2">
          {systemList.map((system) => (
            <article className="gt-card p-5" key={system.id} data-testid={`card-solar-${system.id}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--primary)/.16)] text-[hsl(var(--primary))]">
                    <SunMedium size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold">{system.name}</h2>
                    <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <MapPin size={10} /> {system.location}
                    </p>
                  </div>
                </div>
                <span className={`flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.08em] ${system.status === 'online' ? 'text-[hsl(var(--accent))]' : 'text-muted-foreground'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${system.status === 'online' ? 'bg-[hsl(var(--accent))]' : 'bg-muted-foreground'}`} /> {system.status}
                </span>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 border-y border-[hsl(var(--border))] py-4">
                <div>
                  <div className="gt-label">Capacity</div>
                  <div className="gt-mono mt-1 text-[16px]">
                    {formatNumber(system.capacityKw)} <span className="text-[10px] text-muted-foreground">kW</span>
                  </div>
                </div>
                <div>
                  <div className="gt-label">Generated</div>
                  <div className="gt-mono mt-1 text-[16px] text-[hsl(var(--accent))]">
                    {formatNumber(system.todayGenerationKwh)} <span className="text-[10px] text-muted-foreground">kWh</span>
                  </div>
                </div>
                <div>
                  <div className="gt-label">Consumed</div>
                  <div className="gt-mono mt-1 text-[16px]">
                    {formatNumber(system.todayConsumptionKwh)} <span className="text-[10px] text-muted-foreground">kWh</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Net available today</span>
                <span className="gt-mono font-medium text-foreground">{formatNumber(system.todayGenerationKwh - system.todayConsumptionKwh)} kWh</span>
              </div>
            </article>
          ))}
        </div>
      </DataState>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[hsl(var(--sidebar)/.55)] p-3 sm:items-center">
          <div className="gt-card w-full max-w-[460px] p-5 sm:p-6" role="dialog" aria-modal="true" data-testid="dialog-add-solar">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <div className="gt-label text-[hsl(var(--accent))]">Owned asset</div>
                <h2 className="mt-1 text-xl font-extrabold tracking-[-.04em]">Register a solar system</h2>
              </div>
              <button onClick={() => setOpen(false)} data-testid="button-close-solar">
                <X size={18} />
              </button>
            </div>

            {!isProsumerOrAdmin && (
              <div className="mb-4 space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
                <div className="font-bold text-amber-300">Role Notice: Currently {userRole}</div>
                <p className="text-muted-foreground">Only Prosumer or Admin roles can create solar generation assets.</p>
                <button
                  type="button"
                  onClick={() => updateAuthToken('demo:prosumer')}
                  className="gt-button gt-button-primary !py-1 text-xs w-full bg-amber-500 text-black hover:bg-amber-400"
                >
                  Switch to PROSUMER Persona (`demo:prosumer`)
                </button>
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <label className="block">
                <span className="gt-label mb-1.5 block">System name</span>
                <input
                  className="gt-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="East roof array"
                  required
                  data-testid="input-solar-name"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="gt-label mb-1.5 block">Capacity (kW)</span>
                  <input
                    className="gt-input"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={form.capacityKw}
                    onChange={(e) => setForm({ ...form, capacityKw: e.target.value })}
                    required
                    data-testid="input-solar-capacity"
                  />
                </label>
                <label>
                  <span className="gt-label mb-1.5 block">Location</span>
                  <input
                    className="gt-input"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="HSR Layout"
                    required
                    data-testid="input-solar-location"
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="gt-button gt-button-quiet" onClick={() => setOpen(false)} data-testid="button-cancel-solar">
                  Cancel
                </button>
                <button className="gt-button gt-button-primary" disabled={create.isPending} type="submit" data-testid="button-submit-solar">
                  {create.isPending ? 'Registering…' : <><Check size={14} /> Register system</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function GridPage() {
  const grid = useGetGridStatus();
  const matches = useGetMatchRecommendations();
  const energy = useGetEnergyOverview({ window: '24h' });
  const g = grid.data;
  const matchGridList = ensureArray<any>(matches.data);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [tradeListingId, setTradeListingId] = useState<string | null>(null);

  return <div className="mx-auto max-w-[1450px]"><PageHeader eyebrow="Grid conditions / decision layer" title="Read the grid before you act." detail="The local decision model balances congestion, renewable share, frequency, and match quality into one operating instruction." action={<div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground"><span className="gt-status-dot" /> Updated {formatWhen(g?.updatedAt)}</div>} />
    <DataState loading={grid.isLoading} error={grid.isError} onRetry={() => void grid.refetch()} label="grid status"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><div className="gt-card relative overflow-hidden bg-[hsl(var(--sidebar))] p-5 text-[hsl(var(--sidebar-foreground))] md:col-span-2"><div className="gt-label !text-[hsl(var(--sidebar-foreground)/.55)]">Current operating instruction</div><div className="mt-8 flex items-end justify-between"><div><div className="text-[28px] font-extrabold tracking-[-.06em]">{g?.label ?? '—'}</div><div className="mt-2 text-[11px] text-[hsl(var(--sidebar-foreground)/.58)]">{g?.decision ?? '—'} · decision is based on local conditions</div></div><div className={`rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.1em] ${decisionTone(g?.decision) === 'approved' ? 'bg-[hsl(var(--accent)/.2)] text-[hsl(var(--sidebar-primary))]' : 'bg-[hsl(var(--primary)/.2)] text-[hsl(var(--sidebar-primary))]'}`}>{g?.decision ?? '—'}</div></div><div className="absolute -bottom-16 -right-10 h-48 w-48 rounded-full border border-[hsl(var(--sidebar-primary)/.15)]" /></div><SignalCard icon={Gauge} label="Congestion" value={`${formatNumber(g?.congestionPercent)}%`} detail="Lower is more flexible" meter={g?.congestionPercent} inverse /><SignalCard icon={SunMedium} label="Renewable share" value={`${formatNumber(g?.renewableSharePercent)}%`} detail="Current local mix" meter={g?.renewableSharePercent} /><SignalCard icon={Radio} label="Grid frequency" value={`${g?.frequencyHz?.toFixed(2) ?? '—'} Hz`} detail="Nominal 50.00 Hz" meter={Math.min(Math.abs((g?.frequencyHz ?? 50) - 49.5) * 100, 100)} inverse /></div></DataState>
    <div className="mt-3 grid gap-3 xl:grid-cols-[1.15fr_1fr]"><section className="gt-card p-5"><div className="mb-5 flex items-start justify-between"><div><div className="gt-label">Signal history</div><h2 className="mt-1 text-base font-extrabold">Generation and load / 24h</h2></div><LineChart size={17} className="text-[hsl(var(--accent))]" /></div><Sparkline observations={ensureArray(energy.data)} /></section><section className="gt-card p-5"><div className="mb-4"><div className="gt-label">Decision rationale</div><h2 className="mt-1 text-base font-extrabold">Why this instruction is active</h2></div><div className="space-y-3"><RationaleRow label="Congestion headroom" value={`${formatNumber(100 - (g?.congestionPercent ?? 0))}% available`} good={(g?.congestionPercent ?? 100) < 55} /><RationaleRow label="Renewable supply" value={`${formatNumber(g?.renewableSharePercent)}% of local mix`} good={(g?.renewableSharePercent ?? 0) > 40} /><RationaleRow label="Frequency stability" value={`${g?.frequencyHz?.toFixed(2) ?? '—'} Hz`} good={Math.abs((g?.frequencyHz ?? 50) - 50) < .12} /></div><div className="mt-6 rounded-lg bg-[hsl(var(--muted)/.55)] p-3 text-[11px] leading-5 text-muted-foreground">
  <div className="font-extrabold text-foreground mb-1">Grid-Aware Trading Protocol:</div>
  Smart trading is not only about finding a buyer and a seller. GridTrade also checks whether the local grid can safely support the trade right now.
  <div className="mt-2 flex flex-wrap gap-1.5 text-[9.5px]">
    <span className="gt-badge border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold">APPROVED: Feeder Safe</span>
    <span className="gt-badge border-amber-500/40 bg-amber-500/10 text-amber-300 font-bold">ADJUSTED: Feeder Capped</span>
    <span className="gt-badge border-red-500/40 bg-red-500/10 text-red-400 font-bold">RESTRICTED: Grid Congested</span>
  </div>
</div></section></div>
    <section className="gt-card mt-3 p-5"><div className="mb-3 flex items-center justify-between"><div><div className="gt-label">Match recommendations</div><h2 className="mt-1 text-base font-extrabold">Actions that respect the current grid</h2></div><Link href="/marketplace" className="gt-button gt-button-quiet" data-testid="link-grid-marketplace">Open marketplace <ChevronRight size={13} /></Link></div><DataState loading={matches.isLoading} error={matches.isError} empty={!matches.isLoading && !matchGridList.length} onRetry={() => void matches.refetch()} label="grid matches"><div className="grid gap-3 md:grid-cols-2">{matchGridList.map((match: any) => <div key={match.id} className="rounded-lg border border-[hsl(var(--border))] p-4 hover:border-[hsl(var(--accent)/.4)] transition-colors cursor-pointer" onClick={() => setSelectedMatch(match)} data-testid={`card-grid-match-${match.id}`}><div className="flex items-center justify-between"><div className="text-[12px] font-extrabold">{match.sellerName}</div><div className="gt-mono text-[12px] text-[hsl(var(--accent))] font-bold">{match.score}% match</div></div><div className="mt-2 text-[11px] text-muted-foreground">{match.rationale}</div><div className="mt-3 flex flex-wrap items-center justify-between gap-1.5"><div className="flex flex-wrap gap-1.5">{ensureArray<string>(match.factors).map((factor: string) => <span key={factor} className="rounded-full bg-[hsl(var(--muted))] px-2 py-1 text-[9px] font-bold text-muted-foreground">{factor}</span>)}</div><span className="text-[10px] font-bold text-[hsl(var(--accent))] flex items-center gap-1">Inspect 6-Factor Fit <ArrowRight size={11} /></span></div></div>)}</div></DataState></section>
    
    {selectedMatch && <MatchBreakdownModal match={selectedMatch} onClose={() => setSelectedMatch(null)} onPreviewTrade={(id) => setTradeListingId(id)} />}
    {tradeListingId && <TradePreviewModal listingId={tradeListingId} onClose={() => setTradeListingId(null)} />}
  </div>;
}

function SignalCard({ icon: Icon, label, value, detail, meter, inverse = false }: { icon: IconType; label: string; value: string; detail: string; meter?: number; inverse?: boolean }) {
  const width = Math.max(4, Math.min(100, meter ?? 0));
  return <div className="gt-card p-4"><div className="flex items-center justify-between"><div className="gt-label">{label}</div><Icon size={15} className="text-[hsl(var(--accent))]" /></div><div className="gt-mono mt-6 text-[22px]">{value}</div><div className="mt-1 text-[10px] text-muted-foreground">{detail}</div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[hsl(var(--muted))]"><div className={`h-full rounded-full ${inverse ? 'bg-[hsl(var(--primary))]' : 'bg-[hsl(var(--accent))]'}`} style={{ width: `${width}%` }} /></div></div>;
}

function RationaleRow({ label, value, good }: { label: string; value: string; good: boolean }) {
  return <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-3 text-[11px]"><span className="text-muted-foreground">{label}</span><span className={`flex items-center gap-1.5 font-extrabold ${good ? 'text-[hsl(var(--accent))]' : 'text-[hsl(var(--primary))]'}`}>{good ? <CircleCheck size={13} /> : <CircleAlert size={13} />}{value}</span></div>;
}

function ActivityPage() {
  const [limit, setLimit] = useState(20);
  const events = useGetActivityFeed({ limit });
  const eventList = ensureArray<any>(events.data);
  return <div className="mx-auto max-w-[1000px]"><PageHeader eyebrow="Activity / persisted events" title="The record of every decision." detail="A durable timeline of listings, matches, grid instructions, transactions, and model alerts across your workspace." action={<button className="gt-button gt-button-quiet" onClick={() => void events.refetch()} data-testid="button-refresh-activity"><RefreshCw size={14} /> Refresh feed</button>} /><section className="gt-card p-4 sm:p-6"><div className="mb-2 flex items-center justify-between border-b border-[hsl(var(--border))] pb-4"><div className="gt-label">Latest events</div><div className="gt-mono text-[10px] text-muted-foreground">{eventList.length} loaded</div></div><DataState loading={events.isLoading} error={events.isError} empty={!events.isLoading && !eventList.length} onRetry={() => void events.refetch()} label="activity events"><ActivityList events={eventList} /></DataState>{eventList.length === limit && <button className="mt-4 w-full rounded-lg border border-dashed border-[hsl(var(--border))] py-3 text-[11px] font-extrabold text-muted-foreground hover:bg-[hsl(var(--muted)/.5)]" onClick={() => setLimit((current) => Math.min(50, current + 10))} data-testid="button-load-more-activity">Load older events</button>}</section></div>;
}

function SettingsPage() {
  const session = useGetAuthSession();
  const health = useHealthCheck();
  const [saved, setSaved] = useState(false);
  return <div className="mx-auto max-w-[920px]"><PageHeader eyebrow="Settings / session context" title="Make the control room yours." detail="Review the session boundary and the role context that shapes what GridTrade can coordinate for you." /><div className="grid gap-3 md:grid-cols-[1.1fr_.9fr]"><section className="gt-card p-5 sm:p-6"><div className="gt-label">Authenticated session</div><div className="mt-5 flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/.17)] text-lg font-extrabold text-[hsl(var(--primary))]">{session.data?.displayName?.slice(0, 2).toUpperCase() ?? 'GT'}</div><div><h2 className="text-lg font-extrabold">{session.data?.displayName ?? 'Loading session'}</h2><p className="mt-1 text-xs text-muted-foreground">{session.data?.role ?? 'Resolving role context'}</p></div></div><div className="mt-7 space-y-3"><SettingRow label="Authentication" value={session.data?.authenticated ? 'Authenticated' : 'Not authenticated'} icon={UserRound} good={session.data?.authenticated} /><SettingRow label="Role context" value={session.data?.role ?? '—'} icon={Cpu} good /><SettingRow label="Service health" value={health.data?.status ?? (health.isLoading ? 'Checking…' : 'Unavailable')} icon={Radio} good={health.data?.status === 'ok'} /></div></section><section className="gt-card p-5 sm:p-6"><div className="gt-label">Workspace preferences</div><h2 className="mt-2 text-base font-extrabold">Operational defaults</h2><div className="mt-5 space-y-4"><label className="block"><span className="gt-label mb-1.5 block">Primary operating zone</span><select className="gt-input" defaultValue="South Bengaluru" data-testid="select-operating-zone"><option>South Bengaluru</option><option>East Bengaluru</option><option>North Bengaluru</option></select></label><label className="block"><span className="gt-label mb-1.5 block">Default observation window</span><select className="gt-input" defaultValue="24h" data-testid="select-observation-window"><option value="24h">Last 24 hours</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option></select></label><button className="gt-button gt-button-primary w-full" onClick={() => setSaved(true)} data-testid="button-save-settings">{saved ? <><Check size={14} /> Preferences saved</> : 'Save preferences'}</button></div></section></div><section className="gt-card mt-3 p-5"><div className="flex items-start gap-3"><div className="mt-0.5 rounded-lg bg-[hsl(var(--accent)/.12)] p-2 text-[hsl(var(--accent))]"><CircleCheck size={16} /></div><div><h2 className="text-sm font-extrabold">Your role changes the decision surface</h2><p className="mt-1 max-w-[650px] text-xs leading-5 text-muted-foreground">GridTrade keeps the operating picture shared, while role context controls which actions are emphasized. Your current role is read from the authenticated platform session.</p></div></div></section></div>;
}

function SettingRow({ label, value, icon: Icon, good }: { label: string; value: string; icon: IconType; good?: boolean }) {
  return <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-3"><div className="flex items-center gap-2 text-[11px] text-muted-foreground"><Icon size={14} /> {label}</div><div className={`flex items-center gap-1.5 text-[11px] font-extrabold ${good ? 'text-[hsl(var(--accent))]' : 'text-[hsl(var(--primary))]'}`}>{good ? <Check size={13} /> : <CircleAlert size={13} />}{value}</div></div>;
}

function LedgerPage() {
  const transactions = useListTransactions();
  const ledgerAudit = useVerifyLedger();
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const txList = ensureArray<any>(transactions.data);
  const auditData: any = ledgerAudit.data;

  const handleVerifyTransaction = async (id: string) => {
    setVerifyingId(id);
    try {
      const res = await fetch(`/api/v1/transactions/${id}/verify`);
      const data = await res.json();
      setVerificationResult(data);
    } catch (err: any) {
      alert("Verification failed: " + err?.message);
    } finally {
      setVerifyingId(null);
    }
  };

  return <div className="mx-auto max-w-[1450px]">
    <PageHeader
      eyebrow="SHA-256 Ledger / Auditable Record"
      title="Tamper-evident cryptographic hash-chain."
      detail="Every completed trade creates a canonical SHA-256 block record linked to the previous block in PostgreSQL."
      action={
        <button className="gt-button gt-button-primary" onClick={() => void ledgerAudit.refetch()} data-testid="button-audit-ledger">
          <ShieldCheck size={15} /> Run Ledger Audit
        </button>
      }
    />

    {/* Whole-Ledger Verification Banner */}
    <DataState loading={ledgerAudit.isLoading} error={ledgerAudit.isError} onRetry={() => void ledgerAudit.refetch()} label="ledger audit">
      <div className={`mb-5 rounded-xl border p-5 ${
        auditData?.verified ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-amber-500/40 bg-amber-500/10'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${auditData?.verified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold tracking-tight">
                  {auditData?.verified ? 'SHA-256 Cryptographic Hash Chain Intact' : 'Ledger Integrity Audit Status'}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest ${
                  auditData?.verified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {auditData?.verified ? 'Chain Valid' : 'Audit Alert'}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {auditData?.verified
                  ? `${auditData.verifiedBlocks || 0} of ${auditData.totalBlocks || 0} blocks verified with 0 cryptographic hash mismatches.`
                  : (auditData?.failureReason || 'Auditing ledger block chain linkage...')}
              </p>
            </div>
          </div>
          <div className="gt-mono text-xs font-bold text-muted-foreground">
            Checked: {formatWhen(auditData?.checkedAt)}
          </div>
        </div>
      </div>
    </DataState>

    {/* Transaction Hash Blocks Table */}
    <DataState loading={transactions.isLoading} error={transactions.isError} empty={!transactions.isLoading && !txList.length} onRetry={() => void transactions.refetch()} label="transactions">
      <div className="gt-card overflow-hidden p-0">
        <div className="border-b border-[hsl(var(--border))] px-5 py-4 flex items-center justify-between">
          <div>
            <div className="gt-label">Immutable Ledger Blocks</div>
            <h2 className="mt-0.5 text-sm font-extrabold">Confirmed Transactions & SHA-256 Records</h2>
          </div>
          <span className="gt-mono text-xs text-muted-foreground">{txList.length} Blocks Recorded</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/.4)] text-[10px] uppercase font-bold text-muted-foreground">
              <tr>
                <th className="py-3 px-4">Block #</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Buyer → Seller</th>
                <th className="py-3 px-4">Energy / Rate</th>
                <th className="py-3 px-4">Net Amount</th>
                <th className="py-3 px-4">SHA-256 Hash</th>
                <th className="py-3 px-4 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))] font-mono text-[11px]">
              {txList.map((tx: any) => (
                <tr key={tx.id} className="hover:bg-[hsl(var(--muted)/.2)] transition-colors">
                  <td className="py-3 px-4 font-bold text-[hsl(var(--accent))]">#{tx.blockIndex}</td>
                  <td className="py-3 px-4 text-muted-foreground">{formatWhen(tx.settledAt || tx.createdAt)}</td>
                  <td className="py-3 px-4 font-sans font-bold">{tx.buyerName} → {tx.sellerName}</td>
                  <td className="py-3 px-4">{formatNumber(tx.quantityKwh)} kWh @ {formatCurrency(tx.agreedPriceInrPerKwh)}</td>
                  <td className="py-3 px-4 font-bold text-[hsl(var(--accent))]">{formatCurrency(tx.amountInr)}</td>
                  <td className="py-3 px-4 text-[10px] text-muted-foreground truncate max-w-[140px]" title={tx.hash}>
                    {tx.hash ? `${tx.hash.slice(0, 10)}...${tx.hash.slice(-6)}` : '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-sans">
                    <button
                      className="gt-button gt-button-quiet !py-1 !px-2 text-[10px]"
                      onClick={() => handleVerifyTransaction(tx.id)}
                      disabled={verifyingId === tx.id}
                      data-testid={`button-verify-tx-${tx.id}`}
                    >
                      {verifyingId === tx.id ? 'Verifying…' : <><ShieldCheck size={12} /> Verify Hash</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DataState>

    {/* Individual Transaction Verification Result Modal */}
    {verificationResult && (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-[hsl(var(--sidebar)/.55)] p-3 sm:items-center">
        <div className="gt-card w-full max-w-[520px] p-5 sm:p-6" role="dialog" aria-modal="true" data-testid="dialog-verification-result">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="gt-label text-[hsl(var(--accent))]">Tamper-Evident SHA-256 Verification</div>
              <h2 className="mt-1 text-xl font-extrabold tracking-[-.04em]">Transaction Audit Result</h2>
            </div>
            <button onClick={() => setVerificationResult(null)} data-testid="button-close-verification"><X size={18} /></button>
          </div>

          <div className={`space-y-3 rounded-xl border p-4 text-xs ${
            verificationResult.verified ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-red-500/40 bg-red-500/10 text-red-300'
          }`}>
            <div className="flex items-center gap-2 font-extrabold uppercase text-xs">
              <ShieldCheck size={18} />
              Status: {verificationResult.result}
            </div>
            <p className="leading-relaxed">{verificationResult.explanation}</p>
          </div>

          <div className="mt-4 space-y-2 rounded-lg bg-[hsl(var(--muted)/.3)] p-3.5 text-xs font-mono border border-[hsl(var(--border))]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Block Index:</span>
              <span className="font-bold">#{verificationResult.blockIndex ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Persisted Hash:</span>
              <span className="truncate max-w-[220px] font-bold">{verificationResult.hash ?? '—'}</span>
            </div>
            {verificationResult.expectedHash && (
              <div className="flex justify-between text-amber-400">
                <span>Computed Hash:</span>
                <span className="truncate max-w-[220px] font-bold">{verificationResult.expectedHash}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground border-t border-[hsl(var(--border))] pt-2">
              <span>Previous Block Hash:</span>
              <span className="truncate max-w-[220px]">{verificationResult.previousHash ?? 'GENESIS'}</span>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button className="gt-button gt-button-primary" onClick={() => setVerificationResult(null)} data-testid="button-done-verification">
              Done
            </button>
          </div>
        </div>
      </div>
    )}
  </div>;
}

function AiCockpitPage() {
  const [, setLocation] = useLocation();
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    sources?: string[];
    confidence?: number;
    actions?: Array<{ label: string; action: string; targetUrl?: string }>;
  }>>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Welcome to the GridTrade AI Energy Assistant. I have analyzed your current solar meter data, grid region status, and active market orders. How can I help optimize your energy trading today?',
      sources: ['GRIDTRADE_SYSTEM_CONTEXT', 'LATEST_ENERGY_DATA'],
      confidence: 0.95,
      actions: [
        { label: 'How much surplus do I have?', action: 'QUERY' },
        { label: 'Should I sell now?', action: 'QUERY' },
        { label: 'Why is today\'s price higher?', action: 'QUERY' },
      ],
    },
  ]);

  const handleSendChat = async (queryText?: string) => {
    const text = queryText || chatInput;
    if (!text.trim() || chatLoading) return;

    const userMsgId = `user-${Date.now()}`;
    setChatMessages((prev) => [...prev, { id: userMsgId, role: 'user', content: text }]);
    if (!queryText) setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/v1/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [
          ...prev,
          {
            id: `asst-${Date.now()}`,
            role: 'assistant',
            content: data.answer,
            sources: data.sources,
            confidence: data.confidence,
            actions: data.suggestedActions,
          },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: 'AI Assistant service is temporarily unavailable. Standard marketplace functionality remains operational.',
            confidence: 0.50,
          },
        ]);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'AI Assistant service connection offline. Standard marketplace features remain accessible.',
          confidence: 0.50,
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const sampleForecastData = [
    { hour: '06:00', generation: 0.8, demand: 2.1 },
    { hour: '08:00', generation: 3.4, demand: 5.2 },
    { hour: '10:00', generation: 7.8, demand: 4.1 },
    { hour: '12:00', generation: 12.4, demand: 3.8 },
    { hour: '14:00', generation: 11.2, demand: 4.2 },
    { hour: '16:00', generation: 6.5, demand: 5.9 },
    { hour: '18:00', generation: 1.8, demand: 8.4 },
    { hour: '20:00', generation: 0.0, demand: 7.6 },
  ];

  return (
    <div className="space-y-6" data-testid="ai-cockpit-page">
      {/* Header Banner */}
      <div className="gt-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="gt-label text-[hsl(var(--accent))] flex items-center gap-1.5">
            <Sparkles size={14} /> AI Intelligence & Decision Support
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-[-.04em] sm:text-3xl">Smart Energy Cockpit</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            FastAPI forecasting, Smart Sell & Smart Buy recommendation engines, anomaly detection, and explainable AI assistant.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="gt-badge border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse mr-1.5 inline-block"></span>
            FastAPI Service: AVAILABLE
          </span>
          <span className="gt-badge bg-[hsl(var(--muted)/.4)] text-muted-foreground font-mono">
            generation-forecast-v1.0
          </span>
        </div>
      </div>

      {/* Grid Layout: Top Row Recommendations */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Smart Sell Card */}
        <div className="gt-card p-5" data-testid="card-smart-sell">
          <div className="flex items-center justify-between pb-3 border-b border-[hsl(var(--border))]">
            <div className="flex items-center gap-2 font-extrabold text-sm text-emerald-400">
              <SunMedium size={18} />
              SMART SELL RECOMMENDATION
            </div>
            <span className="gt-badge border-emerald-500/40 bg-emerald-500/10 text-emerald-300">
              Score: 88%
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 rounded-lg bg-[hsl(var(--muted)/.2)] p-3 text-center text-xs">
            <div>
              <div className="text-muted-foreground text-[10px]">Predicted Surplus</div>
              <div className="mt-1 text-base font-extrabold text-emerald-400">7.6 kWh</div>
            </div>
            <div>
              <div className="text-muted-foreground text-[10px]">Indicative Price</div>
              <div className="mt-1 text-base font-extrabold">₹5.20/kWh</div>
            </div>
            <div>
              <div className="text-muted-foreground text-[10px]">Est. Revenue</div>
              <div className="mt-1 text-base font-extrabold text-emerald-400">₹39.52</div>
            </div>
          </div>

          <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
            <div className="font-semibold text-foreground">Structured Explanations:</div>
            <ul className="space-y-1 list-disc list-inside">
              <li>Solar peak generation window predicted between 11:00 AM – 2:00 PM.</li>
              <li>High local consumer demand in NCR-NORTH sector.</li>
              <li>Grid condition APPROVED: Unrestricted feeder throughput.</li>
            </ul>
          </div>

          <div className="mt-5 flex items-center justify-between pt-3 border-t border-[hsl(var(--border))]">
            <span className="text-[10px] text-muted-foreground font-mono">Model: generation-forecast-v1.0</span>
            <button className="gt-button gt-button-primary text-xs" onClick={() => setLocation('/marketplace')} data-testid="button-action-smart-sell">
              Publish Solar Listing <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Smart Buy Card */}
        <div className="gt-card p-5" data-testid="card-smart-buy">
          <div className="flex items-center justify-between pb-3 border-b border-[hsl(var(--border))]">
            <div className="flex items-center gap-2 font-extrabold text-sm text-[hsl(var(--accent))]">
              <ShoppingBag size={18} />
              SMART BUY RECOMMENDATION
            </div>
            <span className="gt-badge border-[hsl(var(--accent)/.4)] bg-[hsl(var(--accent)/.1)] text-[hsl(var(--accent))]">
              Score: 92%
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 rounded-lg bg-[hsl(var(--muted)/.2)] p-3 text-center text-xs">
            <div>
              <div className="text-muted-foreground text-[10px]">Match Quantity</div>
              <div className="mt-1 text-base font-extrabold">12.0 kWh</div>
            </div>
            <div>
              <div className="text-muted-foreground text-[10px]">Agreed Price</div>
              <div className="mt-1 text-base font-extrabold">₹4.80/kWh</div>
            </div>
            <div>
              <div className="text-muted-foreground text-[10px]">Est. Savings</div>
              <div className="mt-1 text-base font-extrabold text-emerald-400">₹20.40</div>
            </div>
          </div>

          <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
            <div className="font-semibold text-foreground">Structured Explanations:</div>
            <ul className="space-y-1 list-disc list-inside">
              <li>Lowest available price (₹4.80/kWh) compared to ₹6.50 grid tariff.</li>
              <li>Proximity match (1.2 km) minimizes transmission wheeling fees.</li>
              <li>Seller has 98% historical generation reliability rating.</li>
            </ul>
          </div>

          <div className="mt-5 flex items-center justify-between pt-3 border-t border-[hsl(var(--border))]">
            <span className="text-[10px] text-muted-foreground font-mono">Model: demand-forecast-v1.0</span>
            <button className="gt-button gt-button-accent text-xs" onClick={() => setLocation('/marketplace')} data-testid="button-action-smart-buy">
              Browse Matches <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Middle Section: Forecasting Cockpit & AI Energy Assistant */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Forecast Dashboard (2 cols) */}
        <div className="gt-card p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[hsl(var(--border))]">
            <div>
              <div className="gt-label text-[hsl(var(--accent))]">Diurnal Solar & Demand Profile</div>
              <h2 className="text-lg font-black tracking-[-.03em]">24-Hour AI Energy Forecast</h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="gt-badge border-amber-500/40 bg-amber-500/10 text-amber-300">
                Confidence: 88%
              </span>
              <span className="gt-badge bg-[hsl(var(--muted)/.4)] text-muted-foreground">
                Updated: Just now
              </span>
            </div>
          </div>

          <div className="h-[260px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sampleForecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="solarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="demandGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" stroke="#6b7280" fontSize={11} />
                <YAxis stroke="#6b7280" fontSize={11} unit=" kWh" />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="generation" name="Predicted Solar Gen (kWh)" stroke="#10b981" fillOpacity={1} fill="url(#solarGradient)" />
                <Area type="monotone" dataKey="demand" name="Predicted Demand (kWh)" stroke="#3b82f6" fillOpacity={1} fill="url(#demandGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="rounded-lg bg-[hsl(var(--muted)/.2)] p-3 border border-[hsl(var(--border))]">
              <div className="text-muted-foreground text-[10px] uppercase font-bold">Peak Solar Window</div>
              <div className="mt-1 font-extrabold text-sm text-emerald-400">11:00 AM – 3:00 PM (12.4 kWh)</div>
            </div>
            <div className="rounded-lg bg-[hsl(var(--muted)/.2)] p-3 border border-[hsl(var(--border))]">
              <div className="text-muted-foreground text-[10px] uppercase font-bold">Peak Demand Window</div>
              <div className="mt-1 font-extrabold text-sm text-blue-400">6:00 PM – 10:00 PM (8.4 kWh)</div>
            </div>
          </div>
        </div>

        {/* AI Assistant Panel (1 col) */}
        <div className="gt-card flex flex-col p-5 h-[440px]">
          <div className="flex items-center justify-between pb-3 border-b border-[hsl(var(--border))]">
            <div className="flex items-center gap-2 font-extrabold text-sm">
              <Sparkles size={16} className="text-[hsl(var(--accent))]" />
              AI Energy Assistant
            </div>
            <span className="gt-badge border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-[10px]">
              ONLINE
            </span>
          </div>

          {/* Chat Messages Thread */}
          <div className="my-3 flex-1 space-y-3 overflow-y-auto pr-1 text-xs">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`rounded-xl px-3.5 py-2.5 max-w-[88%] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] font-semibold'
                      : 'bg-[hsl(var(--muted)/.3)] border border-[hsl(var(--border))] text-foreground'
                  }`}
                >
                  {msg.content}

                  {/* Sources Pills */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1 border-t border-[hsl(var(--border)/.5)] pt-1.5">
                      <span className="text-[9px] text-muted-foreground font-bold">Sources:</span>
                      {msg.sources.map((src) => (
                        <span key={src} className="rounded bg-black/30 px-1.5 py-0.5 text-[9px] font-mono text-emerald-300">
                          {src}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Suggested Actions */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 pt-1">
                      {msg.actions.map((act) => (
                        <button
                          key={act.label}
                          className="rounded bg-[hsl(var(--accent)/.2)] px-2 py-1 text-[10px] font-bold text-[hsl(var(--accent))] hover:bg-[hsl(var(--accent)/.3)] transition"
                          onClick={() => {
                            if (act.action === 'NAVIGATE' && act.targetUrl) setLocation(act.targetUrl);
                            else handleSendChat(act.label);
                          }}
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex items-center gap-2 text-muted-foreground text-xs p-2">
                <RefreshCw size={14} className="animate-spin" /> Assistant processing response…
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="flex items-center gap-2 pt-2 border-t border-[hsl(var(--border))]">
            <input
              type="text"
              className="gt-input text-xs flex-1"
              placeholder="Ask assistant about energy, prices, surplus…"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              data-testid="input-chat-assistant"
            />
            <button
              className="gt-button gt-button-primary text-xs"
              onClick={() => handleSendChat()}
              disabled={chatLoading}
              data-testid="button-send-chat"
            >
              Ask
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Anomaly Detection Queue (Admin View) */}
      <div className="gt-card p-5 space-y-4" data-testid="section-anomaly-queue">
        <div className="flex items-center justify-between pb-3 border-b border-[hsl(var(--border))]">
          <div>
            <div className="gt-label text-amber-400">Security & Metric Safeguards</div>
            <h2 className="text-lg font-black tracking-[-.03em]">Anomaly Detection Audit Queue</h2>
          </div>
          <span className="gt-badge border-amber-500/40 bg-amber-500/10 text-amber-300">
            anomaly-rule-v1.0
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] text-muted-foreground font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Risk Score</th>
                <th className="py-2.5 px-3">Entity Type</th>
                <th className="py-2.5 px-3">Triggered Reasons</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border)/.4)]">
              <tr>
                <td className="py-3 px-3">
                  <span className="gt-badge border-amber-500/40 bg-amber-500/10 text-amber-400 font-bold">
                    HIGH
                  </span>
                </td>
                <td className="py-3 px-3 font-mono font-bold text-amber-400">0.78 / 1.0</td>
                <td className="py-3 px-3 font-medium">Trade Frequency</td>
                <td className="py-3 px-3 text-muted-foreground max-w-[280px]">
                  Unusually high trade frequency: 18 trades/min from consumer account.
                </td>
                <td className="py-3 px-3">
                  <span className="gt-badge border-blue-500/40 bg-blue-500/10 text-blue-300 font-bold">
                    OPEN
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <button className="gt-button gt-button-quiet !py-1 !px-2 text-[10px]">
                    Resolve / Dismiss
                  </button>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3">
                  <span className="gt-badge border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold">
                    LOW
                  </span>
                </td>
                <td className="py-3 px-3 font-mono font-bold text-emerald-400">0.12 / 1.0</td>
                <td className="py-3 px-3 font-medium">Meter Reading</td>
                <td className="py-3 px-3 text-muted-foreground max-w-[280px]">
                  Metrics within expected baseline bounds.
                </td>
                <td className="py-3 px-3">
                  <span className="gt-badge bg-[hsl(var(--muted)/.4)] text-muted-foreground font-bold">
                    RESOLVED
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <span className="text-[10px] text-muted-foreground">Reviewed</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function UtilityControlRoomPage() {
  const [activeScenario, setActiveScenario] = useState<string>("BALANCED");
  const [triggering, setTriggering] = useState(false);
  const [selectedFeeder, setSelectedFeeder] = useState<string | null>(null);

  const fetchUtilityMetrics = async () => {
    try {
      const res = await fetch("/api/v1/operations/utility/dashboard");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      return json.data;
    } catch {
      return null;
    }
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["utilityDashboard", activeScenario],
    queryFn: fetchUtilityMetrics,
    refetchInterval: 3000,
  });

  const handleTriggerScenario = async (scenario: string) => {
    setTriggering(true);
    try {
      await fetch("/api/v1/operations/simulation/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-role": "UTILITY" },
        body: JSON.stringify({ scenario, region: "KA_BLR_01" }),
      });
      setActiveScenario(scenario);
      await refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setTriggering(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await fetch(`/api/v1/operations/alerts/${alertId}/acknowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-role": "UTILITY" },
        body: JSON.stringify({ userId: "operator-01" }),
      });
      await refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const metrics = data || {
    region: "KA_BLR_01",
    scenario: activeScenario,
    gridStatus: { congestionPercent: 18.2, renewableSharePercent: 62.4, frequencyHz: 50.00, decision: "APPROVED", recommendedPriceInr: 4.20 },
    marketplaceSummary: { activeListingsCount: 14, openDemandsCount: 9, completedTradesCount: 42, totalKwhTraded: 1850.5, totalWheelingFeeInr: 925.25 },
    feeders: [
      { id: "FDR-BLR-NORTH", name: "North Substation Feeder 1", capacityKw: 500, loadKw: 210, status: "NORMAL" },
      { id: "FDR-BLR-SOUTH", name: "South Substation Feeder 2", capacityKw: 750, loadKw: 340, status: "NORMAL" },
      { id: "FDR-BLR-EAST", name: "East Substation Feeder 3", capacityKw: 600, loadKw: 290, status: "NORMAL" },
      { id: "FDR-BLR-WEST", name: "West Industrial Feeder 4", capacityKw: 1000, loadKw: 510, status: "NORMAL" },
    ],
    recentAlerts: [
      { id: "alt-001", type: "CONGESTION_WARNING", severity: "WARNING", message: "Feeder 4B experiencing high load (78% capacity). Dynamic pricing adjusted.", createdAt: new Date().toISOString(), acknowledgedBy: null }
    ]
  };

  const scenarios = [
    { id: "SUNNY_SURPLUS", label: "Sunny Surplus", desc: "High solar generation (+40%), low load, zero congestion", icon: "☀️", color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" },
    { id: "HIGH_DEMAND", label: "High Demand Peak", desc: "Evening load spike (+60%), 78% congestion, high price", icon: "⚡", color: "border-amber-500/40 bg-amber-500/10 text-amber-400" },
    { id: "MODERATE_CONGESTION", label: "Moderate Congestion", desc: "46% congestion level, adjusted trade quantities", icon: "⚠️", color: "border-yellow-500/40 bg-yellow-500/10 text-yellow-400" },
    { id: "SEVERE_CONGESTION", label: "Severe Overload", desc: "94% thermal overload, grid RESTRICTED safety clamp", icon: "🛑", color: "border-rose-500/40 bg-rose-500/10 text-rose-400" },
    { id: "BALANCED", label: "Balanced Baseline", desc: "Normal equilibrium, 18% congestion, 50.00 Hz", icon: "⚖️", color: "border-blue-500/40 bg-blue-500/10 text-blue-400" }
  ];

  return (
    <div className="mx-auto max-w-[1450px] space-y-6">
      <PageHeader
        eyebrow="DISCOM Operations / Substation Control Room"
        title="Utility Control Room — KA_BLR_01 Substation"
        detail="Real-time distribution grid management, feeder load balance, wheeling fee collection, and scenario simulation triggers."
        action={
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            DISCOM Node Active · 24/7 Grid Dispatch
          </div>
        }
      />

      <div className="gt-card p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[hsl(var(--border))]">
          <div>
            <div className="gt-label text-[hsl(var(--accent))]">Scenario Simulator & Dispatch Engine</div>
            <h2 className="text-lg font-black tracking-[-.03em]">Real-Time Grid Stress Testing</h2>
          </div>
          <span className="gt-badge border-[hsl(var(--accent)/.4)] bg-[hsl(var(--accent)/.1)] text-[hsl(var(--accent))]">
            Active: {metrics.scenario}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {scenarios.map((sc) => {
            const isActive = metrics.scenario === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => handleTriggerScenario(sc.id)}
                disabled={triggering}
                className={`flex flex-col text-left p-4 rounded-xl border transition-all ${
                  isActive
                    ? `${sc.color} ring-2 ring-[hsl(var(--accent))] shadow-lg`
                    : "border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:bg-[hsl(var(--muted)/.3)]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">{sc.icon}</span>
                  {isActive && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[hsl(var(--accent))] text-black">Active</span>}
                </div>
                <div className="font-extrabold text-sm mb-1">{sc.label}</div>
                <div className="text-[11px] text-muted-foreground leading-relaxed">{sc.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Substation Congestion" value={`${metrics.gridStatus.congestionPercent}%`} sub={`Grid Decision: ${metrics.gridStatus.decision}`} icon={Gauge} accent={metrics.gridStatus.congestionPercent > 70 ? 'accent' : 'primary'} />
        <KpiCard label="Renewable Mix" value={`${metrics.gridStatus.renewableSharePercent}%`} sub={`Frequency: ${metrics.gridStatus.frequencyHz.toFixed(2)} Hz`} icon={SunMedium} />
        <KpiCard label="Wheeling Revenue" value={`₹${metrics.marketplaceSummary.totalWheelingFeeInr.toFixed(2)}`} sub={`From ${metrics.marketplaceSummary.completedTradesCount} confirmed trades`} icon={TrendingUp} accent="accent" />
        <KpiCard label="Active Zone Demand" value={`${metrics.marketplaceSummary.openDemandsCount} Demands`} sub={`${metrics.marketplaceSummary.activeListingsCount} Available Listings`} icon={Network} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="gt-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[hsl(var(--border))]">
            <div>
              <div className="gt-label">Feeders & Transformers</div>
              <h2 className="text-lg font-black tracking-[-.03em]">Distribution Feeder Load Status</h2>
            </div>
            <span className="text-xs text-muted-foreground font-mono">4 Active Feeders</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {metrics.feeders.map((f: any) => {
              const loadPercent = Math.min(Math.round((f.loadKw / f.capacityKw) * 100), 100);
              const isCritical = f.status === "CRITICAL" || loadPercent > 85;
              const isCongested = f.status === "CONGESTED" || loadPercent > 65;

              return (
                <div
                  key={f.id}
                  onClick={() => setSelectedFeeder(f.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isCritical
                      ? "border-rose-500/50 bg-rose-500/10"
                      : isCongested
                      ? "border-amber-500/50 bg-amber-500/10"
                      : "border-[hsl(var(--border))] bg-[hsl(var(--card))]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-sm">{f.name}</span>
                    <span className={`gt-badge text-[10px] font-bold ${
                      isCritical ? "border-rose-500/40 bg-rose-500/20 text-rose-300" : isCongested ? "border-amber-500/40 bg-amber-500/20 text-amber-300" : "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                    }`}>
                      {f.status}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground font-mono">{f.loadKw} kW / {f.capacityKw} kW</span>
                    <span className="font-bold font-mono">{loadPercent}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[hsl(var(--muted)/.4)] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isCritical ? "bg-rose-500" : isCongested ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${loadPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="gt-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[hsl(var(--border))]">
            <div>
              <div className="gt-label text-rose-400">Emergency & System Safeguards</div>
              <h2 className="text-lg font-black tracking-[-.03em]">Live Grid Alerts Queue</h2>
            </div>
            <span className="gt-badge border-rose-500/40 bg-rose-500/10 text-rose-300">
              {metrics.recentAlerts.length} Active
            </span>
          </div>

          <div className="space-y-3">
            {metrics.recentAlerts.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">No active grid alerts. System operating within normal thresholds.</div>
            ) : (
              metrics.recentAlerts.map((alt: any) => (
                <div key={alt.id} className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="gt-badge border-amber-500/40 bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                        {alt.severity || "WARNING"}
                      </span>
                      <span className="text-xs font-bold">{alt.type}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{alt.message}</p>
                    <div className="text-[10px] text-muted-foreground font-mono">{formatWhen(alt.createdAt)}</div>
                  </div>
                  {alt.acknowledgedBy ? (
                    <span className="gt-badge border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px]">Ack</span>
                  ) : (
                    <button
                      onClick={() => handleAcknowledgeAlert(alt.id)}
                      className="gt-button gt-button-quiet !py-1 !px-2 text-[10px] text-amber-300 hover:text-white"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminControlRoomPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'grid' | 'ai' | 'settlement'>('overview');

  const fetchAdminMetrics = async () => {
    try {
      const res = await fetch("/api/v1/operations/admin/dashboard", {
        headers: { "Authorization": `Bearer ${activeAuthToken}`, "x-user-role": "ADMIN" }
      });
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      return json.data;
    } catch {
      return null;
    }
  };

  const { data } = useQuery({
    queryKey: ["adminDashboard", activeAuthToken],
    queryFn: fetchAdminMetrics,
    refetchInterval: 5000,
  });

  const admin = data || {
    timestamp: new Date().toISOString(),
    systemStatus: { database: "HEALTHY", redis: "HEALTHY", aiService: "HEALTHY", uptimeSeconds: 14200 },
    userDistribution: { prosumer: 15, consumer: 7, utility: 1, regulator: 1, admin: 1 },
    marketplaceStats: { totalUsers: 25, totalListings: 30, totalTrades: 42, totalVolumeKwh: 1850.5, totalSettledInr: 8327.25 },
    activeAnomaliesCount: 2
  };

  const usersList = [
    { id: "usr_prosumer_01", name: "Aarav Sharma", role: "PROSUMER", area: "KA_BLR_01", node: "NODE-BLR-014", solarKw: 12.5, balance: 4850.00, status: "ACTIVE" },
    { id: "usr_prosumer_02", name: "Rohan Verma", role: "PROSUMER", area: "KA_BLR_01", node: "NODE-BLR-022", solarKw: 8.0, balance: 2940.50, status: "ACTIVE" },
    { id: "usr_consumer_01", name: "Priya Nair", role: "CONSUMER", area: "KA_BLR_01", node: "NODE-BLR-008", solarKw: 0.0, balance: 12400.00, status: "ACTIVE" },
    { id: "usr_consumer_02", name: "Kavita Rao", role: "CONSUMER", area: "KA_BLR_01", node: "NODE-BLR-019", solarKw: 0.0, balance: 6720.00, status: "ACTIVE" },
    { id: "usr_utility_01", name: "BESCOM Grid Controller", role: "UTILITY", area: "KA_BLR_01", node: "SUBSTATION-BLR-N", solarKw: 0.0, balance: 145000.00, status: "ACTIVE" },
    { id: "usr_regulator_01", name: "KERC Regulatory Inspector", role: "REGULATOR", area: "STATE_KA", node: "AUDIT-NODE-01", solarKw: 0.0, balance: 0.00, status: "ACTIVE" },
    { id: "usr_admin_01", name: "System Administrator", role: "ADMIN", area: "GLOBAL", node: "CORE-SYS-00", solarKw: 0.0, balance: 0.00, status: "ACTIVE" },
  ];

  const substations = [
    { id: "SUB-BLR-01", name: "North Substation (KA-BLR-01)", transformer: "T-101 (2.5 MVA)", loadPercent: 68, voltage: "230.4 V", frequency: "50.02 Hz", status: "HEALTHY" },
    { id: "SUB-BLR-02", name: "South Substation (KA-BLR-02)", transformer: "T-102 (3.0 MVA)", loadPercent: 42, voltage: "229.8 V", frequency: "49.98 Hz", status: "HEALTHY" },
    { id: "SUB-BLR-03", name: "East Industrial Grid (KA-BLR-03)", transformer: "T-103 (5.0 MVA)", loadPercent: 88, voltage: "227.1 V", frequency: "49.92 Hz", status: "CONGESTED" },
  ];

  return (
    <div className="mx-auto max-w-[1450px] space-y-6">
      <PageHeader
        eyebrow="System Governance / Platform Administration"
        title="Admin Control Room — System Health & RBAC"
        detail="Infrastructure component health monitoring, platform user distribution, RBAC role management, and security safeguards."
        action={
          <div className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-bold text-blue-400">
            <ShieldCheck size={16} />
            Platform Admin Session Verified
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2 border-b border-[hsl(var(--border))] pb-3">
        {[
          { id: 'overview', label: 'System Overview', icon: LayoutDashboard },
          { id: 'users', label: 'User & Entity Directory', icon: UserRound },
          { id: 'grid', label: 'Substations & Feeders', icon: Gauge },
          { id: 'ai', label: 'AI & Algorithm Governance', icon: Sparkles },
          { id: 'settlement', label: 'Financial Settlement & Audit', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                active
                  ? 'bg-[hsl(var(--accent))] text-black shadow-md'
                  : 'bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="PostgreSQL Database" value={admin.systemStatus.database} sub="Prisma ORM Connected" icon={Cpu} accent="primary" />
            <KpiCard label="Redis Event Bus" value={admin.systemStatus.redis} sub="Real-time PubSub Active" icon={Zap} accent="accent" />
            <KpiCard label="FastAPI AI Engine" value={admin.systemStatus.aiService} sub="Forecast & Anomaly Models Online" icon={Sparkles} />
            <KpiCard label="Total Volume Traded" value={`${admin.marketplaceStats.totalVolumeKwh} kWh`} sub={`₹${admin.marketplaceStats.totalSettledInr.toFixed(2)} total settled`} icon={TrendingUp} accent="accent" />
          </div>

          <div className="gt-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[hsl(var(--border))]">
              <div>
                <div className="gt-label text-[hsl(var(--accent))]">Role-Based Access Control</div>
                <h2 className="text-lg font-black tracking-[-.03em]">User & Entity Distribution ({admin.marketplaceStats.totalUsers} Total)</h2>
              </div>
              <span className="gt-mono text-xs text-muted-foreground">Uptime: {Math.floor(admin.systemStatus.uptimeSeconds / 60)} mins</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1">
                <div className="gt-label text-emerald-400">PROSUMER</div>
                <div className="text-2xl font-black">{admin.userDistribution.prosumer}</div>
                <div className="text-[11px] text-muted-foreground">Solar asset owners & sellers</div>
              </div>
              <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-1">
                <div className="gt-label text-blue-400">CONSUMER</div>
                <div className="text-2xl font-black">{admin.userDistribution.consumer}</div>
                <div className="text-[11px] text-muted-foreground">Clean energy buyers</div>
              </div>
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-1">
                <div className="gt-label text-amber-400">UTILITY (DISCOM)</div>
                <div className="text-2xl font-black">{admin.userDistribution.utility}</div>
                <div className="text-[11px] text-muted-foreground">Grid dispatch & feeder control</div>
              </div>
              <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-1">
                <div className="gt-label text-purple-400">REGULATOR</div>
                <div className="text-2xl font-black">{admin.userDistribution.regulator}</div>
                <div className="text-[11px] text-muted-foreground">Read-only compliance oversight</div>
              </div>
              <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-1">
                <div className="gt-label text-rose-400">ADMINISTRATOR</div>
                <div className="text-2xl font-black">{admin.userDistribution.admin}</div>
                <div className="text-[11px] text-muted-foreground">Full system access</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="gt-card p-5 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-[hsl(var(--border))]">
            <div>
              <div className="gt-label text-[hsl(var(--accent))]">Directory & Governance</div>
              <h2 className="text-lg font-black tracking-[-.03em]">Registered Users & System Accounts</h2>
            </div>
            <span className="gt-badge border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-bold">
              RBAC Guard Active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[hsl(var(--border))] text-muted-foreground font-bold">
                  <th className="pb-3 pt-2">User ID</th>
                  <th className="pb-3 pt-2">Name</th>
                  <th className="pb-3 pt-2">Role</th>
                  <th className="pb-3 pt-2">Grid Area</th>
                  <th className="pb-3 pt-2">Node ID</th>
                  <th className="pb-3 pt-2">Solar Capacity</th>
                  <th className="pb-3 pt-2">Wallet Balance</th>
                  <th className="pb-3 pt-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-secondary/40">
                    <td className="py-3 font-mono text-[11px]">{u.id}</td>
                    <td className="py-3 font-extrabold">{u.name}</td>
                    <td className="py-3">
                      <span className={`gt-badge text-[10px] font-mono font-bold px-2 py-0.5 border ${getRoleBadgeClass(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-[11px] text-muted-foreground">{u.area}</td>
                    <td className="py-3 font-mono text-[11px]">{u.node}</td>
                    <td className="py-3 font-bold">{u.solarKw > 0 ? `${u.solarKw} kWp` : '—'}</td>
                    <td className="py-3 font-mono font-extrabold">{u.balance > 0 ? `₹${u.balance.toFixed(2)}` : '—'}</td>
                    <td className="py-3">
                      <span className="gt-badge border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                        {u.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'grid' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="gt-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[hsl(var(--border))]">
              <div>
                <div className="gt-label text-[hsl(var(--accent))]">Physical Asset Infrastructure</div>
                <h2 className="text-lg font-black tracking-[-.03em]">Substations & Distribution Transformers</h2>
              </div>
              <span className="gt-mono text-xs text-emerald-400 font-bold">Grid Stability: 99.8%</span>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {substations.map((s) => (
                <div key={s.id} className="p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="gt-mono text-[11px] text-muted-foreground">{s.id}</span>
                    <span className={`gt-badge text-[10px] font-bold px-2 py-0.5 border ${s.status === 'CONGESTED' ? 'border-amber-500/40 bg-amber-500/10 text-amber-300' : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'}`}>
                      {s.status}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm">{s.name}</h3>
                    <p className="text-xs text-muted-foreground">{s.transformer}</p>
                  </div>
                  <div className="space-y-1.5 pt-2 border-t border-[hsl(var(--border))] text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">Transformer Load:</span> <span className="font-mono font-bold">{s.loadPercent}%</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Voltage Level:</span> <span className="font-mono font-bold">{s.voltage}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Frequency:</span> <span className="font-mono font-bold">{s.frequency}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="FastAPI Model Status" value="ONLINE" sub="gridtrade-ai-v2.1-prod" icon={Sparkles} accent="accent" />
            <KpiCard label="Avg Prediction Latency" value="84 ms" sub="Edge-optimized inference" icon={Clock3} />
            <KpiCard label="Anomaly Detector" value={`${admin.activeAnomaliesCount} Flagged`} sub="Isolation forest scanner" icon={CircleAlert} accent="primary" />
            <KpiCard label="Safety Guard" value="ACTIVE" sub="Prompt injection filtered" icon={ShieldCheck} />
          </div>

          <div className="gt-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[hsl(var(--border))]">
              <div>
                <div className="gt-label text-[hsl(var(--accent))]">AI Governance</div>
                <h2 className="text-lg font-black tracking-[-.03em]">Machine Learning & Dynamic Pricing Engine Controls</h2>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-2 text-xs">
              <div className="font-extrabold text-sm text-blue-300">Model Deployment & Weight Configuration</div>
              <p className="text-muted-foreground">The AI engine continuously recalculates feeder congestion coefficients, generation curves, and dynamic pricing bounds based on real-time P2P bid-ask feeds.</p>
              <div className="flex flex-wrap gap-4 pt-2 font-mono text-[11px]">
                <div><span className="text-muted-foreground">Model Weight:</span> 0.942</div>
                <div><span className="text-muted-foreground">Solar Irradiance Forecast Loss:</span> 0.014</div>
                <div><span className="text-muted-foreground">Price Elasticity Delta:</span> +0.12</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settlement' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Total Volume Traded" value={`${admin.marketplaceStats.totalVolumeKwh} kWh`} sub="P2P Energy Exchanged" icon={TrendingUp} accent="accent" />
            <KpiCard label="Gross Settled Value" value={`₹${admin.marketplaceStats.totalSettledInr.toFixed(2)}`} sub="Idempotent Settlements" icon={Tag} />
            <KpiCard label="SHA-256 Block Height" value="#42" sub="Canonical Chain Height" icon={ShieldCheck} accent="primary" />
            <KpiCard label="Ledger Hash Status" value="VERIFIED" sub="0 Tampering Detected" icon={Check} />
          </div>

          <div className="gt-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[hsl(var(--border))]">
              <div>
                <div className="gt-label text-[hsl(var(--accent))]">Financial Audit</div>
                <h2 className="text-lg font-black tracking-[-.03em]">Platform Wheeling Fee & Settlement Ledger Overview</h2>
              </div>
              <Link href="/ledger" className="gt-button gt-button-quiet text-xs font-extrabold">
                Inspect SHA-256 Block Ledger <ChevronRight size={13} />
              </Link>
            </div>
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-emerald-300">Automated Clearing & Settlement Engine</div>
                <p className="text-xs text-muted-foreground">Transactions are matched via marginal clearing price and settled atomically with SHA-256 audit proofs.</p>
              </div>
              <span className="gt-badge border-emerald-500/40 bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold px-3 py-1.5">
                DISCOM Fee: ₹0.50 / kWh
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RegulatorPortalPage() {
  const fetchRegulatorMetrics = async () => {
    try {
      const res = await fetch("/api/v1/operations/regulator/dashboard", {
        headers: { "Authorization": `Bearer ${activeAuthToken}`, "x-user-role": "REGULATOR" }
      });
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      return json.data;
    } catch {
      return null;
    }
  };

  const { data } = useQuery({
    queryKey: ["regulatorDashboard", activeAuthToken],
    queryFn: fetchRegulatorMetrics,
    refetchInterval: 5000,
  });

  const regulator = data || {
    timestamp: new Date().toISOString(),
    complianceOverview: { ledgerIntegrityStatus: "VERIFIED", totalBlocksHashed: 42, complianceScorePercent: 99.4, averageMarketTariffInr: 4.45, gridStabilityIndex: 0.98 },
    tradingAuditsSummary: { totalTradesAudited: 42, flaggedTradesCount: 1, lastAuditedAt: new Date().toISOString() }
  };

  return (
    <div className="mx-auto max-w-[1450px] space-y-6">
      <PageHeader
        eyebrow="Regulatory Oversight / Statutory Compliance"
        title="Regulator Portal — Non-Discrimination & Audit Oversight"
        detail="Strictly read-only statutory oversight, SHA-256 cryptographic ledger verification, market tariff compliance, and grid non-discrimination monitoring."
        action={
          <div className="flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-xs font-bold text-purple-300">
            <ShieldCheck size={16} />
            Read-Only Regulatory Mode Active
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Ledger Hash Integrity" value={regulator.complianceOverview.ledgerIntegrityStatus} sub={`${regulator.complianceOverview.totalBlocksHashed} SHA-256 blocks chained`} icon={ShieldCheck} accent="accent" />
        <KpiCard label="Market Compliance Index" value={`${regulator.complianceOverview.complianceScorePercent}%`} sub="Statutory tariff bound compliance" icon={Check} />
        <KpiCard label="Avg Market Tariff" value={`₹${regulator.complianceOverview.averageMarketTariffInr.toFixed(2)} / kWh`} sub="Within regulatory ceiling" icon={TrendingUp} />
        <KpiCard label="Audited Trades" value={`${regulator.tradingAuditsSummary.totalTradesAudited}`} sub={`${regulator.tradingAuditsSummary.flaggedTradesCount} Flagged for review`} icon={Clock3} accent="primary" />
      </div>

      <div className="gt-card p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[hsl(var(--border))]">
          <div>
            <div className="gt-label text-purple-400">Cryptographic Integrity Verification</div>
            <h2 className="text-lg font-black tracking-[-.03em]">SHA-256 Immutable Audit Ledger Status</h2>
          </div>
          <Link href="/ledger" className="gt-button gt-button-quiet text-xs font-extrabold">
            Inspect Full Ledger <ChevronRight size={13} />
          </Link>
        </div>

        <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-sm font-bold text-purple-300">Genesis Block to Block #{regulator.complianceOverview.totalBlocksHashed} Verified</div>
            <p className="text-xs text-muted-foreground">Every trade execution is canonically serialized and hashed with SHA-256 into an append-only chain.</p>
          </div>
          <span className="gt-badge border-purple-500/40 bg-purple-500/20 text-purple-300 text-xs font-mono font-bold px-3 py-1.5">
            0x7f8a...e9b2 [VERIFIED]
          </span>
        </div>
      </div>
    </div>
  );
}

function AuditExplorerPage() {
  const { data: activityData } = useGetActivityFeed({ limit: 20 });
  const events = ensureArray<any>(activityData);

  return (
    <div className="mx-auto max-w-[1450px] space-y-6">
      <PageHeader
        eyebrow="Audit Trail / Immutable History"
        title="Audit Explorer — Complete Platform Event Stream"
        detail="Chronological audit log tracking grid decisions, trade matches, ledger commits, and simulation triggers."
        action={
          <div className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-xs font-bold">
            <Clock3 size={14} className="text-[hsl(var(--accent))]" />
            Audit Log Stream
          </div>
        }
      />

      <div className="gt-card p-5 space-y-4">
        <ActivityList events={events} />
      </div>
    </div>
  );
}

function ProtectedRoute({ path, allowedRoles, component: Component }: {
  path: string;
  allowedRoles: string[];
  component: React.ComponentType<any>;
}) {
  const { data: session } = useGetAuthSession();
  const role = session?.role || 'PROSUMER';

  if (!allowedRoles.includes(role)) {
    return (
      <Route path={path}>
        <AccessDeniedPage requiredRole={allowedRoles[0]} currentRole={role} />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}

function Router() {
  const [location] = useLocation();
  return (
    <ErrorBoundary resetKey={location}>
      <AppShell>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/marketplace" component={MarketplacePage} />
          <ProtectedRoute path="/utility" allowedRoles={['UTILITY', 'ADMIN']} component={UtilityControlRoomPage} />
          <ProtectedRoute path="/admin" allowedRoles={['ADMIN']} component={AdminControlRoomPage} />
          <ProtectedRoute path="/regulator" allowedRoles={['REGULATOR', 'ADMIN']} component={RegulatorPortalPage} />
          <Route path="/audit" component={AuditExplorerPage} />
          <Route path="/solar" component={SolarPage} />
          <Route path="/grid" component={GridPage} />
          <Route path="/ai" component={AiCockpitPage} />
          <Route path="/ledger" component={LedgerPage} />
          <Route path="/activity" component={ActivityPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route component={NotFound} />
        </Switch>
      </AppShell>
    </ErrorBoundary>
  );
}

function App() {
  const [demoToken, setDemoToken] = useState(() => localStorage.getItem('gridtrade_auth_token') || 'demo:prosumer');

  const handleTokenChange = (newToken: string) => {
    setDemoToken(newToken);
    updateAuthToken(newToken);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Router />
      </WouterRouter>
      <Toaster />
      {IS_DEMO_MODE && (
        <DemoPanel
          activeToken={demoToken}
          onTokenChange={handleTokenChange}
        />
      )}
    </QueryClientProvider>
  );
}

export default App;