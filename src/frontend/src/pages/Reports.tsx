import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { FileText, Printer } from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useActor } from "../hooks/useActor";
import { EXPENSE_CATEGORIES, MONTH_NAMES, formatINR } from "../lib/formatters";

const now = new Date();
const CURRENT_YEAR = now.getFullYear();
const CURRENT_MONTH = now.getMonth() + 1;

const CHART_COLORS = [
  "oklch(0.46 0.19 275)",
  "oklch(0.74 0.17 72)",
  "oklch(0.54 0.16 145)",
  "oklch(0.62 0.18 310)",
  "oklch(0.58 0.18 25)",
  "oklch(0.55 0.14 185)",
];

function MonthYearPicker({
  month,
  year,
  onMonth,
  onYear,
}: {
  month: string;
  year: string;
  onMonth: (v: string) => void;
  onYear: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <select
        className="h-8 rounded-md border border-input bg-background px-2 text-sm"
        value={month}
        onChange={(e) => onMonth(e.target.value)}
      >
        {MONTH_NAMES.map((m, i) => (
          <option key={m} value={i + 1}>
            {m}
          </option>
        ))}
      </select>
      <select
        className="h-8 rounded-md border border-input bg-background px-2 text-sm"
        value={year}
        onChange={(e) => onYear(e.target.value)}
      >
        {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}

function FeeDueReport() {
  const { actor, isFetching } = useActor();
  const [month, setMonth] = useState(String(CURRENT_MONTH));
  const [year, setYear] = useState(String(CURRENT_YEAR));

  const { data: pending = [], isLoading } = useQuery({
    queryKey: ["pendingFees", month, year],
    queryFn: () => actor!.getPendingFeeStudents(BigInt(month), BigInt(year)),
    enabled: !!actor && !isFetching,
  });

  const totalPending = pending.reduce((sum, s) => sum + s.monthlyFee, 0);

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <CardTitle className="text-base flex-1">Fee Due Report</CardTitle>
          <div className="flex items-center gap-2">
            <MonthYearPicker
              month={month}
              year={year}
              onMonth={setMonth}
              onYear={setYear}
            />
            <Button
              size="sm"
              variant="outline"
              className="gap-2 no-print"
              data-ocid="reports.feedue.print.button"
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4" />
              Print
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : pending.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            ✅ No pending fees for {MONTH_NAMES[Number(month) - 1]} {year}!
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold">
                      Roll No
                    </th>
                    <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold">
                      Student Name
                    </th>
                    <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold">
                      Class
                    </th>
                    <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold">
                      Parent Name
                    </th>
                    <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold">
                      Phone
                    </th>
                    <th className="text-right px-4 py-2.5 text-muted-foreground font-semibold">
                      Fee Due
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((s, i) => (
                    <tr
                      key={String(s.id)}
                      data-ocid={`reports.feedue.item.${i + 1}`}
                      className="border-b border-border/50 hover:bg-muted/20"
                    >
                      <td className="px-4 py-2.5">
                        <Badge variant="outline" className="font-mono">
                          {s.rollNumber}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 font-medium">{s.name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {s.className}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {s.parentName}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {s.phone}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-destructive">
                        {formatINR(s.monthlyFee)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex justify-end">
              <div className="bg-destructive/10 rounded-lg px-4 py-2 text-sm">
                <span className="text-muted-foreground">Total Pending: </span>
                <span className="font-bold text-destructive">
                  {formatINR(totalPending)}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function IncomeExpenseReport() {
  const { actor, isFetching } = useActor();
  const [month, setMonth] = useState(String(CURRENT_MONTH));
  const [year, setYear] = useState(String(CURRENT_YEAR));

  const { data: fees = 0, isLoading: feesLoading } = useQuery({
    queryKey: ["monthFees", month, year],
    queryFn: () => actor!.getFeesByMonthYear(BigInt(month), BigInt(year)),
    enabled: !!actor && !isFetching,
  });

  const { data: expTotal = 0, isLoading: expLoading } = useQuery({
    queryKey: ["monthExpenses", month, year],
    queryFn: () =>
      actor!.getExpensesByMonthYearTotal(BigInt(month), BigInt(year)),
    enabled: !!actor && !isFetching,
  });

  const net = fees - expTotal;
  const isLoading = feesLoading || expLoading;

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <CardTitle className="text-base flex-1">
            Income & Expense Report
          </CardTitle>
          <div className="flex items-center gap-2">
            <MonthYearPicker
              month={month}
              year={year}
              onMonth={setMonth}
              onYear={setYear}
            />
            <Button
              size="sm"
              variant="outline"
              className="gap-2 no-print"
              data-ocid="reports.income.print.button"
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4" />
              Print
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-3 max-w-sm">
            <div className="flex justify-between items-center p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div>
                <p className="text-sm text-emerald-700 font-medium">
                  Fees Collected
                </p>
                <p className="text-xs text-emerald-600">
                  {MONTH_NAMES[Number(month) - 1]} {year}
                </p>
              </div>
              <p className="text-xl font-bold text-emerald-700">
                {formatINR(fees)}
              </p>
            </div>
            <div className="flex justify-between items-center p-4 bg-red-50 border border-red-200 rounded-lg">
              <div>
                <p className="text-sm text-red-700 font-medium">
                  Total Expenses
                </p>
                <p className="text-xs text-red-600">
                  {MONTH_NAMES[Number(month) - 1]} {year}
                </p>
              </div>
              <p className="text-xl font-bold text-red-700">
                {formatINR(expTotal)}
              </p>
            </div>
            <div
              className={`flex justify-between items-center p-4 rounded-lg border ${net >= 0 ? "bg-primary/10 border-primary/30" : "bg-destructive/10 border-destructive/30"}`}
            >
              <p
                className={`text-sm font-bold ${net >= 0 ? "text-primary" : "text-destructive"}`}
              >
                {net >= 0 ? "Net Profit" : "Net Deficit"}
              </p>
              <p
                className={`text-xl font-bold ${net >= 0 ? "text-primary" : "text-destructive"}`}
              >
                {formatINR(Math.abs(net))}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CategoryReport() {
  const { actor, isFetching } = useActor();
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(String(CURRENT_YEAR));

  const { data: allExpenses = [], isLoading } = useQuery({
    queryKey: ["allExpenses"],
    queryFn: () => actor!.getAllExpenses(),
    enabled: !!actor && !isFetching,
  });

  let filtered = allExpenses;
  if (month)
    filtered = filtered.filter((e) => {
      const [, em] = e.date.split("-").map(Number);
      return em === Number(month);
    });
  if (year)
    filtered = filtered.filter((e) => {
      const [ey] = e.date.split("-").map(Number);
      return ey === Number(year);
    });

  const categoryTotals = EXPENSE_CATEGORIES.map((cat) => ({
    name: cat,
    value: filtered
      .filter((e) => e.category === cat)
      .reduce((sum, e) => sum + e.amount, 0),
  })).filter((c) => c.value > 0);

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <CardTitle className="text-base flex-1">
            Expense by Category
          </CardTitle>
          <div className="flex items-center gap-2">
            <select
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              <option value="">All Months</option>
              {MONTH_NAMES.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              <option value="">All Years</option>
              {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : categoryTotals.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-3">
            <FileText className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">
              No expense data for selected period
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryTotals}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {categoryTotals.map((entry, i) => (
                      <Cell
                        key={entry.name}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatINR(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryTotals}
                  margin={{ top: 5, right: 10, bottom: 20, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    angle={-30}
                    textAnchor="end"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip formatter={(v: number) => formatINR(v)} />
                  <Bar dataKey="value" name="Amount" radius={[4, 4, 0, 0]}>
                    {categoryTotals.map((entry, i) => (
                      <Cell
                        key={entry.name}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Reports() {
  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Financial reports and analytics
        </p>
      </div>
      <Tabs defaultValue="feedue">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="feedue" data-ocid="reports.feedue.tab">
            Fee Due Report
          </TabsTrigger>
          <TabsTrigger value="income" data-ocid="reports.income.tab">
            Income & Expense
          </TabsTrigger>
          <TabsTrigger value="category" data-ocid="reports.category.tab">
            Category Report
          </TabsTrigger>
        </TabsList>
        <TabsContent value="feedue" className="mt-4">
          <FeeDueReport />
        </TabsContent>
        <TabsContent value="income" className="mt-4">
          <IncomeExpenseReport />
        </TabsContent>
        <TabsContent value="category" className="mt-4">
          <CategoryReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
