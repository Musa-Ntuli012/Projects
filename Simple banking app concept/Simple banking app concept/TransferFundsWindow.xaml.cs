using System.Windows;

namespace Simple_banking_app_concept
{
    public partial class TransferFundsWindow : Window
    {
        private User currentUser;

        public TransferFundsWindow(User user)
        {
            InitializeComponent();
            currentUser = user;
        }

        private void TransferButton_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                string recipientUsername = RecipientUsernameTextBox.Text;
                if (decimal.TryParse(AmountTextBox.Text, out decimal amount) && amount > 0)
                {
                    User recipient = UserDatabase.FindUser (recipientUsername);

                    if (recipient != null)
                    {
                        if (currentUser.Balance >= amount)
                        {
                            currentUser.Balance -= amount;
                            recipient.Balance += amount;
                            currentUser.AddTransaction($"Transfer to {recipient.Username}", -amount);
                            recipient.AddTransaction($"Transfer from {currentUser.Username}", amount);
                            TransferMessageTextBlock.Text = "Transfer successful!";
                        }
                        else
                        {
                            TransferMessageTextBlock.Text = "Insufficient balance.";
                        }
                    }
                    else
                    {
                        TransferMessageTextBlock.Text = "Recipient not found.";
                    }
                }
                else
                {
                    TransferMessageTextBlock.Text = "Please enter a valid amount.";
                }
            }
            catch (Exception ex)
            {
                TransferMessageTextBlock.Text = "An error occurred during the transfer. Please try again.";
                Console.WriteLine($"Transfer error: {ex.Message}");
            }
        }
    }
}