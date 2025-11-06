# SwimLanes Sample Data

This directory contains diverse sample datasets designed to demonstrate SwimLanes' ability to import and unify data from multiple sources.

---

## Directory Structure

```
sample-data/
├── hardware/              # Hardware engineering projects (turbochargers)
├── software/              # Software development projects
├── from-pm-tools/         # Real-world PM tool export formats
└── messy-data/            # Test data for edge cases and validation
```

---

## Hardware Projects (Primary Focus)

Realistic turbocharger development project timelines demonstrating hardware engineering workflows.

### `hardware/turbo-gt2860-rd.csv`

**MS Project Export Format** - GT2860 Turbocharger R&D Project

- **Source:** Microsoft Project export
- **Project:** GT2860 turbocharger development from concept through prototype
- **Timeline:** June 2025 - November 2025 (6 months)
- **Item Count:** 20 tasks and milestones
- **Demonstrates:**
  - Design phases: compressor/turbine aero, bearings, CHRA, housings
  - CFD analysis workflow
  - Prototype procurement and fabrication
  - Design reviews and freeze milestones
  - Work Breakdown Structure (WBS) numbering
  - Resource assignments with multiple engineers
  - % Complete tracking

**Key Columns:**
- `Task Name` - Activity description
- `Start Date`, `Finish Date` - Date range
- `Duration` - Days
- `Resource Names` - Assigned engineers (semicolon-separated)
- `% Complete` - Progress tracking
- `Type` - task or milestone (inferred from Duration=0)
- `Priority` - High/Medium/Low/Critical
- `Work Breakdown Structure` - Hierarchical task IDs

**Use Case:** Demonstrates MS Project-style exports with resource tracking and WBS hierarchy.

---

### `hardware/turbo-gt2860-testing.csv`

**Custom Test Lab Format** - GT2860 Test & Validation Schedule

- **Source:** Internal test lab scheduling system
- **Project:** Comprehensive testing program for GT2860 turbocharger
- **Timeline:** October 2025 - April 2026 (6 months)
- **Item Count:** 23 test activities
- **Demonstrates:**
  - Cold flow and hot gas testing sequences
  - Durability and reliability testing (100hr, 500hr cycles)
  - Environmental testing (thermal, vibration, HALT)
  - Engine dyno integration
  - Field testing program
  - Certification milestones

**Key Columns:**
- `Test Name` - Test activity description
- `Type` - task, milestone, meeting
- `Start Date`, `End Date` - Test window
- `Assigned To` - Lab team or individual
- `Status` - Scheduled/Planned
- `Rig` - Test equipment identifier
- `Notes` - Test objectives and details

**Use Case:** Domain-specific test lab workflow with equipment tracking.

---

### `hardware/turbo-gt2860-manufacturing.csv`

**Mixed Date Format** - GT2860 Manufacturing Ramp-Up

- **Source:** Manufacturing planning system
- **Project:** Tooling, process development, and production ramp
- **Timeline:** September 2025 - March 2026 (7 months)
- **Item Count:** 26 manufacturing tasks and milestones
- **Demonstrates:**
  - Tooling design and fabrication (casting, machining, assembly)
  - Supplier qualification (bearings, seals, gaskets)
  - Process validation (FMEA, first articles)
  - Production ramp phases (pilot, 50-unit, full rate)
  - Long lead-time component procurement
  - **US date format (M/D/YYYY)** - Tests date normalization

**Key Columns:**
- `Activity` - Task description
- `Type` - task or milestone
- `Start`, `Finish` - US date format (M/D/YYYY)
- `Owner` - Responsible team/individual
- `Phase` - Tooling/Validation/Pilot/Ramp Up/Production
- `Supplier` - External vendor or Internal
- `Status` - Planning
- `Priority` - High/Medium/Critical

**Use Case:** Manufacturing workflow with supplier tracking and US date formats.

---

## Customer-Specific Projects

Real-world customer project timelines demonstrating how different customer requirements and applications drive unique turbocharger development programs.

### `hardware/customer-acme-diesel.csv`

**Custom Development Project** - Acme Motors Heavy Duty Diesel Turbo

