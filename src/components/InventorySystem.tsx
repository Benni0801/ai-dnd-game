'use client';

import React, { useState, useImperativeHandle, forwardRef } from 'react';

interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'consumable' | 'tool' | 'misc';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  value: number;
  weight: number;
  description: string;
  quantity: number;
  equipped?: boolean;
  stats?: {
    damage?: string;
    armor?: number;
    bonus?: number;
  };
}

interface InventorySystemProps {
  characterStats: any;
  onInventoryChange: (items: Item[]) => void;
  initialInventory?: Item[];
  onAddItem?: (item: Item) => void;
}

export interface InventorySystemRef {
  addItem: (item: Item) => void;
  getItems: () => Item[];
}

const STARTER_ITEMS: Item[] = [
  {
    id: '1',
    name: 'Iron Sword',
    type: 'weapon',
    rarity: 'common',
    value: 10,
    weight: 3,
    description: 'A sturdy iron sword, reliable in combat.',
    quantity: 1,
    equipped: true,
    stats: { damage: '1d8+1' }
  },
  {
    id: '2',
    name: 'Leather Armor',
    type: 'armor',
    rarity: 'common',
    value: 10,
    weight: 10,
    description: 'Basic leather armor providing minimal protection.',
    quantity: 1,
    equipped: true,
    stats: { armor: 1 }
  },
  {
    id: '3',
    name: 'Health Potion',
    type: 'consumable',
    rarity: 'common',
    value: 25,
    weight: 0.5,
    description: 'A red potion that restores 2d4+2 hit points.',
    quantity: 3,
    stats: { bonus: 2 }
  },
  {
    id: '4',
    name: 'Rope (50ft)',
    type: 'tool',
    rarity: 'common',
    value: 2,
    weight: 10,
    description: 'Strong hemp rope, useful for climbing and binding.',
    quantity: 1
  },
  {
    id: '5',
    name: 'Torch',
    type: 'tool',
    rarity: 'common',
    value: 1,
    weight: 1,
    description: 'A wooden torch that burns for 1 hour.',
    quantity: 5
  }
];

const InventorySystem = forwardRef<InventorySystemRef, InventorySystemProps>(({ characterStats, onInventoryChange, initialInventory, onAddItem }, ref) => {
  const [items, setItems] = useState<Item[]>(initialInventory || STARTER_ITEMS);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState<Partial<Item>>({
    name: '',
    type: 'misc',
    rarity: 'common',
    value: 0,
    weight: 0,
    description: '',
    quantity: 1
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-300';
      case 'uncommon': return 'text-green-400';
      case 'rare': return 'text-blue-400';
      case 'epic': return 'text-purple-400';
      case 'legendary': return 'text-yellow-400';
      default: return 'text-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'weapon': return '⚔️';
      case 'armor': return '🛡️';
      case 'consumable': return '🧪';
      case 'tool': return '🔧';
      case 'misc': return '📦';
      default: return '📦';
    }
  };

  const equipItem = (item: Item) => {
    if (item.type === 'weapon' || item.type === 'armor') {
      const updatedItems = items.map(i => {
        if (i.id === item.id) {
          return { ...i, equipped: !i.equipped };
        }
        // Unequip other items of the same type
        if (i.type === item.type && i.equipped) {
          return { ...i, equipped: false };
        }
        return i;
      });
      setItems(updatedItems);
      onInventoryChange(updatedItems);
    }
  };

  // Function to add items from external sources (like AI)
  const addItem = (item: Item) => {
    const newItem = {
      ...item,
      id: item.id || `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    // Check if item already exists (by name) and stack it
    const existingItemIndex = items.findIndex(i => i.name === newItem.name && i.type === newItem.type);
    
    if (existingItemIndex !== -1) {
      // Stack the item
      const updatedItems = [...items];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + newItem.quantity
      };
      setItems(updatedItems);
      onInventoryChange(updatedItems);
    } else {
      // Add new item
      const updatedItems = [...items, newItem];
      setItems(updatedItems);
      onInventoryChange(updatedItems);
    }
    
    // Notify parent component
    if (onAddItem) {
      onAddItem(newItem);
    }
  };

  // Expose functions to parent component
  useImperativeHandle(ref, () => ({
    addItem,
    getItems: () => items
  }));

  const consumeItem = (item: Item) => {
    if (item.type === 'consumable') {
      const updatedItems = items.map(i => {
        if (i.id === item.id) {
          const newQuantity = i.quantity - 1;
          return newQuantity > 0 ? { ...i, quantity: newQuantity } : null;
        }
        return i;
      }).filter(Boolean) as Item[];
      
      setItems(updatedItems);
      onInventoryChange(updatedItems);
      
      // Apply item effect (this would integrate with character stats)
      if (item.name.includes('Health Potion')) {
        // Restore HP logic would go here
        console.log('Used health potion!');
      }
    }
  };

  const addNewItem = () => {
    if (newItem.name) {
      const item: Item = {
        id: Date.now().toString(),
        name: newItem.name,
        type: newItem.type as any,
        rarity: newItem.rarity as any,
        value: newItem.value || 0,
        weight: newItem.weight || 0,
        description: newItem.description || '',
        quantity: newItem.quantity || 1
      };
      
      const updatedItems = [...items, item];
      setItems(updatedItems);
      onInventoryChange(updatedItems);
      setNewItem({
        name: '',
        type: 'misc',
        rarity: 'common',
        value: 0,
        weight: 0,
        description: '',
        quantity: 1
      });
      setShowAddItem(false);
    }
  };

  const removeItem = (itemId: string) => {
    const updatedItems = items.filter(item => item.id !== itemId);
    setItems(updatedItems);
    onInventoryChange(updatedItems);
  };

  const totalWeight = items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
  const totalValue = items.reduce((sum, item) => sum + (item.value * item.quantity), 0);

  return (
    <div className="inventory-system bg-gray-800 p-4 rounded-lg border border-gray-600">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white flex items-center">
          🎒 Inventory
        </h3>
        <button
          onClick={() => setShowAddItem(true)}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
        >
          + Add Item
        </button>
      </div>

      {/* Inventory Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div className="bg-gray-700 p-2 rounded">
          <div className="text-gray-300">Total Weight</div>
          <div className="text-white font-bold">{totalWeight.toFixed(1)} lbs</div>
        </div>
        <div className="bg-gray-700 p-2 rounded">
          <div className="text-gray-300">Total Value</div>
          <div className="text-white font-bold">{totalValue} gp</div>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {items.map(item => (
          <div
            key={item.id}
            className={`p-3 rounded border cursor-pointer transition-colors ${
              selectedItem?.id === item.id
                ? 'bg-blue-600 border-blue-500'
                : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
            }`}
            onClick={() => setSelectedItem(item)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getTypeIcon(item.type)}</span>
                  <span className={`font-bold ${getRarityColor(item.rarity)}`}>
                    {item.name}
                    {item.equipped && ' (Equipped)'}
                  </span>
                  {item.quantity > 1 && (
                    <span className="text-gray-400 text-sm">x{item.quantity}</span>
                  )}
                </div>
                <div className="text-gray-300 text-sm mt-1">
                  {item.description}
                </div>
                <div className="flex gap-4 text-xs text-gray-400 mt-1">
                  <span>Value: {item.value} gp</span>
                  <span>Weight: {item.weight} lbs</span>
                  {item.stats?.damage && <span>Damage: {item.stats.damage}</span>}
                  {item.stats?.armor && <span>AC: +{item.stats.armor}</span>}
                </div>
              </div>
              <div className="flex gap-1 ml-2">
                {(item.type === 'weapon' || item.type === 'armor') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      equipItem(item);
                    }}
                    className={`px-2 py-1 text-xs rounded ${
                      item.equipped
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-gray-600 hover:bg-gray-500'
                    } text-white`}
                  >
                    {item.equipped ? 'Equipped' : 'Equip'}
                  </button>
                )}
                {item.type === 'consumable' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      consumeItem(item);
                    }}
                    className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded"
                  >
                    Use
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeItem(item.id);
                  }}
                  className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-600 w-96">
            <h4 className="text-lg font-bold text-white mb-4">Add New Item</h4>
            
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Item Name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600"
              />
              
              <select
                value={newItem.type}
                onChange={(e) => setNewItem({ ...newItem, type: e.target.value as any })}
                className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600"
              >
                <option value="weapon">Weapon</option>
                <option value="armor">Armor</option>
                <option value="consumable">Consumable</option>
                <option value="tool">Tool</option>
                <option value="misc">Miscellaneous</option>
              </select>
              
              <select
                value={newItem.rarity}
                onChange={(e) => setNewItem({ ...newItem, rarity: e.target.value as any })}
                className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600"
              >
                <option value="common">Common</option>
                <option value="uncommon">Uncommon</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
              </select>
              
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Value (gp)"
                  value={newItem.value}
                  onChange={(e) => setNewItem({ ...newItem, value: parseInt(e.target.value) || 0 })}
                  className="p-2 bg-gray-700 text-white rounded border border-gray-600"
                />
                <input
                  type="number"
                  step="0.1"
                  placeholder="Weight (lbs)"
                  value={newItem.weight}
                  onChange={(e) => setNewItem({ ...newItem, weight: parseFloat(e.target.value) || 0 })}
                  className="p-2 bg-gray-700 text-white rounded border border-gray-600"
                />
              </div>
              
              <textarea
                placeholder="Description"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 h-20"
              />
            </div>
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={addNewItem}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Add Item
              </button>
              <button
                onClick={() => setShowAddItem(false)}
                className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

InventorySystem.displayName = 'InventorySystem';

export default InventorySystem;
