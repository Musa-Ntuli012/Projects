using LiveCharts;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows;

namespace Simple_banking_app_concept
{
    public partial class Dashboard : Window
    {
        private User currentUser;

        public ChartValues<double> IncomeValues { get; set; }
        public ChartValues<double> ExpenseValues { get; set; }
        public string[] Categories { get; set; }

        public Dashboard(User user)
        {
            InitializeComponent();
            currentUser = user;

            // Display user details
            FirstNameTextBlock.Text = $"Username: {currentUser.Username}";
            BalanceTextBlock.Text = $"Account Balance: {currentUser.Balance}";

            // Load transaction history into the DataGrid
            //LoadTransactionHistory();

            // Set up chart data
            SetupChart();
        }

        private void SetupChart()
        {
            // Group transactions by type (income or expense)
            var incomeTransactions = currentUser.TransactionHistory.Where(t => t.Amount > 0).ToList();
            var expenseTransactions = currentUser.TransactionHistory.Where(t => t.Amount < 0).ToList();

            // Set up income and expense values
            IncomeValues = new ChartValues<double>
            {
                (double)incomeTransactions.Sum(t => t.Amount) // Total income
            };

            ExpenseValues = new ChartValues<double>
            {
                (double)Math.Abs(expenseTransactions.Sum(t => t.Amount)) // Total expenses (make positive)
            };

            // Set categories for the chart
            Categories = new[] { "Total Income", "Total Expenses" };

            // Bind the data to the chart
            BudgetChart.DataContext = this;
        }

        private void LogoutButton_Click(object sender, RoutedEventArgs e)
        {
            this.Close(); // Close the dashboard window
        }

        private void ChangePasswordButton_Click(object sender, RoutedEventArgs e)
        {
            ChangePasswordWindow changePasswordWindow = new ChangePasswordWindow(currentUser); // Pass the current user
            changePasswordWindow.ShowDialog();
        }

        private void BuyDataButton_Click(object sender, RoutedEventArgs e)
        {
            BuyDataWindow buyDataWindow = new BuyDataWindow(currentUser); // Pass the current user
            buyDataWindow.ShowDialog();
        }

        private void BuyAirtimeButton_Click(object sender, RoutedEventArgs e)
        {
            BuyAirtimeWindow buyAirtimeWindow = new BuyAirtimeWindow(currentUser); // Pass the current user
            buyAirtimeWindow.ShowDialog();
        }

        private void ViewTransactionHistoryButton_Click(object sender, RoutedEventArgs e)
        {
            TransactionHistoryWindow transactionHistoryWindow = new TransactionHistoryWindow(currentUser.TransactionHistory);
            transactionHistoryWindow.ShowDialog();
        }

        private void BuyElectricityButton_Click(object sender, RoutedEventArgs e)
        {
            BuyElectricityWindow buyElectricityWindow = new BuyElectricityWindow(currentUser);
            buyElectricityWindow.ShowDialog();
        }

        private void TransferFundsButton_Click(object sender, RoutedEventArgs e)
        {
            TransferFundsWindow transferFundsWindow = new TransferFundsWindow(currentUser);
            transferFundsWindow.ShowDialog();
        }
    }
}