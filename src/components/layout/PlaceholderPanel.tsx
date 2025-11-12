import { Construction } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PlaceholderPanelProps {
  title: string;
  description?: string;
}

/**
 * PlaceholderPanel - Reusable "Coming Soon" panel for incomplete features
 *
 * Used for tabs that are planned but not yet implemented.
 */
export function PlaceholderPanel({ title, description }: PlaceholderPanelProps) {
  return (
    <div className="flex items-center justify-center h-full p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-muted">
              <Construction className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {description || 'This feature is coming soon. Check back later!'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          <p>
            This feature will be implemented in a future update. Stay tuned for more functionality!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