- **Customer:** Acme Motors
- **Application:** 6.7L Heavy Duty Diesel Truck
- **Timeline:** May 2025 - April 2026 (12 months)
- **Item Count:** 25 tasks and milestones
- **Demonstrates:**
  - Customer-specific requirements (flow targets, EPA compliance)
  - Custom mounting and interface design
  - Customer approval gates and witnessed tests
  - Interface Control Document (ICD) workflow
  - First Article Inspection (FAI) process
  - On-site customer testing at Acme facility
  - Long-term field testing with customer vehicles

**Key Columns:**
- `Task Name` - Activity description
- `Start Date`, `Finish Date` - Timeline
- `Resource Names` - Team assignments
- `Type` - task or milestone
- `Priority` - Critical/High/Medium
- `Customer` - Acme Motors
- `Application` - Heavy Duty Truck
- `Notes` - Technical requirements and details

**Use Case:** Demonstrates customer-driven development with formal approval gates and specifications.

---

### `hardware/customer-apex-performance.csv`

**Performance Aftermarket Project** - Apex Performance Turbo Upgrade

- **Customer:** Apex Performance
- **Application:** 2.5L 4-Cylinder Performance Upgrade (300 HP → 450 HP)
- **Timeline:** June 2025 - January 2026 (8 months)
- **Item Count:** 20 tasks and milestones
- **Demonstrates:**
  - Performance upgrade project workflow
  - Power target definition and validation
  - Billet compressor and upgraded bearing system
  - Engine dyno testing and optimization
  - Small batch production (25 units)
  - Field feedback collection and warranty tracking

**Key Columns:**
- `Activity` - Task description
- `Type` - task/meeting/milestone
- `Start`, `End` - US date format (M/D/YYYY)
- `Owner` - Team/individual assignment
- `Customer` - Apex Performance
- `Application` - 2.5L 4-Cyl Turbo Upgrade
- `Status` - Complete/In Progress/Planned
- `Deliverable` - Expected output or result

**Use Case:** Aftermarket performance project with dyno validation and customer feedback loop.

---

### `hardware/customer-marine-systems.csv`

**Marine Application Project** - BlueSea Marine Diesel Turbo

- **Customer:** BlueSea Marine
- **Application:** 6.0L Marine Diesel Engine
- **Timeline:** July 2025 - March 2026 (9 months)
- **Item Count:** 18 tasks and milestones
- **Demonstrates:**
  - Marine-specific environmental requirements
  - Corrosion protection and salt spray testing
  - Seawater cooling integration
  - Marine vibration and humidity testing
  - On-water testing in real marine environment
  - 500-hour salt water exposure validation

**Key Columns:**
- `Item` - Task description
- `Type` - task or milestone
- `Start Date`, `Due Date` - Timeline
- `Assignee` - Responsible individual/team
- `Customer` - BlueSea Marine
- `Application` - 6.0L Marine Diesel
- `Phase` - Requirements/Design/Validation/Field Test/Release
- `Notes` - Technical details and special requirements

**Use Case:** Specialized marine application with environmental testing and customer on-site validation.

---

### `hardware/customer-deliverables-multi.csv`

**Cross-Customer Deliverables Schedule** - Multi-Customer Document Delivery

- **Customers:** Acme Motors, Apex Performance, BlueSea Marine
- **Timeline:** June 2025 - March 2026 (10 months)
- **Item Count:** 21 deliverables across 3 customers
- **Demonstrates:**
  - Technical documentation deliverables
  - Test reports and validation packages
  - Customer-specific documentation requirements
  - Recurring deliverables (monthly status, quarterly reviews)
  - Different document types across customers

**Key Columns:**
- `Deliverable` - Document/report name
- `Type` - task/meeting/milestone
- `Due Date` - Delivery deadline
- `Customer` - Acme Motors/Apex Performance/BlueSea Marine/All Customers
- `Status` - In Progress/Planned/Recurring
- `Owner` - Responsible team/individual
- `Document Type` - Presentation/Technical Doc/Test Report/Manual/etc.
- `Notes` - Document details and specifications

**Use Case:** Managing deliverables across multiple concurrent customer programs.

---

### `hardware/field-test-results.csv`

**Field Testing Program** - Multi-Customer Field Test Tracking

