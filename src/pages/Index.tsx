
import { useState } from "react";
import { motion } from "framer-motion";
import { Edit, LogOut, Plus, Trash } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [newProgramName, setNewProgramName] = useState("");
  const [newProgramBudget, setNewProgramBudget] = useState("");
  const [newProgramDescription, setNewProgramDescription] = useState("");
  
  // State for edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [editProgramName, setEditProgramName] = useState("");
  const [editProgramBudget, setEditProgramBudget] = useState("");
  const [editProgramDescription, setEditProgramDescription] = useState("");
  const [editProgramStatus, setEditProgramStatus] = useState("active");

  // Fetch programs
  const { data: programs, isLoading } = useQuery({
    queryKey: ["programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          title: "Error fetching programs",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      return data;
    },
  });

  // Create new program
  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgramName || !newProgramBudget) {
      toast({
        title: "Missing information",
        description: "Please provide both a name and budget for the program.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("programs").insert({
        name: newProgramName,
        budget: parseFloat(newProgramBudget),
        description: newProgramDescription || null,
        user_id: user?.id,
      });

      if (error) throw error;

      // Reset form and refetch programs
      setNewProgramName("");
      setNewProgramBudget("");
      setNewProgramDescription("");
      setIsCreating(false);
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      
      toast({
        title: "Success",
        description: "Program created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error creating program",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Open edit dialog
  const handleOpenEditDialog = (program) => {
    setEditingProgram(program);
    setEditProgramName(program.name);
    setEditProgramBudget(program.budget.toString());
    setEditProgramDescription(program.description || "");
    setEditProgramStatus(program.status);
    setIsEditing(true);
  };

  // Update program
  const handleUpdateProgram = async () => {
    if (!editProgramName || !editProgramBudget) {
      toast({
        title: "Missing information",
        description: "Please provide both a name and budget for the program.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("programs")
        .update({
          name: editProgramName,
          budget: parseFloat(editProgramBudget),
          description: editProgramDescription || null,
          status: editProgramStatus,
        })
        .eq("id", editingProgram.id);

      if (error) throw error;

      // Reset form and refetch programs
      setIsEditing(false);
      setEditingProgram(null);
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      
      toast({
        title: "Success",
        description: "Program updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error updating program",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Delete program
  const handleDeleteProgram = async (programId: string) => {
    try {
      const { error } = await supabase
        .from("programs")
        .delete()
        .eq("id", programId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["programs"] });
      toast({
        title: "Success",
        description: "Program deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting program",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Helper function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'on hold':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
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
                <Button variant="ghost" className="font-medium text-blue-600">Programs</Button>
                <Button variant="ghost" onClick={() => navigate('/expenses')}>Expenses</Button>
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
          <h2 className="text-2xl font-bold text-gray-900">Your Programs</h2>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Program
          </Button>
        </div>

        {/* Create Program Form */}
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-white rounded-lg shadow-sm"
          >
            <form onSubmit={handleCreateProgram} className="space-y-4">
              <div>
                <Label htmlFor="programName">Program Name</Label>
                <Input
                  id="programName"
                  value={newProgramName}
                  onChange={(e) => setNewProgramName(e.target.value)}
                  placeholder="Enter program name"
                />
              </div>
              <div>
                <Label htmlFor="programBudget">Budget</Label>
                <Input
                  type="number"
                  id="programBudget"
                  value={newProgramBudget}
                  onChange={(e) => setNewProgramBudget(e.target.value)}
                  placeholder="Enter budget amount"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <Label htmlFor="programDescription">Description (Optional)</Label>
                <Input
                  id="programDescription"
                  value={newProgramDescription}
                  onChange={(e) => setNewProgramDescription(e.target.value)}
                  placeholder="Enter program description"
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
                <Button type="submit">Create Program</Button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Programs List */}
        {isLoading ? (
          <div className="text-center py-8">Loading programs...</div>
        ) : programs?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No programs found. Create your first program to get started!
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {programs?.map((program) => (
              <motion.div
                key={program.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold">{program.name}</h3>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-500 hover:text-blue-600"
                      onClick={() => handleOpenEditDialog(program)}
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
                          <AlertDialogTitle>Delete Program</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{program.name}"? This action
                            cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteProgram(program.id)}
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
                  <Badge className={getStatusColor(program.status)}>
                    {program.status.charAt(0).toUpperCase() + program.status.slice(1)}
                  </Badge>
                </div>
                <p className="text-gray-800 mb-4 font-medium">
                  Budget: ${program.budget.toLocaleString()}
                </p>
                {program.description && (
                  <p className="text-gray-600 mb-4 text-sm">{program.description}</p>
                )}
                <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-100 pt-3 mt-2">
                  <span>
                    Created: {format(new Date(program.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Edit Program Dialog */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Program</DialogTitle>
              <DialogDescription>
                Make changes to the program details below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-program-name">Program Name</Label>
                <Input
                  id="edit-program-name"
                  value={editProgramName}
                  onChange={(e) => setEditProgramName(e.target.value)}
                  placeholder="Enter program name"
                />
              </div>
              <div>
                <Label htmlFor="edit-program-budget">Budget</Label>
                <Input
                  type="number"
                  id="edit-program-budget"
                  value={editProgramBudget}
                  onChange={(e) => setEditProgramBudget(e.target.value)}
                  placeholder="Enter budget amount"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <Label htmlFor="edit-program-description">Description</Label>
                <Input
                  id="edit-program-description"
                  value={editProgramDescription}
                  onChange={(e) => setEditProgramDescription(e.target.value)}
                  placeholder="Enter program description"
                />
              </div>
              <div>
                <Label htmlFor="edit-program-status">Status</Label>
                <select
                  id="edit-program-status"
                  value={editProgramStatus}
                  onChange={(e) => setEditProgramStatus(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="on hold">On Hold</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateProgram}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Index;
