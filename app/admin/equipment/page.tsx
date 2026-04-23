"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package,
  DollarSign,
  Stock,
  Eye
} from "lucide-react";
import { toast } from "sonner";

interface Equipment {
  id: string;
  name: string;
  description?: string;
  price_per_day: number;
  stock: number;
  image_url?: string;
  category?: string;
  created_at: string;
  updated_at: string;
}

export default function EquipmentManagement() {
  const router = useRouter();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price_per_day: "",
    stock: "",
    category: "",
    image_url: ""
  });

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("equipment")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching equipment:", error);
        toast.error("Failed to load equipment");
        return;
      }

      setEquipment(data || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load equipment");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const submitData = {
        name: formData.name,
        description: formData.description,
        price_per_day: parseFloat(formData.price_per_day),
        stock: parseInt(formData.stock),
        category: formData.category,
        image_url: formData.image_url || null
      };

      if (editingItem) {
        // Update existing equipment
        const { error } = await supabase
          .from("equipment")
          .update(submitData)
          .eq("id", editingItem.id);

        if (error) throw error;
        toast.success("Equipment updated successfully!");
      } else {
        // Add new equipment
        const { error } = await supabase
          .from("equipment")
          .insert(submitData);

        if (error) throw error;
        toast.success("Equipment added successfully!");
      }

      // Reset form and refresh data
      setFormData({
        name: "",
        description: "",
        price_per_day: "",
        stock: "",
        category: "",
        image_url: ""
      });
      setShowAddForm(false);
      setEditingItem(null);
      fetchEquipment();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to save equipment");
    }
  };

  const handleEdit = (item: Equipment) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      price_per_day: item.price_per_day.toString(),
      stock: item.stock.toString(),
      category: item.category || "",
      image_url: item.image_url || ""
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this equipment?")) return;

    try {
      const { error } = await supabase
        .from("equipment")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Equipment deleted successfully!");
      fetchEquipment();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to delete equipment");
    }
  };

  const filteredEquipment = equipment.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push("/admin")}>
                ← Back
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Equipment Management</h1>
            </div>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Equipment
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Search Bar */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search equipment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="outline" className="w-fit">
              {filteredEquipment.length} items
            </Badge>
          </div>
        </Card>

        {/* Equipment Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
          {filteredEquipment.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {item.image_url ? (
                <div className="h-36 sm:h-40 lg:h-48 bg-gray-100">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-36 sm:h-40 lg:h-48 bg-gray-100 flex items-center justify-center">
                  <Package className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-gray-400" />
                </div>
              )}
              
              <div className="p-3 lg:p-4">
                <h3 className="font-semibold text-gray-900 mb-1 lg:mb-2 text-sm lg:text-base">{item.name}</h3>
                
                {item.description && (
                  <p className="text-xs lg:text-sm text-gray-600 mb-2 lg:mb-3 line-clamp-2">{item.description}</p>
                )}
                
                {item.category && (
                  <Badge variant="secondary" className="mb-2 lg:mb-3 text-xs">{item.category}</Badge>
                )}
                
                <div className="space-y-1 lg:space-y-2 text-xs lg:text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Price/day:</span>
                    <span className="font-medium">{formatCurrency(item.price_per_day)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Stock:</span>
                    <span className={`font-medium ${
                      item.stock_quantity > 5 ? 'text-green-600' : 
                      item.stock_quantity > 0 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {item.stock_quantity} {item.stock_quantity > 1 ? 'units' : 'unit'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge className={
                      item.is_available 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }>
                      {item.is_available ? 'Available' : 'Unavailable'}
                    </Badge>
                  </div>
                </div>
                
                <div className="mt-3 lg:mt-4 flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 text-xs lg:text-sm"
                    onClick={() => viewEquipment(item.id)}
                  >
                    <Eye className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                    View
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 text-xs lg:text-sm"
                    onClick={() => editEquipment(item.id)}
                  >
                    <Edit className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredEquipment.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No equipment found</h3>
            <p className="text-gray-600 mb-4">Get started by adding your first equipment item.</p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Equipment
            </Button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingItem ? "Edit Equipment" : "Add New Equipment"}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="price_per_day">Price per Day *</Label>
                <Input
                  id="price_per_day"
                  type="number"
                  step="0.01"
                  value={formData.price_per_day}
                  onChange={(e) => setFormData({...formData, price_per_day: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="stock">Stock *</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  {editingItem ? "Update" : "Add"} Equipment
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingItem(null);
                    setFormData({
                      name: "",
                      description: "",
                      price_per_day: "",
                      stock: "",
                      category: "",
                      image_url: ""
                    });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
