require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');
// Node 18+ has built in fetch, we use it natively below.

// The web App URL of your Google Apps Script which returns the guests in JSON format
const APPS_SCRIPT_GET_GUESTS_URL = 'https://script.google.com/macros/s/AKfycbwNch6a7a0KVZIZFzkVGcDMGIK6P9HbTzqNFFMpT7yvc4XMh-PPcqrcOT6l47RrKtp9/exec';

// Function to add a delay
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('Escanea este QR con tu WhatsApp para autenticarte:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ WhatsApp cliente listo!');
});

async function main() {
    try {
        console.log('Iniciando cliente de WhatsApp...');
        client.initialize();
    } catch (err) {
        console.error('Error al iniciar WhatsApp:', err);
    }
}

async function sendReminders() {
    console.log('⏳ Iniciando el envío de recordatorios...');
    
    if (!APPS_SCRIPT_GET_GUESTS_URL) {
        console.error('❌ Falla: La URL del Apps Script (APPS_SCRIPT_GET_GUESTS_URL) no está configurada.');
        return;
    }

    try {
        // Fetch data from Apps Script Web App
        console.log('Obteniendo invitados desde Google Apps Script...');
        const response = await fetch(`${APPS_SCRIPT_GET_GUESTS_URL}?action=getGuests`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        const rows = data.guests; // we expect the apps script to return {"status":"success", "guests": [...]}

        for (const row of rows) {
            // Check form match (Assuming Apps script maps these correctly)
            const name = row['Nombre'];
            const rawPhone = row['Teléfono'];
            const attendance = row['Confirmación'];

            console.log("Fila leída:", row);
            if (!name || !rawPhone || !attendance) continue; // skip incomplete rows
            console.log("Datos detectados:", {name, rawPhone, attendance});

            // Consider "Si" or "Sii" as confirmed attendance
            if (attendance.toLowerCase().includes('si')) {
                // Formatting the number to whatsapp-web format (+xxxxxxxxx@c.us)
                let number = String(rawPhone).replace(/\D/g, '');

                if (!number.startsWith('54')) {
                    number = '54' + number;
                }

                if (!number.startsWith('549')) {
                    number = number.replace(/^54/, '549');
                }
                const chatId = `${number}@c.us`;

                const urlName = encodeURIComponent(name);
                const message = `🦉 *Recordatorio de Hogwarts*\n\nHola *${name}*!\n\nTe recordamos que el cumpleaños de 15 de Luchi es en una semana! Espero que ya te estés preparando ✨\n\n📜 Invitación:\nhttps://tufiesta.com/?inv=${urlName}`;

                try {
                    await client.sendMessage(chatId, message);
                    console.log(`✅ Enviado a ${name} (${number})`);
                } catch (sendErr) {
                    console.error(`❌ Error enviando a ${name} (${number}):`, sendErr.message);
                }

                // Delay between 5 to 8 seconds
                const delayMs = Math.floor(Math.random() * 3000) + 5000;
                await wait(delayMs);
            } else {
                console.log(`⏭️  Omitiendo a ${name} (Asistencia: ${attendance})`);
            }
        }
        console.log('✅ Envío de recordatorios finalizado.');
    } catch (err) {
        console.error('Error procesando los invitados mediante Apps Script:', err);
    }
}

// ============================================
// SCHEDULER
// ============================================
// Schedule to run exactly 7 days before the event
// Say the event is 2026-06-06 at 21:00. 7 days before is 2026-05-30.
// Let's check every day at 12:00 PM if it's currently 7 days before the event
cron.schedule('18 23 * * *', () => {
    const today = new Date();
    const eventDate = new Date('2026-03-22T21:00:00'); // set your event date here
    
    // Calculates the difference in days
    const diffTime = Math.abs(eventDate - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    if (diffDays === 7) {
        console.log('⏰ ¡Es el día 7 antes del evento! Ejecutando envío de mensajes...');
        sendReminders();
    }
});

console.log('Servicio de automatización iniciado. Esperando conexión a WP o tarea programada.');
main();

// Uncomment the following line to test immediately on startup
//setTimeout(sendReminders, 15000); 
