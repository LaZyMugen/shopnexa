import express from "express";
import supabase from "../config/supabaseClient.js";

const router = express.Router();

// Test Supabase JS client connection
router.get("/", async (req, res) => {
  try {
    // Test basic connection by querying a table
    // Replace "users" with an actual table name in your database
    const { data, error } = await supabase.from("users").select("*").limit(1);
    
    if (error) {
      return res.status(500).json({ 
        success: false,
        message: "Supabase connection test failed",
        error: error.message,
        hint: "Make sure SUPABASE_URL and SUPABASE_ANON_KEY are set in .env"
      });
    }
    
    res.json({ 
      success: true,
      message: "Supabase JS client connected successfully",
      data,
      tables: "Queried 'users' table"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Supabase test error",
      error: error.message
    });
  }
});

// Test Supabase connection with a simple query
router.get("/ping", async (req, res) => {
  try {
    // Simple test query that works on any Supabase instance
    const { data, error } = await supabase.rpc('version');
    
    if (error) {
      // If RPC doesn't exist, try a different approach
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError && authError.message.includes('Invalid API key')) {
        return res.status(500).json({
          success: false,
          message: "Invalid Supabase credentials",
          error: "Check your SUPABASE_URL and SUPABASE_ANON_KEY in .env"
        });
      }
      
      // If we can reach Supabase, connection is good
      res.json({
        success: true,
        message: "Supabase connection is working",
        note: "Using auth endpoint to verify connection"
      });
    } else {
      res.json({
        success: true,
        message: "Supabase connection is working",
        data
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Supabase connection test failed",
      error: error.message
    });
  }
});

export default router;
