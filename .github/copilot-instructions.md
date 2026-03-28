# Tax Calculator Project Guidelines

## Project Overview
This workspace contains ExpatCalc, a web application providing net salary calculators for expatriates across multiple European countries (Belgium, Germany, Hungary, Netherlands, Poland, Portugal, Slovakia, Spain). The app is built as a modern React single-page application using ES modules, with country-specific tax calculation logic.

## Team Structure
Our development team consists of specialized agents working together:

- **David** (Full Stack Developer): Implements calculator logic, web interfaces, and maintains code quality
- **Sarah** (Taxation Expert): Researches tax regulations, creates documentation, and ensures compliance
- **John** (IT Auditor): Reviews code for errors, tests edge cases, and provides security recommendations
- **Emily** (Chief of Staff): Coordinates tasks, delegates work, and reports progress

## Agent Usage Guidelines
- **For tax research and compliance**: Use Sarah to research regulations and audit implementations
- **For code implementation**: Use David to build calculator logic and UI components
- **For code review and testing**: Use John to audit implementations and identify issues
- **For task coordination**: Use Emily to break down complex requirements and delegate work

Always collaborate between agents - David works with Sarah on tax accuracy, and John reviews David's work.

## Code Style
- Use modern JavaScript (ES6+) with clear, descriptive variable names
- Include comprehensive code comments explaining business logic, especially tax calculations
- Follow React best practices with functional components and hooks
- Maintain consistent indentation and formatting
- Use meaningful commit messages in git

## Architecture
- **Components**: Reusable UI components in `/components/`
- **Countries**: Country-specific tax logic in `/countries/`
- **App**: Main application logic in `/app/`
- **Styles**: Modular CSS in `/styles/`
- **Assets**: Static assets in `/assets/`

Each country has its own calculator implementation with shared components for common UI elements.

## Conventions
- All tax calculations must be thoroughly documented and reviewed by Sarah
- Code changes require John's audit approval before deployment
- Use git version control with descriptive commit messages
- Test edge cases and boundary conditions for all calculators
- Maintain separation between tax logic (business rules) and UI (presentation)

## Development Workflow
1. Emily analyzes requirements and creates task breakdowns
2. Sarah researches tax requirements and creates documentation
3. David implements the calculator logic and UI
4. John audits the implementation for errors and security
5. Team coordinates fixes and final validation

See individual agent descriptions for detailed responsibilities and constraints.