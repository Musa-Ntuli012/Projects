using System.Windows;

namespace Simple_banking_app_concept
{
    public partial class BuyAirtimeWindow : Window
    {
        private User currentUser;

        public BuyAirtimeWindow(User user)
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
                    BuyAirtimeMessageTextBlock.Text = "Airtime purchased successfully!";
                }
                else
                {
                    BuyAirtimeMessageTextBlock.Text = "Insufficient balance.";
                }
            }
            else
            {
                BuyAirtimeMessageTextBlock.Text = "Please enter a valid amount.";
            }
        }
    }
}