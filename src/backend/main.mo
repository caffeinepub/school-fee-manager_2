import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Student Management
  public type Student = {
    id : Nat;
    name : Text;
    className : Text;
    rollNumber : Text;
    parentName : Text;
    phone : Text;
    monthlyFee : Float;
    createdAt : Int;
  };

  var nextStudentId = 1;
  let students = Map.empty<Nat, Student>();

  public shared ({ caller }) func createStudent(
    name : Text,
    className : Text,
    rollNumber : Text,
    parentName : Text,
    phone : Text,
    monthlyFee : Float,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create students");
    };

    let id = nextStudentId;
    nextStudentId += 1;

    let student : Student = {
      id = id;
      name;
      className;
      rollNumber;
      parentName;
      phone;
      monthlyFee;
      createdAt = Time.now();
    };

    ignore students.add(id, student);
    id;
  };

  public query ({ caller }) func getStudent(id : Nat) : async ?Student {
    students.get(id);
  };

  public query ({ caller }) func getAllStudents() : async [Student] {
    students.values().toArray();
  };

  public shared ({ caller }) func updateStudent(
    id : Nat,
    name : Text,
    className : Text,
    rollNumber : Text,
    parentName : Text,
    phone : Text,
    monthlyFee : Float,
  ) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update students");
    };

    switch (students.get(id)) {
      case (null) { false };
      case (?existing) {
        let updated : Student = {
          id;
          name;
          className;
          rollNumber;
          parentName;
          phone;
          monthlyFee;
          createdAt = existing.createdAt;
        };
        ignore students.add(id, updated);
        true;
      };
    };
  };

  public shared ({ caller }) func deleteStudent(id : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete students");
    };
    if (students.containsKey(id)) {
      students.remove(id);
      true;
    } else {
      false;
    };
  };

  // Payment Management
  public type Payment = {
    id : Nat;
    studentId : Nat;
    amount : Float;
    paymentType : Text; // "monthly"/"quarterly"/"yearly"
    month : Nat;
    year : Nat;
    receiptNumber : Text;
    note : Text;
    paidAt : Int;
  };

  var nextPaymentId = 1;
  let payments = Map.empty<Nat, Payment>();

  public shared ({ caller }) func addPayment(
    studentId : Nat,
    amount : Float,
    paymentType : Text,
    month : Nat,
    year : Nat,
    receiptNumber : Text,
    note : Text,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add payments");
    };

    let id = nextPaymentId;
    nextPaymentId += 1;

    let payment : Payment = {
      id;
      studentId;
      amount;
      paymentType;
      month;
      year;
      receiptNumber;
      note;
      paidAt = Time.now();
    };

    ignore payments.add(id, payment);
    id;
  };

  public query ({ caller }) func getPaymentsByStudent(studentId : Nat) : async [Payment] {
    let allPayments = payments.values().toArray();
    allPayments.filter(
      func(p) {
        p.studentId == studentId;
      }
    );
  };

  public query ({ caller }) func getAllPayments() : async [Payment] {
    payments.values().toArray();
  };

  public query ({ caller }) func getPaymentsByMonthYear(month : Nat, year : Nat) : async [Payment] {
    let allPayments = payments.values().toArray();
    allPayments.filter(
      func(p) {
        p.month == month and p.year == year;
      }
    );
  };

  public query ({ caller }) func getPendingFeeStudents(month : Nat, year : Nat) : async [Student] {
    let allStudents = students.values().toArray();
    allStudents.filter(
      func(s) {
        not payments.values().toArray().any(
          func(p) {
            p.studentId == s.id and p.month == month and p.year == year
          }
        );
      }
    );
  };

  // Expense Management
  public type Expense = {
    id : Nat;
    category : Text; // "salary"/"electricity"/"maintenance"/"books"/"transport"/"other"
    description : Text;
    amount : Float;
    date : Text;
    createdAt : Int;
  };

  var nextExpenseId = 1;
  let expenses = Map.empty<Nat, Expense>();

  public shared ({ caller }) func createExpense(
    category : Text,
    description : Text,
    amount : Float,
    date : Text,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create expenses");
    };

    let id = nextExpenseId;
    nextExpenseId += 1;

    let expense : Expense = {
      id;
      category;
      description;
      amount;
      date;
      createdAt = Time.now();
    };

    ignore expenses.add(id, expense);
    id;
  };

  public query ({ caller }) func getExpense(id : Nat) : async ?Expense {
    expenses.get(id);
  };

  public query ({ caller }) func getAllExpenses() : async [Expense] {
    expenses.values().toArray();
  };

  public shared ({ caller }) func updateExpense(
    id : Nat,
    category : Text,
    description : Text,
    amount : Float,
    date : Text,
  ) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update expenses");
    };

    switch (expenses.get(id)) {
      case (null) { false };
      case (?existing) {
        let updated : Expense = {
          id;
          category;
          description;
          amount;
          date;
          createdAt = existing.createdAt;
        };
        ignore expenses.add(id, updated);
        true;
      };
    };
  };

  public shared ({ caller }) func deleteExpense(id : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete expenses");
    };
    if (expenses.containsKey(id)) {
      expenses.remove(id);
      true;
    } else {
      false;
    };
  };

  public query ({ caller }) func getExpensesByMonthYear(month : Nat, year : Nat) : async [Expense] {
    let allExpenses = expenses.values().toArray();
    allExpenses.filter(
      func(e) {
        // Simple check for date matching
        e.date.contains(#text (Nat.toText(year))) and
        e.date.contains(#text (Nat.toText(month)));
      }
    );
  };

  public query ({ caller }) func getExpensesByCategory(category : Text) : async [Expense] {
    let allExpenses = expenses.values().toArray();
    allExpenses.filter(
      func(e) {
        e.category == category;
      }
    );
  };

  // Summary Statistics
  public query ({ caller }) func getTotalFeesCollected() : async Float {
    var total : Float = 0.0;
    for ((_, payment) in payments.entries()) {
      total += payment.amount;
    };
    total;
  };

  public query ({ caller }) func getTotalExpenses() : async Float {
    var total : Float = 0.0;
    for ((_, expense) in expenses.entries()) {
      total += expense.amount;
    };
    total;
  };

  public query ({ caller }) func getFeesByMonthYear(month : Nat, year : Nat) : async Float {
    var total : Float = 0.0;
    for ((_, payment) in payments.entries()) {
      if (payment.month == month and payment.year == year) {
        total += payment.amount;
      };
    };
    total;
  };

  public query ({ caller }) func getExpensesByMonthYearTotal(month : Nat, year : Nat) : async Float {
    var total : Float = 0.0;
    let yearText = Nat.toText(year);
    let monthText = if (month < 10) { "0" # Nat.toText(month) } else {
      Nat.toText(month);
    };
    for ((_, expense) in expenses.entries()) {
      if (expense.date.contains(#text yearText) and
        expense.date.contains(#text monthText)) {
        total += expense.amount;
      };
    };
    total;
  };
};
