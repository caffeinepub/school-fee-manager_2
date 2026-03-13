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
import { Loader2, Pencil, Plus, Search, Trash2, UserX } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Student } from "../backend";
import { useActor } from "../hooks/useActor";
import { formatINR } from "../lib/formatters";

const emptyForm = {
  name: "",
  className: "",
  rollNumber: "",
  parentName: "",
  phone: "",
  monthlyFee: "",
};

function StudentForm({
  form,
  onChange,
}: {
  form: typeof emptyForm;
  onChange: (f: typeof emptyForm) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label>Student Name *</Label>
        <Input
          data-ocid="student.form.name.input"
          placeholder="e.g. Rahul Sharma"
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Class *</Label>
        <Input
          data-ocid="student.form.class.input"
          placeholder="e.g. Class 5A"
          value={form.className}
          onChange={(e) => onChange({ ...form, className: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Roll Number *</Label>
        <Input
          data-ocid="student.form.roll.input"
          placeholder="e.g. 21"
          value={form.rollNumber}
          onChange={(e) => onChange({ ...form, rollNumber: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Parent Name *</Label>
        <Input
          data-ocid="student.form.parent.input"
          placeholder="e.g. Ramesh Sharma"
          value={form.parentName}
          onChange={(e) => onChange({ ...form, parentName: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Phone Number *</Label>
        <Input
          data-ocid="student.form.phone.input"
          placeholder="e.g. 9876543210"
          value={form.phone}
          onChange={(e) => onChange({ ...form, phone: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Monthly Fee (₹) *</Label>
        <Input
          data-ocid="student.form.fee.input"
          type="number"
          placeholder="e.g. 1500"
          value={form.monthlyFee}
          onChange={(e) => onChange({ ...form, monthlyFee: e.target.value })}
        />
      </div>
    </div>
  );
}

export default function Students() {
  const qc = useQueryClient();
  const { actor, isFetching } = useActor();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [deleteStudent, setDeleteStudent] = useState<Student | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: () => actor!.getAllStudents(),
    enabled: !!actor && !isFetching,
  });

  const createMutation = useMutation({
    mutationFn: (f: typeof emptyForm) =>
      actor!.createStudent(
        f.name,
        f.className,
        f.rollNumber,
        f.parentName,
        f.phone,
        Number(f.monthlyFee),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student added successfully");
      setDialogOpen(false);
      setForm(emptyForm);
    },
    onError: () => toast.error("Failed to add student"),
  });

  const updateMutation = useMutation({
    mutationFn: (f: typeof emptyForm) =>
      actor!.updateStudent(
        editStudent!.id,
        f.name,
        f.className,
        f.rollNumber,
        f.parentName,
        f.phone,
        Number(f.monthlyFee),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student updated");
      setDialogOpen(false);
      setEditStudent(null);
      setForm(emptyForm);
    },
    onError: () => toast.error("Failed to update student"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: bigint) => actor!.deleteStudent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student deleted");
      setDeleteStudent(null);
    },
    onError: () => toast.error("Failed to delete student"),
  });

  const openAdd = () => {
    setEditStudent(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (s: Student) => {
    setEditStudent(s);
    setForm({
      name: s.name,
      className: s.className,
      rollNumber: s.rollNumber,
      parentName: s.parentName,
      phone: s.phone,
      monthlyFee: String(s.monthlyFee),
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (
      !form.name ||
      !form.className ||
      !form.rollNumber ||
      !form.parentName ||
      !form.phone ||
      !form.monthlyFee
    ) {
      toast.error("Please fill all required fields");
      return;
    }
    if (editStudent) updateMutation.mutate(form);
    else createMutation.mutate(form);
  };

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.className.toLowerCase().includes(search.toLowerCase()),
  );

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Students</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage student records
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="gap-2"
          data-ocid="students.add.button"
        >
          <Plus className="w-4 h-4" />
          Add Student
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          data-ocid="students.search.input"
          placeholder="Search by name, class, or roll number..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-lg border border-border overflow-hidden bg-card">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 gap-3"
            data-ocid="students.empty_state"
          >
            <UserX className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">
              {search
                ? "No students match your search"
                : "No students added yet"}
            </p>
            {!search && (
              <Button variant="outline" onClick={openAdd} className="gap-2">
                <Plus className="w-4 h-4" /> Add First Student
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-ocid="students.table">
              <thead className="bg-muted/50">
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-muted-foreground font-semibold">
                    Roll No
                  </th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-semibold">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-semibold">
                    Class
                  </th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-semibold hidden md:table-cell">
                    Parent
                  </th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-semibold hidden lg:table-cell">
                    Phone
                  </th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-semibold">
                    Monthly Fee
                  </th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr
                    key={String(s.id)}
                    data-ocid={`students.item.${i + 1}`}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="font-mono">
                        {s.rollNumber}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.className}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {s.parentName}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {s.phone}
                    </td>
                    <td className="px-4 py-3 font-semibold text-primary">
                      {formatINR(s.monthlyFee)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          data-ocid={`students.edit.button.${i + 1}`}
                          onClick={() => openEdit(s)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover:text-destructive"
                          data-ocid={`students.delete.button.${i + 1}`}
                          onClick={() => setDeleteStudent(s)}
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
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editStudent ? "Edit Student" : "Add New Student"}
            </DialogTitle>
          </DialogHeader>
          <StudentForm form={form} onChange={setForm} />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              data-ocid="student.form.cancel.button"
            >
              Cancel
            </Button>
            <Button
              data-ocid="student.form.submit.button"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editStudent ? "Update Student" : "Add Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteStudent}
        onOpenChange={(o) => !o && setDeleteStudent(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteStudent?.name}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="students.delete.cancel.button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="students.delete.confirm.button"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                deleteStudent && deleteMutation.mutate(deleteStudent.id)
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
