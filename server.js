const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});

const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

const express = require("express");
const puppeteer = require("puppeteer");
const nodemailer = require("nodemailer");
const QRCode = require("qrcode");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.post("/generate", async (req, res) => {
    const firstname = req.body.firstname.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const lastname = req.body.lastname.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const email = req.body.email.trim().toLowerCase();
    const phone = req.body.phone;
    const entreprise = req.body.entreprise.trim().toLowerCase();

    function normalizePhone(phone) {

    // enlever tout sauf chiffres
    phone = phone.replace(/\D/g, '');

    // si numéro français commençant par 0
    if (phone.startsWith('0')) {
        phone = '33' + phone.substring(1);
    }

    return '+' + phone;
}
    const normalizedPhone = normalizePhone(phone);


    // Création de la vCard
    const vCard = `
        BEGIN:VCARD
        VERSION:3.0
        FN:${firstname} ${lastname}
        TEL;TYPE=CELL:${normalizedPhone}
        EMAIL:${email}
        END:VCARD
`   ;
    function getTodayDate() {
    const today = new Date();

    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();

    return `${day}/${month}/${year}`;}
    const todayDate = getTodayDate();
    const qrCode = await QRCode.toDataURL(vCard);
    const ticketNumber = Math.floor(Math.random() * 100000000000000);
    const orderNumber = Math.floor(Math.random() * 100000000);

    const html = `
        <html>
        <body style="font-family: Arial;font-size: 12px; padding:20px;margin:0;">

            <div style="height:100vh;max-height:100%;position:relative;">
                <span style="font-size:10px;text-align: end;">Billet n°1</span>
                <div style="background-color: #FFD000;width:100vw;max-width:100%;display: flex;flex-direction: row; border: 1px solid black;margin-bottom: 20px;">

                    <div style="width:70%;"><img src="http://localhost:3000/banner.png" style="max-width:100%"></div>

                    <div style="background-color: white;width:30%; padding-left: 20px;padding-right: 20px;">
                        <p><b>Billet n°${ticketNumber}<br>
                        Date de l'évènement : 30/04/2026</b><p>
                        <span>Commande n°${orderNumber} - ${todayDate} </span>
                        <span>Client : <span style="text-transform: capitalize;">${firstname} ${lastname}</span> - ${email}</span><br>
                        <span style="text-transform: capitalize;">Entreprise : ${entreprise}</span><br>
                        <img src="${qrCode}" width="150" style="display:block; margin:auto;">
                    </div>

                </div>
                
                <div style="background-color: rgb(225, 225, 225);display: flex">
                    <div style="font-size: 15px;padding:7px;">
                        <span><b>Festival des Compétences</b></span><br>
                        <span><b>par GRETA Lille Métropole</b></span>
                    </div>

                    <div style="width:150px;"></div>

                    <div style="max-width:100%;font-size: 15px;padding:7px;">
                        <span><b>Validité du billet</b></span><br>
                        <span style="font-size: 12px;">jeu. 30 avril 2026, 10:00-15:00</span><br><br>
                        <span><b>Adresse</b></span><br>
                        <span style="font-size: 12px;">111 Av. de Dunkerque, 59000 Lille</span>
                    </div>
                    
                </div>

                <div style="position:absolute;bottom:0;width:100%;display: flex;justify-content: center;align-items: center;flex-direction: column;text-align: center;">
                    <img src="http://localhost:3000/gretalogo.svg" style="max-width:75px;padding-bottom:10"/>
                    <span>fourni par GRETA Lille Métropole, 111 Av. de Dunkerque, 59000 Lille - 03 20 74 67 10<br>
                    billeterie codée par <a href=https://horloge.world>horloge</a></span></div>
            </div>
        </body>
        </html>
    `;

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html);

    const pdf = await page.pdf({ format: "A4", printBackground: true });

    await browser.close();

    res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename=billet-${ticketNumber}.pdf`,
    });

    res.send(pdf);
});

app.listen(3000, () => {
    console.log("Serveur lancé sur http://localhost:3000");
});