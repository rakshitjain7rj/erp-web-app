// src/pages/ASUUnit1Page.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';

import { 
  asuUnit1Api, 
  ASUMachine, 
  ASUProductionEntry, 
  CreateProductionEntryData,
  ProductionStats 
} from '../api/asuUnit1Api';

interface EditingEntry {
  id: number;
  dayShift: number;
  nightShift: number;
  date: string;
}

const ASUUnit1Page: React.FC = () => {
  const [machines, setMachines] = useState<ASUMachine[]>([]);
  const [productionEntries, setProductionEntries] = useState<ASUProductionEntry[]>([]);
  const [stats, setStats] = useState<ProductionStats | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<ASUMachine | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingEntry, setEditingEntry] = useState<EditingEntry | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<CreateProductionEntryData>({
    machineId: 0,
    date: new Date().toISOString().split('T')[0],
    dayShift: 0,
    nightShift: 0
  });

  // Define functions first
  const loadMachines = async () => {
    try {
      const machines = await asuUnit1Api.getMachines();
      setMachines(machines);
    } catch (error) {
      console.error('Error loading machines:', error);
      toast.error('Failed to load machines');
    }
  };

  const loadProductionEntries = useCallback(async () => {
    if (!selectedMachine) return;
    
    try {
      setLoading(true);
      const data = await asuUnit1Api.getProductionEntries({
        machineId: selectedMachine.id,
        limit: 30
      });
      
      setProductionEntries(data.items);
    } catch (error) {
      console.error('Error loading production entries:', error);
      toast.error('Failed to load production entries');
    } finally {
      setLoading(false);
    }
  }, [selectedMachine]);

  const loadStats = async () => {
    try {
      const stats = await asuUnit1Api.getProductionStats();
      setStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Load initial data
  useEffect(() => {
    loadMachines();
    loadStats();
  }, []);

  // Load production entries when machine is selected
  useEffect(() => {
    if (selectedMachine) {
      loadProductionEntries();
    }
  }, [selectedMachine, loadProductionEntries]);

  const handleMachineSelect = (machineId: string) => {
    const machine = machines.find(m => m.id === parseInt(machineId));
    setSelectedMachine(machine || null);
    setFormData(prev => ({ ...prev, machineId: parseInt(machineId) }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachine || !formData.machineId) {
      toast.error('Please select a machine');
      return;
    }

    try {
      setLoading(true);
      await asuUnit1Api.createProductionEntry(formData);
      
      toast.success('Production entry created successfully');
      setFormData({
        machineId: selectedMachine.id,
        date: new Date().toISOString().split('T')[0],
        dayShift: 0,
        nightShift: 0
      });
      loadProductionEntries();
      loadStats();
    } catch (error) {
      console.error('Error creating production entry:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create production entry';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry: ASUProductionEntry) => {
    setEditingEntry({
      id: entry.id,
      dayShift: entry.dayShift,
      nightShift: entry.nightShift,
      date: entry.date
    });
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;

    try {
      setLoading(true);
      await asuUnit1Api.updateProductionEntry(editingEntry.id, {
        dayShift: editingEntry.dayShift,
        nightShift: editingEntry.nightShift,
        date: editingEntry.date
      });

      toast.success('Production entry updated successfully');
      setEditingEntry(null);
      loadProductionEntries();
      loadStats();
    } catch (error) {
      console.error('Error updating production entry:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update production entry';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this production entry?')) {
      return;
    }

    try {
      setLoading(true);
      await asuUnit1Api.deleteProductionEntry(id);
      
      toast.success('Production entry deleted successfully');
      loadProductionEntries();
      loadStats();
    } catch (error) {
      console.error('Error deleting production entry:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete production entry';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = (dayShift: number, nightShift: number) => {
    return dayShift + nightShift;
  };

  const calculatePercentage = (total: number, productionAt100: number) => {
    if (productionAt100 === 0) return 0;
    return (total / productionAt100) * 100;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">ASU Unit 1 Production</h1>
        <Badge variant="secondary">Unit 1</Badge>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Machines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMachines}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Machines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeMachines}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Today's Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayEntries}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Efficiency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.averageEfficiency.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Machine Selection & Production Entry Form */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Production Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <Label htmlFor="machine">Select Machine</Label>
                <Select onValueChange={handleMachineSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a machine" />
                  </SelectTrigger>
                  <SelectContent>
                    {machines.map(machine => (
                      <SelectItem key={machine.id} value={machine.id.toString()}>
                        Machine {machine.machineNo} - {machine.count} Count
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedMachine && (
                <>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium mb-2">Machine Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Count: {selectedMachine.count}</div>
                      <div>Spindles: {selectedMachine.spindles}</div>
                      <div>Speed: {selectedMachine.speed} RPM</div>
                      <div>Production @ 100%: {selectedMachine.productionAt100} kg</div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="dayShift">Day Shift (kg)</Label>
                    <Input
                      id="dayShift"
                      type="number"
                      step="0.01"
                      value={formData.dayShift}
                      onChange={(e) => setFormData({ ...formData, dayShift: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="nightShift">Night Shift (kg)</Label>
                    <Input
                      id="nightShift"
                      type="number"
                      step="0.01"
                      value={formData.nightShift}
                      onChange={(e) => setFormData({ ...formData, nightShift: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Total: {calculateTotal(formData.dayShift, formData.nightShift)} kg</div>
                      <div>Efficiency: {calculatePercentage(calculateTotal(formData.dayShift, formData.nightShift), selectedMachine.productionAt100).toFixed(1)}%</div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Production Entry
                  </Button>
                </>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Production Entries Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Recent Production Entries
              {selectedMachine && ` - Machine ${selectedMachine.machineNo}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : productionEntries.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                {selectedMachine ? 'No production entries found' : 'Select a machine to view entries'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Day Shift</TableHead>
                      <TableHead>Night Shift</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Efficiency</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productionEntries.map(entry => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          {editingEntry?.id === entry.id ? (
                            <Input
                              type="date"
                              value={editingEntry.date}
                              onChange={(e) => setEditingEntry({ ...editingEntry, date: e.target.value })}
                              className="w-full"
                            />
                          ) : (
                            new Date(entry.date).toLocaleDateString()
                          )}
                        </TableCell>
                        <TableCell>
                          {editingEntry?.id === entry.id ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={editingEntry.dayShift}
                              onChange={(e) => setEditingEntry({ ...editingEntry, dayShift: parseFloat(e.target.value) || 0 })}
                              className="w-20"
                            />
                          ) : (
                            `${entry.dayShift} kg`
                          )}
                        </TableCell>
                        <TableCell>
                          {editingEntry?.id === entry.id ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={editingEntry.nightShift}
                              onChange={(e) => setEditingEntry({ ...editingEntry, nightShift: parseFloat(e.target.value) || 0 })}
                              className="w-20"
                            />
                          ) : (
                            `${entry.nightShift} kg`
                          )}
                        </TableCell>
                        <TableCell>
                          {editingEntry?.id === entry.id 
                            ? `${calculateTotal(editingEntry.dayShift, editingEntry.nightShift)} kg`
                            : `${entry.total} kg`
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant={entry.percentage >= 80 ? 'default' : entry.percentage >= 60 ? 'secondary' : 'destructive'}>
                            {editingEntry?.id === entry.id && selectedMachine
                              ? `${calculatePercentage(calculateTotal(editingEntry.dayShift, editingEntry.nightShift), selectedMachine.productionAt100).toFixed(1)}%`
                              : `${entry.percentage.toFixed(1)}%`
                            }
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {editingEntry?.id === entry.id ? (
                              <>
                                <Button size="sm" onClick={handleSaveEdit} disabled={loading}>
                                  <Save className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingEntry(null)}>
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button size="sm" variant="outline" onClick={() => handleEdit(entry)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDelete(entry.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ASUUnit1Page;
