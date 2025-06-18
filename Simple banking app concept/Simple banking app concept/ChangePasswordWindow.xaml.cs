using System.Security.Cryptography; // Add this line
using System.Text;
using System.Windows;

namespace Simple_banking_app_concept
{
    public partial class ChangePasswordWindow : Window
    {
        private User currentUser;

        public ChangePasswordWindow(User user)
        {
            InitializeComponent();
            currentUser = user;
        }

        private void ChangePasswordButton_Click(object sender, RoutedEventArgs e)
        {
            string newPassword = NewPasswordBox.Password;

            if (string.IsNullOrWhiteSpace(newPassword))
            {
                ChangePasswordMessageTextBlock.Text = "Password cannot be empty.";
                return;
            }

            currentUser.HashedPassword = HashPassword(newPassword);
            ChangePasswordMessageTextBlock.Text = "Password changed successfully!";
            this.Close();
        }

        private string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                byte[] bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                var builder = new StringBuilder();
                foreach (var b in bytes)
                {
                    builder.Append(b.ToString("x2"));
                }
                return builder.ToString();
            }
        }
    }
}