import {connect} from "./db.js"
import express from "express"
import cors from "cors"
import user from "./user.js"
import event from "./events.js"
import admin from "./admin.js"

const app=express()

app.use(cors())
app.use(express.json())
app.use("/user",user)
app.use("/admin",admin)
app.use("/event",event)
app.get('/',(req,res)=>{
    res.send("hello")
})
app.listen(6500,async()=>{
    await connect()
    console.log("listening...")
})
