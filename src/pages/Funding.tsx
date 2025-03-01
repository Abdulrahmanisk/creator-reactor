
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

// Define funding types based on Supabase enum
type FundingType = "Grant" | "Investment" | "Internal" | "Other";

// Define Funding interface
interface Funding {
  id: string;
  source: string;
  amount: number;
  type: FundingType;
  contact_name?: string | null;
  contact_email?: string | null;
  program_id?: string | null;
  program_name?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// New Funding form interface
interface FundingFormData {
  source: string;
  amount: number;
  type: FundingType;
  contact_name?: string;
  contact_email?: string;
  program_id?: string;
}

export default function Funding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State for dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // State for form data
  const [formData, setFormData] = useState<FundingFormData>({
    source: "",
    amount: 0,
    type: "Grant",
    contact_name: "",
    contact_email: ""
  });
  
  // State for selected funding for edit/delete
  const [selectedFunding, setSelectedFunding] = useState<Funding | null>(null);
  
  // Get all programs for dropdown
  const { data: programs } = useQuery({
    queryKey: ["programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("programs")
        .select("id, name")
        .eq("user_id", user?.id)
        .order("name");
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
    enabled: !!user
  });
  
  // Get all funding with program names
  const { data: funding, isLoading } = useQuery({
    queryKey: ["funding"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("funding")
        .select(`
          *,
          programs:program_id (
            name
          )
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data.map(item => ({
        ...item,
        program_name: item.programs?.name || "No Program"
      })) as Funding[];
    },
    enabled: !!user
  });
  
  // Create new funding
  const createFunding = useMutation({
    mutationFn: async (data: FundingFormData) => {
      const { error } = await supabase
        .from("funding")
        .insert({
          ...data,
          user_id: user?.id
        });
      
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funding"] });
      setIsAddDialogOpen(false);
      resetForm();
      toast.success("Funding added successfully");
    },
    onError: (error) => {
      toast.error(`Failed to add funding: ${error.message}`);
    }
  });
  
  // Update funding
  const updateFunding = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: FundingFormData }) => {
      const { error } = await supabase
        .from("funding")
        .update(data)
        .eq("id", id)
        .eq("user_id", user?.id);
      
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funding"] });
      setIsEditDialogOpen(false);
      resetForm();
      toast.success("Funding updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update funding: ${error.message}`);
    }
  });
  
  // Delete funding
  const deleteFunding = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("funding")
        .delete()
        .eq("id", id)
        .eq("user_id", user?.id);
      
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funding"] });
      setIsDeleteDialogOpen(false);
      setSelectedFunding(null);
      toast.success("Funding deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete funding: ${error.message}`);
    }
  });
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "amount" ? parseFloat(value) || 0 : value
    });
  };
  
  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Reset form
  const resetForm = () => {
    setFormData({
      source: "",
      amount: 0,
      type: "Grant",
      contact_name: "",
      contact_email: ""
    });
    setSelectedFunding(null);
  };
  
  // Open edit dialog with funding data
  const openEditDialog = (funding: Funding) => {
    setSelectedFunding(funding);
    setFormData({
      source: funding.source,
      amount: funding.amount,
      type: funding.type,
      contact_name: funding.contact_name || "",
      contact_email: funding.contact_email || "",
      program_id: funding.program_id || undefined
    });
    setIsEditDialogOpen(true);
  };
  
  // Open delete dialog
  const openDeleteDialog = (funding: Funding) => {
    setSelectedFunding(funding);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle add funding submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createFunding.mutate(formData);
  };
  
  // Handle edit funding submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFunding) {
      updateFunding.mutate({ id: selectedFunding.id, data: formData });
    }
  };
  
  // Handle delete funding
  const handleDelete = () => {
    if (selectedFunding) {
      deleteFunding.mutate(selectedFunding.id);
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Funding Management</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
              Add New Funding
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Funding</DialogTitle>
              <DialogDescription>
                Enter the details for the new funding source.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="source" className="text-right">Source</Label>
                  <Input
                    id="source"
                    name="source"
                    value={formData.source}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">Amount</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="col-span-3"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleSelectChange("type", value)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Grant">Grant</SelectItem>
                      <SelectItem value="Investment">Investment</SelectItem>
                      <SelectItem value="Internal">Internal</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="program_id" className="text-right">Program</Label>
                  <Select
                    value={formData.program_id || "none"}
                    onValueChange={(value) => handleSelectChange("program_id", value === "none" ? "" : value)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select program (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Program</SelectItem>
                      {programs?.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="contact_name" className="text-right">Contact Name</Label>
                  <Input
                    id="contact_name"
                    name="contact_name"
                    value={formData.contact_name}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="contact_email" className="text-right">Contact Email</Label>
                  <Input
                    id="contact_email"
                    name="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createFunding.isPending}>
                  {createFunding.isPending ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funding Sources</CardTitle>
          <CardDescription>
            Manage your funding sources and allocations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-6">Loading...</div>
          ) : funding && funding.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {funding.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.source}</TableCell>
                    <TableCell>${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.program_name}</TableCell>
                    <TableCell>
                      {item.contact_name && (
                        <>
                          {item.contact_name}
                          {item.contact_email && (
                            <div className="text-xs text-muted-foreground">
                              {item.contact_email}
                            </div>
                          )}
                        </>
                      )}
                    </TableCell>
                    <TableCell>{format(new Date(item.created_at), "MM/dd/yyyy")}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(item)}>
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(item)}>
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-6">
              No funding records found. Add your first funding source by clicking the "Add New Funding" button.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Funding</DialogTitle>
            <DialogDescription>
              Update the funding source details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-source" className="text-right">Source</Label>
                <Input
                  id="edit-source"
                  name="source"
                  value={formData.source}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-amount" className="text-right">Amount</Label>
                <Input
                  id="edit-amount"
                  name="amount"
                  type="number"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="col-span-3"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-type" className="text-right">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleSelectChange("type", value as FundingType)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Grant">Grant</SelectItem>
                    <SelectItem value="Investment">Investment</SelectItem>
                    <SelectItem value="Internal">Internal</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-program" className="text-right">Program</Label>
                <Select
                  value={formData.program_id || "none"}
                  onValueChange={(value) => handleSelectChange("program_id", value === "none" ? "" : value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select program (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Program</SelectItem>
                    {programs?.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-contact-name" className="text-right">Contact Name</Label>
                <Input
                  id="edit-contact-name"
                  name="contact_name"
                  value={formData.contact_name}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-contact-email" className="text-right">Contact Email</Label>
                <Input
                  id="edit-contact-email"
                  name="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={updateFunding.isPending}>
                {updateFunding.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the funding record for "{selectedFunding?.source}". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteFunding.isPending}>
              {deleteFunding.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
