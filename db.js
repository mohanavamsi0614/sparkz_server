import  { MongoClient } from "mongodb"
import {config} from "dotenv"

config()


const client=new MongoClient(process.env.MONGO_URL)

const connect=async ()=>await client.connect()

const db=client.db("Sparkz")

export {connect,db}