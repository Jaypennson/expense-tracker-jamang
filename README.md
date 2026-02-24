#  Expense Tracker

A modern, full-stack expense and income tracking application built with Next.js 14, Supabase, and TypeScript. Track your income and expenses, manage budgets, calculate your balance, and visualize your financial patterns with beautiful charts.

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20Database-green)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)

## Features

### Dashboard
- **Financial Overview** - See income, expenses, and balance at a glance
- **Monthly & Yearly Stats** - Track your financial health over time
- **Balance Calculation** - Automatic calculation: Income - Expenses = Balance
- **Interactive Charts** - Daily spending line chart, category pie chart, and 6-month trend bar chart
- **Summary Cards** - Total income, total expenses, balance, biggest category, and expense count
- **Powered by Recharts** - Beautiful, responsive data visualizations
- **Color-Coded Indicators** - Green for surplus/income, red for deficit/expenses

### Income Management
- **Full CRUD Operations** - Create, read, update, and delete income records
- **Source Tracking** - Categorize income by source (salary, freelance, investment, etc.)
- **Date Tracking** - Track income by date with calendar picker
- **Notes Field** - Add optional notes to income records
- **Amount Formatting** - Philippine Peso (?) currency formatting
- **Total Income Display** - See your total income at the top

### Expense Management
- **Full CRUD Operations** - Create, read, update, and delete expenses
- **Category-based Organization** - Assign expenses to custom categories
- **Date Tracking** - Track expenses by date with calendar picker
- **Notes Field** - Add optional notes to expense records
- **User Attribution** - See who added each expense
- **Amount Formatting** - Philippine Peso (?) currency formatting

### Category Management
- **Custom Categories** - Create unlimited expense categories
- **Color Coding** - Visual color identification for each category
- **Category Stats** - See spending breakdown by category
- **Easy Management** - Edit and delete categories as needed

### Budget Tracking
- **Monthly Budgets** - Set budget limits for each category
- **Progress Bars** - Visual progress tracking with color indicators
- **Month Navigation** - Browse budgets by month and year
- **Spending Alerts** - Color-coded warnings when approaching or exceeding limits
  - Green: Under 80%
  - Yellow: 80-100%
  - Red: Over 100%

### Authentication & Security
- **Secure Authentication** - Powered by Supabase Auth
- **Row Level Security (RLS)** - Each user only sees their own data
- **Session Management** - Automatic logout and session handling
- **Protected Routes** - Middleware-based route protection

### Progressive Web App (PWA)
- **Installable on iPhone** - Add to home screen for native app experience
- **Offline Support** - Service worker caching for offline access
- **Native Feel** - Fullscreen mode, custom app icon, and splash screen
- **Responsive Design** - Works perfectly on mobile, tablet, and desktop

## Tech Stack

### Frontend
- **Next.js 16.1.6** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Recharts 3.7** - Composable charting library
- **Lucide React** - Beautiful icon library

### Backend & Database
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Authentication
  - Real-time subscriptions
  - Row Level Security
- **Server Actions** - Next.js server-side operations
- **Edge Runtime** - Fast, globally distributed

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Turbopack** - Fast bundler

## Installation

### Prerequisites
- Node.js 20+ installed
- A Supabase account and project

### 1. Clone the Repository

```sh
git clone https://github.com/yourusername/expense-tracker.git
cd expense-tracker
```

### 2. Install Dependencies

```sh
npm install
```

### 3. Set Up Environment Variables
Create a `.env.local` file in the root directory:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Get these values from your Supabase Dashboard ? Settings ? API

### 4. Set Up Database

Run these SQL commands in your Supabase SQL Editor:

<details>
<summary>Click to expand SQL setup</summary>

```sql
-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Expenses table
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Incomes table
CREATE TABLE incomes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  source TEXT NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Budgets table
CREATE TABLE budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  category_id UUID REFERENCES categories(id),
  monthly_limit DECIMAL(10,2) NOT NULL,
  month INT NOT NULL,
  year INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, category_id, month, year)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can view own expenses" ON expenses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own categories" ON categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own budgets" ON budgets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own incomes" ON incomes FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX expenses_user_id_idx ON expenses(user_id);
CREATE INDEX expenses_date_idx ON expenses(date);
CREATE INDEX categories_user_id_idx ON categories(user_id);
CREATE INDEX budgets_user_id_idx ON budgets(user_id);
CREATE INDEX incomes_user_id_idx ON incomes(user_id);
CREATE INDEX incomes_date_idx ON incomes(date);

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (new.id, new.email, INITCAP(REGEXP_REPLACE(SPLIT_PART(new.email, '@', 1), '\d+$', '')));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```
</details>

