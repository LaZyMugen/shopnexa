import express from "express";
import supabase from "../config/supabaseClient.js";

const router = express.Router();

// GET /categories - list categories
router.get("/", async (req, res) => {
	try {
		const { data, error } = await supabase.from("categories").select("id, name").order("name", { ascending: true });
		if (error) throw error;
		return res.json({ success: true, data });
	} catch (e) {
		return res.status(500).json({ success: false, error: e.message || String(e) });
	}
});

// POST /categories - create category
router.post("/", async (req, res) => {
	try {
		const name = (req.body?.name || "").trim();
		if (!name) return res.status(400).json({ success: false, error: "Name is required" });
		const { data, error } = await supabase.from("categories").insert({ name }).select();
		if (error) throw error;
		return res.status(201).json({ success: true, data });
	} catch (e) {
		return res.status(500).json({ success: false, error: e.message || String(e) });
	}
});

// PUT /categories/:id - rename category
router.put("/:id", async (req, res) => {
	try {
		const id = req.params.id;
		const name = (req.body?.name || "").trim();
		if (!name) return res.status(400).json({ success: false, error: "Name is required" });
		const { data, error } = await supabase.from("categories").update({ name }).eq("id", id).select();
		if (error) throw error;
		return res.json({ success: true, data });
	} catch (e) {
		return res.status(500).json({ success: false, error: e.message || String(e) });
	}
});

// DELETE /categories/:id - delete category
router.delete("/:id", async (req, res) => {
	try {
		const id = req.params.id;
		const { error } = await supabase.from("categories").delete().eq("id", id);
		if (error) throw error;
		return res.json({ success: true, message: "Category deleted" });
	} catch (e) {
		return res.status(500).json({ success: false, error: e.message || String(e) });
	}
});

export default router;
