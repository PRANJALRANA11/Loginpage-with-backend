// importing packages
require('dotenv').config();
const cookieparser=require('cookie-parser');
const express=require('express');
const app=express();
const mongoose = require('mongoose');
const path=require('path');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const auth=require('./middleware/auth');
// connectiong database
main().catch(err=>console.log(err));
async function main(){
    await mongoose.connect('mongodb://127.0.0.1:27017/test');
    console.log("connected")
}
// making schema
const contactSchema = new mongoose.Schema({
  name:{type:String,required:true},
  phone:{type:Number,required:true,unique:true},
  emailaddress:{type:String,required:true,unique:true},
  password:{type:String,required:true},
  Confirmpassword:{type:String,required:true},
  tokens:[{token:{
		type:String,
		required:true
}}]
});
// making Tokens
contactSchema.methods.generateAuthToken =async function(){
	try{
	const token=jwt.sign({_id:this._id.toString},process. envy. secretkey);
	this.tokens=this.tokens.concat({token:token})
	await this.save();
	 return token;
}catch(error){
	console.log(error.message)
}
}
// Hashing
contactSchema.pre("save",async function(next){
	if(this.isModified("password")){
		this.password=await bcrypt.hash(this.password,12)
		this.Confirmpassword =await bcrypt.hash(this.password,12);
	}next();
})
// making model
const Contact = new mongoose.model('Contact', contactSchema);
// Parsing
app.use(express.urlencoded ({extended:false}));
// giving path
const staticpath=path.join(__dirname,"static/login");
app.use( express.static(staticpath));
app.use(cookieparser());
app.use(express.json());
// setting view engine
app.set('view engine', 'pug')
// read 
app.get("/signup" ,(req,res)=>{
    res.render("signup")});
app.get("/TOURIST_info" ,(req,res)=>{
    	res.status(200).render("TOURIST_info")});
app.get("/welcome",auth,(req,res)=>{
    	res.render("welcome")});
app.get("/logout",auth,async(req,res)=>{
	try{
		res.clearCookie("jwt");
		console.log("logout")
		await req.user.save();
		res.render("login")
	}catch(error){
		res.status(500).send(error);
	}    

	})
app.get("/login" ,(req,res)=>{
    res.render("login")});
    // post
app.post('/signup', async(req , res)=>{
    try{
       
            password=req.body.Password;
            Confirmpassword=req.body.Confirmpassword;
            if(password===Confirmpassword){
                const con = new Contact({
                    name:req.body.name,
                    phone:req.body.phone,
                    emailaddress:req.body.emailaddress,
                    password:req.body.Password,
                    Confirmpassword:req.body.Confirmpassword
                })
		const token=await con.generateAuthToken();
		res.cookie("jwt",token);
		const cont= await con.save();
		console.log(con)
            	res.status(200).send("signed up"); 
            // res.status(201).render("choose");
            }else{
               res.status(400).send("Password not match")
            }
        
    }catch(error){
    res.status(400).send(error);
    }
})
app.post('/login', async(req , res)=>{
    try{
	const emailaddress=req.body.emailaddress;
        const password=req.body.password;
        const userinfo=await Contact.findOne({emailaddress:emailaddress});
	const isMatch = await bcrypt.compare(password,userinfo.password);
	const token=await userinfo.generateAuthToken();
	res.cookie("jwt",token);
        if(isMatch){
		res.status(200).render("TOURIST_info");
        }else{
            res.status(400).send("invalid login details");
        }
    }catch(error){
        res.status(400).send("Bad request")
    }
})
// listening
app.listen(80,()=>{
    console.log(`server running ${80} `)
})
module.exports=app;