### 5. Run Development Server

```sh
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Create Your First User
Go to **Supabase Dashboard** ? **Authentication** ? **Users** ? **"Add user"** and create an account.

## PWA Installation (iPhone)

1. Open Safari on your iPhone
2. Navigate to your deployed app URL
3. Tap the **Share** button (square with arrow)
4. Scroll down and tap **"Add to Home Screen"**
5. Tap **"Add"**
6. The app icon appears on your home screen!

### Creating App Icons
You need two icon files:
- `public/icon-192.png` (192x192 pixels)
- `public/icon-512.png` (512x512 pixels)

Use [PWA Builder Image Generator](https://www.pwabuilder.com/imageGenerator) to create them.

## Project Structure

```
expense-tracker/
??? app/
?   ??? (app)/                    # Protected routes (with layout)
?   ?   ??? dashboard/            # Dashboard page
?   ?   ??? incomes/              # Income management
?   ?   ??? expenses/             # Expenses management
?   ?   ??? categories/           # Category management
?   ?   ??? budgets/              # Budget tracking
?   ??? actions/                  # Server actions
?   ?   ??? incomes.ts
?   ?   ??? expenses.ts
?   ?   ??? categories.ts
?   ?   ??? budgets.ts
?   ?   ??? dashboard.ts
?   ??? login/                    # Login page
?   ??? layout.tsx                # Root layout
??? components/
?   ??? charts/                   # Chart components
?   ??? ui/                       # shadcn/ui components
?   ??? pwa-register.tsx          # PWA registration
??? lib/
?   ??? supabase/                 # Supabase client utilities
??? public/
?   ??? manifest.json             # PWA manifest
?   ??? sw.js                     # Service worker
??? middleware.ts                 # Auth middleware
??? database-migration-income.sql # Income feature migration
```

## Configuration

### Supabase Authentication Setup

1. **Go to** Supabase Dashboard ? Authentication ? URL Configuration
2. **Set Site URL**: `http://localhost:3000` (or your production URL)
3. **Add Redirect URLs**: `http://localhost:3000/login`

### User Management

**To add new users:**
1. Go to **Supabase Dashboard** ? **Authentication** ? **Users**
2. Click **"Invite user"** or **"Add user"**
3. Enter their email and password
4. User can now login to the app

## Features in Detail

### Dashboard Analytics
- **Financial Overview** - See total income, total expenses, and balance (Income - Expenses)
- **Monthly & Yearly Stats** - Track your financial health over different periods
- **Color-Coded Balance** - Green for surplus, red for deficit
- **Daily Spending Chart** - Line chart showing daily expenses for the current month
- **Category Breakdown** - Pie chart with spending distribution by category
- **6-Month Trend** - Bar chart showing spending trends over the last 6 months
- **Summary Cards** - Quick overview of key financial metrics

### Income Management
- Add income with description, amount, source, date, and optional notes
- Edit existing income records
- Delete with confirmation
- View all income in a sortable table
- Track income by different sources (salary, freelance, investment, etc.)
- See total income at the top

### Expense Tracking
- Add expenses with description, amount, category, date, and optional notes
- Edit existing expenses
- Delete with confirmation
- View all expenses in a sortable table
- See total expenses at the top
- Category-based organization

### Budget Management
- Set monthly budget limits per category
- Navigate through different months
- Visual progress bars showing spending vs budget
- Automatic calculation of remaining budget
- Color-coded warnings for overspending

### Category System
- Create custom categories with names and colors
- Color-coded badges throughout the app
- Edit category details
- Delete categories (with warning about affected expenses)

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import project to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Update Supabase Settings
After deployment, update in Supabase Dashboard:
- Site URL: Your Vercel deployment URL
- Redirect URLs: Add your Vercel URL

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Supabase](https://supabase.com/) - Backend as a Service
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Recharts](https://recharts.org/) - Charting library
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Lucide](https://lucide.dev/) - Icon library

## Contact

For questions or feedback, please open an issue on GitHub.

---

**Built with ?? using Next.js and Supabase**
