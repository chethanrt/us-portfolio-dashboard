import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { format, parseISO } from "date-fns";
import { History } from "lucide-react";
import {
  ALL_FILTER,
  DataTable,
  EmptyState,
  FilterBar,
  FilterSelect,
  LoadingSkeleton,
  PageHeader,
  SearchBar,
} from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { auditLogService } from "@/services";
import type { AuditLogEntry } from "@/types";

const POLL_INTERVAL_MS = 5000;

const EVENT_LABELS: Record<AuditLogEntry["eventType"], string> = {
  login: "Login",
  logout: "Logout",
  create: "Create",
  update: "Update",
  delete: "Delete",
};

const EVENT_VARIANTS: Record<AuditLogEntry["eventType"], "default" | "secondary" | "destructive" | "outline"> = {
  login: "default",
  logout: "outline",
  create: "default",
  update: "secondary",
  delete: "destructive",
};

export default function AuditLog() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState(ALL_FILTER);
  const [moduleFilter, setModuleFilter] = useState(ALL_FILTER);

  // Polled, not pushed — a few seconds of staleness is fine for this scale
  // and avoids adding a WebSocket/SSE layer nothing else in this app uses.
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      auditLogService
        .getRecent(200)
        .then((rows) => {
          if (cancelled) return;
          setEntries(rows);
          setError(null);
        })
        .catch(() => {
          if (!cancelled) setError("Unable to load the audit log.");
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    };
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const moduleOptions = useMemo(() => [...new Set(entries.map((e) => e.module))].sort(), [entries]);

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    return entries.filter((entry) => {
      if (eventTypeFilter !== ALL_FILTER && entry.eventType !== eventTypeFilter) return false;
      if (moduleFilter !== ALL_FILTER && entry.module !== moduleFilter) return false;
      if (!query) return true;
      return [entry.actorUsername, entry.module, entry.summary].some((field) =>
        field.toLowerCase().includes(query)
      );
    });
  }, [entries, search, eventTypeFilter, moduleFilter]);

  const columns = useMemo<ColumnDef<AuditLogEntry>[]>(
    () => [
      {
        accessorKey: "timestamp",
        header: "When",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm">
            {format(parseISO(row.original.timestamp), "d MMM yyyy, HH:mm:ss")}
          </span>
        ),
      },
      {
        accessorKey: "actorUsername",
        header: "Account",
        cell: ({ row }) => <span className="font-medium">{row.original.actorUsername}</span>,
      },
      {
        accessorKey: "eventType",
        header: "Event",
        cell: ({ row }) => (
          <Badge variant={EVENT_VARIANTS[row.original.eventType]}>{EVENT_LABELS[row.original.eventType]}</Badge>
        ),
      },
      { accessorKey: "module", header: "Module" },
      {
        accessorKey: "summary",
        header: "Details",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.summary || "—"}</span>,
      },
    ],
    []
  );

  const clearFilters = () => {
    setSearch("");
    setEventTypeFilter(ALL_FILTER);
    setModuleFilter(ALL_FILTER);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Audit Log" description="Login/logout and edit history across the app" />
        <LoadingSkeleton variant="table" count={8} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Audit Log" />
        <EmptyState icon={History} title="Unable to load the audit log" description={error} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description={
          <span className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-green-500" />
            </span>
            Live · {entries.length} recent events, refreshed every {POLL_INTERVAL_MS / 1000}s
          </span>
        }
      />

      <FilterBar>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by account, module, details…"
          className="w-full sm:w-72"
        />
        <FilterSelect
          placeholder="Event"
          options={Object.keys(EVENT_LABELS)}
          value={eventTypeFilter}
          onChange={setEventTypeFilter}
          className="sm:w-40"
        />
        <FilterSelect
          placeholder="Module"
          options={moduleOptions}
          value={moduleFilter}
          onChange={setModuleFilter}
          className="sm:w-44"
        />
      </FilterBar>

      {filteredEntries.length === 0 ? (
        <EmptyState
          icon={History}
          title="No Events to Show"
          description="No audit events match the current search and filters."
          actionLabel="Clear Filters"
          onAction={clearFilters}
        />
      ) : (
        <DataTable columns={columns} data={filteredEntries} pageSize={20} />
      )}
    </div>
  );
}
