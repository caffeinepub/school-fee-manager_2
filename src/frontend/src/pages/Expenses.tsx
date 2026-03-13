import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Receipt, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Expense } from "../backend";
import { useActor } from "../hooks/useActor";
import { EXPENSE_CATEGORIES, MONTH_NAMES, formatINR } from "../lib/formatters";

const now = new Date();
const CURRENT_YEAR = now.getFullYear();
const CURRENT_MONTH = now.getMonth() + 1;
const todayStr = now.toISOString().split("T")[0];

const emptyForm = {
  category: "Teacher Salary",
  description: "",
  amount: "",
  date: todayStr,
};

const CATEGORY_COLORS: Record<string, string> = {
  "Teacher Salary": "bg-blue-100 text-blue-700",
  Electricity: "bg-yellow-100 text-yellow-700",
  Maintenance: "bg-orange-100 text-orange-700",
  Books: "bg-purple-100 text-purple-700",
  Transport: "bg-teal-100 text-teal-700",
  Other: "bg-gray-100 text-gray-700",
};

function ExpenseForm({
  form,
  onChange,
}: {
  form: typeof emptyForm;
  onChange: (f: typeof emptyForm) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label>Category *</Label>
        <select
          data-ocid="expense.form.category.select"
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          value={form.category}
          onChange={(e) => onChange({ ...form, category: e.target.value })}
        >
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label>Date *</Label>
        <Input
          data-ocid="expense.form.date.input"
          type="date"
          value={form.date}
          onChange={(e) => onChange({ ...form, date: e.target.value })}
        />
      </div>
      <div className="sm:col-span-2 space-y-1.5">
        <Label>Description *</Label>
        <Input
          data-ocid="expense.form.description.input"
          placeholder="e.g. June salary for 5 teachers"
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Amount (₹) *</Label>
        <Input
          data-ocid="expense.form.amount.input"
          type="number"
          placeholder="e.g. 45000"
          value={form.amount}
          onChange={(e) => onChange({ ...form, amount: e.target.value })}
        />
      </div>
    </div>
  );
}

export default function Expenses() {
  const qc = useQueryClient();
  const { actor, isFetching } = useActor();
  const [form, setForm] = useState(emptyForm);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null);
  const [filterMonth, setFilterMonth] = useState(String(CURRENT_MONTH));
  const [filterYear, setFilterYear] = useState(String(CURRENT_YEAR));
  const [filterCategory, setFilterCategory] = useState("");

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["allExpenses"],
    queryFn: () => actor!.getAllExpenses(),
    enabled: !!actor && !isFetching,
  });

  const createMutation = useMutation({
    mutationFn: (f: typeof emptyForm) =>
      actor!.createExpense(f.category, f.description, Number(f.amount), f.date),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allExpenses"] });
      qc.invalidateQueries({ queryKey: ["totalExpenses"] });
      toast.success("Expense added");
      setForm(emptyForm);
    },
    onError: () => toast.error("Failed to add expense"),
  });

  const updateMutation = useMutation({
    mutationFn: (f: typeof emptyForm) =>
      actor!.updateExpense(
        editExpense!.id,
        f.category,
        f.description,
        Number(f.amount),
        f.date,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allExpenses"] });
      qc.invalidateQueries({ queryKey: ["totalExpenses"] });
      toast.success("Expense updated");
      setEditOpen(false);
      setEditExpense(null);
    },
    onError: () => toast.error("Failed to update expense"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: bigint) => actor!.deleteExpense(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allExpenses"] });
      qc.invalidateQueries({ queryKey: ["totalExpenses"] });
      toast.success("Expense deleted");
      setDeleteExpense(null);
    },
    onError: () => toast.error("Failed to delete expense"),
  });

  const handleAdd = () => {
    if (
      !form.description ||
      !form.amount ||
      !form.date ||
      Number(form.amount) <= 0
    ) {
      toast.error("Please fill all required fields");
      return;
    }
    createMutation.mutate(form);
  };

  const openEdit = (e: Expense) => {
    setEditExpense(e);
    setEditForm({
      category: e.category,
      description: e.description,
      amount: String(e.amount),
      date: e.date,
    });
    setEditOpen(true);
  };

  // Filter expenses
  let filtered = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
  if (filterMonth) {
    filtered = filtered.filter((e) => {
      const [, em] = e.date.split("-").map(Number);
      return em === Number(filterMonth);
    });
  }
  if (filterYear) {
    filtered = filtered.filter((e) => {
      const [ey] = e.date.split("-").map(Number);
      return ey === Number(filterYear);
    });
  }
  if (filterCategory)
    filtered = filtered.filter((e) => e.category === filterCategory);

  const totalFiltered = filtered.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Expenses</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Track and manage school expenses
        </p>
      </div>

      {/* Add Expense */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Expense
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ExpenseForm form={form} onChange={setForm} />
          <Button
            data-ocid="expense.form.submit.button"
            onClick={handleAdd}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Add Expense
          </Button>
        </CardContent>
      </Card>

      {/* Filters + Table */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <CardTitle className="text-base flex-1">Expense Records</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
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
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
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
            <div
              className="flex flex-col items-center py-12 gap-3"
              data-ocid="expenses.empty_state"
            >
              <Receipt className="w-10 h-10 text-muted-foreground/40" />
              <p className="text-muted-foreground font-medium">
                No expenses found for selected filters
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold">
                        Date
                      </th>
                      <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold">
                        Category
                      </th>
                      <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold">
                        Description
                      </th>
                      <th className="text-right px-4 py-2.5 text-muted-foreground font-semibold">
                        Amount
                      </th>
                      <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((e, i) => (
                      <tr
                        key={String(e.id)}
                        data-ocid={`expenses.item.${i + 1}`}
                        className="border-b border-border/50 hover:bg-muted/20"
                      >
                        <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                          {e.date}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${CATEGORY_COLORS[e.category] ?? "bg-gray-100 text-gray-700"}`}
                          >
                            {e.category}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">{e.description}</td>
                        <td className="px-4 py-2.5 text-right font-semibold">
                          {formatINR(e.amount)}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              data-ocid={`expenses.edit.button.${i + 1}`}
                              onClick={() => openEdit(e)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 hover:text-destructive"
                              data-ocid={`expenses.delete.button.${i + 1}`}
                              onClick={() => setDeleteExpense(e)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex justify-end">
                <div className="bg-muted rounded-lg px-4 py-2 text-sm">
                  <span className="text-muted-foreground">Total: </span>
                  <span className="font-bold text-foreground">
                    {formatINR(totalFiltered)}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          <ExpenseForm form={editForm} onChange={setEditForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => updateMutation.mutate(editForm)}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleteExpense}
        onOpenChange={(o) => !o && setDeleteExpense(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete expense: <strong>{deleteExpense?.description}</strong> (
              {deleteExpense ? formatINR(deleteExpense.amount) : ""})?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                deleteExpense && deleteMutation.mutate(deleteExpense.id)
              }
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
