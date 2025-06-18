using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Windows;

namespace Simple_banking_app_concept
{
    public partial class MainWindow : Window
    {
        private static List<User> users = new List<User>();

        public MainWindow()
        {
            InitializeComponent();
        }

        private void LoginButton_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                string username = UsernameTextBox.Text.Trim();
                string password = PasswordBox.Password;

                if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
                {
                    LoginMessageTextBlock.Text = "Username and password cannot be empty.";
                    return;
                }

                string hashedPassword = HashPassword(password);
                User user = users.FirstOrDefault(u => u.Username == username && u.HashedPassword == hashedPassword);

                if (user != null)
                {
                    LoginMessageTextBlock.Text = "Login successful!";
                    Dashboard dashboard = new Dashboard(user);
                    dashboard.Show();
                    this.Close(); // Close the login window
                }
                else
                {
                    LoginMessageTextBlock.Text = "Invalid username or password.";
                }
            }
            catch (Exception ex)
            {
                LoginMessageTextBlock.Text = "An error occurred during login. Please try again.";
                Console.WriteLine($"Login error: {ex.Message}");
            }
        }

        private void OpenRegistrationWindow_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                RegistrationWindow registrationWindow = new RegistrationWindow();
                registrationWindow.ShowDialog();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error opening registration window: {ex.Message}");
            }
        }

        private void ForgotPasswordButton_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                ForgotPasswordWindow forgotPasswordWindow = new ForgotPasswordWindow(users);
                forgotPasswordWindow.ShowDialog();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error opening forgot password window: {ex.Message}");
            }
        }

        private string HashPassword(string password)
        {
            try
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
            catch (Exception ex)
            {
                Console.WriteLine($"Error hashing password: {ex.Message}");
                return string.Empty; // Return an empty string if an error occurs
            }
        }
    }
}