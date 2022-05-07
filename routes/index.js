var express = require('express');
const { append } = require('express/lib/response');
var router = express.Router();
const sqlite3=require('sqlite3').verbose();
const http=require('http');
const path = require('path');


const db=path.join(__dirname,"data","formcontacts.db");
const db_run=new sqlite3.Database(db, err =>{ 
if (err){
	return console.error(err.message);
}else{
	console.log("DB active");
}
})
	
const crear="CREATE TABLE IF NOT EXISTS contacts(email VARCHAR(16),nombre VARCHAR(16), comentario TEXT,fecha DATATIME,ip VARCHAR(15));";
	
	
	
db_run.run(crear,err=>{
	if (err){
	return console.error(err.message);
}else{
	console.log("Tb active");
}
})
router.get('/',(req,res)=>{
	res.render('index.ejs',{ct:{}})
});

db_run.run(crear,err=>{
	if (err){
	return console.error(err.message);
}else{
	console.log("Tb active");
}
})
	
	
	
router.get('/contactos',(req,res)=>{
	const sql="SELECT * FROM contacts;";
	db_run.all(sql, [],(err, rows)=>{
			if (err){
				return console.error(err.message);
			}else{
			res.render("contactos.ejs",{ct:rows});
			}
	})
})
	
router.post('/contactos',(req,res)=>{
	  let today = new Date();
	  let hours = today.getHours();
	  let minutes = today.getMinutes();
	  let seconds = today.getSeconds();
	  let fech = today.getDate() + '-' + ( today.getMonth() + 1 ) + '-' + today.getFullYear() +' - '+ hours + ':' + minutes + ':' + seconds + ' ';
	const sql="INSERT INTO contacts(email, nombre, comentario, fecha,ip) VALUES ('jorgemon@gmail.com','Jorge','Hola, ¿como estas?',?,?)";
	const nuevos_mensajes=[req.body.email, req.body.nombre, req.body.comentario,fech];
	db_run.run(sql, nuevos_mensajes, err =>{
	if (err){
		return console.error(err.message);
	}
	else{
		res.redirect("/");
		}
	})
});
	
	
module.exports = router;