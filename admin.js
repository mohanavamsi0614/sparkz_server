import { Router } from "express";
import {db} from "./db.js"

const route=Router()

route.get("/normal",async(req,res)=>{
    try {
        const data= await db.collection("normal").find({}).toArray() 
        res.json(data)
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
})
route.get("/users",async(req,res)=>{
    try {
        const data= await db.collection("user").find({}).toArray() 
        res.json(data)
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
})
route.get("/proshow",async(req,res)=>{
    try {
        const data= await db.collection("proshow").find({}).toArray() 
        res.json(data)
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
})

export default route