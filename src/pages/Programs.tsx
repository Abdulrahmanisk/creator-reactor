
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { CalendarIcon, PlusCircle, Pencil, Trash2, FolderOpen } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

// Program type from the database
type Program = {
  id: string;
  name: string;
  description: string | null;
  budget: number;
  start_date: string | null;
  end_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
};

// Form type for creating/editing a program
type ProgramFormData = {
  name: string;
  description: string;
  budget: string;
  start_date: Date | null;
  end_date: Date | null;
  status: string;
};

const Programs = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // State for form dialog
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentProgramId, setCurrentProgramId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<ProgramFormData>({
    name: "",
    description: "",
    budget: "",
    start_date: null,
    end_date: null,
    status: "active",
  });
  
  // Reset form function
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      budget: "",
      start_date: null,
      end_date: null,
      status: "active",
    });
    setIsEditMode(false);
    setCurrentProgramId(null);
  };
  
  // Fetch programs
  const { data: programs, isLoading, error } = useQuery({
    queryKey: ["programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .eq("user_id", user?.id ?? '')
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      return data as Program[];
    },
    enabled: !!user,
  });
  
  // Create program mutation
  const createProgram = useMutation({
    mutationFn: async (program: ProgramFormData) => {
      const { data, error } = await supabase
        .from("programs")
        .insert([
          {
            name: program.name,
            description: program.description || null,
            budget: parseFloat(program.budget),
            start_date: program.start_date ? format(program.start_date, "yyyy-MM-dd") : null,
            end_date: program.end_date ? format(program.end_date, "yyyy-MM-dd") : null,
            status: program.status,
            user_id: user?.id,
          },
        ])
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      toast.success("Program created successfully");
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create program: ${error.message}`);
    },
  });
  
  // Update program mutation
  const updateProgram = useMutation({
    mutationFn: async ({ id, program }: { id: string; program: ProgramFormData }) => {
      const { data, error } = await supabase
        .from("programs")
        .update({
          name: program.name,
          description: program.description || null,
          budget: parseFloat(program.budget),
          start_date: program.start_date ? format(program.start_date, "yyyy-MM-dd") : null,
          end_date: program.end_date ? format(program.end_date, "yyyy-MM-dd") : null,
          status: program.status,
        })
        .eq("id", id)
        .eq("user_id", user?.id ?? '')
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      toast.success("Program updated successfully");
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to update program: ${error.message}`);
    },
  });
  
  // Delete program mutation
  const deleteProgram = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("programs")
        .delete()
        .eq("id", id)
        .eq("user_id", user?.id ?? '');
        
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      toast.success("Program deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete program: ${error.message}`);
    },
  });
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.budget) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    if (isEditMode && currentProgramId) {
      updateProgram.mutate({ id: currentProgramId, program: formData });
    } else {
      createProgram.mutate(formData);
    }
  };
  
  // Handle edit program
  const handleEditProgram = (program: Program) => {
    setFormData({
      name: program.name,
      description: program.description || "",
      budget: program.budget.toString(),
      start_date: program.start_date ? parseISO(program.start_date) : null,
      end_date: program.end_date ? parseISO(program.end_date) : null,
      status: program.status,
    });
    setIsEditMode(true);
    setCurrentProgramId(program.id);
    setIsOpen(true);
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-gray-200">Programs</h1>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsOpen(true); }}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Program
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{isEditMode ? "Edit Program" : "Add New Program"}</DialogTitle>
              <DialogDescription>
                {isEditMode 
                  ? "Update the program details below."
                  : "Fill in the program details to create a new program."}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Program name"
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Program description"
                    rows={3}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="budget">Budget *</Label>
                  <Input
                    id="budget"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.start_date ? (
                            format(formData.start_date, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.start_date || undefined}
                          onSelect={(date) => setFormData({ ...formData, start_date: date })}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.end_date ? (
                            format(formData.end_date, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.end_date || undefined}
                          onSelect={(date) => setFormData({ ...formData, end_date: date })}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    resetForm();
                    setIsOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {isEditMode ? "Update Program" : "Create Program"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center p-8">
          <p className="text-gray-500 dark:text-gray-400">Loading programs...</p>
        </div>
      ) : error ? (
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <p className="text-red-600 dark:text-red-400">
              Error loading programs: {error.message}
            </p>
          </CardContent>
        </Card>
      ) : programs && programs.length > 0 ? (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Program List</CardTitle>
              <CardDescription>
                Manage your programs, budgets, and timelines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead className="hidden md:table-cell">Dates</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programs.map((program) => (
                    <TableRow key={program.id}>
                      <TableCell className="font-medium">{program.name}</TableCell>
                      <TableCell>
                        {formatCurrency(parseFloat(program.budget.toString()))}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {program.start_date && program.end_date ? (
                          <>
                            {format(parseISO(program.start_date), "MM/dd/yyyy")} - {format(parseISO(program.end_date), "MM/dd/yyyy")}
                          </>
                        ) : program.start_date ? (
                          <>From {format(parseISO(program.start_date), "MM/dd/yyyy")}</>
                        ) : program.end_date ? (
                          <>Until {format(parseISO(program.end_date), "MM/dd/yyyy")}</>
                        ) : (
                          "No dates set"
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            program.status === "active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : program.status === "completed"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              : program.status === "on-hold"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                        >
                          {program.status.charAt(0).toUpperCase() + program.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditProgram(program)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-red-500" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the program "{program.name}". 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => deleteProgram.mutate(program.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border-dashed border-2">
          <CardContent className="pt-6 flex flex-col items-center justify-center p-8 text-center">
            <FolderOpen className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No programs yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              You haven't created any programs yet. Create your first program to get started.
            </p>
            <Button onClick={() => { resetForm(); setIsOpen(true); }}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Your First Program
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Programs;
