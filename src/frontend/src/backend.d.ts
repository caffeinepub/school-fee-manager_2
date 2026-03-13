import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Payment {
    id: bigint;
    month: bigint;
    studentId: bigint;
    note: string;
    year: bigint;
    paymentType: string;
    amount: number;
    paidAt: bigint;
    receiptNumber: string;
}
export interface Expense {
    id: bigint;
    date: string;
    createdAt: bigint;
    description: string;
    category: string;
    amount: number;
}
export interface Student {
    id: bigint;
    name: string;
    createdAt: bigint;
    rollNumber: string;
    phone: string;
    monthlyFee: number;
    className: string;
    parentName: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addPayment(studentId: bigint, amount: number, paymentType: string, month: bigint, year: bigint, receiptNumber: string, note: string): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createExpense(category: string, description: string, amount: number, date: string): Promise<bigint>;
    createStudent(name: string, className: string, rollNumber: string, parentName: string, phone: string, monthlyFee: number): Promise<bigint>;
    deleteExpense(id: bigint): Promise<boolean>;
    deleteStudent(id: bigint): Promise<boolean>;
    getAllExpenses(): Promise<Array<Expense>>;
    getAllPayments(): Promise<Array<Payment>>;
    getAllStudents(): Promise<Array<Student>>;
    getCallerUserRole(): Promise<UserRole>;
    getExpense(id: bigint): Promise<Expense | null>;
    getExpensesByCategory(category: string): Promise<Array<Expense>>;
    getExpensesByMonthYear(month: bigint, year: bigint): Promise<Array<Expense>>;
    getExpensesByMonthYearTotal(month: bigint, year: bigint): Promise<number>;
    getFeesByMonthYear(month: bigint, year: bigint): Promise<number>;
    getPaymentsByMonthYear(month: bigint, year: bigint): Promise<Array<Payment>>;
    getPaymentsByStudent(studentId: bigint): Promise<Array<Payment>>;
    getPendingFeeStudents(month: bigint, year: bigint): Promise<Array<Student>>;
    getStudent(id: bigint): Promise<Student | null>;
    getTotalExpenses(): Promise<number>;
    getTotalFeesCollected(): Promise<number>;
    isCallerAdmin(): Promise<boolean>;
    updateExpense(id: bigint, category: string, description: string, amount: number, date: string): Promise<boolean>;
    updateStudent(id: bigint, name: string, className: string, rollNumber: string, parentName: string, phone: string, monthlyFee: number): Promise<boolean>;
}
