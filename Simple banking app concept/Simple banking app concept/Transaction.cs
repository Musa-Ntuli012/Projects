using System;

namespace Simple_banking_app_concept
{
    public class Transaction
    {
        public DateTime Date { get; set; }
        public string Description { get; set; }
        public decimal Amount { get; set; } // Use decimal for currency

        public Transaction(DateTime date, string description, decimal amount)
        {
            Date = date;
            Description = description;
            Amount = amount;
        }
    }
}