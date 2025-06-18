using System;
using System.Collections.Generic;
using System.Linq;

namespace Simple_banking_app_concept
{
    public static class UserDatabase
    {
        private static List<User> users = new List<User>();

        public static void AddUser(User user)
        {
            try
            {
                users.Add(user);
            }
            catch (Exception ex)
            {
                // Log the exception (you can implement logging here)
                Console.WriteLine($"Error adding user: {ex.Message}");
            }
        }

        public static User FindUser (string username)
        {
            try
            {
                return users.FirstOrDefault(u => u.Username.Equals(username, StringComparison.OrdinalIgnoreCase));
            }
            catch (Exception ex)
            {
                // Log the exception
                Console.WriteLine($"Error finding user: {ex.Message}");
                return null; // Return null if an error occurs
            }
        }

        public static List<User> GetAllUsers()
        {
            return users;
        }
    }
}