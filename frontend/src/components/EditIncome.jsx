import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const EditIncomeModal = ({ 
  isEditModalOpen, 
  setIsEditModalOpen, 
  newIncome, 
  setNewIncome, 
  userType, 
  isDarkMode,
  categories,
  sources,
  incomes,
  setIncomes,
  recurringIncomes,
  setRecurringIncomes
}) => {
  const [loading, setLoading] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState("monthly");

  // Set initial recurring state when modal opens
  useEffect(() => {
    if (newIncome) {
      setIsRecurring(newIncome.isRecurring || false);
      setFrequency(newIncome.frequency || "monthly");
    }
  }, [newIncome]);

  const handleUpdateIncome = async () => {
    if (!newIncome || !newIncome.title || 
        (userType === "individual" ? !newIncome.amount : (!newIncome.units || !newIncome.pricePerUnit)) || 
        !newIncome.category) return;

    try {
      setLoading(true);

      const incomeData = {
        title: newIncome.title,
        category: newIncome.category,
        date: new Date(newIncome.date),
        source: newIncome.source || "",
        notes: newIncome.notes || ""
      };
      
      // Add type-specific fields
      if (userType === "individual") {
        incomeData.amount = parseFloat(newIncome.amount);
      } else {
        incomeData.units = parseFloat(newIncome.units);
        incomeData.pricePerUnit = parseFloat(newIncome.pricePerUnit);
      }

      // Add recurring fields if it's a recurring income
      if (isRecurring) {
        incomeData.isRecurring = true;
        incomeData.frequency = frequency;
        incomeData.startDate = new Date(newIncome.date);
      }

      const isRecurringIncome = newIncome.isRecurring || isRecurring;

      // Make API request with cookies
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/income/${newIncome._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(incomeData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Income Updated:", data);

        // Update local state based on whether it's a recurring income
        if (isRecurringIncome) {
          const updatedRecurringIncomes = recurringIncomes.map((income) =>
            income._id === newIncome._id
              ? { ...income, ...incomeData }
              : income
          );
          setRecurringIncomes(updatedRecurringIncomes);
        } else {
          const updatedIncomes = incomes.map((income) =>
            income._id === newIncome._id
              ? { ...income, ...incomeData }
              : income
          );
          setIncomes(updatedIncomes);
        }

        setIsEditModalOpen(false);
        // Reset the form
        setNewIncome({
          title: '',
          amount: '',
          units: '',
          pricePerUnit: '',
          category: '',
          date: '',
          source: '',
          notes: '',
          isRecurring: false
        });
      } else {
        console.error("Failed to update income");
        alert("Failed to update income. Please try again.");
      }
    } catch (error) {
      console.error("Error updating income:", error);
      alert("Error updating income. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
      <DialogContent className={`p-6 max-h-[90vh] overflow-y-auto ${isDarkMode ? "bg-gray-900 text-white border-gray-800" : "bg-white text-black"}`}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Edit {isRecurring ? "Recurring" : ""} Income
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 my-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Title</label>
            <Input
              type="text"
              placeholder={userType === "individual" ? "Salary, Freelance work, etc." : "Product sales, Service fees, etc."}
              className={isDarkMode ? "bg-gray-800 border-gray-700 text-white" : ""}
              value={newIncome.title || ""}
              onChange={(e) => setNewIncome({ ...newIncome, title: e.target.value })}
            />
          </div>
          
          {userType === "individual" ? (
            <div>
              <label className="text-sm font-medium mb-1 block">Amount (₹)</label>
              <Input
                type="number"
                placeholder="0.00"
                className={isDarkMode ? "bg-gray-800 border-gray-700 text-white" : ""}
                value={newIncome.amount || ""}
                onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Units</label>
                <Input
                  type="number"
                  placeholder="Quantity"
                  className={isDarkMode ? "bg-gray-800 border-gray-700 text-white" : ""}
                  value={newIncome.units || ""}
                  onChange={(e) => setNewIncome({ ...newIncome, units: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Price per Unit (₹)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  className={isDarkMode ? "bg-gray-800 border-gray-700 text-white" : ""}
                  value={newIncome.pricePerUnit || ""}
                  onChange={(e) => setNewIncome({ ...newIncome, pricePerUnit: e.target.value })}
                />
              </div>
              {newIncome.units && newIncome.pricePerUnit && (
                <div className="col-span-2">
                  <label className="text-sm font-medium mb-1 block">Total Amount (₹)</label>
                  <Input
                    type="text"
                    readOnly
                    className={`${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : ""} cursor-not-allowed`}
                    value={(parseFloat(newIncome.units) * parseFloat(newIncome.pricePerUnit)).toFixed(2)}
                  />
                </div>
              )}
            </div>
          )}
          
          <div>
            <label className="text-sm font-medium mb-1 block">Category</label>
            <Select
              value={newIncome.category || ""}
              onValueChange={(value) => setNewIncome({ ...newIncome, category: value })}
            >
              <SelectTrigger className={isDarkMode ? "bg-gray-800 border-gray-700 text-white" : ""}>
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent className={isDarkMode ? "bg-gray-800 border-gray-700 text-white" : ""}>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Date</label>
            <Input
              type="date"
              className={isDarkMode ? "bg-gray-800 border-gray-700 text-white" : ""}
              value={newIncome.date || ""}
              onChange={(e) => setNewIncome({ ...newIncome, date: e.target.value })}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Source</label>
            <Select
              value={newIncome.source || ""}
              onValueChange={(value) => setNewIncome({ ...newIncome, source: value })}
            >
              <SelectTrigger className={isDarkMode ? "bg-gray-800 border-gray-700 text-white" : ""}>
                <SelectValue placeholder="Select Source" />
              </SelectTrigger>
              <SelectContent className={isDarkMode ? "bg-gray-800 border-gray-700 text-white" : ""}>
                {sources.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Recurring options */}
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="isRecurring" 
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
              className={isDarkMode ? "border-gray-600" : ""}
            />
            <label
              htmlFor="isRecurring"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              This is a recurring income
            </label>
          </div>
          
          {isRecurring && (
            <div>
              <label className="text-sm font-medium mb-1 block">Frequency</label>
              <Select
                value={frequency}
                onValueChange={setFrequency}
              >
                <SelectTrigger className={isDarkMode ? "bg-gray-800 border-gray-700 text-white" : ""}>
                  <SelectValue placeholder="Select Frequency" />
                </SelectTrigger>
                <SelectContent className={isDarkMode ? "bg-gray-800 border-gray-700 text-white" : ""}>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="biannually">Bi-Annually</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div>
            <label className="text-sm font-medium mb-1 block">Notes (Optional)</label>
            <Input
              type="text"
              placeholder="Additional information"
              className={isDarkMode ? "bg-gray-800 border-gray-700 text-white" : ""}
              value={newIncome.notes || ""}
              onChange={(e) => setNewIncome({ ...newIncome, notes: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-4">
          <DialogClose asChild>
            <Button variant="outline" className={isDarkMode ? "bg-gray-600 hover:bg-red-700 text-white" : ""}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleUpdateIncome}
            disabled={!newIncome.title || (userType === "individual" ? !newIncome.amount : (!newIncome.units || !newIncome.pricePerUnit)) || !newIncome.category || loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? "Updating..." : "Update Income"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditIncomeModal;