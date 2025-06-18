package com.example.ice3

/**
 * ICE 3 - Product Management App
 * 
 * This Android application provides a simple product management system with the following features:
 * - View a list of all products
 * - Add new products with details (name, price, category, availability, image)
 * - Real-time updates using Firebase Realtime Database
 * - Material Design UI components
 * 
 * The app uses:
 * - Firebase Realtime Database for data storage
 * - RecyclerView for efficient list display
 * - ViewBinding for view access
 * - Material Design components for modern UI
 * 
 * Main components:
 * - ProductListActivity: Main screen showing all products
 * - AddProductActivity: Screen for adding new products
 * - Product: Data model class for product information
 * - ProductAdapter: Handles display of products in RecyclerView
 */

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.Menu
import android.view.MenuItem
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.ice3.adapter.ProductAdapter
import com.example.ice3.databinding.ActivityProductListBinding
import com.example.ice3.model.Product
import com.google.firebase.FirebaseApp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener
import com.google.firebase.database.ktx.database
import com.google.firebase.ktx.Firebase

class ProductListActivity : AppCompatActivity() {
    private lateinit var binding: ActivityProductListBinding
    private lateinit var adapter: ProductAdapter
    private lateinit var database: FirebaseDatabase
    private val productList = mutableListOf<Product>()
    private val TAG = "ProductListActivity"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityProductListBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Check authentication
        val user = FirebaseAuth.getInstance().currentUser
        if (user == null) {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
            return
        }

        // Set up the toolbar
        setSupportActionBar(binding.toolbar)
        supportActionBar?.title = "Products"

        // Initialize Firebase
        try {
            FirebaseApp.initializeApp(this)
            database = Firebase.database("https://prog7313-6e979-default-rtdb.europe-west1.firebasedatabase.app")

            
            // Test database connection
            database.reference.child("test_connection").setValue("connected")
                .addOnSuccessListener {
                    Log.d(TAG, "Database connection test successful")
                    setupRecyclerView()
                    setupFab()
                    loadProducts()
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
    }

    private fun setupRecyclerView() {
        adapter = ProductAdapter(productList)
        binding.recyclerViewProducts.apply {
            layoutManager = LinearLayoutManager(this@ProductListActivity)
            adapter = this@ProductListActivity.adapter
            setHasFixedSize(true)
        }
    }

    private fun setupFab() {
        binding.fabAddProduct.setOnClickListener {
            startActivity(Intent(this, AddProductActivity::class.java))
        }
    }

    private fun loadProducts() {
        Log.d(TAG, "Attempting to load products from Firebase")
        val productsRef = database.reference.child("products")
        
        // Show loading state
        binding.progressBar?.visibility = android.view.View.VISIBLE
        
        productsRef.addValueEventListener(object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                binding.progressBar?.visibility = android.view.View.GONE
                Log.d(TAG, "Data changed. Children count: ${snapshot.childrenCount}")
                productList.clear()
                
                if (!snapshot.exists()) {
                    Log.d(TAG, "No products found in database")
                    Toast.makeText(this@ProductListActivity, 
                        "No products found. Add some products!", 
                        Toast.LENGTH_LONG).show()
                    return
                }
                
                for (productSnapshot in snapshot.children) {
                    try {
                        val product = productSnapshot.getValue(Product::class.java)
                        product?.let { 
                            productList.add(it)
                            Log.d(TAG, "Loaded product: ${it.name}")
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error parsing product: ${productSnapshot.key}", e)
                    }
                }
                adapter.notifyDataSetChanged()
            }

            override fun onCancelled(error: DatabaseError) {
                binding.progressBar?.visibility = android.view.View.GONE
                Log.e(TAG, "Database error: ${error.message}", error.toException())
                Toast.makeText(this@ProductListActivity,
                    "Error loading products: ${error.message}",
                    Toast.LENGTH_LONG).show()
            }
        })
    }

    override fun onCreateOptionsMenu(menu: Menu?): Boolean {
        menuInflater.inflate(R.menu.menu_product_list, menu)
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            R.id.action_logout -> {
                FirebaseAuth.getInstance().signOut()
                startActivity(Intent(this, LoginActivity::class.java))
                finish()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }
} 