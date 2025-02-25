# Manufacturing Terminal System Documentation

## 1. System Overview

### 1.1 Purpose
The Manufacturing Terminal System is designed to digitize and streamline the manufacturing process workflow in a factory environment. It allows real-time tracking of jobs, operations, setup times, inspections, and production runs across multiple machines and operations. The system aims to improve efficiency, quality control, and data collection throughout the manufacturing process.

### 1.2 Goals and Objectives
- **Digitize Manufacturing Workflow**: Replace paper-based tracking with digital terminals
- **Real-time Production Monitoring**: Track job status, completion times, and quantities
- **Quality Control Integration**: Enforce inspection steps and documentation
- **Process Efficiency Analysis**: Compare planned vs. actual times for setup and production
- **Resource Utilization**: Track operator, setter, and machine utilization
- **Data-Driven Decision Making**: Collect production metrics for continuous improvement

### 1.3 Stakeholders
- Machine Operators
- Setup Technicians/Setters
- Quality Inspectors
- Production Managers
- Factory Floor Supervisors
- Engineering Department

## 2. System Architecture

### 2.1 Technology Stack
- **Frontend**: Next.js (React), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui component library
- **State Management**: React Context API with useReducer
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: PostgreSQL on AWS RDS
- **Database Management**: DBeaver (for administration)
- **Hosting**: Vercel (planned)
- **Version Control**: Git

### 2.2 High-Level Architecture
The application follows a client-server architecture with serverless API functions:

```
Client (Browser) <-> Next.js Frontend <-> Next.js API Routes <-> PostgreSQL Database
```

- **Client**: Web browsers running on terminal devices (tablets, touchscreens) at each machine
- **Frontend**: Next.js React application with TypeScript
- **API Layer**: Next.js API Routes for database operations
- **Database**: PostgreSQL on AWS RDS

### 2.3 Deployment Architecture
- **Production Environment**: Vercel hosting with environment variables for database connection
- **Database**: AWS RDS PostgreSQL instance
- **CI/CD**: Automated deployments through Vercel's GitHub integration

## 3. Core System Components

### 3.1 Terminal Management
Each physical machine in the factory has an assigned terminal with a unique ID, name, and operation code. Terminals must log in to access the system and can only perform their assigned operations.

### 3.2 User Authentication
Users (setters, operators, inspectors) authenticate via employee ID scan. The system validates permissions based on role requirements:
- **Setters**: Authorized to perform machine setup
- **Operators**: Authorized to run production
- **Inspectors**: Authorized to approve/reject setups
- **Supervisors**: Authorized for remanufacturing operations

### 3.3 Job Workflow
The system enforces a structured workflow for each job:

1. **Job Scanning**: Terminal scans job barcode to retrieve job details
2. **Setter Authentication**: Setter scans ID to begin setup process
3. **Setup Phase**: Terminal in SETUP state while machine is prepared
4. **Inspection Process**: Inspector scans ID and approves/rejects setup
5. **Run Phase**: If approved, operator scans ID to begin production run
6. **Job Completion**: Operator records completed quantity
7. **Return to Idle**: Terminal resets for next job

### 3.4 Quality Control
- Setup inspection is mandatory before production can begin
- Inspectors must authenticate and provide pass/fail decision
- Failed inspections return to setup phase with notes
- Inspection data is logged for quality tracking

### 3.5 Production Tracking
- Real-time tracking of setup and run times
- Comparison to planned times for efficiency analysis
- Quantity completion tracking
- Automatic balance calculation

## 4. Database Structure

### 4.1 Database Schema
The system uses a PostgreSQL database with the following core tables:

#### terminals
- `terminal_id`: Unique identifier (Primary Key)
- `terminal_name`: Human-readable name
- `operation_code`: Type of operation performed
- `password`: Terminal authentication
- `active`: Boolean flag for terminal status

#### users
- `employee_id`: Unique identifier (Primary Key)
- `name`: User's name
- `can_operate`: Permission flag
- `can_setup`: Permission flag
- `can_inspect`: Permission flag
- `can_remanufacture`: Permission flag
- `active`: Account status

#### jobs
- `id`: Internal unique identifier
- `contract_number`: External reference number
- `route_card`: Manufacturing route card number
- `part_number`: Part identifier
- `op_code`: Operation code
- `lookup_code`: Composite key for scanning
- `planned_setup_time`: Expected setup duration
- `planned_run_time`: Expected run duration
- `quantity`: Total required quantity
- `customer_name`: Client name
- `description`: Part description
- `due_date`: Completion deadline
- `balance`: Remaining quantity
- `status`: Current job status
- `completed_qty`: Total completed so far

