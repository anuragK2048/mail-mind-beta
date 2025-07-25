"use client";

import { createLabel, deleteLabel, updateLabel } from "@/api/labelsApi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Edit,
  MoreHorizontal,
  Settings2Icon,
  Trash2,
} from "lucide-react";
import { useState } from "react";

// The main dialog component that users will interact with.
export default function LabelSettingsDialog({ labels }) {
  const [view, setView] = useState("list"); // 'list' or 'form'
  const [currentLabel, setCurrentLabel] = useState(null); // Holds the label being edited

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteLabel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userLabels"] });
    },
  });

  const handleEdit = (label) => {
    setCurrentLabel(label);
    setView("form");
  };

  const handleAddNew = () => {
    setCurrentLabel(null); // Ensure we're not editing
    setView("form");
  };

  const resetView = () => {
    setView("list");
    setCurrentLabel(null);
  };

  // Reset view when dialog is closed
  const onOpenChange = (isOpen) => {
    if (!isOpen) {
      // Use a timeout to prevent the form from disappearing before the dialog closes
      setTimeout(() => {
        resetView();
      }, 0);
    }
  };

  // Define consistent animation variants for the sliding effect
  const slideVariants = {
    initial: { x: "100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "-100%", opacity: 0 },
  };

  const transition = { type: "spring", stiffness: 400, damping: 40 };

  return (
    <Dialog onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings2Icon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0 sm:max-w-[480px]">
        {/*
          This container will now smoothly animate its height changes thanks to the `layout` prop.
        */}
        <motion.div
          layout
          transition={transition}
          className="overflow-x-hidden"
        >
          {/*
            FIX: Added `mode="wait"` to ensure only one component is rendered at a time during animation.
          */}
          <AnimatePresence initial={false} mode="popLayout">
            {view === "list" ? (
              <motion.div
                key="list"
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={transition}
              >
                <LabelList
                  labels={labels}
                  onEdit={handleEdit}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onAddNew={handleAddNew}
                />
              </motion.div>
            ) : (
              <motion.div
                key="form"
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={transition}
              >
                <LabelForm currentLabel={currentLabel} onBack={resetView} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

// --- Internal Sub-Components for Clarity ---

/**
 * Renders the list of current labels.
 */
function LabelList({ labels, onEdit, onDelete, onAddNew }) {
  return (
    <>
      <DialogHeader className="p-6 pb-4">
        <DialogTitle>Manage Labels</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-2 p-6 pt-0">
        <div className="flex max-h-[400px] flex-col gap-3 overflow-y-auto pr-2">
          {labels?.length > 0 ? (
            labels.map((label) => (
              <div
                key={label.id}
                className="flex items-center justify-between gap-4 rounded-md border p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: label.color }}
                  />
                  <div className="flex-grow">
                    <p className="text-sm font-semibold">{label.name}</p>
                    {label.description && (
                      <p className="text-xs">{label.description}</p>
                    )}
                  </div>
                </div>
                {/* Mobile-friendly Dropdown Menu for actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => onEdit(label)}>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(label.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-sm text-gray-500">
              You have no labels yet.
            </p>
          )}
        </div>
        <Button onClick={onAddNew} className="mt-4">
          Add a new label
        </Button>
      </div>
    </>
  );
}

/**
 * Renders the form for creating or editing a label.
 */
function LabelForm({ currentLabel, onBack }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(currentLabel?.name || "");
  const [color, setColor] = useState(currentLabel?.color || "#000000");
  const [description, setDescription] = useState(
    currentLabel?.description || ""
  );

  const createMutation = useMutation({
    mutationFn: createLabel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userLabels"] });
      onBack();
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateLabel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userLabels"] });
      onBack();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const labelData = { name, color, description };
    if (currentLabel) {
      updateMutation.mutate({ labelId: currentLabel.id, updates: labelData });
    } else {
      createMutation.mutate(labelData);
    }
  };

  return (
    <>
      <DialogHeader className="flex-row items-center p-6 pb-4">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 h-8 w-8"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <DialogTitle>
          {currentLabel ? "Edit Label" : "Create New Label"}
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6 pt-0">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Prompt (Optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="color">Color</Label>
          <Input
            id="color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-16 p-1"
          />
        </div>
        <div className="mt-4 flex flex-col items-center justify-end">
          <Button
            type="submit"
            disabled={updateMutation.isLoading || createMutation.isLoading}
            className="w-1/2"
          >
            {currentLabel ? "Update Label" : "Create Label"}
          </Button>
          <div>It would take some time to categorize emails</div>
        </div>
      </form>
    </>
  );
}
