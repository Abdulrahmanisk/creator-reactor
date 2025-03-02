
import React, { useState, useRef, ChangeEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { User, Upload } from "lucide-react";

const Profile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    display_name: "",
    theme_preference: "light",
  });
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch user profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
        
      if (error) {
        toast.error("Error fetching profile");
        throw error;
      }
      
      return data;
    },
    enabled: !!user,
    onSuccess: (data) => {
      if (data) {
        setFormData({
          display_name: data.display_name || "",
          theme_preference: data.theme_preference || "light",
        });
      }
    }
  });

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", user.id);

      if (error) throw error;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Profile updated successfully");
    },
    onError: (error: any) => {
      toast.error("Error updating profile: " + error.message);
    },
  });

  // Handle avatar upload
  const uploadAvatar = async (file: File) => {
    if (!user) return null;
    
    setIsUploading(true);
    
    try {
      // Create unique file path
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}-${Date.now()}.${fileExt}`;
      
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });
        
      if (uploadError) {
        throw uploadError;
      }
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);
        
      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl })
        .eq("id", user.id);
        
      if (updateError) {
        throw updateError;
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Avatar updated successfully");
      
    } catch (error: any) {
      toast.error("Error uploading avatar: " + error.message);
      console.error("Avatar upload error:", error);
    } finally {
      setIsUploading(false);
      setAvatarFile(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(formData);
    
    if (avatarFile) {
      uploadAvatar(avatarFile);
    }
  };

  const handleAvatarSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (isLoading) {
    return <div className="container mx-auto py-12 text-center">Loading profile...</div>;
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl">
      <Card className="border rounded-lg shadow-sm dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Your Profile</CardTitle>
          <CardDescription>
            Update your personal information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="relative">
                <Avatar className="h-24 w-24 mb-2 cursor-pointer" onClick={triggerFileInput}>
                  {avatarFile ? (
                    <AvatarImage src={URL.createObjectURL(avatarFile)} alt="Preview" />
                  ) : (
                    <AvatarImage src={profile?.avatar_url || ""} alt="User avatar" />
                  )}
                  <AvatarFallback className="text-lg">
                    {profile?.display_name?.charAt(0)?.toUpperCase() || 
                     user?.email?.charAt(0)?.toUpperCase() || <User />}
                  </AvatarFallback>
                </Avatar>
                <Button 
                  type="button"
                  size="icon"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={triggerFileInput}
                >
                  <Upload size={16} />
                </Button>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleAvatarSelect}
              />
              <p className="text-sm text-muted-foreground mt-2">
                Click on the avatar to upload a new image
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleInputChange}
                  placeholder="Enter your display name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="mt-1 bg-gray-100 dark:bg-gray-800"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Email cannot be changed
                </p>
              </div>

              <div>
                <Label htmlFor="theme_preference">Theme Preference</Label>
                <Select
                  value={formData.theme_preference}
                  onValueChange={(value) => handleSelectChange("theme_preference", value)}
                >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end space-x-4">
          <Button variant="outline" type="button" onClick={() => window.history.back()}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={handleSubmit} 
            disabled={updateProfile.isPending || isUploading}
          >
            {(updateProfile.isPending || isUploading) ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Profile;