#### setup_logs
- Tracks each setup event with:
  - Terminal, job, and setter IDs
  - Start and end times
  - Inspection details and results

#### run_logs
- Tracks each production run with:
  - Terminal, job, and operator IDs
  - Start and end times
  - Completed quantities

#### efficiency_logs
- Compares planned vs. actual times
- Calculates efficiency metrics

### 4.2 Database Management
- AWS RDS PostgreSQL instance
- DBeaver for administration and management
- Connection pooling via the app's db.ts module

## 5. Application Structure

### 5.1 File Organization
```
src/
├── app/
│   ├── api/                       # API Routes (Backend)
│   │   ├── db-test/               # Database connection test
│   │   ├── jobs/                  # Job-related endpoints
│   │   ├── logs/                  # Logging endpoints
│   │   │   ├── setup/             # Setup logging endpoints
│   │   │   └── run/               # Run logging endpoints
│   │   ├── terminal/              # Terminal endpoints
│   │   └── users/                 # User authentication
│   ├── login/                     # Terminal login page
│   ├── globals.css                # Global styles
│   ├── layout.tsx                 # Root layout component
│   └── page.tsx                   # Home page (main terminal interface)
├── components/
│   ├── ui/                        # UI components from shadcn/ui
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── textarea.tsx
│   ├── CompletionDialog.tsx       # Job completion dialog
│   ├── InspectionDialog.tsx       # Inspection process dialog
│   ├── JobDetailsCard.tsx         # Job information display
│   ├── ScanJobDialog.tsx          # Job scanning interface
│   ├── ScanUserDialog.tsx         # User authentication dialog
│   ├── StateControlButtons.tsx    # Terminal state control interface
│   └── TerminalInfo.tsx           # Terminal status display
├── contexts/
│   └── terminalContext.tsx        # Global state management
├── lib/
│   ├── db.ts                      # Database connection pool
│   └── utils.ts                   # Utility functions
├── types/
│   └── index.ts                   # TypeScript type definitions
└── utils/
    ├── authenticateUser.ts        # User authentication helper
    ├── clearData.ts               # State reset functions
    ├── jobScanner.ts              # Job scanning logic
    └── terminalState.ts           # Terminal state management
```

### 5.2 Key Components
- **TerminalLogin**: Terminal authentication
- **ScanJobDialog**: Job barcode scanning interface
- **JobDetailsCard**: Displays job information
- **ScanUserDialog**: User authentication dialog
- **InspectionDialog**: Setup inspection interface
- **CompletionDialog**: Production run completion interface
- **StateControlButtons**: Controls for changing terminal states
- **TerminalInfo**: Displays current terminal status

### 5.3 State Management
The application uses React Context with useReducer for state management:

- **TerminalContext**: Global state provider
- **AppState**: Contains terminal, job, user, and logging data
- **Actions**: Typed actions for state updates
- **LocalStorage**: Persists key state between sessions

## 6. User Interface

### 6.1 Design System
The application UI is built using:
- **Tailwind CSS**: For responsive styling
- **shadcn/ui**: Component library for consistent design
- **Geist Sans**: Primary font family

### 6.2 UI States and Color Coding
Terminal states are visually differentiated:
- **IDLE**: Red background (awaiting job)
- **SETUP**: Yellow background (machine being set up)
- **RUNNING**: Green background (production in progress)
- **PAUSED**: Blue background with animation (temporarily halted)
- **INSPECTION_REQUIRED**: Orange background (quality check needed)

### 6.3 Responsive Design
The interface is designed to work on various devices deployed on the factory floor, including:
- Fixed terminal touchscreens
- Tablets
- Desktop computers

## 7. Business Logic

### 7.1 Terminal Workflow Logic
The system enforces strict workflow transitions between states:
- IDLE → SETUP (after job scan and setter authentication)
- SETUP → INSPECTION_REQUIRED (after setup completion)
- INSPECTION_REQUIRED → RUNNING (after successful inspection)
- RUNNING → PAUSED (temporary halt)
- PAUSED → RUNNING (resume production)
- RUNNING → IDLE (after completion and quantity entry)

### 7.2 Authentication Logic
- Terminal authentication with terminal ID and password
- User authentication with employee ID
- Role-based authorization (setter, operator, inspector)

