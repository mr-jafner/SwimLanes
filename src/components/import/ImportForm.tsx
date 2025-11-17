/**
 * Import Form Component
 *
 * Orchestrates the complete import workflow:
 * 1. Upload CSV file
 * 2. Auto-detect and map columns
 * 3. Preview changes (dry-run)
 * 4. Commit import to database
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { IDStrategySelector } from './IDStrategySelector';
import { ColumnMapper } from './ColumnMapper';
import { DryRunPreview } from './DryRunPreview';
import { useImportStore } from '@/stores/import.store';
import { useBranchStore } from '@/stores/branch.store';
import { csvParserService } from '@/services/csv-parser.service';
import { importService } from '@/services/import.service';
import { validateColumnMapping } from '@/utils/validation.utils';
import type { ColumnMapping, ImportMode } from '@/types/import.types';

/**
 * ImportForm component
 */
export function ImportForm() {
  // Zustand stores
  const {
    stage,
    currentData,
    currentMapping,
    dryRunData,
    targetBranch,
    idStrategy,
    importMode,
    setStage,
    setCurrentData,
    setCurrentMapping,
    setDryRunData,
    setTargetBranch,
    setIdStrategy,
    setImportMode,
    setSelectedProfile,
    reset,
  } = useImportStore();

  const { branches, refreshBranches } = useBranchStore();

  // Local state
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [profileName, setProfileName] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);

  // Load branches on mount
  useEffect(() => {
    refreshBranches();
  }, [refreshBranches]);

  /**
   * Handle file selection
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
  };

  /**
   * Parse CSV file
   */
  const handleParseCsv = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    try {
      const text = await file.text();
      const result = csvParserService.parseCSV(text, {
        headers: true,
        skipEmptyRows: true,
        trim: true,
      });

      // Filter out benign errors (TooManyFields from comma-separated values in fields)
      const criticalErrors = result.errors.filter((error) => error.code !== 'TooManyFields');

      if (criticalErrors.length > 0) {
        toast.error(`CSV parsing errors: ${criticalErrors.length} rows had errors`);
        console.error('CSV errors:', criticalErrors);
      }

      if (result.data.length === 0) {
        toast.error('No data found in CSV file');
        return;
      }

      // Extract headers
      const headers = result.meta.fields || [];
      setCsvHeaders(headers);

      // Auto-detect column mapping
      const detectedMapping = importService.autoDetectMapping(headers);
      setCurrentMapping(detectedMapping);
      setCurrentData(result.data);
      setStage('mapped');

      toast.success(`Loaded ${result.data.length} rows from CSV`);
    } catch (error) {
      toast.error('Failed to parse CSV file');
      console.error('Parse error:', error);
    }
  };

  /**
   * Perform dry-run
   */
  const handleDryRun = () => {
    if (!currentData || !currentMapping) {
      toast.error('No data or mapping available');
      return;
    }

    // Validate mapping
    const validation = validateColumnMapping(currentMapping);
    if (!validation.valid) {
      toast.error(`Invalid mapping: ${validation.errors.join(', ')}`);
      return;
    }

    // ID column required for 'column' strategy
    if (idStrategy === 'column' && !currentMapping.id) {
      toast.error('ID column is required when using column ID strategy');
      return;
    }

    try {
      const fullMapping: ColumnMapping = {
        title: currentMapping.title!,
        type: currentMapping.type!,
        start_date: currentMapping.start_date || '',
        end_date: currentMapping.end_date || '',
        owner: currentMapping.owner || '',
        lane: currentMapping.lane || '',
        project: currentMapping.project || '',
        tags: currentMapping.tags || '',
        id: currentMapping.id || '',
        idStrategy,
        tagsDelimiter: currentMapping.tagsDelimiter || ',',
      };

      const result = importService.performDryRun(
        currentData,
        fullMapping,
        targetBranch,
        importMode
      );

      setDryRunData(result);
      setCurrentMapping(fullMapping);
      setStage('dry-run');

      const totalChanges = result.added.length + result.updated.length;
      toast.success(`Dry-run complete: ${totalChanges} changes, ${result.skipped.length} skipped`);
    } catch (error) {
      toast.error('Dry-run failed');
      console.error('Dry-run error:', error);
    }
  };

  /**
   * Commit import
   */
  const handleCommit = async (): Promise<void> => {
    if (!dryRunData) {
      toast.error('No dry-run data available');
      return;
    }

    const totalChanges = dryRunData.added.length + dryRunData.updated.length;
    if (totalChanges === 0) {
      toast.info('No changes to commit');
      return;
    }

    setIsCommitting(true);

    try {
      const { addedCount, updatedCount } = await importService.commitImport(
        dryRunData,
        targetBranch
      );

      toast.success(`Import complete: ${addedCount} added, ${updatedCount} updated`);
      setStage('complete');

      // Refresh branches to update item counts
      refreshBranches();
    } catch (error) {
      toast.error('Import failed');
      console.error('Import error:', error);
    } finally {
      setIsCommitting(false);
    }
  };

  /**
   * Save profile
   */
  const handleSaveProfile = async (): Promise<void> => {
    if (!profileName.trim()) {
      toast.error('Please enter a profile name');
      return;
    }

    if (!currentMapping || !currentMapping.title || !currentMapping.type) {
      toast.error('Mapping must be complete before saving');
      return;
    }

    const fullMapping: ColumnMapping = {
      title: currentMapping.title,
      type: currentMapping.type,
      start_date: currentMapping.start_date || '',
      end_date: currentMapping.end_date || '',
      owner: currentMapping.owner || '',
      lane: currentMapping.lane || '',
      project: currentMapping.project || '',
      tags: currentMapping.tags || '',
      id: currentMapping.id || '',
      idStrategy: currentMapping.idStrategy || 'generate',
      tagsDelimiter: currentMapping.tagsDelimiter || ',',
    };

    const success = await importService.saveProfile(profileName, fullMapping);
    if (success) {
      toast.success(`Profile "${profileName}" saved`);
      setProfileName('');
    } else {
      toast.error('Failed to save profile');
    }
  };

  /**
   * Load profile
   */
  const handleLoadProfile = (name: string) => {
    const profile = importService.getProfile(name);
    if (!profile) {
      toast.error(`Profile "${name}" not found`);
      return;
    }

    setCurrentMapping(profile.mapping);
    setIdStrategy(profile.mapping.idStrategy);
    setSelectedProfile(name);
    toast.success(`Loaded profile "${name}"`);
  };

  /**
   * Reset workflow
   */
  const handleReset = () => {
    reset();
    setFile(null);
    setCsvHeaders([]);
    setProfileName('');
    toast.info('Import workflow reset');
  };

  // Get all saved profiles
  const savedProfiles = importService.getAllProfiles();

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Import Data</h1>
        <p className="text-muted-foreground mt-2">
          Upload a CSV file and map columns to import tasks, milestones, releases, and meetings
        </p>
      </div>

      {/* Progress indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={stage === 'idle' || stage === 'parsed' ? 'default' : 'secondary'}>
                1. Upload
              </Badge>
              <span className="text-muted-foreground">→</span>
              <Badge variant={stage === 'mapped' ? 'default' : 'secondary'}>2. Map Columns</Badge>
              <span className="text-muted-foreground">→</span>
              <Badge variant={stage === 'dry-run' ? 'default' : 'secondary'}>3. Preview</Badge>
              <span className="text-muted-foreground">→</span>
              <Badge variant={stage === 'complete' ? 'default' : 'secondary'}>4. Complete</Badge>
            </div>
            {stage !== 'idle' && (
              <Button variant="outline" size="sm" onClick={handleReset}>
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stage 1: File Upload */}
      {(stage === 'idle' || stage === 'parsed') && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Upload CSV File</CardTitle>
            <CardDescription>Select a CSV file to import</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File input */}
            <div className="space-y-2">
              <Label htmlFor="csv-file">CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              {file && (
                <p className="text-sm text-muted-foreground">
                  Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            {/* Branch selector */}
            <div className="space-y-2">
              <Label htmlFor="target-branch">Target Branch</Label>
              <Select value={targetBranch} onValueChange={setTargetBranch}>
                <SelectTrigger id="target-branch">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.branch_id} value={branch.branch_id}>
                      {branch.label || branch.branch_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Import mode */}
            <div className="space-y-2">
              <Label>Import Mode</Label>
              <RadioGroup value={importMode} onValueChange={(v) => setImportMode(v as ImportMode)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="upsert" id="mode-upsert" />
                  <Label htmlFor="mode-upsert" className="font-normal cursor-pointer">
                    Upsert (add new items, update existing)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="update-only" id="mode-update" />
                  <Label htmlFor="mode-update" className="font-normal cursor-pointer">
                    Update only (ignore new items)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Load saved profile */}
            {savedProfiles.length > 0 && (
              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="load-profile">Load Saved Profile (Optional)</Label>
                <div className="flex gap-2">
                  <Select onValueChange={handleLoadProfile}>
                    <SelectTrigger id="load-profile">
                      <SelectValue placeholder="Select a profile..." />
                    </SelectTrigger>
                    <SelectContent>
                      {savedProfiles.map((profile) => (
                        <SelectItem key={profile.name} value={profile.name}>
                          {profile.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <Button onClick={handleParseCsv} disabled={!file} className="w-full">
              Parse CSV & Detect Columns
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stage 2: Column Mapping */}
      {stage === 'mapped' && currentData && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Configure Import</CardTitle>
              <CardDescription>
                Loaded {currentData.length} rows with {csvHeaders.length} columns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* ID Strategy */}
              <IDStrategySelector
                strategy={idStrategy}
                onStrategyChange={setIdStrategy}
                headers={csvHeaders}
                idColumn={currentMapping?.id}
                onIdColumnChange={(col) => setCurrentMapping({ ...currentMapping, id: col })}
              />

              <div className="border-t" />

              {/* Column Mapping */}
              <ColumnMapper
                headers={csvHeaders}
                mapping={currentMapping || {}}
                onMappingChange={setCurrentMapping}
              />

              {/* Save profile */}
              <div className="pt-4 border-t space-y-2">
                <Label htmlFor="profile-name">Save as Profile (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="profile-name"
                    placeholder="Profile name (e.g., 'Jira Export')"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                  />
                  <Button variant="outline" onClick={handleSaveProfile}>
                    Save Profile
                  </Button>
                </div>
              </div>

              <Button onClick={handleDryRun} className="w-full" size="lg">
                Preview Changes (Dry-Run)
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* Stage 3: Dry-Run Preview */}
      {stage === 'dry-run' && dryRunData && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Review Changes</CardTitle>
              <CardDescription>Preview what will be imported before committing</CardDescription>
            </CardHeader>
          </Card>

          <DryRunPreview result={dryRunData} />

          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setStage('mapped')}
                  className="flex-1"
                  disabled={isCommitting}
                >
                  Back to Mapping
                </Button>
                <Button
                  onClick={handleCommit}
                  disabled={
                    isCommitting || dryRunData.added.length + dryRunData.updated.length === 0
                  }
                  className="flex-1"
                  size="lg"
                >
                  {isCommitting ? 'Importing...' : 'Commit Import'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Stage 4: Complete */}
      {stage === 'complete' && (
        <Card>
          <CardHeader>
            <CardTitle>Import Complete!</CardTitle>
            <CardDescription>Your data has been successfully imported</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-center py-8">
                <Badge variant="default" className="bg-green-600 text-lg py-2 px-4">
                  Success
                </Badge>
              </div>
              <div className="flex gap-4">
                <Button onClick={handleReset} className="flex-1">
                  Import More Data
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    /* TODO: Navigate to timeline */
                  }}
                  className="flex-1"
                >
                  View Timeline
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
