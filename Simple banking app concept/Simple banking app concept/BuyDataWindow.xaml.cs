using System.Windows;

namespace Simple_banking_app_concept
{
    public partial class BuyDataWindow : Window
    {
        private User currentUser;

        public BuyDataWindow(User user)
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
                    BuyDataMessageTextBlock.Text = "Data purchased successfully!";
                }
                else
                {
                    BuyDataMessageTextBlock.Text = "Insufficient balance.";
                }
            }
            else
            {
                BuyDataMessageTextBlock.Text = "Please enter a valid amount.";
            }
        }
    }
}