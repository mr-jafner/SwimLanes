/**
 * ID Strategy Selector Component
 *
 * Allows users to choose between three ID strategies for import:
 * - generate: Auto-generate UUIDs (default)
 * - column: Use a CSV column as item ID
 * - match: Match items by project + title composite key
 */

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { IDStrategy } from '@/types/import.types';

export interface IDStrategySelectorProps {
  /** Current ID strategy */
  strategy: IDStrategy;

  /** Callback when strategy changes */
  onStrategyChange: (strategy: IDStrategy) => void;

  /** CSV column headers (for column selector) */
  headers: string[];

  /** Selected ID column (when strategy is 'column') */
  idColumn?: string;

  /** Callback when ID column changes */
  onIdColumnChange: (column: string) => void;

  /** Disable the selector */
  disabled?: boolean;
}

/**
 * IDStrategySelector component
 */
export function IDStrategySelector({
  strategy,
  onStrategyChange,
  headers,
  idColumn,
  onIdColumnChange,
  disabled = false,
}: IDStrategySelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold">ID Strategy</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Choose how to identify items during import
        </p>
      </div>

      <RadioGroup
        value={strategy}
        onValueChange={(value) => onStrategyChange(value as IDStrategy)}
        disabled={disabled}
        className="space-y-3"
      >
        {/* Generate UUIDs */}
        <div className="flex items-start space-x-3">
          <RadioGroupItem value="generate" id="strategy-generate" className="mt-1" />
          <div className="flex-1">
            <Label htmlFor="strategy-generate" className="font-medium cursor-pointer">
              Generate UUIDs
            </Label>
            <p className="text-sm text-muted-foreground">
              Automatically generate unique IDs for all items. Best for first-time imports.
            </p>
          </div>
        </div>

        {/* Use Column as ID */}
        <div className="flex items-start space-x-3">
          <RadioGroupItem value="column" id="strategy-column" className="mt-1" />
          <div className="flex-1 space-y-2">
            <Label htmlFor="strategy-column" className="font-medium cursor-pointer">
              Use Column as ID
            </Label>
            <p className="text-sm text-muted-foreground">
              Use a specific CSV column (e.g., "Issue Key", "Task ID") as the item ID. Good for
              maintaining external system references.
            </p>

            {/* Show column selector when this strategy is selected */}
            {strategy === 'column' && (
              <div className="ml-6 mt-3 space-y-2">
                <Label htmlFor="id-column" className="text-sm">
                  ID Column
                </Label>
                <Select value={idColumn} onValueChange={onIdColumnChange} disabled={disabled}>
                  <SelectTrigger id="id-column" className="w-full">
                    <SelectValue placeholder="Select ID column..." />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!idColumn && <p className="text-sm text-destructive">ID column is required</p>}
              </div>
            )}
          </div>
        </div>

        {/* Match by Project + Title */}
        <div className="flex items-start space-x-3">
          <RadioGroupItem value="match" id="strategy-match" className="mt-1" />
          <div className="flex-1">
            <Label htmlFor="strategy-match" className="font-medium cursor-pointer">
              Match by Project + Title
            </Label>
            <p className="text-sm text-muted-foreground">
              Match items using a composite key of project and title. Best for re-importing data
              where external IDs aren't stable.
            </p>
          </div>
        </div>
      </RadioGroup>
    </div>
  );
}
