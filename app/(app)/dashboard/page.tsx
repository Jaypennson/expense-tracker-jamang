import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDashboardData } from "@/app/actions/dashboard"
import {
  DailySpendingChart,
  CategoryPieChart,
  MonthlySpendingChart,
} from "@/components/charts/dashboard-charts"
import { TrendingUp, Calendar, Tag, Receipt, DollarSign, Wallet as WalletIcon, TrendingDown } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const result = await getDashboardData()

  if (result.error || !result.data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive font-medium mb-2">Failed to load dashboard</p>
          <p className="text-sm text-muted-foreground">
            {result.error || "Please try again later"}
          </p>
        </div>
      </div>
    )
  }

  const { summary, dailySpending, categoryBreakdown, monthlySpending } = result.data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your income, expenses and financial health
        </p>
      </div>

      {/* Summary Cards - First Row: Monthly Stats */}
      <div>
        <h2 className="text-lg font-semibold mb-3">This Month</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Total Income
                </CardTitle>
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xl sm:text-2xl font-bold text-green-600">
                ₱{summary.totalIncomesThisMonth.toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Total Expenses
                </CardTitle>
                <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xl sm:text-2xl font-bold text-red-600">
                ₱{summary.totalExpensesThisMonth.toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 lg:col-span-1">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Balance
                </CardTitle>
                <WalletIcon className={`h-3 w-3 sm:h-4 sm:w-4 ${
                  summary.balanceThisMonth >= 0 ? "text-green-600" : "text-red-600"
                }`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className={`text-xl sm:text-2xl font-bold ${
                summary.balanceThisMonth >= 0 ? "text-green-600" : "text-red-600"
              }`}>
                ₱{summary.balanceThisMonth.toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.balanceThisMonth >= 0 ? "Surplus" : "Deficit"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Second Row: Yearly Stats and Other Info */}
      <div>
        <h2 className="text-lg font-semibold mb-3">This Year & Stats</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Yearly Balance
                </CardTitle>
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className={`text-xl sm:text-2xl font-bold ${
                summary.balanceThisYear >= 0 ? "text-green-600" : "text-red-600"
              }`}>
                ₱{summary.balanceThisYear.toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Biggest Category
                </CardTitle>
                <Tag className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {summary.biggestCategory ? (
                <>
                  <p className="text-base sm:text-lg font-bold truncate">
                    {summary.biggestCategory.name}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    ₱{(summary.biggestCategory.amount as number).toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </>
              ) : (
                <p className="text-xs sm:text-sm text-muted-foreground">No expenses yet</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Number of Expenses
                </CardTitle>
                <Receipt className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xl sm:text-2xl font-bold">{summary.expenseCount}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts Row 1: Daily Spending */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Daily Spending This Month</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {dailySpending.length > 0 ? (
            <DailySpendingChart data={dailySpending} />
          ) : (
            <div className="flex items-center justify-center h-[250px] sm:h-[300px]">
              <p className="text-muted-foreground text-sm">No expenses this month</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts Row 2: Category Breakdown and Monthly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            {categoryBreakdown.length > 0 ? (
              <CategoryPieChart data={categoryBreakdown} />
            ) : (
              <div className="flex items-center justify-center h-[280px] sm:h-[300px]">
                <p className="text-muted-foreground text-sm">No category data</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Last 6 Months</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            {monthlySpending.length > 0 ? (
              <MonthlySpendingChart data={monthlySpending} />
            ) : (
              <div className="flex items-center justify-center h-[250px] sm:h-[300px]">
                <p className="text-muted-foreground text-sm">No monthly data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
