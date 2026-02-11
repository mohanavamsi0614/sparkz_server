import { Router } from "express";
import {db} from "./db.js"

const route=Router()

route.get("/",async (req,res)=>{
    try {
        const events=await db.collection("event").find().toArray()
        res.json(events)
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
})

route.post("/",async (req,res)=>{
    const body=req.body
    await db.collection("event").insertOne(body)
    res.json("done")
})

export default route