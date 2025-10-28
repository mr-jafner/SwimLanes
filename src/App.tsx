import { useState } from 'react';
import './App.css';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

function App() {
  const [selectedItem, setSelectedItem] = useState<string>('');

  return (
    <div className="min-h-screen bg-background text-foreground dark">
      <Toaster />
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            SwimLanes
          </h1>
          <p className="text-muted-foreground text-lg">
            Tailwind CSS v4 + shadcn/ui Component Showcase
          </p>
        </div>

        {/* Button Variants */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Button Components</h2>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => toast.success('Default button clicked!')}>Default</Button>
            <Button variant="secondary" onClick={() => toast.info('Secondary button clicked!')}>
              Secondary
            </Button>
            <Button variant="destructive" onClick={() => toast.error('Destructive action!')}>
              Destructive
            </Button>
            <Button variant="outline" onClick={() => toast('Outline button clicked')}>
              Outline
            </Button>
            <Button variant="ghost" onClick={() => toast('Ghost button clicked')}>
              Ghost
            </Button>
            <Button variant="link" onClick={() => toast('Link button clicked')}>
              Link
            </Button>
          </div>
        </section>

        {/* Dialog Component */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Dialog Component</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>SwimLanes Dialog</DialogTitle>
                <DialogDescription>
                  This is a dialog component from shadcn/ui. It's accessible, customizable, and
                  works great with Tailwind CSS v4.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-muted-foreground">
                  You can add any content here, including forms, lists, or other components.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </section>

        {/* Select Component */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Select Component</h2>
          <div className="max-w-xs">
            <Select
              onValueChange={(value) => {
                setSelectedItem(value);
                toast.success(`Selected: ${value}`);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an item type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="task">Task</SelectItem>
                <SelectItem value="milestone">Milestone</SelectItem>
                <SelectItem value="release">Release</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
              </SelectContent>
            </Select>
            {selectedItem && (
              <p className="mt-4 text-sm text-muted-foreground">
                Selected: <span className="font-semibold">{selectedItem}</span>
              </p>
            )}
          </div>
        </section>

        {/* Toast Demo */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Toast Notifications (Sonner)</h2>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => toast('This is a default toast')}>Default Toast</Button>
            <Button onClick={() => toast.success('Operation completed successfully!')}>
              Success Toast
            </Button>
            <Button onClick={() => toast.error('An error occurred!')}>Error Toast</Button>
            <Button onClick={() => toast.info('Here is some information')}>Info Toast</Button>
            <Button onClick={() => toast.warning('Warning: Check your input')}>
              Warning Toast
            </Button>
          </div>
        </section>

        {/* Custom Theme Colors */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">SwimLanes Custom Colors</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-task/20 border-2 border-task rounded-lg p-6">
              <div className="w-6 h-6 bg-task rounded-full mb-3"></div>
              <h3 className="font-semibold text-task mb-1">Task</h3>
              <p className="text-xs text-muted-foreground">Blue bars for work items</p>
            </div>

            <div className="bg-milestone/20 border-2 border-milestone rounded-lg p-6">
              <div className="w-6 h-6 bg-milestone rounded-full mb-3"></div>
              <h3 className="font-semibold text-milestone mb-1">Milestone</h3>
              <p className="text-xs text-muted-foreground">Green diamonds for markers</p>
            </div>

            <div className="bg-release/20 border-2 border-release rounded-lg p-6">
              <div className="w-6 h-6 bg-release rounded-full mb-3"></div>
              <h3 className="font-semibold text-release mb-1">Release</h3>
              <p className="text-xs text-muted-foreground">Orange bars for deployments</p>
            </div>

            <div className="bg-meeting/20 border-2 border-meeting rounded-lg p-6">
              <div className="w-6 h-6 bg-meeting rounded-full mb-3"></div>
              <h3 className="font-semibold text-meeting mb-1">Meeting</h3>
              <p className="text-xs text-muted-foreground">Purple bars for events</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-muted-foreground text-sm mt-16">
          <p>Built with React 19, Vite, TypeScript, Tailwind CSS v4, and shadcn/ui</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
