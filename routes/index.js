const express = require('express');
const router = express.Router();
const sqlite3=require('sqlite3').verbose();
const path = require('path');
const nodemailer = require('nodemailer');
const XMLHttpRequest = require('xhr2');
const fetch = require('node-fetch'); 
require('dotenv').config()

const basededatos=path.join(__dirname,"data","formcontacts.db");
const bd=new sqlite3.Database(basededatos, err =>{ 
if (err){
	return console.error(err.message);
}else{
	console.log("...");
}
})


const create="CREATE TABLE IF NOT EXISTS contactos(email VARCHAR(20),nombre VARCHAR(20), comentario TEXT, date DATATIME, hour VARCHAR(20),ipaddress TEXT, country VARCHAR(20));";

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
router.post('/',(req,res)=>{
	const name = req.body.name;
  	const response_key_RV = req.body["g-recaptcha-response"];
  	const secret_key_RV = process.env.KEY_PRIVATE;
  	const url = 
	`https://www.google.com/recaptcha/api/siteverify?secret=${secret_key_RV}&response=${response_key_RV}`;
  	fetch(url, {
    	method: "post",
  	})
    	.then((response) => response.json())
    	.then((google_response) => {
	//Si se verifica el captcha, automaticamente se hace envia los datos a la Base de Datos
      	if (google_response.success == true) {
        	//Obtener la fecha/hora
  			let dateRV_30406581 = new Date();
  			let hoursRV = dateRV_30406581.getHours();
  			let minutesRV = dateRV_30406581.getMinutes();
  			let secondsRV = dateRV_30406581.getSeconds();
			//Reconversión a 12 horas.
  			let formatRV = hoursRV >= 12 ? 'PM' : 'AM'; 
  			hoursRV = hoursRV % 12; 
  			hoursRV = hoursRV ? hoursRV : 12; 
  			minutesRV = minutesRV < 10 ? '0' + minutesRV : minutesRV;
  			let timeToday = hoursRV + ':' + minutesRV + ':' + secondsRV + ' ' + formatRV; //=> Hora
  			let todayDate = dateRV_30406581.getDate() + '-' + ( dateRV_30406581.getMonth() + 1 ) + '-' + dateRV_30406581.getFullYear(); //=> Fecha
			//////////////Obtener la IP publica////////////////
			let ipRV = req.headers["x-forwarded-for"];
  			if (ipRV){
    			let list = ipRV.split(",");
    			ipRV = list[list.length-1];
 			} else {
				ipRV = req.connection.remoteAddress;
  			}
			////////////Obtener el Pais//////////////
			let XMLHttp = new XMLHttpRequest();
			XMLHttp.onreadystatechange = function(){
			if(this.readyState == 4 && this.status == 200) {
				let ipwhois = JSON.parse(this.responseText); 
				let country = ipwhois.country 
				let countryCode = ipwhois.country_code
				let clientCountry = country + '(' + countryCode + ')'
			//Obtener los datos que ingresa el usuario
				let email = req.body.email
				let nombre = req.body.nombre
				let comentario = req.body.comentario
			//Ingreso de los registros hacia la Base de Datos
				const sqlCreateRecords="INSERT INTO Contactos(email,nombre,comentario,date,hour,ipaddress,country) VALUES (?,?,?,?,?,?,?)";
				const clientData=[email,nombre,comentario,todayDate,timeToday,ipRV,clientCountry];
				dbAdmin.run(sqlCreateRecords, clientData, err =>{
				if (err){
					return console.error(err.message); //=> Si existe un error retorna el error
				}
				else{
					setTimeout(function(){ //=>  Temporizador para mostrar el mensaje e ingresar a la ruta
						res.redirect("/"); //=>  Si no existe algún error,el mensaje se envia.
					}, 1800);
					}
				})

		//Conexion al servidor del correo electronico
			let transporter = nodemailer.createTransport({
			host: "smtp-mail.outlook.com",
    			secureConnection: false,
    			port: 587, 
    			tls: {
       				ciphers:'SSLv3'
    			},
				auth: {
					user: process.env.EMAIL,
					pass: process.env.PASS
				}
			});
				const customerMessage = `
					<p>Programacion P2</p>
					<h3>Información del Cliente/Contacto:</h3>
					<ul>
			  		<li>Email: ${email}</li>
			  		<li>Nombre: ${nombre}</li>
			  		<li>Comentario: ${comentario}</li>
			  		<li>Fecha: ${todayDate}</li>
					<li>Hora: ${timeToday}</li>
					<li>IP: ${ipRV}</li>
					<li>Pais: ${clientCountry}</li>
					</ul>`;

				const receiverAndTransmitter = {
					from: process.env.EMAIL,
					to: 'joseleonmb393@gmail.com',
					subject: 'Informacion del Contacto', 
					html: customerMessage
				};
				transporter.sendMail(receiverAndTransmitter,(err, info) => {
					if(err)
						console.log(err)
					else
						console.log(info);
					})
				}
			}; //=> Llave qué cierra el "if" para obtener el pais.
	//Obtener el Pais desde la API con la IP.
	XMLHttp.open('GET', 'https://ipwho.is/' + ipRV, true); //"Variable "ipRV" => IP Publica arriba.
	XMLHttp.send();
    }else{
	//Si hay error en el reCaptcha se recarga la pagina y muestra el mensaje de JS:)
        setTimeout(function(){ //=>  Temporizador para mostrar el mensaje e ingresar a la ruta
			res.redirect("/");				
		}, 1800);
    }
    })
	//Errores de syntaxis en el Recaptcha
    .catch((error) => {
    return res.json({ error });
    });
})


router.get('/',(req,res)=>{
	res.render('index.ejs',{tarea:{}})
});



module.exports = router;