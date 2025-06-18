using System;
using System.Collections.Generic;

namespace Simple_banking_app_concept
{
    public class User
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Address { get; set; }
        public string IdCopyPath { get; set; }
        public string Username { get; set; }
        public string HashedPassword { get; set; }
        public decimal Balance { get; set; }
        public List<Transaction> TransactionHistory { get; set; }

        public User(string firstName, string lastName, string address, string idCopyPath, string username, string hashedPassword, decimal balance)
        {
            FirstName = firstName;
            LastName = lastName;
            Address = address;
            IdCopyPath = idCopyPath;
            Username = username;
            HashedPassword = hashedPassword;
            Balance = balance;
            TransactionHistory = new List<Transaction>();
        }

        public void AddTransaction(string description, decimal amount)
        {
            TransactionHistory.Add(new Transaction(DateTime.Now, description, amount));
        }

        internal object ByUsername(string username)
        {
            throw new NotImplementedException();
        }
    }
}