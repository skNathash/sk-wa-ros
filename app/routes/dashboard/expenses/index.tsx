import { Navigate } from "react-router";

const ExpensesIndex = () => {
  return <Navigate to="/dashboard/expenses/expense-records" replace />;
};

export default ExpensesIndex;
