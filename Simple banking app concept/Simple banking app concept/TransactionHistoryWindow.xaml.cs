using System;
using System.Collections.Generic;
using System.Windows;

namespace Simple_banking_app_concept
{
    public partial class TransactionHistoryWindow : Window
    {
        public TransactionHistoryWindow(List<Transaction> transactions)
        {
            InitializeComponent();
            try
            {
                TransactionListView.ItemsSource = transactions;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading transaction history: {ex.Message}");
            }
        }
    }
}