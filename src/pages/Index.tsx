
import { useState } from "react";
import { motion } from "framer-motion";
import { LogOut, Plus, Trash } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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

const Index = () => {
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [newProgramName, setNewProgramName] = useState("");
  const [newProgramBudget, setNewProgramBudget] = useState("");
  const [newProgramDescription, setNewProgramDescription] = useState("");

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

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold">Program Management</h1>
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
                className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold">{program.name}</h3>
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
                <p className="text-gray-600 mb-4">
                  Budget: ${program.budget.toLocaleString()}
                </p>
                {program.description && (
                  <p className="text-gray-500 text-sm mb-4">{program.description}</p>
                )}
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Status: {program.status}</span>
                  <span>
                    Created: {new Date(program.created_at).toLocaleDateString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;

