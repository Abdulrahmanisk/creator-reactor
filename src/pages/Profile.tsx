
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Moon, Sun, UserCircle, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [displayName, setDisplayName] = useState("");
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    onSettled: (data) => {
      if (data) {
        setDisplayName(data.display_name || "");
        setIsDarkTheme(data.theme_preference === "dark");
      }
    },
    enabled: !!user?.id,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (newProfile: { display_name: string, theme_preference: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update(newProfile)
        .eq('id', user?.id);
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success("Profile updated successfully");
    },
    onError: (error: any) => {
      toast.error(`Error updating profile: ${error.message}`);
    }
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      display_name: displayName,
      theme_preference: isDarkTheme ? "dark" : "light"
    });
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading profile...</div>;
  }

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
                <Button variant="ghost" onClick={() => navigate('/programs')}>Programs</Button>
                <Button variant="ghost" onClick={() => navigate('/expenses')}>Expenses</Button>
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
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Your Profile</h1>
        
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="bg-gray-200 rounded-full p-4">
                  <UserCircle className="h-12 w-12 text-gray-500" />
                </div>
                <div>
                  <CardTitle>{profile?.display_name || user?.email}</CardTitle>
                  <CardDescription>{user?.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input 
                  id="displayName"
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Theme Preference</Label>
                <div className="flex items-center space-x-4">
                  <div className="flex-1 flex items-center space-x-2">
                    <Sun className="h-5 w-5 text-yellow-500" />
                    <span>Light</span>
                  </div>
                  <Switch 
                    checked={isDarkTheme}
                    onCheckedChange={setIsDarkTheme}
                  />
                  <div className="flex-1 flex items-center space-x-2">
                    <Moon className="h-5 w-5 text-blue-700" />
                    <span>Dark</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t pt-4">
              <Button onClick={handleSaveProfile}>
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
