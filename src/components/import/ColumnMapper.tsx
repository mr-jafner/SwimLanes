/**
 * Column Mapper Component
 *
 * Allows users to map CSV columns to item fields.
 * Shows auto-detected mappings with ability to manually override.
 */

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { ColumnMapping } from '@/types/import.types';

export interface ColumnMapperProps {
  /** CSV column headers */
  headers: string[];

  /** Current column mapping */
  mapping: Partial<ColumnMapping>;

  /** Callback when mapping changes */
  onMappingChange: (mapping: Partial<ColumnMapping>) => void;

  /** Disable the mapper */
  disabled?: boolean;
}

/**
 * Field configuration for the mapper
 */
interface FieldConfig {
  key: keyof ColumnMapping;
  label: string;
  description: string;
  required: boolean;
}

const FIELD_CONFIGS: FieldConfig[] = [
  {
    key: 'title',
    label: 'Title',
    description: 'Item name or summary',
    required: true,
  },
  {
    key: 'type',
    label: 'Type',
    description: 'Item type (task, milestone, release, meeting)',
    required: true,
  },
  {
    key: 'start_date',
    label: 'Start Date',
    description: 'Start or created date',
    required: false,
  },
  {
    key: 'end_date',
    label: 'End Date',
    description: 'End, finish, or due date',
    required: false,
  },
  {
    key: 'owner',
    label: 'Owner',
    description: 'Assignee or responsible person',
    required: false,
  },
  {
    key: 'lane',
    label: 'Lane',
    description: 'Swim lane, track, or status',
    required: false,
  },
  {
    key: 'project',
    label: 'Project',
    description: 'Project, epic, or initiative',
    required: false,
  },
  {
    key: 'tags',
    label: 'Tags',
    description: 'Tags, labels, or keywords',
    required: false,
  },
];

/**
 * ColumnMapper component
 */
export function ColumnMapper({
  headers,
  mapping,
  onMappingChange,
  disabled = false,
}: ColumnMapperProps) {
  const handleFieldChange = (field: keyof ColumnMapping, value: string | undefined) => {
    onMappingChange({
      ...mapping,
      [field]: value || undefined,
    });
  };

  const handleTagsDelimiterChange = (delimiter: string) => {
    onMappingChange({
      ...mapping,
      tagsDelimiter: delimiter,
    });
  };

  // Check if required fields are mapped
  const isTitleMapped = !!mapping.title;
  const isTypeMapped = !!mapping.type;
  const allRequiredMapped = isTitleMapped && isTypeMapped;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Label className="text-base font-semibold">Column Mapping</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Map CSV columns to item fields. Auto-detected mappings are pre-filled.
        </p>
        {!allRequiredMapped && (
          <p className="text-sm text-destructive mt-2">
            Required fields must be mapped: Title, Type
          </p>
        )}
      </div>

      {/* Field mappings */}
      <div className="space-y-4">
        {FIELD_CONFIGS.map((fieldConfig) => {
          const value = mapping[fieldConfig.key];
          const isMapped = !!value;

          return (
            <div key={fieldConfig.key} className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor={`field-${fieldConfig.key}`} className="font-medium">
                  {fieldConfig.label}
                </Label>
                {fieldConfig.required && (
                  <Badge variant="destructive" className="text-xs">
                    Required
                  </Badge>
                )}
                {isMapped && (
                  <Badge variant="secondary" className="text-xs">
                    Mapped
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{fieldConfig.description}</p>
              <Select
                value={value as string | undefined}
                onValueChange={(val) =>
                  handleFieldChange(fieldConfig.key, val === 'none' ? undefined : val)
                }
                disabled={disabled}
              >
                <SelectTrigger
                  id={`field-${fieldConfig.key}`}
                  className={!isMapped && fieldConfig.required ? 'border-destructive' : ''}
                >
                  <SelectValue placeholder="Select column..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">(None)</span>
                  </SelectItem>
                  {headers.map((header) => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}

        {/* Tags delimiter selector (only show if tags field is mapped) */}
        {mapping.tags && (
          <div className="space-y-2 pt-2 border-t">
            <Label htmlFor="tags-delimiter" className="font-medium">
              Tags Delimiter
            </Label>
            <p className="text-sm text-muted-foreground">
              Character used to separate tags in the CSV
            </p>
            <Select
              value={mapping.tagsDelimiter || ','}
              onValueChange={handleTagsDelimiterChange}
              disabled={disabled}
            >
              <SelectTrigger id="tags-delimiter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=",">Comma (,)</SelectItem>
                <SelectItem value=";">Semicolon (;)</SelectItem>
                <SelectItem value="|">Pipe (|)</SelectItem>
                <SelectItem value=" ">Space ( )</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="pt-4 border-t">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Mapped {Object.values(mapping).filter((v) => v && typeof v === 'string').length} of{' '}
            {FIELD_CONFIGS.length} fields
          </span>
          {allRequiredMapped ? (
            <Badge variant="default" className="bg-green-600">
              Ready
            </Badge>
          ) : (
            <Badge variant="destructive">Incomplete</Badge>
          )}
        </div>
      </div>
    </div>
  );
}
