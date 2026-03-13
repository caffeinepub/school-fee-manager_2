# School Accounting and Fee Management System

## Current State
New project — no existing code.

## Requested Changes (Diff)

### Add
- Admin login system (authorization component)
- Student Management: add/edit/delete students with name, class, roll number, parent name, phone, monthly fee amount
- Fee Collection: record payments (monthly/quarterly/yearly), digital receipt view, payment history per student, pending fee list
- Expense Management: record school expenses with category (teacher salary, electricity, maintenance, books, transport, other)
- Accounting Dashboard: total fees collected, total expenses, monthly profit/deficit, daily/monthly/yearly summary
- Reports: student fee due report, monthly income/expense report, expense-by-category report; print-to-PDF via browser

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Backend (Motoko):
   - Student record: id, name, class, rollNumber, parentName, phone, monthlyFee, createdAt
   - Payment record: id, studentId, amount, paymentType (monthly/quarterly/yearly), month, year, receiptNumber, paidAt
   - Expense record: id, category, description, amount, date
   - CRUD for students, payments, expenses
   - Queries: pending fees by month/year, total collected, total expenses, payments by student

2. Frontend (React + Tailwind):
   - Login page (authorization)
   - Sidebar navigation: Dashboard, Students, Fee Collection, Expenses, Reports
   - Dashboard: summary cards + charts
   - Students page: table with add/edit/delete modal
   - Fee Collection: record payment form, pending fee list, payment history
   - Expenses: add expense form, expense list with filters
   - Reports: printable views for each report type
