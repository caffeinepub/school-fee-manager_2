import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IndianRupee, Loader2, Printer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Payment, Student } from "../backend";
import { useActor } from "../hooks/useActor";
import { MONTH_NAMES, formatDate, formatINR } from "../lib/formatters";

const PAYMENT_TYPES = ["Monthly", "Quarterly", "Yearly"];
const now = new Date();
const CURRENT_YEAR = now.getFullYear();
const CURRENT_MONTH = now.getMonth() + 1;

function ReceiptView({
  payment,
  student,
}: { payment: Payment; student: Student | undefined }) {
  return (
    <div className="print-receipt space-y-5 font-sans">
      <div className="text-center border-b pb-4">
        <h2 className="text-2xl font-bold text-foreground">
          Vidya Mandir School
        </h2>
        <p className="text-muted-foreground text-sm">Fee Payment Receipt</p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground">Receipt No.</p>
          <p className="font-mono font-bold">{payment.receiptNumber}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Date</p>
          <p className="font-semibold">{formatDate(payment.paidAt)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Student Name</p>
          <p className="font-semibold">{student?.name ?? "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Class</p>
          <p className="font-semibold">{student?.className ?? "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Roll No.</p>
          <p className="font-semibold">{student?.rollNumber ?? "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Parent Name</p>
          <p className="font-semibold">{student?.parentName ?? "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">For Month/Year</p>
          <p className="font-semibold">
            {MONTH_NAMES[Number(payment.month) - 1]} {String(payment.year)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Payment Type</p>
          <p className="font-semibold">{payment.paymentType}</p>
        </div>
      </div>
      {payment.note && (
        <div className="text-sm">
          <p className="text-muted-foreground">Note</p>
          <p>{payment.note}</p>
        </div>
      )}
      <div className="border-t pt-4">
        <div className="flex justify-between items-center">
          <p className="text-lg font-bold text-foreground">Amount Paid</p>
          <p className="text-2xl font-bold text-emerald-600">
            {formatINR(payment.amount)}
          </p>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground border-t pt-3">
        This is a computer-generated receipt. No signature required.
      </p>
    </div>
  );
}

function CollectFeeTab({ students }: { students: Student[] }) {
  const qc = useQueryClient();
  const { actor } = useActor();
  const [studentId, setStudentId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState("Monthly");
  const [month, setMonth] = useState(String(CURRENT_MONTH));
  const [year, setYear] = useState(String(CURRENT_YEAR));
  const [note, setNote] = useState("");
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const rcp = `RCP-${Date.now()}`;
      const id = await actor!.addPayment(
        BigInt(studentId),
        Number(amount),
        paymentType,
        BigInt(month),
        BigInt(year),
        rcp,
        note,
      );
      const payments = await actor!.getAllPayments();
      return payments.find((p) => p.id === id) ?? null;
    },
    onSuccess: (payment) => {
      qc.invalidateQueries({ queryKey: ["allPayments"] });
      qc.invalidateQueries({ queryKey: ["totalFees"] });
      toast.success("Payment recorded successfully");
      if (payment) {
        setReceiptPayment(payment);
        setReceiptOpen(true);
      }
      setStudentId("");
      setAmount("");
      setNote("");
    },
    onError: () => toast.error("Failed to record payment"),
  });

  const selectedStudent = students.find((s) => String(s.id) === studentId);

  const handleSubmit = () => {
    if (!studentId || !amount || Number(amount) <= 0) {
      toast.error("Please select student and enter a valid amount");
      return;
    }
    mutation.mutate();
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Record Fee Payment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Select Student *</Label>
            <select
              data-ocid="fee.form.student.select"
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              value={studentId}
              onChange={(e) => {
                setStudentId(e.target.value);
                const s = students.find(
                  (st) => String(st.id) === e.target.value,
                );
                if (s) setAmount(String(s.monthlyFee));
              }}
            >
              <option value="">-- Select Student --</option>
              {students.map((s) => (
                <option key={String(s.id)} value={String(s.id)}>
                  {s.rollNumber} — {s.name} ({s.className})
                </option>
              ))}
            </select>
          </div>
          {selectedStudent && (
            <div className="sm:col-span-2 flex items-center gap-2 text-sm bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
              <IndianRupee className="w-4 h-4 text-primary" />
              <span>
                Monthly fee:{" "}
                <strong>{formatINR(selectedStudent.monthlyFee)}</strong>
              </span>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Amount (₹) *</Label>
            <Input
              data-ocid="fee.form.amount.input"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Payment Type *</Label>
            <select
              data-ocid="fee.form.type.select"
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
            >
              {PAYMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Month *</Label>
            <select
              data-ocid="fee.form.month.select"
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              {MONTH_NAMES.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Year *</Label>
            <select
              data-ocid="fee.form.year.select"
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Note (optional)</Label>
            <Input
              placeholder="Any additional notes..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        <Button
          data-ocid="fee.form.submit.button"
          onClick={handleSubmit}
          disabled={mutation.isPending}
          className="w-full"
        >
          {mutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Record Payment
        </Button>
      </CardContent>
      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="max-w-md" data-ocid="receipt.dialog">
          <DialogHeader>
            <DialogTitle>Payment Receipt</DialogTitle>
          </DialogHeader>
          {receiptPayment && (
            <ReceiptView
              payment={receiptPayment}
              student={students.find((s) => s.id === receiptPayment.studentId)}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiptOpen(false)}>
              Close
            </Button>
            <Button
              data-ocid="receipt.print.button"
              onClick={() => window.print()}
              className="gap-2 no-print"
            >
              <Printer className="w-4 h-4" /> Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function PendingFeesTab() {
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
          <CardTitle className="text-base flex-1">
            Pending Fee Students
          </CardTitle>
          <div className="flex items-center gap-2">
            <select
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
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
              onChange={(e) => setYear(e.target.value)}
            >
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
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : pending.length === 0 ? (
          <div
            className="flex flex-col items-center py-10 gap-2"
            data-ocid="fees.pending.empty_state"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="font-medium text-muted-foreground">
              All fees collected for this month!
            </p>
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
                      Name
                    </th>
                    <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold">
                      Class
                    </th>
                    <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold">
                      Parent Phone
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
                      data-ocid={`fees.pending.item.${i + 1}`}
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
                        {s.phone}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-destructive">
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

function PaymentHistoryTab({ students }: { students: Student[] }) {
  const { actor, isFetching } = useActor();
  const [filterStudentId, setFilterStudentId] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState(String(CURRENT_YEAR));

  const { data: allPayments = [], isLoading } = useQuery({
    queryKey: ["allPayments"],
    queryFn: () => actor!.getAllPayments(),
    enabled: !!actor && !isFetching,
  });

  const studentMap = new Map(students.map((s) => [String(s.id), s]));

  let filtered = [...allPayments].sort(
    (a, b) => Number(b.paidAt) - Number(a.paidAt),
  );
  if (filterStudentId)
    filtered = filtered.filter((p) => String(p.studentId) === filterStudentId);
  if (filterMonth)
    filtered = filtered.filter((p) => Number(p.month) === Number(filterMonth));
  if (filterYear)
    filtered = filtered.filter((p) => Number(p.year) === Number(filterYear));

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <CardTitle className="text-base flex-1">Payment History</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              value={filterStudentId}
              onChange={(e) => setFilterStudentId(e.target.value)}
            >
              <option value="">All Students</option>
              {students.map((s) => (
                <option key={String(s.id)} value={String(s.id)}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
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
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            >
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
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            No payments found for the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold">
                    Receipt No
                  </th>
                  <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold">
                    Student
                  </th>
                  <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold">
                    Amount
                  </th>
                  <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold">
                    Type
                  </th>
                  <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold">
                    Month/Year
                  </th>
                  <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={String(p.id)}
                    className="border-b border-border/50 hover:bg-muted/20"
                  >
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                      {p.receiptNumber}
                    </td>
                    <td className="px-4 py-2.5 font-medium">
                      {studentMap.get(String(p.studentId))?.name ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-emerald-600">
                      {formatINR(p.amount)}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant="secondary" className="text-xs">
                        {p.paymentType}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {MONTH_NAMES[Number(p.month) - 1]} {String(p.year)}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
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
  );
}

export default function FeeCollection() {
  const { actor, isFetching } = useActor();

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => actor!.getAllStudents(),
    enabled: !!actor && !isFetching,
  });

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Fee Collection</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Record payments, view pending fees and payment history
        </p>
      </div>
      <Tabs defaultValue="collect">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="collect" data-ocid="fees.collect.tab">
            Collect Fee
          </TabsTrigger>
          <TabsTrigger value="pending" data-ocid="fees.pending.tab">
            Pending Fees
          </TabsTrigger>
          <TabsTrigger value="history" data-ocid="fees.history.tab">
            Payment History
          </TabsTrigger>
        </TabsList>
        <TabsContent value="collect" className="mt-4">
          <CollectFeeTab students={students} />
        </TabsContent>
        <TabsContent value="pending" className="mt-4">
          <PendingFeesTab />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <PaymentHistoryTab students={students} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
