
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { Edit, LogOut, Plus, Trash, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

type ExpenseCategory = "Equipment" | "Professional Services" | "Travel" | "Supplies" | "Other";

type Expense = {
  id: string;
  amount: number;
  description: string;
  date: string;
  category: ExpenseCategory;
  payment_method: string;
  payee: string;
  program_id: string | null;
  program_name: string | null;
  user_id: string;
  created_at: string;
  status: string;
};

type Program = {
  id: string;
  name: string;
};

const Expenses = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [isCreating, setIsCreating] = useState(false);
  const [newExpense, setNewExpense] = useState({
    amount: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    category: "Equipment" as ExpenseCategory,
    payment_method: "Credit Card",
    payee: "",
    program_id: "",
    status: "pending"
  });
  
  // State for edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  // Filter state
  const [filterProgramId, setFilterProgramId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Fetch expenses
  const { data: expenses, isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      let query = supabase
        .from("expenses")
        .select(`
          *,
          programs (
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (filterProgramId) {
        query = query.eq("program_id", filterProgramId);
      }

      if (filterCategory) {
        query = query.eq("category", filterCategory as ExpenseCategory);
      }

      const { data, error } = await query;

      if (error) {
        toast.error("Error fetching expenses: " + error.message);
        throw error;
      }

      // Transform the data to include program_name and map approval_status to status
      return data.map(expense => ({
        ...expense,
        program_name: expense.programs?.name || null,
        date: expense.created_at.split('T')[0], // Use created_at as the date
        status: expense.approval_status || "pending" // Map approval_status to status
      })) as Expense[];
    },
  });

  // Fetch programs for dropdown
  const { data: programs } = useQuery({
    queryKey: ["programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("programs")
        .select("id, name")
        .order("name");

      if (error) {
        toast.error("Error fetching programs: " + error.message);
        throw error;
      }

      return data as Program[];
    },
  });

  // Get unique categories for filter
  const categories = expenses ? [...new Set(expenses.map(e => e.category))].sort() : [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (newExpenseData: any) => {
      const { data, error } = await supabase
        .from("expenses")
        .insert({
          amount: parseFloat(newExpenseData.amount),
          description: newExpenseData.description,
          category: newExpenseData.category as ExpenseCategory,
          payment_method: newExpenseData.payment_method,
          payee: newExpenseData.payee,
          program_id: newExpenseData.program_id || null,
          approval_status: newExpenseData.status,
          user_id: user?.id,
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setIsCreating(false);
      setNewExpense({
        amount: "",
        description: "",
        date: new Date().toISOString().split('T')[0],
        category: "Equipment" as ExpenseCategory,
        payment_method: "Credit Card",
        payee: "",
        program_id: "",
        status: "pending"
      });
      toast.success("Expense created successfully");
    },
    onError: (error: any) => {
      toast.error("Error creating expense: " + error.message);
    },
  });

  // Update mutation - fixed to not send the programs field and only update what's needed
  const updateMutation = useMutation({
    mutationFn: async (updatedExpense: any) => {
      // Extract only the fields we need to update
      const { 
        id, 
        amount, 
        description, 
        category, 
        payment_method, 
        payee, 
        program_id,
        status 
      } = updatedExpense;
      
      const { data, error } = await supabase
        .from("expenses")
        .update({
          amount,
          description,
          category,
          payment_method,
          payee,
          program_id,
          approval_status: status // Map status to approval_status for database
        })
        .eq("id", id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setIsEditing(false);
      setEditingExpense(null);
      toast.success("Expense updated successfully");
    },
    onError: (error: any) => {
      toast.error("Error updating expense: " + error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense deleted successfully");
    },
    onError: (error: any) => {
      toast.error("Error deleting expense: " + error.message);
    },
  });

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.amount || !newExpense.description || !newExpense.date || !newExpense.payee) {
      toast.error("Please fill in all required fields");
      return;
    }

    createMutation.mutate(newExpense);
  };

  const handleUpdateExpense = () => {
    if (!editingExpense) return;
    
    updateMutation.mutate(editingExpense);
  };

  // Function to handle editing an expense
  const handleOpenEditDialog = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditing(true);
  };

  // Function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilterProgramId(null);
    setFilterCategory(null);
    setIsFilterOpen(false);
    queryClient.invalidateQueries({ queryKey: ["expenses"] });
  };

  // Navigation functions
  const navigateToPrograms = () => {
    navigate('/programs');
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-semibold">Accounting App</h1>
              <div className="hidden md:flex space-x-4">
                <Button variant="ghost" onClick={() => navigate('/')}>Home</Button>
                <Button variant="ghost" onClick={navigateToPrograms}>Programs</Button>
                <Button variant="ghost" className="font-medium text-blue-600">Expenses</Button>
                <Button variant="ghost" onClick={() => navigate('/funding')}>Funding</Button>
                <Button variant="ghost" onClick={() => navigate('/dashboard')}>Dashboard</Button>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() => signOut()}
              className="text-gray-600 hover:text-gray-900"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Expenses</h2>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setIsFilterOpen(true)}
              className="flex items-center"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Expense
            </Button>
          </div>
        </div>

        {/* Filter Dialog */}
        <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Filter Expenses</DialogTitle>
              <DialogDescription>
                Select filters to narrow down your expense list.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="filter-program">Program</Label>
                <select
                  id="filter-program"
                  value={filterProgramId || ""}
                  onChange={(e) => setFilterProgramId(e.target.value || null)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">All Programs</option>
                  {programs?.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="filter-category">Category</Label>
                <select
                  id="filter-category"
                  value={filterCategory || ""}
                  onChange={(e) => setFilterCategory(e.target.value || null)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetFilters}>
                Reset Filters
              </Button>
              <Button onClick={() => {
                setIsFilterOpen(false);
                queryClient.invalidateQueries({ queryKey: ["expenses"] });
              }}>
                Apply Filters
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Expense Form */}
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-white rounded-lg shadow-sm"
          >
            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount*</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    placeholder="Enter amount"
                    min="0.01"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="date">Date*</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category*</Label>
                  <select
                    id="category"
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as ExpenseCategory })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="Equipment">Equipment</option>
                    <option value="Professional Services">Professional Services</option>
                    <option value="Travel">Travel</option>
                    <option value="Supplies">Supplies</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="payment_method">Payment Method*</Label>
                  <select
                    id="payment_method"
                    value={newExpense.payment_method}
                    onChange={(e) => setNewExpense({ ...newExpense, payment_method: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Check">Check</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="payee">Payee*</Label>
                  <Input
                    id="payee"
                    value={newExpense.payee}
                    onChange={(e) => setNewExpense({ ...newExpense, payee: e.target.value })}
                    placeholder="Enter payee name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="program">Program (Optional)</Label>
                  <select
                    id="program"
                    value={newExpense.program_id}
                    onChange={(e) => setNewExpense({ ...newExpense, program_id: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">No Program</option>
                    {programs?.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="status">Status*</Label>
                  <select
                    id="status"
                    value={newExpense.status}
                    onChange={(e) => setNewExpense({ ...newExpense, status: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description*</Label>
                <Input
                  id="description"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  placeholder="Enter expense description"
                  required
                />
              </div>
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Expense</Button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Expenses List */}
        {isLoading ? (
          <div className="text-center py-8">Loading expenses...</div>
        ) : !expenses || expenses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No expenses found. Create your first expense to get started!
          </div>
        ) : (
          <div className="space-y-4">
            {filterProgramId || filterCategory ? (
              <div className="flex items-center justify-between bg-blue-50 p-3 rounded-md mb-4">
                <div className="text-sm text-blue-700">
                  Showing filtered results: 
                  {filterProgramId && programs && ` Program: ${programs.find(p => p.id === filterProgramId)?.name}`}
                  {filterProgramId && filterCategory && " and "}
                  {filterCategory && ` Category: ${filterCategory}`}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={resetFilters}
                  className="text-blue-700 hover:text-blue-900 h-7 px-2"
                >
                  Clear Filters
                </Button>
              </div>
            ) : null}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {expenses?.map((expense) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">${expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                      <p className="text-sm text-gray-500">{format(new Date(expense.date), 'MMM d, yyyy')}</p>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-blue-600"
                        onClick={() => handleOpenEditDialog(expense)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-500 hover:text-red-600"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this expense of ${expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}? This action
                              cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(expense.id)}
                              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <div className="mb-4">
                    <Badge className={getStatusColor(expense.status)}>
                      {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-gray-800 mb-1">{expense.description}</p>
                  <p className="text-sm text-gray-600 mb-1">Paid to: {expense.payee}</p>
                  <p className="text-sm text-gray-600 mb-4">
                    {expense.category} • {expense.payment_method}
                  </p>
                  {expense.program_name && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        Program: <span className="font-medium">{expense.program_name}</span>
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Edit Expense Dialog */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Expense</DialogTitle>
              <DialogDescription>
                Make changes to the expense details below.
              </DialogDescription>
            </DialogHeader>
            {editingExpense && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-amount">Amount</Label>
                    <Input
                      id="edit-amount"
                      type="number"
                      step="0.01"
                      value={editingExpense.amount}
                      onChange={(e) => setEditingExpense({ ...editingExpense, amount: parseFloat(e.target.value) })}
                      min="0.01"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-date">Date</Label>
                    <Input
                      id="edit-date"
                      type="date"
                      value={editingExpense.date}
                      onChange={(e) => setEditingExpense({ ...editingExpense, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-category">Category</Label>
                    <select
                      id="edit-category"
                      value={editingExpense.category}
                      onChange={(e) => setEditingExpense({ ...editingExpense, category: e.target.value as ExpenseCategory })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="Equipment">Equipment</option>
                      <option value="Professional Services">Professional Services</option>
                      <option value="Travel">Travel</option>
                      <option value="Supplies">Supplies</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="edit-payment-method">Payment Method</Label>
                    <select
                      id="edit-payment-method"
                      value={editingExpense.payment_method}
                      onChange={(e) => setEditingExpense({ ...editingExpense, payment_method: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="Credit Card">Credit Card</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Check">Check</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="edit-payee">Payee</Label>
                    <Input
                      id="edit-payee"
                      value={editingExpense.payee}
                      onChange={(e) => setEditingExpense({ ...editingExpense, payee: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-program">Program</Label>
                    <select
                      id="edit-program"
                      value={editingExpense.program_id || ""}
                      onChange={(e) => setEditingExpense({ ...editingExpense, program_id: e.target.value || null })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">No Program</option>
                      {programs?.map((program) => (
                        <option key={program.id} value={program.id}>
                          {program.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="edit-status">Status</Label>
                    <select
                      id="edit-status"
                      value={editingExpense.status}
                      onChange={(e) => setEditingExpense({ ...editingExpense, status: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                    id="edit-description"
                    value={editingExpense.description}
                    onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateExpense}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Expenses;
