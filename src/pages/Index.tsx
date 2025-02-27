
import { useState } from "react";
import { motion } from "framer-motion";
import { LogOut, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [newProgramName, setNewProgramName] = useState("");
  const [newProgramBudget, setNewProgramBudget] = useState("");

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
        user_id: user?.id,
      });

      if (error) throw error;

      setNewProgramName("");
      setNewProgramBudget("");
      setIsCreating(false);
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
                <label
                  htmlFor="programName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Program Name
                </label>
                <input
                  type="text"
                  id="programName"
                  value={newProgramName}
                  onChange={(e) => setNewProgramName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="Enter program name"
                />
              </div>
              <div>
                <label
                  htmlFor="programBudget"
                  className="block text-sm font-medium text-gray-700"
                >
                  Budget
                </label>
                <input
                  type="number"
                  id="programBudget"
                  value={newProgramBudget}
                  onChange={(e) => setNewProgramBudget(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="Enter budget amount"
                  min="0"
                  step="0.01"
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
                <h3 className="text-lg font-semibold mb-2">{program.name}</h3>
                <p className="text-gray-600 mb-4">
                  Budget: ${program.budget.toLocaleString()}
                </p>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Status: {program.status}</span>
                  <span>
                    Created:{" "}
                    {new Date(program.created_at).toLocaleDateString()}
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