### 7.3 Logging Logic
The system creates comprehensive logs for:
- Setup events (start time, end time, setter, inspector)
- Production runs (start time, end time, operator, quantity)
- Efficiency metrics (planned vs. actual times)

## 8. API Endpoints

### 8.1 Terminal API
- **POST /api/terminal/login**: Authenticate terminal

### 8.2 User API
- **POST /api/users/authenticate**: Authenticate user by role

### 8.3 Job API
- **POST /api/jobs/lookup**: Retrieve job details by scan code

### 8.4 Logging API
- **POST /api/logs/setup/start**: Begin setup logging
- **POST /api/logs/setup/complete**: Complete setup with inspection
- **POST /api/logs/run/start**: Begin production run logging
- **POST /api/logs/run/complete**: Complete run with quantity

## 9. Security Considerations

### 9.1 Authentication Security
- Terminal authentication with ID and password
- User authentication with employee ID
- Role-based access control

### 9.2 Data Security
- PostgreSQL with SSL connection
- Environment variables for sensitive credentials
- Input validation on all form entries

### 9.3 API Security
- CSRF protection through Next.js defaults
- Input validation on all API endpoints
- Error handling that doesn't expose implementation details

## 10. Factory Environment Integration

### 10.1 Terminal Distribution
Terminals are strategically placed at each machine or workstation throughout the factory. Each terminal:
- Is assigned to a specific operation
- Has a unique terminal ID and name
- May share operation codes with other similar machines
- Must be properly authenticated

### 10.2 Multi-Operation Flow
The system supports the typical manufacturing flow where:
- Jobs move between different operations in sequence
- Multiple terminals might exist for the same operation type
- Each operation stage has its own setup and run requirements
- Jobs are tracked throughout their entire production lifecycle

### 10.3 Barcode Integration
- Job barcodes on physical paperwork for scanning
- Employee ID cards with barcodes for authentication
- Option for manual entry if scanning is unavailable

## 11. Future Enhancements

### 11.1 Planned Features
- **Reject Handling**: Track rejected parts and reasons
- **Remanufacturing Flow**: Process for reworking rejected parts
- **Label Printing**: Generate labels at various stages
- **Operation Override**: Allow flexibility in special cases
- **Drawing Change Requests**: Process for engineering changes

### 11.2 Technical Enhancements
- **Offline Support**: Function when network is unavailable
- **PWA Capabilities**: Install on devices without browser
- **Real-time Dashboard**: Production monitoring for management
- **Report Generation**: Automated efficiency and quality reports
- **Mobile App**: For supervisors to monitor production remotely

## 12. System Requirements

### 12.1 Hardware Requirements
- Touchscreen terminals or tablets at each workstation
- Barcode scanners (or camera function for scanning)
- Factory network infrastructure
- Optional: Label printers at key stations

### 12.2 Software Requirements
- Modern web browser (Chrome, Firefox, Edge)
- Network connectivity to application server
- DBeaver for database administration
- Git for source control

### 12.3 Network Requirements
- Reliable network throughout the factory floor
- Internet connection for cloud database access
- Appropriate firewall configurations for AWS RDS

## 13. Deployment and Operations

### 13.1 Deployment Process
- Application deployed to Vercel
- Database hosted on AWS RDS
- Environment variables configured in Vercel dashboard
- Continuous deployment from Git repository

### 13.2 Monitoring and Maintenance
- Application monitoring through Vercel analytics
- Database monitoring through AWS RDS monitoring tools
- Regular database backups
- Performance monitoring and optimization

### 13.3 Troubleshooting
- Terminal login issues
- Job scanning problems
- User authentication failures
- Network connectivity problems
- Database connection issues

## 14. Training and Adoption

### 14.1 User Training
- Terminal login and basics
- Job scanning procedures
- Setup and inspection processes
- Production run tracking
- Issue reporting

### 14.2 Administrator Training
- System configuration
- User management
- Terminal management
- Database administration
- Troubleshooting procedures

## 15. Conclusion

The Manufacturing Terminal System represents a significant advancement in digitizing factory floor operations. By providing real-time tracking, enforcing quality procedures, and collecting valuable production data, the system will drive improvements in efficiency, quality, and decision-making throughout the manufacturing process.

The modular architecture and scalable design allow for future enhancements to address evolving business needs while the use of modern web technologies ensures a responsive, user-friendly experience for all stakeholders.
