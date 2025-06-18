package com.example.ice3.model

/**
 * Data model class representing a product in the system.
 * 
 * Properties:
 * - id: Unique identifier for the product
 * - name: Product name
 * - price: Product price as a Double
 * - category: Product category
 * - isAvailable: Boolean indicating if product is in stock
 * - imageUrl: Optional URL to product image
 * 
 * Note: The @PropertyName annotation maps 'isAvailable' to 'available' in Firebase
 * to maintain consistent database field naming.
 */

import com.google.firebase.database.PropertyName

data class Product(
    val id: String = "",
    val name: String = "",
    val price: Double = 0.0,
    val category: String = "",
    @PropertyName("available")
    val isAvailable: Boolean = true,
    val imageUrl: String = ""
) {
    // Empty constructor for Firebase
    constructor() : this("", "", 0.0, "", true, "")
} 