import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { format } from "date-fns";

// Define types for our data
type Program = {
  id: string;
  name: string;
  budget: number;
  status: string;
};

type ExpenseSummary = {
  category: string;
  total: number;
  count: number;
};

type FundingSummary = {
  type: string;
  total: number;
  count: number;
};

type ProgramSummary = {
  id: string;
  name: string;
  budget: number;
  expenses: number;
  funding: number;
  status: string;
  balance: number;
};

const Dashboard = () => {
  const { user } = useAuth();
  
  // Colors for charts
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];
  
  // Fetch programs
  const { data: programs } = useQuery({
    queryKey: ["programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      return data as Program[];
    },
    enabled: !!user,
  });
  
  // Fetch expense summary by category
  const { data: expensesByCategory } = useQuery({
    queryKey: ["expenses-by-category"],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_expenses_by_category", { user_id_param: user?.id })
        .catch(() => {
          // If the function doesn't exist, do a manual query
          return supabase
            .from("expenses")
            .select("category, amount")
            .eq("user_id", user?.id);
        });
        
      if (error) throw error;
      
      // If we used the RPC, we're getting the exact format we want
      if (data && data[0] && 'total' in data[0]) {
        return data as ExpenseSummary[];
      }
      
      // Otherwise, we need to transform the data
      const summary: Record<string, { total: number; count: number }> = {};
      
      data?.forEach((expense: any) => {
        const category = expense.category;
        const amount = parseFloat(expense.amount);
        
        if (!summary[category]) {
          summary[category] = { total: 0, count: 0 };
        }
        
        summary[category].total += amount;
        summary[category].count += 1;
      });
      
      return Object.entries(summary).map(([category, { total, count }]) => ({
        category,
        total,
        count,
      })) as ExpenseSummary[];
    },
    enabled: !!user,
  });
  
  // Fetch funding summary by type
  const { data: fundingByType } = useQuery({
    queryKey: ["funding-by-type"],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_funding_by_type", { user_id_param: user?.id })
        .catch(() => {
          // If the function doesn't exist, do a manual query
          return supabase
            .from("funding")
            .select("type, amount")
            .eq("user_id", user?.id);
        });
        
      if (error) throw error;
      
      // If we used the RPC, we're getting the exact format we want
      if (data && data[0] && 'total' in data[0]) {
        return data as FundingSummary[];
      }
      
      // Otherwise, we need to transform the data
      const summary: Record<string, { total: number; count: number }> = {};
      
      data?.forEach((funding: any) => {
        const type = funding.type;
        const amount = parseFloat(funding.amount);
        
        if (!summary[type]) {
          summary[type] = { total: 0, count: 0 };
        }
        
        summary[type].total += amount;
        summary[type].count += 1;
      });
      
      return Object.entries(summary).map(([type, { total, count }]) => ({
        type,
        total,
        count,
      })) as FundingSummary[];
    },
    enabled: !!user,
  });
  
  // Fetch program summaries with expenses and funding
  const { data: programSummaries, isLoading } = useQuery({
    queryKey: ["program-summaries"],
    queryFn: async () => {
      // First get all programs
      const { data: programs, error: programsError } = await supabase
        .from("programs")
        .select("*")
        .eq("user_id", user?.id);
        
      if (programsError) throw programsError;
      
      // For each program, get the associated expenses and funding
      const summaries = await Promise.all(
        programs.map(async (program) => {
          // Get expenses
          const { data: expenses, error: expensesError } = await supabase
            .from("expenses")
            .select("amount")
            .eq("program_id", program.id);
            
          if (expensesError) throw expensesError;
          
          // Get funding
          const { data: funding, error: fundingError } = await supabase
            .from("funding")
            .select("amount")
            .eq("program_id", program.id);
            
          if (fundingError) throw fundingError;
          
          // Calculate totals
          const totalExpenses = expenses.reduce(
            (sum, item) => sum + parseFloat(item.amount),
            0
          );
          
          const totalFunding = funding.reduce(
            (sum, item) => sum + parseFloat(item.amount),
            0
          );
          
          return {
            id: program.id,
            name: program.name,
            budget: parseFloat(program.budget),
            expenses: totalExpenses,
            funding: totalFunding,
            status: program.status,
            balance: totalFunding - totalExpenses,
          };
        })
      );
      
      return summaries;
    },
    enabled: !!user && !!programs,
  });
  
  // Calculate totals
  const totalExpenses = expensesByCategory?.reduce(
    (sum, category) => sum + parseFloat(category.total.toString()),
    0
  ) || 0;
  
  const totalFunding = fundingByType?.reduce(
    (sum, type) => sum + parseFloat(type.total.toString()),
    0
  ) || 0;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  // Prepare chart data
  const expensesChartData = expensesByCategory?.map((item) => ({
    name: item.category,
    value: parseFloat(item.total.toString()),
  })) || [];
  
  const fundingChartData = fundingByType?.map((item) => ({
    name: item.type,
    value: parseFloat(item.total.toString()),
  })) || [];
  
  const programChartData = programSummaries?.map((program) => ({
    name: program.name,
    budget: program.budget,
    expenses: program.expenses,
    funding: program.funding,
  })) || [];
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 dark:text-gray-200">Financial Dashboard</h1>
      
      {/* Summary Cards */}
      <div className="grid gap-6 mb-8 md:grid-cols-3">
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Funding</CardTitle>
            <CardDescription>Across all programs</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totalFunding)}
            </p>
          </CardContent>
        </Card>
        
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Expenses</CardTitle>
            <CardDescription>Across all programs</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(totalExpenses)}
            </p>
          </CardContent>
        </Card>
        
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Balance</CardTitle>
            <CardDescription>Funding minus expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${
              totalFunding - totalExpenses >= 0
                ? "text-blue-600 dark:text-blue-400"
                : "text-red-600 dark:text-red-400"
            }`}>
              {formatCurrency(totalFunding - totalExpenses)}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid gap-6 mb-8 lg:grid-cols-2">
        {/* Expenses by Category */}
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
            <CardDescription>Distribution of expenses across categories</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {expensesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label={({ name, percent }) => 
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {expensesChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                No expense data available
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Funding by Type */}
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader>
            <CardTitle>Funding by Type</CardTitle>
            <CardDescription>Distribution of funding across types</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {fundingChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fundingChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label={({ name, percent }) => 
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {fundingChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                No funding data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Program Details */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <CardTitle>Program Financial Overview</CardTitle>
          <CardDescription>Budget, expenses, and funding by program</CardDescription>
        </CardHeader>
        <CardContent className="h-96">
          {programChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={programChartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Bar dataKey="budget" name="Budget" fill="#8884d8" />
                <Bar dataKey="expenses" name="Expenses" fill="#FF8042" />
                <Bar dataKey="funding" name="Funding" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              No program data available
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Program Details Table */}
      <Card className="mt-8 dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <CardTitle>Program Financial Details</CardTitle>
          <CardDescription>
            Detailed financial breakdown by program
          </CardDescription>
        </CardHeader>
        <CardContent>
          {programSummaries && programSummaries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="px-4 py-2">Program</th>
                    <th className="px-4 py-2">Budget</th>
                    <th className="px-4 py-2">Expenses</th>
                    <th className="px-4 py-2">Funding</th>
                    <th className="px-4 py-2">Balance</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {programSummaries.map((program) => (
                    <tr key={program.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 font-medium">{program.name}</td>
                      <td className="px-4 py-3">{formatCurrency(program.budget)}</td>
                      <td className="px-4 py-3 text-red-600 dark:text-red-400">
                        {formatCurrency(program.expenses)}
                      </td>
                      <td className="px-4 py-3 text-green-600 dark:text-green-400">
                        {formatCurrency(program.funding)}
                      </td>
                      <td className={`px-4 py-3 font-medium ${
                        program.balance >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}>
                        {formatCurrency(program.balance)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          program.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}>
                          {program.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No program data available. Create programs and add expenses/funding to see data here.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
