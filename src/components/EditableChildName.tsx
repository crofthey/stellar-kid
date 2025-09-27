import React, { useState, useEffect, useRef } from 'react';
import { Pencil } from 'lucide-react';
import { useChartStore } from '@/stores/chartStore';
import { Input } from '@/components/ui/input';
import { useShallow } from 'zustand/react/shallow';
export function EditableChildName() {
  const { selectedChild, updateChildSettings } = useChartStore(
    useShallow((state) => ({
      selectedChild: state.selectedChild,
      updateChildSettings: state.updateChildSettings,
    }))
  );
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(selectedChild?.name || '');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectedChild) {
      setName(selectedChild.name);
    }
  }, [selectedChild]);
  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);
  const handleSave = () => {
    if (name.trim() && name.trim() !== selectedChild?.name) {
      updateChildSettings({ name: name.trim() });
    }
    setIsEditing(false);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setName(selectedChild?.name || '');
      setIsEditing(false);
    }
  };
  if (!selectedChild) return null;
  if (isEditing) {
    return (
      <div className="flex items-center justify-center gap-2">
        <Input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="text-5xl font-display font-bold text-stellar-blue h-auto p-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-center bg-transparent transition-colors"
          style={{ width: `${(name.length || 1) * 0.6 + 2}em`, minWidth: '4em' }}
        />
      </div>
    );
  }
  return (
    <div
      className="group flex items-center justify-center gap-3 cursor-pointer"
      onClick={() => setIsEditing(true)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && setIsEditing(true)}
    >
      <h1 className="text-5xl font-display font-bold text-stellar-blue transition-colors group-hover:text-stellar-blue/80">
        {selectedChild.name}'s Chart
      </h1>
      <Pencil className="h-6 w-6 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}