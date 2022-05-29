const express = require('express');
const router = express.Router();
const sqlite3=require('sqlite3').verbose();
const path = require('path');
const nodemailer = require('nodemailer');
const geoip = require('geoip-lite');
const fetch = require('node-fetch'); 
const request = require('http');
require('dotenv').config()

const basededatos=path.join(__dirname,"data","formcontacts.db");
const bd=new sqlite3.Database(basededatos, err =>{ 
if (err){
	return console.error(err.message);
}else{
	console.log("...");
}
})


const create="CREATE TABLE IF NOT EXISTS contactos(email VARCHAR(20),nombre VARCHAR(20), comentario TEXT, fecha DATATIME, ip TEXT, pais VARCHAR(20));";

bd.run(create,err=>{
	if (err){
	return console.error(err.message);
}else{
	console.log("...");
}
})


router.get('/contactos',(req,res)=>{
	const sql="SELECT * FROM contactos;";
	bd.all(sql, [],(err, rows)=>{
			if (err){
				return console.error(err.message);
			}else{
			res.render("contactos.ejs",{tarea:rows});
			}
	})
})


//Envio POST del Formulario.
router.post('/', (req,res)=>{
	const response_key = req.body["g-recaptcha-response"];
	const secret_key = process.env.KEY_PRIVATE;
	const url = 
  `https://www.google.com/recaptcha/api/siteverify?secret=${secret_key}&response=${response_key}`;
	fetch(url, {
	  method: "POST",
	})
	  .then((response) => response.json())
	  .then((google_response) => {
  //Si se verifica el captcha
		if (google_response.success == true) {
		  var hoy = new Date();
			var horas = hoy.getHours();
			var minutos = hoy.getMinutes();
		  minutos = minutos < 10 ? '0' + minutos : minutos;
			var segundos = hoy.getSeconds();
			var hora = horas + ':' + minutos + ':' + segundos + ' ';
			var fecha = hoy.getDate() + '-' + ( hoy.getMonth() + 1 ) + '-' + hoy.getFullYear() + '//' + hora;
			var ip = req.headers["x-forwarded-for"];
			if (ip){
		  var list = ip.split(",");
		  ip= list[list.length-1];
			} else {
			ip = req.connection.remoteAddress;
			}
		  var geo = geoip.lookup(ip);
		  console.log(geo);
		  var pais = geo.country;
		  const sql="INSERT INTO contactos(nombre, email, comentario, fecha ,ip, pais) VALUES (?,?,?,?,?,?)";
		  const nuevos_mensajes=[req.body.nombre, req.body.email, req.body.comentario,fecha,ip,pais];


		  bd.run(sql, nuevos_mensajes, err =>{
			  if (err){
				  return console.error(err.message);
			  }
			  else{
			  res.redirect("/");
			  }
			  })

			  const transporter = nodemailer.createTransport({
				  host: 'smtp-mail.outlook.com',
				  secureConnection: false, 
				  port: 587, 
				  auth: {
					  user: process.env.EMAIL,
					  pass: process.env.PASS
				  	},
					  tls: {
						rejectUnauthorized: false,
						ciphers:'SSLv3'
					 }
		  });
			  const Message = `
				  <p>Programacion 2, Seccion 1</p>
				  <h3>Información del contacto:</h3>
				  <ul>
					<li>E-mail: ${req.body.email}</li>
					<li>Nombre: ${req.body.nombre}</li>
					<li>Comentario: ${req.body.comentario}</li>
					<li>Fecha-Hora: ${fecha}</li>
				  <li>IP: ${ip}</li>
				  <li>Pais: ${pais}</li>
				  </ul>`;
			  const receiverAndTransmitter = {
				  from: process.env.EMAIL,
				  to: 'programacion2ais@dispostable.com',
				  subject: 'Informacion del Contacto', 
				  html: Message
			  };
			  transporter.sendMail(receiverAndTransmitter,(err, info) => {
				  if(err)
					  console.log(err)
				  else
					  console.log(info);
				  })
  }else{
  //Si hay error en el captcha 
	  setTimeout(function(){ 
		  res.redirect("/");				
	  }, 1800);
  }
  })
  .catch((error) => {
  return res.json({ error });
  });
	

});

router.get('/',(req,res)=>{
	res.render('index.ejs',{tarea:{}})
});



module.exports = router;