using LiveCharts.Wpf.Charts.Base;
using Microsoft.Win32;
using System;
using System.Security.Cryptography;
using System.Text;
using System.Windows;

namespace Simple_banking_app_concept
{
    public partial class RegistrationWindow : Window
    {
        private string idCopyPath;

        public RegistrationWindow()
        {
            InitializeComponent();
        }

        private void UploadIdButton_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                OpenFileDialog openFileDialog = new OpenFileDialog
                {
                    Filter = "PDF Files (*.pdf)|*.pdf",
                    Title = "Select ID Copy"
                };

                if (openFileDialog.ShowDialog() == true)
                {
                    idCopyPath = openFileDialog.FileName;
                    IdCopyPathTextBlock.Text = $"ID Copy: {idCopyPath}";
                }
            }
            
            catch (Exception ex)
            {
                Console.WriteLine($"Error uploading ID copy: {ex.Message}");
            }
        }

        private void RegisterButton_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                string firstName = FirstNameTextBox.Text.Trim();
                string lastName = LastNameTextBox.Text.Trim();
                string address = AddressTextBox.Text.Trim();
                string username = UsernameTextBox.Text.Trim();
                string password = PasswordBox.Password;

                if (string.IsNullOrWhiteSpace(firstName) || string.IsNullOrWhiteSpace(lastName) ||
                    string.IsNullOrWhiteSpace(address) || string.IsNullOrWhiteSpace(username) ||
                    string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(idCopyPath))
                {
                    RegistrationMessageTextBlock.Text = "All fields are required.";
                    return;
                }

                if (UserDatabase.FindUser(username) != null)
                {
                    RegistrationMessageTextBlock.Text = "Username already exists.";
                    return;
                }

                string hashedPassword = HashPassword(password);
                User newUser = new User(firstName, lastName, address, idCopyPath, username, hashedPassword, 0);
                UserDatabase.AddUser(newUser);
                RegistrationMessageTextBlock.Text = "Registration successful!";
                this.Close();
            }
            catch (Exception ex)
            {
                RegistrationMessageTextBlock.Text = "An error occurred during registration. Please try again.";
                Console.WriteLine($"Registration error: {ex.Message}");
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