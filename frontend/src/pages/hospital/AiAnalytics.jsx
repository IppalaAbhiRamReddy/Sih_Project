import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    TrendingUp,
    Activity,
    Brain,
    Lock,
    Loader,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { Select } from '../../components/shared/Select';
import { hospitalService } from '../../services/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getUser() {
    try {
        return JSON.parse(localStorage.getItem('user')) || {};
    } catch {
        return {};
    }
}

const CHART_COLORS = ['#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#F87171'];

// ---------------------------------------------------------------------------
// ChartWrapper — prevents recharts width/height = -1 error
// ---------------------------------------------------------------------------
function ChartWrapper({ height = 320, children }) {
    const ref = useRef(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const ro = new ResizeObserver((entries) => {
            for (const e of entries) {
                if (e.contentRect.width > 0 && e.contentRect.height > 0) setReady(true);
            }
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    return (
        <div ref={ref} style={{ width: '100%', height, minWidth: 0, minHeight: height, position: 'relative' }}>
            {ready ? children : (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Loader className="w-5 h-5 text-gray-300 animate-spin" />
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// ProgressBar
// ---------------------------------------------------------------------------
function ProgressBar({ pct, colorClass = 'bg-amber-400', trackClass = 'bg-amber-100' }) {
    const clamped = Math.min(100, Math.max(0, pct));
    return (
        <div className={`w-full h-2 rounded-full overflow-hidden ${trackClass}`}>
            <div
                className={`h-2 rounded-full transition-all duration-700 ${colorClass}`}
                style={{ width: `${clamped}%` }}
            />
        </div>
    );
}

// ---------------------------------------------------------------------------
// LearningBanner — forecast card, shown when is_learning = true
// Shows: global progress bar, 3 live counters, collapsible dept breakdown
// ---------------------------------------------------------------------------
function LearningBanner({ forecastMetadata }) {
    const [expanded, setExpanded] = useState(false);

    const totalVisits = forecastMetadata?.total_visits_analyzed ?? 0;
    const minRequired = forecastMetadata?.min_visits_required ?? 30;
    const minDeptDays = forecastMetadata?.min_dept_days_required ?? 21;
    const deptProgress = forecastMetadata?.dept_progress ?? {};
    const pct = Math.min(100, Math.round((totalVisits / minRequired) * 100));
    const deptEntries = Object.values(deptProgress);

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">

            {/* Title row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="text-sm font-semibold text-amber-900">
                        AI is Learning — Building Your Forecast Model
                    </span>
                </div>
                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    {pct}% ready
                </span>
            </div>

            {/* Global progress bar */}
            <div className="space-y-1">
                <div className="flex justify-between text-xs text-amber-700">
                    <span>Visit days collected</span>
                    <span className="font-semibold">{totalVisits} / {minRequired} days</span>
                </div>
                <ProgressBar pct={pct} colorClass="bg-amber-400" trackClass="bg-amber-100" />
                <p className="text-xs text-amber-600">
                    Full AI forecasting activates once {minRequired} days of visit history are recorded.
                </p>
            </div>

            {/* Live data counters */}
            <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="bg-white border border-amber-100 rounded-lg px-3 py-2 text-center">
                    <p className="text-lg font-bold text-amber-800">{totalVisits}</p>
                    <p className="text-[10px] text-amber-600 mt-0.5">Visit days recorded</p>
                </div>
                <div className="bg-white border border-amber-100 rounded-lg px-3 py-2 text-center">
                    <p className="text-lg font-bold text-amber-800">{deptEntries.length}</p>
                    <p className="text-[10px] text-amber-600 mt-0.5">Departments tracked</p>
                </div>
                <div className="bg-white border border-amber-100 rounded-lg px-3 py-2 text-center">
                    <p className="text-lg font-bold text-amber-800">
                        {Math.max(0, minRequired - totalVisits)}
                    </p>
                    <p className="text-[10px] text-amber-600 mt-0.5">Days remaining</p>
                </div>
            </div>

            {/* Per-department collapsible breakdown */}
            {deptEntries.length > 0 && (
                <div>
                    <button
                        onClick={() => setExpanded(v => !v)}
                        className="flex items-center gap-1 text-xs text-amber-700 font-medium hover:text-amber-900 transition-colors"
                    >
                        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {expanded ? 'Hide' : 'Show'} department breakdown
                    </button>

                    {expanded && (
                        <div className="mt-2 space-y-2">
                            {deptEntries.map((dept) => {
                                const dPct = Math.min(100, Math.round((dept.visit_days / minDeptDays) * 100));
                                const ready = dept.visit_days >= minDeptDays;
                                return (
                                    <div key={dept.name} className="space-y-0.5">
                                        <div className="flex justify-between text-xs text-amber-800">
                                            <span className="flex items-center gap-1">
                                                <span className={`w-1.5 h-1.5 rounded-full ${ready ? 'bg-green-500' : 'bg-amber-400'}`} />
                                                {dept.name}
                                            </span>
                                            <span className="font-medium">
                                                {dept.visit_days} / {minDeptDays} days
                                                {ready && <span className="text-green-600 ml-1">✓ AI active</span>}
                                            </span>
                                        </div>
                                        <ProgressBar
                                            pct={dPct}
                                            colorClass={ready ? 'bg-green-400' : 'bg-amber-400'}
                                            trackClass="bg-amber-100"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// DiseaseProgressOverlay — full overlay when insufficient_data = true
// ---------------------------------------------------------------------------
function DiseaseProgressOverlay({ diseaseMetadata }) {
    const totalRecords = diseaseMetadata?.total_records ?? 0;
    const minRequired = diseaseMetadata?.min_records_for_ml ?? 50;
    const pct = diseaseMetadata?.ml_progress_pct ?? Math.min(100, Math.round((totalRecords / minRequired) * 100));
    const uniqueDx = diseaseMetadata?.unique_diagnoses ?? 0;

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 rounded-lg px-6 space-y-4">
            <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-purple-400" />
                </div>
                <p className="text-sm font-semibold text-gray-800 text-center">AI Model Training</p>
                <p className="text-xs text-gray-500 text-center">
                    Collecting diagnosis records to build the distribution model
                </p>
            </div>

            <div className="w-full space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                    <span>Records analysed</span>
                    <span className="font-semibold text-purple-700">{totalRecords} / {minRequired}</span>
                </div>
                <ProgressBar pct={pct} colorClass="bg-purple-400" trackClass="bg-purple-100" />
                <p className="text-[10px] text-center text-gray-400">
                    {Math.max(0, minRequired - totalRecords)} more records needed to activate ML distribution
                </p>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full">
                <div className="bg-purple-50 border border-purple-100 rounded-lg px-3 py-2 text-center">
                    <p className="text-base font-bold text-purple-800">{totalRecords}</p>
                    <p className="text-[10px] text-purple-600 mt-0.5">Visits recorded</p>
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-lg px-3 py-2 text-center">
                    <p className="text-base font-bold text-purple-800">{uniqueDx}</p>
                    <p className="text-[10px] text-purple-600 mt-0.5">Diagnoses seen</p>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// ChartEmpty
// ---------------------------------------------------------------------------
function ChartEmpty({ icon: Icon, message, sub }) {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-200">
            <Icon className="w-12 h-12 text-gray-300 mb-2" />
            <p className="text-sm font-medium text-gray-500 text-center px-6">{message}</p>
            {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
    );
}

// ---------------------------------------------------------------------------
// DiseaseLegend
// ---------------------------------------------------------------------------
function DiseaseLegend({ data }) {
    if (!data?.length) return null;
    return (
        <div className="space-y-3">
            {data.map((d) => (
                <div key={d.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-sm font-medium text-gray-900">{d.name}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{d.value}%</span>
                </div>
            ))}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function AiAnalytics() {
    const [timeRange, setTimeRange] = useState('30days');
    const [selectedDept, setSelectedDept] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [loadForecastData, setLoadForecastData] = useState([]);
    const [diseaseData, setDiseaseData] = useState([]);
    const [departmentStatus, setDepartmentStatus] = useState([]);
    const [forecastMetadata, setForecastMetadata] = useState(null);
    const [diseaseMetadata, setDiseaseMetadata] = useState(null);

    const [deptOptions, setDeptOptions] = useState([{ value: 'all', label: 'All Departments' }]);
    const deptsLoaded = useRef(false);

    const timeOptions = [
        { value: '7days', label: 'Last 7 Days' },
        { value: '30days', label: 'Last 30 Days' },
        { value: '90days', label: 'Last 3 Months' },
    ];

    const fetchAnalytics = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            if (!deptsLoaded.current) {
                const user = getUser();
                if (user?.hospital_id) {
                    const depts = await hospitalService.getDepartments(user.hospital_id);
                    if (Array.isArray(depts) && depts.length) {
                        setDeptOptions([
                            { value: 'all', label: 'All Departments' },
                            ...depts.map(d => ({ value: d.id, label: d.name })),
                        ]);
                    }
                }
                deptsLoaded.current = true;
            }

            // Fetch trends and forecast with independent error handling for forecast
            const [forecast, diseases] = await Promise.all([
                hospitalService.getAnalyticsForecast(timeRange).catch(err => {
                    console.warn('[AiAnalytics] Forecast unavailable:', err.message);
                    return {
                        forecast: [],
                        status: [],
                        metadata: { is_learning: true, message: err.message, confidence: 0 }
                    };
                }),
                hospitalService.getAnalyticsDiseaseDistribution(timeRange, selectedDept),
            ]);

            setLoadForecastData(Array.isArray(forecast?.forecast) ? forecast.forecast : []);
            setForecastMetadata(forecast?.metadata ?? null);
            setDepartmentStatus(Array.isArray(forecast?.status) ? forecast.status : []);
            setDiseaseData(Array.isArray(diseases?.distribution) ? diseases.distribution : []);
            setDiseaseMetadata(diseases?.metadata ?? null);

        } catch (err) {
            console.error('[AiAnalytics] fetch failed:', err);
            setError('Failed to load analytics. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [timeRange, selectedDept]);

    useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

    const user = getUser();
    const hospitalName = user?.hospital_name || 'your hospital';
    const isLearning = !!forecastMetadata?.is_learning;
    const confidencePct = forecastMetadata?.confidence ?? 0;
    const hasForecastData = loadForecastData.length > 0;
    const hasDiseaseData = diseaseData.length > 0;
    const diseaseInsuff = !!diseaseMetadata?.insufficient_data;
    // Has some data but ML not yet fully active
    const diseaseInML = !diseaseInsuff && diseaseMetadata?.mode !== 'ml_context_aware' && (diseaseMetadata?.ml_progress_pct ?? 100) < 100;
    const lineDepts = deptOptions.filter(d => d.value !== 'all');

    const globalProgressPct = Math.min(100, Math.round(
        ((forecastMetadata?.total_visits_analyzed ?? 0) / (forecastMetadata?.min_visits_required ?? 30)) * 100
    ));

    // -----------------------------------------------------------------------
    return (
        <div className={`p-8 space-y-8 transition-opacity duration-300 ${loading ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={fetchAnalytics} className="underline font-medium ml-4">Retry</button>
                </div>
            )}

            {/* ── Global info / status banner ── */}
            <div className={`border rounded-xl p-4 flex items-center gap-4 ${isLearning ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'}`}>
                <Brain className={`w-5 h-5 shrink-0 ${isLearning ? 'text-amber-500' : 'text-pink-500'}`} />
                <div className="flex-1 min-w-0">
                    <h4 className={`font-bold text-sm flex items-center gap-2 ${isLearning ? 'text-amber-900' : 'text-blue-900'}`}>
                        <span className={`w-2 h-2 rounded-full shrink-0 ${isLearning ? 'bg-amber-500' : 'bg-pink-500'}`} />
                        {isLearning
                            ? 'AI is in Learning Mode — Gathering data for robust forecasting.'
                            : 'AI analytics support hospital planning and preventive care.'}
                    </h4>
                    <p className={`text-xs ml-4 mt-0.5 ${isLearning ? 'text-amber-700' : 'text-blue-700'}`}>
                        {isLearning
                            ? `${forecastMetadata?.total_visits_analyzed ?? 0} of ${forecastMetadata?.min_visits_required ?? 30} visit days recorded. Basic averages shown until AI is fully trained.`
                            : `AI Confidence: ${confidencePct}% — Using hospital-specific historical patterns to predict trends.`}
                    </p>
                    {isLearning && (
                        <div className="ml-4 mt-2 max-w-xs">
                            <ProgressBar pct={globalProgressPct} colorClass="bg-amber-400" trackClass="bg-amber-200" />
                        </div>
                    )}
                </div>
                {/* Right-side badge */}
                {isLearning ? (
                    <div className="shrink-0 text-right">
                        <p className="text-xl font-bold text-amber-700">{globalProgressPct}%</p>
                        <p className="text-[10px] text-amber-500">AI readiness</p>
                    </div>
                ) : (
                    <div className="shrink-0 text-right">
                        <p className="text-xl font-bold text-blue-700">{confidencePct}%</p>
                        <p className="text-[10px] text-blue-500">AI confidence</p>
                    </div>
                )}
            </div>

            {/* ════════════════════════════════════════════════════════════
                Chart 1 — Department Load Forecast
            ════════════════════════════════════════════════════════════ */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 space-y-6">

                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                                Department Load Forecast
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">Predicted patient load for the next 7–30 days</p>
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded border text-xs font-medium ${isLearning ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                            <Brain className="w-3 h-3" />
                            {isLearning ? 'Learning Mode' : `AI Prediction (${confidencePct}% Confidence)`}
                        </div>
                    </div>

                    {/* Expanded learning banner inside the card */}
                    {isLearning && <LearningBanner forecastMetadata={forecastMetadata} />}

                    {/* Line chart */}
                    <ChartWrapper height={320}>
                        {!hasForecastData ? (
                            <ChartEmpty icon={TrendingUp} message="No forecast data available yet." sub="Data will appear once the system has enough visit history." />
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={loadForecastData} margin={{ top: 8, right: 16, left: 0, bottom: 24 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={{ stroke: '#9CA3AF' }} tickLine={{ stroke: '#9CA3AF' }}
                                        tick={{ fill: '#6B7280', fontSize: 12 }} dy={10}
                                        label={{ value: 'Date', position: 'insideBottom', offset: -10, fill: '#6B7280', fontSize: 12 }}
                                    />
                                    <YAxis
                                        axisLine={{ stroke: '#9CA3AF' }} tickLine={{ stroke: '#9CA3AF' }}
                                        tick={{ fill: '#6B7280', fontSize: 12 }} width={60}
                                        label={{ value: 'Expected Visits', angle: -90, position: 'insideLeft', offset: 10, fill: '#6B7280', fontSize: 12 }}
                                    />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: 'none' }} />
                                    {lineDepts.map((dept, idx) => (
                                        <Line
                                            key={dept.value}
                                            type="monotone"
                                            dataKey={dept.value}
                                            stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                                            strokeWidth={2}
                                            strokeDasharray={isLearning ? '5 3' : undefined}
                                            dot={{ r: 4 }}
                                            activeDot={{ r: 6 }}
                                            name={dept.label}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </ChartWrapper>

                    {/* Legend */}
                    {hasForecastData && lineDepts.length > 0 && (
                        <div className="flex flex-wrap gap-4 justify-center">
                            {lineDepts.map((dept, idx) => {
                                const deptInfo = forecastMetadata?.dept_progress?.[String(dept.value)];
                                const deptReady = deptInfo
                                    ? deptInfo.visit_days >= (forecastMetadata?.min_dept_days_required ?? 21)
                                    : true;
                                return (
                                    <span key={dept.value} className="flex items-center gap-1.5 text-xs text-gray-600">
                                        <span className="inline-block w-3 h-3 rounded-full" style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }} />
                                        {dept.label}
                                        {!deptReady && <span className="text-amber-500 text-[10px]">(learning)</span>}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Department status grid */}
                {departmentStatus.length > 0 && (
                    <div className="p-6 bg-gray-50 border-t border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-900 mb-4">Department Load Status</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {departmentStatus.map((dept, i) => (
                                <div key={i} className="flex items-start gap-2">
                                    <span className="text-lg leading-none mt-0.5">{dept.dot}</span>
                                    <div>
                                        <p className="text-xs font-medium text-gray-900">{dept.name}</p>
                                        <p className={`text-xs ${dept.color}`}>{dept.status} ({dept.percent}%)</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 space-y-1">
                            <p className="text-xs text-gray-600"><span className="font-bold text-gray-900">🟢 Normal:</span> &lt; 60% capacity</p>
                            <p className="text-xs text-gray-600"><span className="font-bold text-gray-900">🟡 Moderate:</span> 60–80% capacity</p>
                            <p className="text-xs text-gray-600"><span className="font-bold text-gray-900">🔴 High:</span> &gt; 80% capacity</p>
                        </div>
                    </div>
                )}

                <div className="px-4 py-3 bg-blue-50 border-t border-blue-100 flex items-center gap-2">
                    <Lock className="w-3 h-3 text-blue-700" />
                    <p className="text-xs text-blue-700">Prediction is based only on historical visit counts. No patient data used.</p>
                </div>
            </div>

            {/* ════════════════════════════════════════════════════════════
                Chart 2 — Disease Trend Distribution
            ════════════════════════════════════════════════════════════ */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">

                    {/* Header + filters */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-purple-600" />
                                Disease Trend Distribution
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">Top diagnosis categories for the selected time period</p>
                        </div>
                        <div className="flex gap-2 items-center">
                            {loading && <Loader className="w-4 h-4 text-blue-600 animate-spin" />}
                            <div className="w-40">
                                <Select options={timeOptions} value={timeRange} onChange={setTimeRange} placeholder="Time Range" />
                            </div>
                            <div className="w-48">
                                <Select options={deptOptions} value={selectedDept} onChange={setSelectedDept} placeholder="Department" />
                            </div>
                        </div>
                    </div>

                    {/* Live data summary strip — always visible regardless of ML state */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-purple-50 border border-purple-100 rounded-lg px-4 py-3">
                            <p className="text-xl font-bold text-purple-800">{diseaseMetadata?.total_records ?? 0}</p>
                            <p className="text-xs text-purple-600 mt-0.5">Total visits analysed</p>
                        </div>
                        <div className="bg-purple-50 border border-purple-100 rounded-lg px-4 py-3">
                            <p className="text-xl font-bold text-purple-800">{diseaseMetadata?.unique_diagnoses ?? 0}</p>
                            <p className="text-xs text-purple-600 mt-0.5">Unique diagnoses seen</p>
                        </div>
                        <div className="bg-purple-50 border border-purple-100 rounded-lg px-4 py-3">
                            <p className="text-xl font-bold text-purple-800 truncate" title={diseaseMetadata?.top_diagnosis ?? '—'}>
                                {diseaseMetadata?.top_diagnosis ?? '—'}
                            </p>
                            <p className="text-xs text-purple-600 mt-0.5">Top diagnosis</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

                        {/* Pie chart */}
                        <div className="flex flex-col items-center">
                            <ChartWrapper height={256}>
                                {diseaseInsuff ? (
                                    /* Full overlay — not enough data at all */
                                    <DiseaseProgressOverlay diseaseMetadata={diseaseMetadata} />
                                ) : diseaseInML ? (
                                    /* Chart visible but ML still training — show chart + inline progress */
                                    <>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={diseaseData} innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="value"
                                                    isAnimationActive animationBegin={0} animationDuration={1200}
                                                    label={({ name, value }) => `${name}: ${value}%`} labelLine={false}>
                                                    {diseaseData.map((entry, i) => (
                                                        <Cell key={`cell-${i}`} fill={entry.color} stroke="white" strokeWidth={2} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    formatter={v => [`${v}%`, 'Share']} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        {/* Inline progress strip below chart */}
                                        <div className="w-full mt-3 space-y-1 px-2">
                                            <div className="flex justify-between text-xs text-purple-700">
                                                <span>ML model progress</span>
                                                <span className="font-semibold">
                                                    {diseaseMetadata?.total_records} / {diseaseMetadata?.min_records_for_ml} records
                                                </span>
                                            </div>
                                            <ProgressBar pct={diseaseMetadata?.ml_progress_pct ?? 0} colorClass="bg-purple-400" trackClass="bg-purple-100" />
                                        </div>
                                    </>
                                ) : hasDiseaseData ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={diseaseData} innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="value"
                                                isAnimationActive animationBegin={0} animationDuration={1200}
                                                label={({ name, value }) => `${name}: ${value}%`} labelLine={false}>
                                                {diseaseData.map((entry, i) => (
                                                    <Cell key={`cell-${i}`} fill={entry.color} stroke="white" strokeWidth={2} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                formatter={v => [`${v}%`, 'Share']} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <ChartEmpty icon={Activity} message="No disease data for this selection." />
                                )}
                            </ChartWrapper>

                            {/* Chart caption + mode badge */}
                            <div className="text-center mt-2">
                                <h4 className="font-semibold text-gray-900 text-sm">Top Conditions</h4>
                                <p className="text-xs text-gray-500">
                                    {timeOptions.find(o => o.value === timeRange)?.label || 'Selected Period'}
                                </p>
                                {diseaseMetadata?.mode && (
                                    <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${diseaseMetadata.mode === 'ml_context_aware'
                                        ? 'bg-green-100 text-green-700'
                                        : diseaseMetadata.mode === 'historical_counts'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        {diseaseMetadata.mode === 'ml_context_aware' ? '✦ AI context-aware' :
                                            diseaseMetadata.mode === 'historical_counts' ? '⊞ Historical counts' : 'No data'}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Legend list */}
                        <div>
                            {hasDiseaseData ? (
                                <DiseaseLegend data={diseaseData} />
                            ) : (
                                <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-100">
                                    <p className="text-sm text-gray-500">No data to display</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-purple-50 border-t border-purple-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Lock className="w-3 h-3 text-purple-700" />
                        <p className="text-xs text-purple-700">
                            Strict Data Isolation: Only {hospitalName}&apos;s records are used.
                        </p>
                    </div>
                    <div className="relative flex items-center gap-2 group cursor-help">
                        <Activity className="w-3 h-3 text-purple-700" />
                        <p className="text-xs text-purple-700 underline decoration-dotted">How are visits counted?</p>
                        <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                            <p className="font-bold mb-1">Workload Counting Model:</p>
                            <ul className="list-disc ml-3 space-y-1">
                                <li>Every patient consultation counts as one visit unit.</li>
                                <li>Multiple visits by the same patient for different diagnoses contribute separately to throughput analytics.</li>
                                <li>AI learns from high-volume patterns to predict future load.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}