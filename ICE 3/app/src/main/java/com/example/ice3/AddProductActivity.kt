package com.example.ice3

/**
 * Activity for adding new products to the system.
 * 
 * Features:
 * - Form for entering product details (name, price, category, availability)
 * - Input validation for required fields
 * - Optional image URL field
 * - Real-time database integration with Firebase
 * - Material Design form components
 * 
 * The activity handles:
 * - Form validation
 * - Database connection
 * - Product creation
 * - Error handling and user feedback
 */

import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.ice3.databinding.ActivityAddProductBinding
import com.example.ice3.model.Product
import com.google.firebase.FirebaseApp
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ktx.database
import com.google.firebase.ktx.Firebase

class AddProductActivity : AppCompatActivity() {
    private lateinit var binding: ActivityAddProductBinding
    private lateinit var database: FirebaseDatabase
    private val TAG = "AddProductActivity"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAddProductBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Set up toolbar
        setSupportActionBar(binding.toolbar)
        supportActionBar?.apply {
            setDisplayHomeAsUpEnabled(true)
            setDisplayShowHomeEnabled(true)
            title = "Add New Product"
        }

        // Initialize Firebase
        try {
            FirebaseApp.initializeApp(this)
            database = Firebase.database("https://prog7313-6e979-default-rtdb.europe-west1.firebasedatabase.app")
            
            // Test database connection
            database.reference.child("test_connection").setValue("connected")
                .addOnSuccessListener {
                    Log.d(TAG, "Database connection test successful")
                }
                .addOnFailureListener { e ->
                    Log.e(TAG, "Database connection test failed", e)
                    Toast.makeText(this, "Database connection failed: ${e.message}", Toast.LENGTH_LONG).show()
                }
            
            Log.d(TAG, "Firebase initialized successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Error initializing Firebase", e)
            Toast.makeText(this, "Error initializing database: ${e.message}", Toast.LENGTH_LONG).show()
            finish()
            return
        }

        binding.btnAddProduct.setOnClickListener {
            if (validateInputs()) {
                addProductToFirebase()
            }
        }
    }

    private fun validateInputs(): Boolean {
        val name = binding.etProductName.text.toString().trim()
        val price = binding.etProductPrice.text.toString().trim()
        val category = binding.etProductCategory.text.toString().trim()

        if (name.isEmpty()) {
            binding.etProductName.error = "Product name is required"
            return false
        }

        if (price.isEmpty()) {
            binding.etProductPrice.error = "Price is required"
            return false
        }

        try {
            price.toDouble()
        } catch (e: NumberFormatException) {
            binding.etProductPrice.error = "Invalid price format"
            return false
        }

        if (category.isEmpty()) {
            binding.etProductCategory.error = "Category is required"
            return false
        }

        return true
    }

    private fun addProductToFirebase() {
        if (!::database.isInitialized) {
            Log.e(TAG, "Database not initialized")
            Toast.makeText(this, "Database not initialized", Toast.LENGTH_LONG).show()
            return
        }

        val name = binding.etProductName.text.toString().trim()
        val price = binding.etProductPrice.text.toString().trim().toDouble()
        val category = binding.etProductCategory.text.toString().trim()
        val isAvailable = binding.switchAvailability.isChecked
        val imageUrl = binding.etImageUrl.text.toString().trim()

        Log.d(TAG, "Attempting to add product: $name")
        
        // Show loading state
        binding.btnAddProduct.isEnabled = false
        binding.btnAddProduct.text = "Adding Product..."
        
        val productRef = database.reference.child("products").push()
        val product = Product(
            id = productRef.key ?: "",
            name = name,
            price = price,
            category = category,
            isAvailable = isAvailable,
            imageUrl = imageUrl
        )

        productRef.setValue(product)
            .addOnSuccessListener {
                Log.d(TAG, "Product added successfully: $name")
                Toast.makeText(this, "Product added successfully", Toast.LENGTH_SHORT).show()
                finish()
            }
            .addOnFailureListener { e ->
                Log.e(TAG, "Failed to add product: ${e.message}", e)
                Toast.makeText(this, "Failed to add product: ${e.message}", Toast.LENGTH_LONG).show()
                // Reset button state
                binding.btnAddProduct.isEnabled = true
                binding.btnAddProduct.text = "Add Product"
            }
    }

    override fun onSupportNavigateUp(): Boolean {
        onBackPressed()
        return true
    }

    private fun clearInputs() {
        binding.etProductName.text?.clear()
        binding.etProductPrice.text?.clear()
        binding.etProductCategory.text?.clear()
        binding.etImageUrl.text?.clear()
        binding.switchAvailability.isChecked = true
    }
} 