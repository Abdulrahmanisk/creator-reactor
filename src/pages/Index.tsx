
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { PlusCircle, DollarSign, BarChart2, User } from "lucide-react";

const Index = () => {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome to Budget Management</h1>
          <p className="text-gray-600 mt-2">
            Manage your expenses, funding sources, and track your financial progress
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5" />
                Expenses
              </CardTitle>
              <CardDescription>
                Track and manage your expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Record expenses, categorize them, and track approval status.</p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link to="/expenses">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Manage Expenses
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5" />
                Funding
              </CardTitle>
              <CardDescription>
                Manage your funding sources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Track funding sources, amounts, and associate them with programs.</p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link to="/funding">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Manage Funding
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart2 className="mr-2 h-5 w-5" />
                Dashboard
              </CardTitle>
              <CardDescription>
                View financial insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Get a visual overview of your expenses, funding, and financial status.</p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link to="/dashboard">
                  <BarChart2 className="mr-2 h-4 w-4" />
                  View Dashboard
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Profile
              </CardTitle>
              <CardDescription>
                Manage your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Update your profile information, preferences, and account settings.</p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link to="/profile">
                  <User className="mr-2 h-4 w-4" />
                  View Profile
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
