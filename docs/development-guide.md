# Manufacturing Terminal System Development Guide

This guide outlines the development workflow, best practices, and implementation steps for building the Manufacturing Terminal System.

## Table of Contents
1. [Development Environment Setup](#development-environment-setup)
2. [Database Configuration](#database-configuration)
3. [Code Organization and Patterns](#code-organization-and-patterns)
4. [Component Implementation Guidelines](#component-implementation-guidelines)
5. [State Management](#state-management)
6. [Testing](#testing)
7. [Deployment](#deployment)

## Development Environment Setup

### Prerequisites
- Node.js (v16.x or later)
- npm or yarn
- Git
- DBeaver (for database management)
- AWS account (for RDS)
- Vercel account (for deployment)

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd manufacturing-terminal
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn
   ```

3. **Create .env.local file**
   ```
   DATABASE_URL=postgres://<username>:<password>@<hostname>:<port>/<database>
   ```

4. **Run development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

### Installed Packages

- **Next.js**: React framework for server-rendered applications
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Component library based on Radix UI
- **PostgreSQL client**: For database connectivity
- **Lucide React**: Icon library

## Database Configuration

### AWS RDS Setup

1. **Create PostgreSQL instance**
   - Login to AWS Console
   - Navigate to RDS
   - Create new PostgreSQL instance
   - Set appropriate size (start with t3.micro for development)
   - Enable SSL connections
   - Configure VPC security groups to allow connections

2. **Configure Security Groups**
   - Allow connections from your development machine
   - Allow connections from Vercel deployment IPs

3. **Initialize Database Schema**
   - Connect to RDS instance using DBeaver
   - Run the provided database schema script
   - Verify tables are created correctly

### Connection Pool Configuration

The application uses a connection pool to manage database connections efficiently:

```typescript
// src/lib/db.ts
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for AWS RDS if SSL is enabled
  },
});

export default pool;
```

### Database Testing

Verify the database connection with the test endpoint:

```
GET /api/db-test
```

This should return the current timestamp from the database.

## Code Organization and Patterns

### Project Structure

Maintain a clean and organized project structure:

```
src/
├── app/               # Pages and API routes
├── components/        # React components
├── contexts/          # React contexts
├── lib/               # Utility libraries
├── types/             # TypeScript type definitions
└── utils/             # Helper functions
```

### Best Practices

1. **Component Organization**
   - Create focused, reusable components
   - Keep components under 200 lines of code
   - Export one component per file

2. **File Naming**
   - Use PascalCase for component files
   - Use camelCase for utility files
   - Use kebab-case for API route folders

3. **TypeScript Usage**
   - Define precise types for all props
   - Use interfaces for complex objects
   - Avoid using `any` type

4. **Code Style**
   - Follow ESLint and Prettier configurations
   - Use functional components with hooks
   - Document complex logic with comments

## Component Implementation Guidelines

### UI Components

1. **shadcn/ui Components**
   - Use and extend the shadcn/ui component library
   - Follow the design system patterns
   - Use Tailwind utilities for additional styling

2. **Custom Components**
   - Create components for domain-specific UI
   - Ensure accessibility with proper ARIA attributes
   - Test responsiveness on different screen sizes

### Terminal Flow Components

When implementing terminal flow components, follow these guidelines:

1. **Dialog Components**
   - Implement as modal overlays
   - Include clear headers
   - Provide cancel and confirmation actions
   - Handle loading states

2. **Authentication Components**
   - Clear user instructions
   - Input validation
   - Error feedback
   - Success confirmation

3. **State Indicators**
   - Consistent color coding
   - Clear visual differentiation
   - Text labels for states

## State Management

### Context and Reducer Pattern

The application uses React Context with useReducer for state management:

1. **Define Types**
   ```typescript
   // Example from src/types/index.ts
   export type TerminalData = {
     terminalId: number | null;
     terminalName: string | null;
     operationCode: string | null;
     // ...other properties
   };
   ```

2. **Create Actions**
   ```typescript
   // Example from src/contexts/terminalContext.tsx
   type ActionType =
     | { type: "SET_TERMINAL_DATA"; payload: Partial<TerminalData> }
     | { type: "SET_TERMINAL_STATE"; payload: TerminalData["terminalState"] }
     | { type: "SET_CURRENT_JOB"; payload: JobData | null }
     // ...other actions
   ```

3. **Implement Reducer**
   ```typescript
   function appReducer(state: AppState, action: ActionType): AppState {
     switch (action.type) {
       case "SET_TERMINAL_DATA":
         return {
           ...state,
           terminal: {
             ...state.terminal,
             ...action.payload,
           },
         };
       // ...other cases
       default:
         return state;
     }
   }
   ```

4. **Create Provider**
   ```typescript
   export function TerminalProvider({ children }: { children: ReactNode }) {
     const [state, dispatch] = useReducer(appReducer, initialState);
     
     // Side effects for localStorage, etc.
     
     return (
       <TerminalContext.Provider value={{ state, dispatch }}>
         {children}
       </TerminalContext.Provider>
     );
   }
   ```

5. **Use in Components**
   ```typescript
   function MyComponent() {
     const { state, dispatch } = useTerminal();
     
     const handleAction = () => {
       dispatch({ 
         type: "SET_TERMINAL_STATE", 
         payload: "RUNNING" 
       });
     };
     
     return (
       // Component JSX using state and dispatch
     );
   }
   ```

### LocalStorage Integration

The application uses localStorage to persist critical state between page refreshes:

1. **Load from localStorage on mount**
   ```typescript
   useEffect(() => {
     const savedTerminalData = localStorage.getItem("terminalData");
     if (savedTerminalData) {
       try {
         const parsedData = JSON.parse(savedTerminalData);
         dispatch({ 
           type: "SET_TERMINAL_DATA", 
           payload: parsedData 
         });
       } catch (error) {
         console.error("Error parsing terminal data from localStorage:", error);
       }
     }
   }, []);
   ```

2. **Save to localStorage on state changes**
   ```typescript
   useEffect(() => {
     if (state.terminal.terminalId) {
       localStorage.setItem("terminalData", JSON.stringify(state.terminal));
     }
   }, [state.terminal]);
   ```

## API Implementation

### API Route Pattern

Next.js API routes follow this pattern:

```typescript
// src/app/api/[endpoint]/route.ts
import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(req: Request) {
  try {
    // 1. Parse request body
    const body = await req.json();
    
    // 2. Validate required fields
    if (!body.requiredField) {
      return NextResponse.json(
        { error: "Missing required field" },
        { status: 400 }
      );
    }
    
    // 3. Execute database query
    const result = await db.query(
      `INSERT INTO table_name (field) VALUES ($1) RETURNING id`,
      [body.field]
    );
    
    // 4. Return success response
    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    // 5. Handle errors
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### Error Handling

Consistent error handling throughout API routes:

1. Use try/catch blocks around all database operations
2. Log detailed errors to the console
3. Return generic error messages to the client
4. Include appropriate HTTP status codes

### Database Queries

SQL queries should use parameterized statements to prevent SQL injection:

```typescript
// Good - Using parameterized query
const result = await db.query(
  "SELECT * FROM users WHERE employee_id = $1",
  [employeeId]
);

// Bad - Vulnerable to SQL injection
const result = await db.query(
  `SELECT * FROM users WHERE employee_id = '${employeeId}'`
);
```

## Testing

### Manual Testing Process

1. **Terminal Login Testing**
   - Verify correct terminals can log in
   - Verify incorrect credentials are rejected
   - Verify login state persists after page refresh

2. **Job Scanning Testing**
   - Verify correct jobs can be scanned
   - Verify invalid scan codes are rejected
   - Verify job details display correctly

3. **User Authentication Testing**
   - Verify users with correct roles can authenticate
   - Verify users without required roles are rejected
   - Verify authentication state persists appropriately

4. **Workflow Testing**
   - Test complete workflow from IDLE to SETUP to RUNNING to completion
   - Test inspection pass/fail scenarios
   - Test job abandonment flow

### Automated Testing (Future)

1. **Component Testing**
   - Use React Testing Library for component tests
   - Test UI behavior and state transitions
   - Mock context providers as needed

2. **API Testing**
   - Use Jest for API route testing
   - Mock database responses
   - Test error handling

3. **End-to-End Testing**
   - Use Cypress for complete workflow testing
   - Test on different devices and screen sizes
   - Test with real database (test environment)

## Deployment

### Vercel Deployment

1. **Initial Setup**
   - Connect GitHub repository to Vercel
   - Configure environment variables (especially DATABASE_URL)
   - Set appropriate Node.js version

2. **Deployment Process**
   - Automatic deployments on push to main branch
   - Preview deployments for pull requests
   - Manual promotion to production if needed

3. **Environment Configuration**
   - Development environment with debugging enabled
   - Staging environment with test database
   - Production environment with production database

### Monitoring and Maintenance

1. **Error Monitoring**
   - Use Vercel Analytics for error tracking
   - Set up log collection
   - Create alerts for critical errors

2. **Performance Monitoring**
   - Track page load times
   - Monitor API response times
   - Identify slow database queries

3. **Database Maintenance**
   - Regular backups (automated with RDS)
   - Index optimization
   - Query performance analysis

## Workflow Implementation Steps

Follow these steps when implementing the complete terminal workflow:

1. **Terminal Login**
   - Implement TerminalLogin component
   - Create terminal authentication API
   - Store terminal data in context

2. **Job Scanning**
   - Implement ScanJobDialog component
   - Create job lookup API
   - Display job details

3. **User Authentication**
   - Implement ScanUserDialog for setter authentication
   - Create user authentication API
   - Transition terminal to SETUP state

4. **Setup Process**
   - Create setup logging API
   - Implement setup completion action
   - Log setup times

5. **Inspection Process**
   - Implement InspectionDialog component
   - Create inspection logging API
   - Handle pass/fail scenarios

6. **Run Process**
   - Implement operator authentication
   - Create run logging API
   - Log production run times

7. **Completion Process**
   - Implement CompletionDialog component
   - Update job quantities
   - Reset terminal to IDLE state

## Conclusion

This development guide provides a structured approach to implementing the Manufacturing Terminal System. By following these guidelines and best practices, you'll create a robust, maintainable application that meets the factory workflow requirements.

Remember to start with the core architecture, then implement each workflow step incrementally, testing thoroughly as you go. Prioritize the critical path functionality before adding additional features.
