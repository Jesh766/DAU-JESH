import { useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import {
  Activity,
  BatteryCharging,
  Check,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  Clock3,
  Cpu,
  Gauge,
  Grid3X3,
  LayoutDashboard,
  LineChart,
  MapPin,
  Menu,
  Network,
  Plus,
  Radio,
  RefreshCw,
  Settings2,
  Sparkles,
  SunMedium,
  TrendingUp,
  UserRound,
  X,
  Zap,
} from 'lucide-react';
import {
  getListListingsQueryKey,
  getListSolarSystemsQueryKey,
  useCreateListing,
  useCreateSolarSystem,
  useGetActivityFeed,
  useGetAuthSession,
  useGetDashboardSummary,
  useGetEnergyOverview,
  useGetGridStatus,
  useGetMatchRecommendations,
  useHealthCheck,
  useListListings,
  useListSolarSystems,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

type IconType = typeof LayoutDashboard;

const navItems: { href: string; label: string; icon: IconType; detail: string }[] = [
  { href: '/', label: 'Operating picture', icon: LayoutDashboard, detail: 'Live system view' },
  { href: '/marketplace', label: 'Marketplace', icon: Network, detail: 'Buy and publish' },
  { href: '/solar', label: 'Solar systems', icon: SunMedium, detail: 'Owned assets' },
  { href: '/grid', label: 'Grid conditions', icon: Grid3X3, detail: 'Decisions and signals' },
  { href: '/activity', label: 'Activity', icon: Activity, detail: 'Persisted events' },
];

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
  const displayName = session?.displayName || 'Control room';
  const role = session?.role || 'SESSION';

  return <div className="gt-shell flex">
    <aside className="gt-sidebar hidden w-[238px] shrink-0 flex-col border-r border-[hsl(var(--sidebar-border))] lg:flex">
      <div className="flex h-[78px] items-center gap-3 border-b border-[hsl(var(--sidebar-border))] px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]"><Zap size={18} strokeWidth={2.5} /></div>
        <div><div className="text-[15px] font-extrabold tracking-[-.04em]">GridTrade</div><div className="gt-label !text-[hsl(var(--sidebar-foreground)/.45)]">Local energy network</div></div>
      </div>
      <div className="flex items-center gap-2 px-5 py-5"><span className="gt-status-dot" /><div className="text-[11px] font-bold text-[hsl(var(--sidebar-foreground)/.72)]">Network live</div><div className="ml-auto gt-mono text-[10px] text-[hsl(var(--sidebar-foreground)/.42)]">24 / 7</div></div>
      <nav className="flex-1 space-y-1 pr-4">
        <div className="px-5 pb-2 pt-1 text-[9px] font-extrabold uppercase tracking-[.2em] text-[hsl(var(--sidebar-foreground)/.35)]">Workspace</div>
        {navItems.map((item) => { const Icon = item.icon; const active = location === item.href; return <Link href={item.href} key={item.href} className={`gt-nav-item ${active ? 'gt-nav-active' : ''}`} data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`}><Icon size={16} /><span>{item.label}</span>{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[hsl(var(--sidebar-primary))]" />}</Link>; })}
      </nav>
      <div className="border-t border-[hsl(var(--sidebar-border))] p-4">
        <Link href="/settings" className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-[hsl(var(--sidebar-accent))]" data-testid="link-nav-settings">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--sidebar-primary)/.18)] text-[11px] font-extrabold text-[hsl(var(--sidebar-primary))]">{displayName.slice(0, 2).toUpperCase()}</div>
          <div className="min-w-0 flex-1"><div className="truncate text-[11px] font-extrabold">{sessionLoading ? 'Loading session' : displayName}</div><div className="gt-label !text-[hsl(var(--sidebar-foreground)/.4)]">{role}</div></div>
          <Settings2 size={14} className="text-[hsl(var(--sidebar-foreground)/.4)]" />
        </Link>
      </div>
    </aside>
    {mobileOpen && <div className="fixed inset-0 z-40 bg-[hsl(var(--sidebar)/.55)] lg:hidden" onClick={() => setMobileOpen(false)} />}
    <aside className={`gt-sidebar fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col border-r border-[hsl(var(--sidebar-border))] transition-transform lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex h-[78px] items-center justify-between border-b border-[hsl(var(--sidebar-border))] px-5"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]"><Zap size={18} /></div><span className="font-extrabold">GridTrade</span></div><button onClick={() => setMobileOpen(false)} aria-label="Close navigation" data-testid="button-close-navigation"><X size={18} /></button></div>
      <nav className="space-y-1 pr-4 pt-5">{navItems.map((item) => { const Icon = item.icon; return <Link href={item.href} key={item.href} onClick={() => setMobileOpen(false)} className="gt-nav-item"><Icon size={16} /><span>{item.label}</span></Link>; })}<Link href="/settings" onClick={() => setMobileOpen(false)} className="gt-nav-item"><Settings2 size={16} /><span>Settings</span></Link></nav>
    </aside>
    <main className="gt-main flex min-h-[100dvh] flex-1 flex-col">
      <header className="gt-topbar sticky top-0 z-30 flex h-[64px] items-center justify-between px-4 sm:px-7">
        <div className="flex items-center gap-3"><button className="rounded-md p-2 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation" data-testid="button-open-navigation"><Menu size={19} /></button><div className="lg:hidden text-sm font-extrabold">GridTrade</div><div className="hidden items-center gap-2 text-[11px] text-muted-foreground sm:flex"><Radio size={13} className="text-[hsl(var(--accent))]" /> Local dispatch / <span className="font-bold text-foreground">South Bengaluru</span></div></div>
        <div className="flex items-center gap-3"><div className="hidden items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1.5 text-[10px] font-bold text-muted-foreground sm:flex"><span className="gt-status-dot" /> Data refreshed <span className="gt-mono text-foreground">12:42:08</span></div><Link href="/settings" className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]" data-testid="link-header-profile"><UserRound size={14} /></Link></div>
      </header>
      <div className="gt-page-enter flex-1 px-4 py-6 sm:px-7 sm:py-8">{children}</div>
    </main>
  </div>;
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
  return <div className="divide-y divide-[hsl(var(--border))]">{events.map((event, index) => <div className={`flex gap-3 ${compact ? 'py-3' : 'py-4'}`} key={event.id ?? index} data-testid={`row-activity-${event.id ?? index}`}><div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${event.status === 'positive' ? 'bg-[hsl(var(--accent)/.12)] text-[hsl(var(--accent))]' : event.status === 'warning' ? 'bg-[hsl(var(--destructive)/.1)] text-[hsl(var(--destructive))]' : 'bg-[hsl(var(--primary)/.14)] text-[hsl(var(--primary))]'}`}><Activity size={13} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"><p className="text-[12px] font-extrabold">{event.title}</p><span className="gt-mono text-[9px] text-muted-foreground">{formatWhen(event.occurredAt)}</span></div><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{event.detail}</p></div></div>)}</div>;
}

function HomePage() {
  const summary = useGetDashboardSummary();
  const activity = useGetActivityFeed({ limit: 6 });
  const energy = useGetEnergyOverview({ window: '24h' });
  const recommendations = useGetMatchRecommendations();
  const grid = useGetGridStatus();
  const summaryData = summary.data;
  const trend = energy.data ?? summaryData?.energyTrend ?? [];
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
        <section className="gt-card p-4 sm:p-5"><div className="mb-3 flex items-center justify-between"><div><div className="gt-label">Recommended actions</div><h2 className="mt-1 text-base font-extrabold">Best matches in your zone</h2></div><Link href="/marketplace" className="text-[11px] font-extrabold text-[hsl(var(--accent))]" data-testid="link-view-marketplace">Open marketplace <ChevronRight size={12} className="ml-1 inline" /></Link></div><DataState loading={recommendations.isLoading} error={recommendations.isError} empty={!recommendations.isLoading && !recommendations.data?.length} onRetry={() => void recommendations.refetch()} label="recommendations"><div className="divide-y divide-[hsl(var(--border))]">{recommendations.data?.slice(0, 3).map((match) => <div key={match.id} className="flex items-center gap-3 py-3" data-testid={`row-recommendation-${match.id}`}><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]"><SunMedium size={16} /></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate text-[12px] font-extrabold">{match.sellerName}</p><span className="gt-mono text-[11px] font-medium">{formatCurrency(match.priceInrPerKwh)}</span></div><div className="mt-1 flex gap-3 text-[10px] text-muted-foreground"><span>{match.location}</span><span>{formatNumber(match.quantityKwh)} kWh</span></div></div><div className="rounded-full bg-[hsl(var(--accent)/.12)] px-2 py-1 gt-mono text-[10px] font-medium text-[hsl(var(--accent))]">{match.score}%</div></div>)}</div></DataState></section>
        <section className="gt-card p-4 sm:p-5"><div className="mb-3 flex items-center justify-between"><div><div className="gt-label">Activity stream</div><h2 className="mt-1 text-base font-extrabold">What just moved</h2></div><Link href="/activity" className="text-[11px] font-extrabold text-[hsl(var(--accent))]" data-testid="link-view-activity">View all <ChevronRight size={12} className="ml-1 inline" /></Link></div><DataState loading={activity.isLoading} error={activity.isError} empty={!activity.isLoading && !activity.data?.length} onRetry={() => void activity.refetch()} label="activity"><ActivityList events={activity.data ?? []} compact /></DataState></section>
      </div>
    </DataState>
  </div>;
}

function MarketplacePage() {
  const listings = useListListings({ status: 'active', limit: 50 });
  const systems = useListSolarSystems();
  const create = useCreateListing();
  const client = useQueryClient();
  const [publishing, setPublishing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [form, setForm] = useState({ solarSystemId: '', quantityKwh: '', priceInrPerKwh: '', availableFrom: '', availableUntil: '' });
  const submit = (event: FormEvent) => { event.preventDefault(); setFeedback(''); create.mutate({ data: { solarSystemId: form.solarSystemId, quantityKwh: Number(form.quantityKwh), priceInrPerKwh: Number(form.priceInrPerKwh), availableFrom: new Date(form.availableFrom).toISOString(), availableUntil: new Date(form.availableUntil).toISOString() } }, { onSuccess: () => { setPublishing(false); setFeedback('Listing published to the local market.'); setForm({ solarSystemId: '', quantityKwh: '', priceInrPerKwh: '', availableFrom: '', availableUntil: '' }); void client.invalidateQueries({ queryKey: getListListingsQueryKey({ status: 'active', limit: 50 }) }); }, onError: () => setFeedback('Could not publish this listing. Check the fields and try again.') }); };
  return <div className="mx-auto max-w-[1450px]"><PageHeader eyebrow="Marketplace / peer-to-peer" title="Move surplus with context." detail="Browse available generation and publish your own. Every listing is checked against the local grid before it reaches the market." action={<button className="gt-button gt-button-primary" onClick={() => setPublishing(true)} data-testid="button-publish-listing"><Plus size={15} /> Publish surplus</button>} />
    {feedback && <div className={`mb-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold ${feedback.startsWith('Listing') ? 'border-[hsl(var(--accent)/.35)] bg-[hsl(var(--accent)/.08)] text-[hsl(var(--accent))]' : 'border-[hsl(var(--destructive)/.3)] bg-[hsl(var(--destructive)/.08)] text-[hsl(var(--destructive))]'}`} data-testid="status-listing-feedback">{feedback}</div>}
    <DataState loading={listings.isLoading} error={listings.isError} empty={!listings.isLoading && !listings.data?.length} onRetry={() => void listings.refetch()} label="active listings"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{listings.data?.map((listing) => <article key={listing.id} className="gt-card gt-card-hover p-4" data-testid={`card-listing-${listing.id}`}><div className="flex items-start justify-between"><div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--secondary))]"><SunMedium size={15} className="text-[hsl(var(--accent))]" /></div><div><div className="text-[12px] font-extrabold">{listing.sellerName}</div><div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground"><MapPin size={10} /> {listing.location}</div></div></div><span className={`rounded-full px-2 py-1 text-[9px] font-extrabold uppercase tracking-[.08em] ${decisionTone(listing.gridDecision) === 'approved' ? 'bg-[hsl(var(--accent)/.12)] text-[hsl(var(--accent))]' : 'bg-[hsl(var(--primary)/.15)] text-[hsl(var(--primary))]'}`}>{listing.gridDecision}</span></div><div className="my-5 flex items-end justify-between"><div><div className="gt-label">Available volume</div><div className="gt-mono mt-1 text-[25px]">{formatNumber(listing.quantityKwh)} <span className="text-[11px] text-muted-foreground">kWh</span></div></div><div className="text-right"><div className="gt-label">Ask</div><div className="gt-mono mt-1 text-[18px] font-medium">{formatCurrency(listing.priceInrPerKwh)}<span className="text-[10px] text-muted-foreground"> / kWh</span></div></div></div><div className="flex items-center justify-between border-t border-[hsl(var(--border))] pt-3 text-[10px] text-muted-foreground"><span className="flex items-center gap-1"><Clock3 size={11} /> {formatWhen(listing.availableFrom)}–{formatWhen(listing.availableUntil)}</span><span className="font-extrabold text-[hsl(var(--accent))]">{listing.matchScore}% fit</span></div></article>)}</div></DataState>
    {publishing && <div className="fixed inset-0 z-50 flex items-end justify-center bg-[hsl(var(--sidebar)/.55)] p-3 sm:items-center"><div className="gt-card w-full max-w-[520px] p-5 sm:p-6" role="dialog" aria-modal="true" data-testid="dialog-publish-listing"><div className="mb-5 flex items-start justify-between"><div><div className="gt-label text-[hsl(var(--accent))]">New listing</div><h2 className="mt-1 text-xl font-extrabold tracking-[-.04em]">Publish surplus energy</h2></div><button onClick={() => setPublishing(false)} data-testid="button-close-publish"><X size={18} /></button></div><form onSubmit={submit} className="space-y-4"><label className="block"><span className="gt-label mb-1.5 block">Solar system</span><select className="gt-input" value={form.solarSystemId} onChange={(e) => setForm({ ...form, solarSystemId: e.target.value })} required data-testid="select-listing-system"><option value="">Select a registered system</option>{systems.data?.map((system) => <option value={system.id} key={system.id}>{system.name} · {system.location}</option>)}</select></label><div className="grid gap-3 sm:grid-cols-2"><label><span className="gt-label mb-1.5 block">Quantity (kWh)</span><input className="gt-input" type="number" min="0.1" step="0.1" value={form.quantityKwh} onChange={(e) => setForm({ ...form, quantityKwh: e.target.value })} required data-testid="input-listing-quantity" /></label><label><span className="gt-label mb-1.5 block">Price (₹ / kWh)</span><input className="gt-input" type="number" min="0.1" step="0.01" value={form.priceInrPerKwh} onChange={(e) => setForm({ ...form, priceInrPerKwh: e.target.value })} required data-testid="input-listing-price" /></label></div><div className="grid gap-3 sm:grid-cols-2"><label><span className="gt-label mb-1.5 block">Available from</span><input className="gt-input" type="datetime-local" value={form.availableFrom} onChange={(e) => setForm({ ...form, availableFrom: e.target.value })} required data-testid="input-listing-from" /></label><label><span className="gt-label mb-1.5 block">Available until</span><input className="gt-input" type="datetime-local" value={form.availableUntil} onChange={(e) => setForm({ ...form, availableUntil: e.target.value })} required data-testid="input-listing-until" /></label></div><div className="flex items-center justify-end gap-2 pt-2"><button type="button" className="gt-button gt-button-quiet" onClick={() => setPublishing(false)} data-testid="button-cancel-publish">Cancel</button><button type="submit" className="gt-button gt-button-primary" disabled={create.isPending} data-testid="button-submit-listing">{create.isPending ? 'Publishing…' : <><Check size={14} /> Publish listing</>}</button></div></form></div></div>}
  </div>;
}

function SolarPage() {
  const systems = useListSolarSystems();
  const create = useCreateSolarSystem();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [form, setForm] = useState({ name: '', capacityKw: '', location: '' });
  const submit = (event: FormEvent) => { event.preventDefault(); create.mutate({ data: { name: form.name, capacityKw: Number(form.capacityKw), location: form.location } }, { onSuccess: () => { setOpen(false); setFeedback('Solar system registered.'); setForm({ name: '', capacityKw: '', location: '' }); void client.invalidateQueries({ queryKey: getListSolarSystemsQueryKey() }); }, onError: () => setFeedback('Could not register this system. Check the fields and try again.') }); };
  const totalGeneration = systems.data?.reduce((sum, system) => sum + system.todayGenerationKwh, 0) ?? 0;
  const totalConsumption = systems.data?.reduce((sum, system) => sum + system.todayConsumptionKwh, 0) ?? 0;
  return <div className="mx-auto max-w-[1450px]"><PageHeader eyebrow="Solar systems / owned assets" title="Know every panel in the network." detail="Keep your generation assets current so the marketplace and grid model can make better calls." action={<button className="gt-button gt-button-primary" onClick={() => setOpen(true)} data-testid="button-add-solar"><Plus size={15} /> Register system</button>} />
    {feedback && <div className="mb-4 flex items-center gap-2 rounded-lg border border-[hsl(var(--accent)/.35)] bg-[hsl(var(--accent)/.08)] px-3 py-2 text-xs font-bold text-[hsl(var(--accent))]" data-testid="status-solar-feedback"><CircleCheck size={14} /> {feedback}</div>}
    <div className="mb-4 grid gap-3 sm:grid-cols-3"><KpiCard label="Registered systems" value={formatNumber(systems.data?.length, 0)} sub="Assets in your account" icon={SunMedium} /><KpiCard label="Generation today" value={`${formatNumber(totalGeneration)} kWh`} sub="Across all systems" icon={SunMedium} accent="accent" /><KpiCard label="Local consumption" value={`${formatNumber(totalConsumption)} kWh`} sub="Behind-the-meter load" icon={BatteryCharging} /></div>
    <DataState loading={systems.isLoading} error={systems.isError} empty={!systems.isLoading && !systems.data?.length} onRetry={() => void systems.refetch()} label="solar systems"><div className="grid gap-3 md:grid-cols-2">{systems.data?.map((system) => <article className="gt-card p-5" key={system.id} data-testid={`card-solar-${system.id}`}><div className="flex items-start justify-between"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--primary)/.16)] text-[hsl(var(--primary))]"><SunMedium size={18} /></div><div><h2 className="text-sm font-extrabold">{system.name}</h2><p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground"><MapPin size={10} /> {system.location}</p></div></div><span className={`flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.08em] ${system.status === 'online' ? 'text-[hsl(var(--accent))]' : 'text-muted-foreground'}`}><span className={`h-1.5 w-1.5 rounded-full ${system.status === 'online' ? 'bg-[hsl(var(--accent))]' : 'bg-muted-foreground'}`} /> {system.status}</span></div><div className="mt-6 grid grid-cols-3 gap-3 border-y border-[hsl(var(--border))] py-4"><div><div className="gt-label">Capacity</div><div className="gt-mono mt-1 text-[16px]">{formatNumber(system.capacityKw)} <span className="text-[10px] text-muted-foreground">kW</span></div></div><div><div className="gt-label">Generated</div><div className="gt-mono mt-1 text-[16px] text-[hsl(var(--accent))]">{formatNumber(system.todayGenerationKwh)} <span className="text-[10px] text-muted-foreground">kWh</span></div></div><div><div className="gt-label">Consumed</div><div className="gt-mono mt-1 text-[16px]">{formatNumber(system.todayConsumptionKwh)} <span className="text-[10px] text-muted-foreground">kWh</span></div></div></div><div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground"><span>Net available today</span><span className="gt-mono font-medium text-foreground">{formatNumber(system.todayGenerationKwh - system.todayConsumptionKwh)} kWh</span></div></article>)}</div></DataState>
    {open && <div className="fixed inset-0 z-50 flex items-end justify-center bg-[hsl(var(--sidebar)/.55)] p-3 sm:items-center"><div className="gt-card w-full max-w-[460px] p-5 sm:p-6" role="dialog" aria-modal="true" data-testid="dialog-add-solar"><div className="mb-5 flex items-start justify-between"><div><div className="gt-label text-[hsl(var(--accent))]">Owned asset</div><h2 className="mt-1 text-xl font-extrabold tracking-[-.04em]">Register a solar system</h2></div><button onClick={() => setOpen(false)} data-testid="button-close-solar"><X size={18} /></button></div><form onSubmit={submit} className="space-y-4"><label className="block"><span className="gt-label mb-1.5 block">System name</span><input className="gt-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="East roof array" required data-testid="input-solar-name" /></label><div className="grid gap-3 sm:grid-cols-2"><label><span className="gt-label mb-1.5 block">Capacity (kW)</span><input className="gt-input" type="number" min="0.1" step="0.1" value={form.capacityKw} onChange={(e) => setForm({ ...form, capacityKw: e.target.value })} required data-testid="input-solar-capacity" /></label><label><span className="gt-label mb-1.5 block">Location</span><input className="gt-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="HSR Layout" required data-testid="input-solar-location" /></label></div><div className="flex justify-end gap-2 pt-2"><button type="button" className="gt-button gt-button-quiet" onClick={() => setOpen(false)} data-testid="button-cancel-solar">Cancel</button><button className="gt-button gt-button-primary" disabled={create.isPending} type="submit" data-testid="button-submit-solar">{create.isPending ? 'Registering…' : <><Check size={14} /> Register system</>}</button></div></form></div></div>}
  </div>;
}

function GridPage() {
  const grid = useGetGridStatus();
  const matches = useGetMatchRecommendations();
  const energy = useGetEnergyOverview({ window: '24h' });
  const g = grid.data;
  return <div className="mx-auto max-w-[1450px]"><PageHeader eyebrow="Grid conditions / decision layer" title="Read the grid before you act." detail="The local decision model balances congestion, renewable share, frequency, and match quality into one operating instruction." action={<div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground"><span className="gt-status-dot" /> Updated {formatWhen(g?.updatedAt)}</div>} />
    <DataState loading={grid.isLoading} error={grid.isError} onRetry={() => void grid.refetch()} label="grid status"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><div className="gt-card relative overflow-hidden bg-[hsl(var(--sidebar))] p-5 text-[hsl(var(--sidebar-foreground))] md:col-span-2"><div className="gt-label !text-[hsl(var(--sidebar-foreground)/.55)]">Current operating instruction</div><div className="mt-8 flex items-end justify-between"><div><div className="text-[28px] font-extrabold tracking-[-.06em]">{g?.label ?? '—'}</div><div className="mt-2 text-[11px] text-[hsl(var(--sidebar-foreground)/.58)]">{g?.decision ?? '—'} · decision is based on local conditions</div></div><div className={`rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.1em] ${decisionTone(g?.decision) === 'approved' ? 'bg-[hsl(var(--accent)/.2)] text-[hsl(var(--sidebar-primary))]' : 'bg-[hsl(var(--primary)/.2)] text-[hsl(var(--sidebar-primary))]'}`}>{g?.decision ?? '—'}</div></div><div className="absolute -bottom-16 -right-10 h-48 w-48 rounded-full border border-[hsl(var(--sidebar-primary)/.15)]" /></div><SignalCard icon={Gauge} label="Congestion" value={`${formatNumber(g?.congestionPercent)}%`} detail="Lower is more flexible" meter={g?.congestionPercent} inverse /><SignalCard icon={SunMedium} label="Renewable share" value={`${formatNumber(g?.renewableSharePercent)}%`} detail="Current local mix" meter={g?.renewableSharePercent} /><SignalCard icon={Radio} label="Grid frequency" value={`${g?.frequencyHz?.toFixed(2) ?? '—'} Hz`} detail="Nominal 50.00 Hz" meter={Math.min(Math.abs((g?.frequencyHz ?? 50) - 49.5) * 100, 100)} inverse /></div></DataState>
    <div className="mt-3 grid gap-3 xl:grid-cols-[1.15fr_1fr]"><section className="gt-card p-5"><div className="mb-5 flex items-start justify-between"><div><div className="gt-label">Signal history</div><h2 className="mt-1 text-base font-extrabold">Generation and load / 24h</h2></div><LineChart size={17} className="text-[hsl(var(--accent))]" /></div><Sparkline observations={energy.data ?? []} /></section><section className="gt-card p-5"><div className="mb-4"><div className="gt-label">Decision rationale</div><h2 className="mt-1 text-base font-extrabold">Why this instruction is active</h2></div><div className="space-y-3"><RationaleRow label="Congestion headroom" value={`${formatNumber(100 - (g?.congestionPercent ?? 0))}% available`} good={(g?.congestionPercent ?? 100) < 55} /><RationaleRow label="Renewable supply" value={`${formatNumber(g?.renewableSharePercent)}% of local mix`} good={(g?.renewableSharePercent ?? 0) > 40} /><RationaleRow label="Frequency stability" value={`${g?.frequencyHz?.toFixed(2) ?? '—'} Hz`} good={Math.abs((g?.frequencyHz ?? 50) - 50) < .12} /></div><div className="mt-6 rounded-lg bg-[hsl(var(--muted)/.55)] p-3 text-[11px] leading-5 text-muted-foreground">The recommendation layer prioritizes a healthy local path over lowest price alone. Matches with a stronger grid fit are ranked first.</div></section></div>
    <section className="gt-card mt-3 p-5"><div className="mb-3 flex items-center justify-between"><div><div className="gt-label">Match recommendations</div><h2 className="mt-1 text-base font-extrabold">Actions that respect the current grid</h2></div><Link href="/marketplace" className="gt-button gt-button-quiet" data-testid="link-grid-marketplace">Open marketplace <ChevronRight size={13} /></Link></div><DataState loading={matches.isLoading} error={matches.isError} empty={!matches.isLoading && !matches.data?.length} onRetry={() => void matches.refetch()} label="grid matches"><div className="grid gap-3 md:grid-cols-2">{matches.data?.map((match) => <div key={match.id} className="rounded-lg border border-[hsl(var(--border))] p-4" data-testid={`card-grid-match-${match.id}`}><div className="flex items-center justify-between"><div className="text-[12px] font-extrabold">{match.sellerName}</div><div className="gt-mono text-[12px] text-[hsl(var(--accent))]">{match.score}% match</div></div><div className="mt-2 text-[11px] text-muted-foreground">{match.rationale}</div><div className="mt-3 flex flex-wrap gap-1.5">{match.factors.map((factor) => <span key={factor} className="rounded-full bg-[hsl(var(--muted))] px-2 py-1 text-[9px] font-bold text-muted-foreground">{factor}</span>)}</div></div>)}</div></DataState></section>
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
  return <div className="mx-auto max-w-[1000px]"><PageHeader eyebrow="Activity / persisted events" title="The record of every decision." detail="A durable timeline of listings, matches, grid instructions, transactions, and model alerts across your workspace." action={<button className="gt-button gt-button-quiet" onClick={() => void events.refetch()} data-testid="button-refresh-activity"><RefreshCw size={14} /> Refresh feed</button>} /><section className="gt-card p-4 sm:p-6"><div className="mb-2 flex items-center justify-between border-b border-[hsl(var(--border))] pb-4"><div className="gt-label">Latest events</div><div className="gt-mono text-[10px] text-muted-foreground">{events.data?.length ?? 0} loaded</div></div><DataState loading={events.isLoading} error={events.isError} empty={!events.isLoading && !events.data?.length} onRetry={() => void events.refetch()} label="activity events"><ActivityList events={events.data ?? []} /></DataState>{events.data?.length === limit && <button className="mt-4 w-full rounded-lg border border-dashed border-[hsl(var(--border))] py-3 text-[11px] font-extrabold text-muted-foreground hover:bg-[hsl(var(--muted)/.5)]" onClick={() => setLimit((current) => Math.min(50, current + 10))} data-testid="button-load-more-activity">Load older events</button>}</section></div>;
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

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><AppShell><Switch><Route path="/" component={HomePage} /><Route path="/marketplace" component={MarketplacePage} /><Route path="/solar" component={SolarPage} /><Route path="/grid" component={GridPage} /><Route path="/activity" component={ActivityPage} /><Route path="/settings" component={SettingsPage} /><Route component={NotFound} /></Switch></AppShell></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></QueryClientProvider>;
}

export default App;