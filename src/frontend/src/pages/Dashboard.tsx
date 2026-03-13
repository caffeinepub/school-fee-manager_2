import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Loader2, TrendingDown, TrendingUp, Users, Wallet } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Payment } from "../backend";
import { useActor } from "../hooks/useActor";
import { MONTH_NAMES, formatDate, formatINR } from "../lib/formatters";

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
  variant = "default",
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  loading?: boolean;
  variant?: "default" | "success" | "danger";
}) {
  return (
    <Card className="border-border shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            {loading ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <p
                className={`text-2xl font-bold ${
                  variant === "success"
                    ? "text-emerald-600"
                    : variant === "danger"
                      ? "text-destructive"
                      : "text-foreground"
                }`}
              >
                {value}
              </p>
            )}
          </div>
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              variant === "success"
                ? "bg-emerald-100"
                : variant === "danger"
                  ? "bg-destructive/10"
                  : "bg-primary/10"
            }`}
          >
            <Icon
              className={`w-5 h-5 ${
                variant === "success"
                  ? "text-emerald-600"
                  : variant === "danger"
                    ? "text-destructive"
                    : "text-primary"
              }`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { actor, isFetching } = useActor();

  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ["students"],
    queryFn: () => actor!.getAllStudents(),
    enabled: !!actor && !isFetching,
  });

  const { data: totalFees = 0, isLoading: feesLoading } = useQuery({
    queryKey: ["totalFees"],
    queryFn: () => actor!.getTotalFeesCollected(),
    enabled: !!actor && !isFetching,
  });

  const { data: totalExpenses = 0, isLoading: expensesLoading } = useQuery({
    queryKey: ["totalExpenses"],
    queryFn: () => actor!.getTotalExpenses(),
    enabled: !!actor && !isFetching,
  });

  const { data: allPayments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ["allPayments"],
    queryFn: () => actor!.getAllPayments(),
    enabled: !!actor && !isFetching,
  });

  const { data: allExpenses = [] } = useQuery({
    queryKey: ["allExpenses"],
    queryFn: () => actor!.getAllExpenses(),
    enabled: !!actor && !isFetching,
  });

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const { data: monthFees = 0, isLoading: monthFeesLoading } = useQuery({
    queryKey: ["monthFees", currentMonth, currentYear],
    queryFn: () =>
      actor!.getFeesByMonthYear(BigInt(currentMonth), BigInt(currentYear)),
    enabled: !!actor && !isFetching,
  });

  const { data: monthExpenses = 0, isLoading: monthExpLoading } = useQuery({
    queryKey: ["monthExpenses", currentMonth, currentYear],
    queryFn: () =>
      actor!.getExpensesByMonthYearTotal(
        BigInt(currentMonth),
        BigInt(currentYear),
      ),
    enabled: !!actor && !isFetching,
  });

  const netBalance = totalFees - totalExpenses;
  const recentPayments = [...allPayments]
    .sort((a, b) => Number(b.paidAt) - Number(a.paidAt))
    .slice(0, 5);

  // Build last 6 months chart data
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() - (5 - i));
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const fees = allPayments
      .filter((p: Payment) => Number(p.month) === m && Number(p.year) === y)
      .reduce((sum: number, p: Payment) => sum + p.amount, 0);
    const expenses = allExpenses
      .filter((e) => {
        const [ey, em] = e.date.split("-").map(Number);
        return em === m && ey === y;
      })
      .reduce((sum, e) => sum + e.amount, 0);
    return { month: MONTH_NAMES[m - 1].slice(0, 3), fees, expenses };
  });

  const studentMap = new Map(students.map((s) => [String(s.id), s.name]));
  const loading =
    studentsLoading || feesLoading || expensesLoading || paymentsLoading;

  return (
    <div className="p-6 space-y-6" data-ocid="dashboard.section">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Welcome back — here's your school financial overview
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={String(students.length)}
          icon={Users}
          loading={loading}
        />
        <StatCard
          title="Total Fees Collected"
          value={formatINR(totalFees)}
          icon={TrendingUp}
          loading={loading}
          variant="success"
        />
        <StatCard
          title="Total Expenses"
          value={formatINR(totalExpenses)}
          icon={TrendingDown}
          loading={loading}
          variant="danger"
        />
        <StatCard
          title="Net Balance"
          value={formatINR(netBalance)}
          icon={Wallet}
          loading={loading}
          variant={netBalance >= 0 ? "success" : "danger"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2 border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Fees vs Expenses — Last 6 Months
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.88 0.02 255)"
                  />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip formatter={(value: number) => formatINR(value)} />
                  <Legend />
                  <Bar
                    dataKey="fees"
                    fill="oklch(0.46 0.19 275)"
                    name="Fees"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="expenses"
                    fill="oklch(0.74 0.17 72)"
                    name="Expenses"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Current month summary */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {MONTH_NAMES[currentMonth - 1]} {currentYear}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {monthFeesLoading || monthExpLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                  <p className="text-sm font-medium text-emerald-700">
                    Fees Collected
                  </p>
                  <p className="text-sm font-bold text-emerald-700">
                    {formatINR(monthFees)}
                  </p>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <p className="text-sm font-medium text-red-700">Expenses</p>
                  <p className="text-sm font-bold text-red-700">
                    {formatINR(monthExpenses)}
                  </p>
                </div>
                <div
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    monthFees - monthExpenses >= 0
                      ? "bg-primary/10"
                      : "bg-destructive/10"
                  }`}
                >
                  <p
                    className={`text-sm font-medium ${
                      monthFees - monthExpenses >= 0
                        ? "text-primary"
                        : "text-destructive"
                    }`}
                  >
                    {monthFees - monthExpenses >= 0 ? "Profit" : "Deficit"}
                  </p>
                  <p
                    className={`text-sm font-bold ${
                      monthFees - monthExpenses >= 0
                        ? "text-primary"
                        : "text-destructive"
                    }`}
                  >
                    {formatINR(Math.abs(monthFees - monthExpenses))}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent payments */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : recentPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No payments recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                      Receipt
                    </th>
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                      Student
                    </th>
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                      Amount
                    </th>
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                      Type
                    </th>
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((p) => (
                    <tr
                      key={String(p.id)}
                      className="border-b border-border/50 hover:bg-muted/30"
                    >
                      <td className="py-2.5 px-2 font-mono text-xs text-muted-foreground">
                        {p.receiptNumber}
                      </td>
                      <td className="py-2.5 px-2 font-medium">
                        {studentMap.get(String(p.studentId)) ?? "Unknown"}
                      </td>
                      <td className="py-2.5 px-2 font-semibold text-emerald-600">
                        {formatINR(p.amount)}
                      </td>
                      <td className="py-2.5 px-2">
                        <Badge variant="secondary" className="text-xs">
                          {p.paymentType}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-2 text-muted-foreground">
                        {formatDate(p.paidAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground pb-4">
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          Built with love using caffeine.ai
        </a>
      </p>
    </div>
  );
}
