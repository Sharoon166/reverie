# Dependencies to Install

Run these commands to install the required dependencies for the new forms:

```bash
# Install react-hook-form and related packages
npm install react-hook-form @hookform/resolvers

# Install react-phone-input-2 for phone number inputs
npm install react-phone-input-2

# Install additional Radix UI components
npm install @radix-ui/react-label @radix-ui/react-select

# Install shadcn components (if not already installed)
npx shadcn@latest add form
npx shadcn@latest add select
npx shadcn@latest add textarea
npx shadcn@latest add label
npx shadcn@latest add calendar
```

Note: Some of these components might already be installed. The commands will update them if needed.
