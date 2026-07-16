import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { BarChart3, Clock, Download, FileSpreadsheet, FileText, Play, Users, Zap } from "lucide-react";
import { toast } from "sonner";
import {
  ALL_FILTER,
  DataTable,
  EmptyState,
  FilterBar,
  FilterSelect,
  KPICard,
  LoadingSkeleton,
  PageHeader,
} from "@/components/common";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useReportsData } from "@/hooks/useReportsData";
import { isOwnDataRole } from "@/utils/permissions";
import {
  computeReport,
  REPORT_TYPES,
  reportToCSV,
  scopeSourcesToEmployee,
} from "@/utils/reportDefinitions";
import type { ReportResult, ReportType } from "@/utils/reportDefinitions";

const DATE_RANGES = ["Last 7 days", "Last 30 days", "Last 90 days"];
const METRIC_ICONS = [BarChart3, Clock, Users, Zap];

export default function Reports() {
  const { sources, isLoading, error } = useReportsData();
  const { currentUser, role } = useAuth();
  const ownDataOnly = isOwnDataRole(role);

  const [reportType, setReportType] = useState<string>("Weekly Summary");
  const [dateFilter, setDateFilter] = useState(ALL_FILTER);
  const [projectFilter, setProjectFilter] = useState(ALL_FILTER);
  const [result, setResult] = useState<{ type: ReportType; data: ReportResult } | null>(null);

  const columns = useMemo<ColumnDef<Record<string, string | number>>[]>(
    () =>
      result
        ? result.data.columns.map((column) => ({
            accessorKey: column.key,
            header: column.label,
          }))
        : [],
    [result]
  );

  const generate = () => {
    if (!sources) return;
    const rangeDays = dateFilter === ALL_FILTER ? 0 : Number(dateFilter.match(/\d+/)?.[0] ?? 0);
    const type = reportType as ReportType;
    // Own-data roles (below Tech Lead) report only on their own records.
    const scopedSources =
      ownDataOnly && currentUser ? scopeSourcesToEmployee(sources, currentUser.id) : sources;
    setResult({ type, data: computeReport(type, scopedSources, { rangeDays, projectId: projectFilter }) });
  };

  const exportCSV = () => {
    if (!result) return;
    const csv = reportToCSV(result.data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${result.type.toLowerCase().replace(/ +/g, "-")}-report.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success("Report exported as CSV.");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Reports" description="Weekly, monthly and team-level AI adoption reports" />
        <LoadingSkeleton variant="page" />
      </div>
    );
  }

  if (error || !sources) {
    return (
      <div className="space-y-6">
        <PageHeader title="Reports" />
        <EmptyState icon={BarChart3} title="Unable to load report data" description={error ?? "Please try again."} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description={ownDataOnly ? "Generate reports on your own data" : "Generate insights from portfolio data"}
      />

      {/* Report filters */}
      <FilterBar className="rounded-xl border bg-card p-4">
        <FilterSelect
          placeholder="Report"
          options={[...REPORT_TYPES]}
          value={reportType}
          onChange={setReportType}
          className="sm:w-52"
        />
        <FilterSelect placeholder="Dates" options={DATE_RANGES} value={dateFilter} onChange={setDateFilter} className="sm:w-40" />
        <FilterSelect
          placeholder="Projects"
          options={sources.projects.map((p) => ({ value: p.id, label: p.name })).map((o) => o.label)}
          value={
            projectFilter === ALL_FILTER
              ? ALL_FILTER
              : sources.projects.find((p) => p.id === projectFilter)?.name ?? ALL_FILTER
          }
          onChange={(name) =>
            setProjectFilter(
              name === ALL_FILTER ? ALL_FILTER : sources.projects.find((p) => p.name === name)?.id ?? ALL_FILTER
            )
          }
          className="sm:w-48"
        />
        <Button onClick={generate}>
          <Play /> Generate Report
        </Button>
      </FilterBar>

      {!result ? (
        <EmptyState
          icon={BarChart3}
          title="No Report Generated"
          description="Choose a report type, date range and project, then click Generate Report."
          actionLabel="Generate Report"
          onAction={generate}
        />
      ) : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {result.data.metrics.map((metric, index) => (
              <KPICard
                key={metric.label}
                title={metric.label}
                value={metric.value}
                icon={METRIC_ICONS[index % METRIC_ICONS.length]}
              />
            ))}
          </div>

          {/* Export actions */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">
              {result.type} <span className="text-sm font-normal text-muted-foreground">({result.data.rows.length} rows)</span>
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download /> CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => toast.info("Excel export is planned for a future release.")}>
                <FileSpreadsheet /> Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => toast.info("PDF export is planned for a future release.")}>
                <FileText /> PDF
              </Button>
            </div>
          </div>

          {result.data.rows.length === 0 ? (
            <EmptyState icon={BarChart3} title="No Data" description="No records match the selected filters." />
          ) : (
            <DataTable columns={columns} data={result.data.rows} pageSize={10} />
          )}
        </div>
      )}
    </div>
  );
}
