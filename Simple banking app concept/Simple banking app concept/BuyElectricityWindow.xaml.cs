using System.Windows;

namespace Simple_banking_app_concept
{
    public partial class BuyElectricityWindow : Window
    {
        private User currentUser;

        public BuyElectricityWindow(User user)
        {
            InitializeComponent();
            currentUser = user;
        }

        private void BuyButton_Click(object sender, RoutedEventArgs e)
        {
            if (decimal.TryParse(AmountTextBox.Text, out decimal amount) && amount > 0)
            {
                if (currentUser.Balance >= amount)
                {
                    currentUser.Balance -= amount;
                    currentUser.AddTransaction("Electricity Purchase", amount); BuyElectricityMessageTextBlock.Text = "Electricity purchased successfully!";
                }
                else { BuyElectricityMessageTextBlock.Text = "Insufficient balance."; }
            }
            else { BuyElectricityMessageTextBlock.Text = "Please enter a valid amount."; }
        }
    }
}