- **Customers:** Acme Motors (3 trucks), Apex Performance (3 cars), BlueSea Marine (2 vessels)
- **Timeline:** September 2025 - March 2026 (7 months)
- **Item Count:** 21 test activities across 8 vehicles/vessels
- **Demonstrates:**
  - Real-world field testing across different applications
  - Test ID tracking system (FT-AM-001, FT-AP-001, FT-BS-001)
  - Vehicle/asset tracking
  - Issues found and resolution tracking
  - Different test environments (highway, track, ocean)
  - Recurring check-ins and data uploads

**Key Columns:**
- `Test ID` - Unique test identifier (FT-[CUSTOMER]-[#])
- `Activity` - Test task description
- `Type` - task/meeting/milestone
- `Start Date`, `End Date` - Test timeline
- `Customer` - Acme Motors/Apex Performance/BlueSea Marine
- `Vehicle/Asset` - Specific truck/car/vessel identification
- `Test Site` - Location of testing
- `Status` - Complete/In Progress/Planned
- `Issues Found` - Problems discovered during testing

**Use Case:** Field test program management with issue tracking across multiple customers and platforms.

---

## Software Projects

Two software development datasets for comparison.

### `software/web-platform-migration.csv`

**Standard SwimLanes Format** - Web Platform Migration Project

- **Timeline:** July 2025 - November 2025 (4.5 months)
- **Item Count:** 20 tasks, milestones, releases, meetings
- **Demonstrates:**
  - Large-scale migration project
  - Infrastructure, backend, frontend, testing workflows
  - Multiple teams (Engineering, DevOps, QA, Security, Product)
  - Staging and production deployment gates

**Key Columns:** title, type, start_date, end_date, owner, lane, project, tags

---

### `software/mobile-app-sprint.csv`

**Agile Sprint Format** - Mobile App Sprint 24

- **Timeline:** August 2025 (2-week sprint)
- **Item Count:** 11 tasks and meetings
- **Demonstrates:**
  - Agile/Scrum workflow
  - Sprint ceremonies (planning, demo, retrospective)
  - User stories with testing
  - Short-duration sprint tasks

**Key Columns:** title, type, start_date, end_date, owner, lane, project, tags

---

## PM Tool Exports

Real-world export formats from popular project management tools.

### `from-pm-tools/ms-project-export.csv`

**Microsoft Project Export** - VGT Actuator Development

- **Format:** MS Project CSV export with all standard columns
- **Project:** Variable Geometry Turbo (VGT) actuator development
- **Timeline:** June 2025 - December 2025 (6 months)
- **Item Count:** 31 tasks and milestones
- **Demonstrates:**
  - MS Project-specific columns: ID, Duration, Predecessors, Priority, Notes
  - Task dependencies via Predecessors column
  - Priority scale (500-1000)
  - Detailed engineering notes

**Key Columns:**
- `ID` - Sequential task ID
- `Task Name` - Activity description
- `Duration` - Days
- `Start`, `Finish` - Date range
- `% Complete` - Progress
- `Resource Names` - Assigned resources (semicolon-separated)
- `Predecessors` - Task dependencies (ID references)
- `Priority` - Numeric priority (500-1000)
- `Notes` - Detailed task notes

**Use Case:** Demonstrates importing MS Project exports with dependencies and priorities.

---

### `from-pm-tools/ms-planner-export.csv`

**Microsoft Planner Export** - Test Lab Task Board

- **Format:** MS Planner Excel export saved as CSV
- **Project:** Test lab operations and infrastructure tasks
- **Timeline:** June-July 2025 (ongoing operational tasks)
- **Item Count:** 15 tasks
- **Demonstrates:**
  - Planner-specific columns: Task ID, Bucket Name, Progress, Labels
  - Operational/maintenance tasks
  - Recurring meeting tasks
  - Multiple label/tag assignments

**Key Columns:**
- `Task ID` - Planner task identifier
- `Task Name` - Task description
- `Bucket Name` - Planner bucket (category/phase)
- `Progress` - Not Started/In Progress/Completed/Recurring
- `Priority` - Urgent/Important/Medium
- `Start Date`, `Due Date` - Date range
- `Assigned To` - Individual or team
- `Created By` - Task creator
- `Labels` - Multiple tags (semicolon-separated)
- `Description` - Detailed task description

**Use Case:** Demonstrates importing from Microsoft Planner with bucket-based organization.

---

### `from-pm-tools/jira-export.csv`

**Jira Export (All Fields)** - Turbo Project Issue Tracking

- **Format:** Jira CSV export with all standard issue fields
- **Project:** TURBO project issue tracker
- **Timeline:** June-July 2025 (Sprint 12-14)
- **Item Count:** 15 issues (stories, bugs, tasks, epics, sub-tasks)
- **Demonstrates:**
  - Jira-specific columns: Issue Key, Issue Type, Sprint, Story Points, Components
  - Multiple issue types (Story, Bug, Task, Epic, Sub-task)
  - Agile workflow with sprints and story points
  - Detailed descriptions with technical context

**Key Columns:**
- `Issue Key` - Jira issue ID (e.g., TURBO-101)
- `Summary` - Issue title
- `Issue Type` - Story/Bug/Task/Epic/Sub-task
- `Status` - Open/In Progress/To Do/In Review
- `Priority` - Critical/High/Medium/Low
- `Assignee` - Assigned individual or team
- `Reporter` - Issue creator
- `Created` - Creation date (ISO format)
- `Due Date` - Target completion date
- `Labels` - Tags (comma-separated)
- `Sprint` - Agile sprint name
- `Story Points` - Effort estimate (Fibonacci scale)
- `Components` - Jira component/module
- `Description` - Detailed issue description

**Use Case:** Demonstrates importing from Jira with agile sprint tracking and story points.

---

## Messy Data (Test Cases)

Datasets designed to test data quality handling, validation, and normalization.

### `messy-data/mixed-date-formats.csv`

**Tests:** Date format normalization

- **Date Formats:**
  - ISO 8601: `2025-06-01` (YYYY-MM-DD)
  - US slashes: `6/10/2025` (M/D/YYYY)
  - US dashes: `6-20-2025` (M-D-YYYY)
  - Leading zeros: `06/01/2025` (MM/DD/YYYY)
  - Mixed in same row: `2025-08-01` to `8/15/2025`

**Expected Behavior:** All dates normalized to ISO 8601 format (YYYY-MM-DD).

---

### `messy-data/missing-fields.csv`

**Tests:** Null/missing field handling

- **Missing Fields:**
  - Missing end_date (valid for milestones)
  - Missing owner
  - Missing type
  - Missing title
  - Missing start_date
  - All optional fields missing
  - Minimal data (title + type only)

**Expected Behavior:**
- Reject rows missing required fields (title, type, start_date)
- Allow missing optional fields (end_date for milestones, tags, lane)
- Provide clear validation errors

---

### `messy-data/duplicate-ids.csv`

**Tests:** Duplicate ID conflict resolution

- **Scenarios:**
  - Same ID used multiple times with different data
  - Duplicate IDs in same import

**Expected Behavior:**
- Detect duplicate IDs
- Offer conflict resolution options:
  - Use first occurrence
  - Use last occurrence
  - Generate new UUIDs
  - Prompt user for decision

---

### `messy-data/special-characters.csv`

**Tests:** Character encoding and escaping

- **Special Characters:**
  - Quotes within quoted fields: `"Task with ""quotes"" in title"`
  - Commas in titles: `Design, Build, Test`
  - Apostrophes: `O'Brien`, `It's a test`
  - Symbols: `< > & @ # $`
  - Unicode: `测试任务`, `José García`, `François`, `Müller`
  - Emoji: `🚀 ✓`
  - Line breaks within fields
  - HTML-like content: `<script>alert('test')</script>`
  - Pipes and slashes: `A/B|C\D`

**Expected Behavior:**
- Correctly parse CSV with proper quoting
- Preserve all characters (no XSS risk in local-first app)
- Handle Unicode and emoji
- Preserve line breaks in multi-line fields

---

### `messy-data/inconsistent-data-types.csv`

**Tests:** Data type validation and coercion

- **Inconsistencies:**
  - Priority as number instead of text
  - Hours as text: `"forty"` instead of `40`
  - Invalid item type: `invalid_type`
  - Boolean in priority field: `true`
  - Negative numbers: `-10 hours`
  - Decimal values: `37.5`
  - Empty strings everywhere
  - Numbers where names expected: `owner: 12345`

**Expected Behavior:**
- Validate item type against allowed values (task/milestone/release/meeting)
- Handle or reject invalid data types
- Provide clear validation errors
- Option to skip invalid rows

---

### `messy-data/extra-unexpected-columns.csv`

**Tests:** Handling of unmapped columns

- **Extra Columns:**
  - `extra_col_1`, `extra_col_2`, `extra_col_3`
  - `random_data`
  - `legacy_id`

**Expected Behavior:**
- Ignore unmapped columns during import
- Optionally warn user about unmapped columns
- Allow user to map extra columns to custom fields (future feature)

---

## Import Workflow Examples

### Example 1: Multi-Source Turbo Project

**Goal:** Combine R&D, testing, and manufacturing timelines for GT2860 project.

**Steps:**
1. Import `hardware/turbo-gt2860-rd.csv`
   - Map columns: Task Name → title, Start Date → start_date, Finish Date → end_date, Resource Names → owner
   - Set project name: "GT2860 Development"
   - Import to branch: `main`

2. Import `hardware/turbo-gt2860-testing.csv`
   - Map columns: Test Name → title, Start Date → start_date, End Date → end_date, Assigned To → owner
   - Set project name: "GT2860 Development" (same project)
   - Append to branch: `main` (combines with existing data)

3. Import `hardware/turbo-gt2860-manufacturing.csv`
   - Map columns: Activity → title, Start → start_date, Finish → end_date, Owner → owner
   - Normalize US date format (M/D/YYYY)
   - Set project name: "GT2860 Development"
   - Append to branch: `main`

**Result:** Unified timeline showing R&D, testing, and manufacturing activities on one canvas.

---

### Example 2: Branch Comparison (Scenario Planning)

**Goal:** Compare original plan vs revised schedule.

**Steps:**
1. Import `from-pm-tools/ms-project-export.csv` to branch `main`
2. Create branch `schedule-acceleration` from `main`
3. Re-import updated CSV to `schedule-acceleration` with compressed dates
4. Use branch comparison to highlight:
   - Tasks with earlier start dates (green)
   - Tasks with later start dates (red)
   - Unchanged tasks (gray)

**Result:** Visual diff showing schedule impact of acceleration.

---

### Example 3: Agile + Hardware Hybrid

**Goal:** Track both software sprint and hardware testing in parallel.

**Steps:**
1. Import `software/mobile-app-sprint.csv` (2-week sprint)
2. Import `hardware/turbo-gt2860-testing.csv` (6-month test program)
3. Filter timeline to show only June-July 2025
4. Group swim lanes by project to separate software and hardware

**Result:** Cross-functional view of concurrent software and hardware work.

---

### Example 4: Multi-Customer Program Management

**Goal:** Track multiple concurrent customer projects with shared deliverables and field testing.

**Steps:**
1. Import `hardware/customer-acme-diesel.csv`
   - Map columns: Task Name → title, Start Date → start_date, Finish Date → end_date
   - Set project name from Customer column: "Acme Motors"
   - Import to branch: `main`

2. Import `hardware/customer-apex-performance.csv`
   - Map columns: Activity → title, Start → start_date, End → end_date
   - Set project name: "Apex Performance"
   - Append to branch: `main`

3. Import `hardware/customer-marine-systems.csv`
   - Map columns: Item → title, Start Date → start_date, Due Date → end_date
   - Set project name: "BlueSea Marine"
   - Append to branch: `main`

4. Import `hardware/customer-deliverables-multi.csv`
   - Append deliverables to existing customer projects
   - Set lane from Document Type column

5. Import `hardware/field-test-results.csv`
   - Track field testing across all customers
   - Use Test ID for unique identification

**Result:** Unified view showing:
- All customer projects on one timeline
- Shared deliverable deadlines across customers
- Field testing activities by customer
- Group by project (Customer) to see each program separately
- Filter by Type to show only milestones (customer approval gates)
- Color code by Phase to show requirements → design → validation → field test

**Advanced Usage:**
- Create branch `acme-schedule-slip` to model impact of Acme delays on other customers
- Filter to show only deliverables Due in Q4 2025
- Export filtered view for executive summary

---

## Column Mapping Reference

Common mappings for different source formats:

| SwimLanes Field | MS Project | MS Planner | Jira | Custom |
|----------------|-----------|------------|------|---------|
| **title** | Task Name | Task Name | Summary | title, name, activity |
| **type** | (inferred) | (inferred) | Issue Type | type, item_type |
| **start_date** | Start | Start Date | Created | start, start_date, begin |
| **end_date** | Finish | Due Date | Due Date | end, finish, due_date |
| **owner** | Resource Names | Assigned To | Assignee | owner, assigned_to, resource |
| **project** | (constant) | (constant) | Components | project, project_name |
| **lane** | (use owner) | Bucket Name | Sprint | lane, category, phase |
| **tags** | (skip) | Labels | Labels | tags, keywords |

---

## File Format Notes

### CSV Format Requirements

- **Encoding:** UTF-8 with BOM optional
- **Delimiter:** Comma (`,`)
- **Quote Character:** Double quote (`"`)
- **Escape:** Double quotes escaped as `""`
- **Line Endings:** CRLF or LF (both accepted)
- **Header Row:** Required (first row)

### Date Format Support

SwimLanes auto-detects and normalizes these formats:

- `YYYY-MM-DD` (ISO 8601) - Preferred
- `M/D/YYYY` (US format)
- `M-D-YYYY` (US format with dashes)
- `MM/DD/YYYY` (US format with leading zeros)

**Ambiguous dates** (e.g., `01/02/2025`): Assumed US format (January 2, 2025). Use ISO format to avoid ambiguity.

### Type Inference

If `type` column is missing, SwimLanes infers type:

- **milestone:** Duration = 0 or end_date is empty
- **task:** Has both start_date and end_date
- **meeting:** Keywords like "meeting", "sync", "standup" in title
- **release:** Keywords like "release", "launch", "deploy" in title

---

## Data Quality Best Practices

1. **Use ISO 8601 dates** (`YYYY-MM-DD`) to avoid parsing ambiguity
2. **Validate required fields** before export: title, type, start_date
3. **Consistent owner names** across imports (e.g., "Alice Chen" not "Alice" and "A. Chen")
4. **Unique project names** to enable filtering and grouping
5. **Standardized tags** for consistent filtering (lowercase, dash-separated)
6. **Export from PM tools regularly** to keep data current

---

## Testing Recommendations

### Unit Tests

- Parse all sample files without errors
- Validate date normalization on `messy-data/mixed-date-formats.csv`
- Validate field validation on `messy-data/missing-fields.csv`
- Test Unicode support on `messy-data/special-characters.csv`

### Integration Tests

- Import each hardware file individually
- Import multi-source workflow (Example 1)
- Create branch comparison (Example 2)
- Test column mapping for each PM tool export

### UI/UX Tests

- Dry-run preview before commit
- Column mapping auto-detection accuracy
- Conflict resolution UI for duplicate IDs
- Error messages for invalid data

---

## Contributing New Sample Data

To add new sample datasets:

1. **Create realistic data** from actual domain (hardware, software, operations, etc.)
2. **Use real tool export formats** (MS Project, Planner, Jira, etc.)
3. **Include documentation** in this README
4. **Test import workflow** with column mapping
5. **Commit to appropriate directory** (hardware/, software/, from-pm-tools/, messy-data/)

### Dataset Checklist

- [ ] Realistic domain-specific terminology
- [ ] Varied date ranges (weeks to months)
- [ ] Multiple owners/assignees
- [ ] Mix of tasks, milestones, releases, meetings
- [ ] Consistent project naming
- [ ] At least 15-30 items per file
- [ ] Documentation in README

---

## Questions and Feedback

For questions about sample data or to suggest improvements:

- **GitHub Issues:** https://github.com/mr-jafner/SwimLanes/issues
- **Label:** `sample-data` or `documentation`

---

**Last Updated:** 2025-11-06
**Version:** 1.0
