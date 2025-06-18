using System.Collections.Generic;
using System.Windows;

namespace Simple_banking_app_concept
{
    public partial class ForgotPasswordWindow : Window
    {
        private List<User> users;

        public ForgotPasswordWindow(List<User> users)
        {
            InitializeComponent();
            this.users = users;
        }

        private void ResetPasswordButton_Click(object sender, RoutedEventArgs e)
        {
            string username = UsernameTextBox.Text.Trim();

            if (string.IsNullOrWhiteSpace(username))
            {
                MessageTextBlock.Text = "Please enter your username.";
                return;
            }

            // Find the user by username
            User user = users.Find(u => u.Username == username);
            if (user != null)
            {
                // Generate a temporary password
                string tempPassword = GenerateTemporaryPassword();
                user.HashedPassword = HashPassword(tempPassword); // Hash the temporary password

                // Display the temporary password to the user
                MessageTextBlock.Text = $"Your temporary password is: {tempPassword}. Please change it after logging in.";
            }
            else
            {
                MessageTextBlock.Text = "Username not found. Please check your entry.";
            }
        }

        private string GenerateTemporaryPassword()
        {
            // Generate a simple temporary password (you can enhance this logic)
            return "Temp1234"; // Replace with a more secure random password generation
        }

        private string HashPassword(string password)
        {
            using (var sha256 = System.Security.Cryptography.SHA256.Create())
            {
                byte[] bytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(password));
                var builder = new System.Text.StringBuilder();
                foreach (byte b in bytes)
                {
                    builder.Append(b.ToString("x2"));
                }
                return builder.ToString();
            }
        }
    }
}