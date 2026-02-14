import { Router } from "express";
import {db} from "./db.js"
import { ObjectId } from "mongodb";
import nodemailer from "nodemailer";
import { config } from "dotenv";
config()
const QR_URL=`https://api.qrserver.com/v1/create-qr-code/?data=${process.env.BACKEND_URL}/user/`

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const route=Router()

route.get("/:id",async(req,res)=>{
    try {
        const {id}=req.params
        const user=await db.collection("user").findOne({_id:new ObjectId(id)})
        res.json(user)
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
})

import { sendWelcomeEmail } from "./mailer.js";
import axios from "axios";

route.post("/kare",async (req,res)=>{
    try {
        const {email,name}=req.body
        const user=await db.collection("user").findOne({email})
        if(user) {
            return res.status(200).json(user);
        }
        else{
        const result=await db.collection("user").insertOne({email,name})
        if(email && name) {
            await sendWelcomeEmail(email, name);
        }
        const user = await db.collection("user").findOne({_id: result.insertedId});
        res.json(user)
    }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
})
route.post("/external",async (req,res)=>{
    try {
        const body=req.body
        const result=await db.collection("user").insertOne(body)
        if(body.email && body.name) {
            await sendWelcomeEmail(body.email, body.name);
        }
        const user = await db.collection("user").findOne({_id: result.insertedId});
        res.json(user)
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
})
route.post("/login",async (req,res)=>{
    try {
        const {password,email}=req.body
        const user=await db.collection("user").findOne({email,password})
        res.json(user)
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
})
// Email Template
const getHtmlTemplate = (userName, eventName, qrUrl) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Arial', sans-serif; background-color: #000000; color: #ffffff; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #111111; border: 1px solid #333333; border-radius: 10px; overflow: hidden; }
    .header { background: linear-gradient(90deg, #d97706, #b45309); padding: 20px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 24px; letter-spacing: 2px; }
    .content { padding: 30px; text-align: center; }
    .content h2 { color: #fbbf24; margin-bottom: 10px; }
    .content p { color: #aeaeae; line-height: 1.6; }
    .qr-container { margin: 30px 0; background: #ffffff; padding: 20px; display: inline-block; border-radius: 10px; }
    .footer { background-color: #0a0a0a; padding: 20px; text-align: center; font-size: 12px; color: #555555; border-top: 1px solid #222222; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SPARKZ'26</h1>
    </div>
    <div class="content">
      <h2>Registration Confirmed!</h2>
      <p>Hello ${userName},</p>
      <p>You have successfully registered for <strong>${eventName}</strong>.</p>
      <div class="qr-container">
        <img src="${qrUrl}" alt="Event QR Code" width="150" height="150" style="display: block;" />
      </div>
      <p>Please show this QR code at the venue entry.</p>
    </div>
    <div class="footer">
      <p>Kalasalingam Academy of Research and Education</p>
      <p>&copy; 2026 Sparkz Cultural Fest</p>
    </div>
  </div>
</body>
</html>
`;

route.post("/event/normal",async (req,res)=>{
    try {
        const {event,user,transactionId,paymentScreenshot,upiId,proshow,accommodation}=req.body
        // Fetch latest user data to check for duplicates
        const dbUser = await db.collection("user").findOne({_id: new ObjectId(user._id)});
        if (!dbUser) return res.status(404).json({ error: "User not found" });
if(dbUser.events.length >=3 && !proshow){
    return res.status(400).json({ error: "Duplicate registration" });
}
        const existingEvents = dbUser.events || [];
        const newEvents = Array.isArray(event) ? event : [event];
        
        // Check for duplicates
        const duplicates = newEvents.filter(ne => 
            existingEvents.some(ee => ee.title === ne.title || ee.id === ne.id)
        );
        axios.post("https://script.google.com/macros/s/AKfycbyEn7uvkW7UOL5x5tjAhRSGCtAh6NZUxnAeMGG2vJ3kXfj-91vCH74hfyq2JReWV8Y6bA/exec",{
            name:user.name,
            email:user.email,
            event:newEvents.map(e=>e.title).join(", "),
            trans:transactionId,
            upi:upiId,
            img:paymentScreenshot,
            proshow:proshow,
            accommodation:accommodation,
            collage:user.collage || "kare",
            branch:user.branch,
            year:user.year
        })
        if (duplicates.length > 0) {
            return res.status(400).json({ 
                error: "Duplicate registration", 
                message: `You are already registered for: ${duplicates.map(d => d.title).join(", ")}` 
            });
        }

        db.collection("user").updateOne({_id:new ObjectId(user._id)},{$push:{events:{$each: newEvents}}})
        await db.collection("normal").insertOne({event,user,transactionId,paymentScreenshot,upiId, date: new Date()})
        if(proshow){
            db.collection("proshow").insertOne({event,user,transactionId,paymentScreenshot,upiId, date: new Date()})
            db.collection("user").updateOne({_id:new ObjectId(user._id)},{$set:{proshow:{transactionId,paymentScreenshot,upiId, date: new Date()}}})
        }
        const qrUrl=QR_URL+user._id
        
        const eventName = newEvents.map(e => e.title).join(", ");
        // axios.post("https://7feej0sxm3.execute-api.eu-north-1.amazonaws.com/default/mail_sender",{
        //     to:user.email,
        //     subject:"Sparkz Event Registration Confirmed",
        //     text:`Hello ${user.name},\n\nWelcome to Sparkz! You have successfully registered for ${eventName}.\n\nBest regards,\nSparkz Team`,
        //     html:getHtmlTemplate(user.name, eventName, qrUrl)
        // })
        res.json("done")
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
})

route.post("/event/proshow",async (req,res)=>{
    try {
        const {event,user, transactionId, paymentScreenshot, upiId}=req.body
        
        // Fetch latest user data to check for duplicates
        const dbUser = await db.collection("user").findOne({_id: new ObjectId(user._id)});
        if (!dbUser) return res.status(404).json({ error: "User not found" });
        const eventReg=dbUser.events||[]
        if(!eventReg) return res.status(400).json({ error: "please reg for events first" });
        const existingProshows = dbUser.proshow || [];
        
        
        const isDuplicate = existingProshows.some(ep => ep.type === event.type);
        if (isDuplicate) {
             return res.status(400).json({ 
                error: "Duplicate registration", 
                message: `You have already registered for ${event.type} Proshow pass.` 
            });
        }

        await db.collection("proshow").insertOne({...user,type:event.type, transactionId, paymentScreenshot, upiId, date: new Date()})
        const qrUrl=QR_URL+user._id
        db.collection("user").updateOne({_id:new ObjectId(user._id)},{$push:{proshow:event,transactionId,upiId,paymentScreenshot}})
        axios.post("https://7feej0sxm3.execute-api.eu-north-1.amazonaws.com/default/mail_sender",{
            to:user.email,
            subject:"Proshow VIP Pass Confirmed",
            text:`Hello ${user.name},\n\nWelcome to Sparkz! You have successfully registered for ${event.name}.\n\nBest regards,\nSparkz Team`,
            html:getHtmlTemplate(user.name, event.name, qrUrl)
        })
                axios.post("https://script.google.com/macros/s/AKfycbyxD9FSxqdjijiqRaot2ZjxHH-BnTKUzrAgoWzodoAEt708Mp16tqOAAKmIrkL36HIWug/exec",{
            name:user.name,
            email:user.email,
            event:"proShow",
            trans:transactionId,
            upi:upiId,
            img:paymentScreenshot
        })

        res.json("done")
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
})

export default route