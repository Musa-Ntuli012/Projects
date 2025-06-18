package com.example.ice3

import android.content.Intent
import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.google.firebase.auth.FirebaseAuth

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val user = FirebaseAuth.getInstance().currentUser
        if (user != null) {
            // User is signed in, go to product list
            startActivity(Intent(this, ProductListActivity::class.java))
        } else {
            // Not signed in, go to login
            startActivity(Intent(this, LoginActivity::class.java))
        }
        finish()
    }
}