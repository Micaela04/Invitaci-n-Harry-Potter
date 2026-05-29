require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');
// Node 18+ has built in fetch, we use it natively below.

const debugg = 1; // Set to 1 to enable debug mode

const CHROME_CANDIDATES = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
].filter(Boolean);

const chromeExecutablePath = CHROME_CANDIDATES.find(candidate => {
    try {
        return require('fs').existsSync(candidate);
    } catch {
        return false;
    }
});

// The web App URL of your Google Apps Script which returns the guests in JSON format
const APPS_SCRIPT_GET_GUESTS_URL = 'https://script.google.com/macros/s/AKfycbwNch6a7a0KVZIZFzkVGcDMGIK6P9HbTzqNFFMpT7yvc4XMh-PPcqrcOT6l47RrKtp9/exec';
const EVENT_YEAR = 2026;
const EVENT_MONTH = 5; // June (0-based month index)
const EVENT_DAY = 6;
const TIMEZONE = 'America/Argentina/Buenos_Aires';
const INVITATION_PAGE_URL = 'https://luchi-fest.netlify.app/?';

// Function to add a delay
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: chromeExecutablePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    },
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/{version}.html',
        strict: false
    }
});

client.on('qr', (qr) => {
    console.log('Escanea este QR con tu WhatsApp para autenticarte:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
    console.log('✅ WhatsApp cliente listo!');

    if (debugg === 1) {
        console.log('🧪 Modo debug activado: enviando todos los recordatorios ahora.');
        await sendReminders('¡Falta una semana!', '1 semana antes');
        await sendReminders('¡Es hoy! no te olvides de traer tu boleto', 'día de la fiesta');
        await sendReminders('Espero que ayer hayas pasado una noche mágica, no te olvides de mandarme tus fotos para recordarla por siempre', 'día después de la fiesta');
    }
});

async function main() {
    try {
        console.log('Iniciando cliente de WhatsApp...');
        await client.initialize();
    } catch (err) {
        console.error('Error al iniciar WhatsApp:', err);
    }
}

async function sendReminders(reminderText, reminderLabel) {
    console.log(`⏳ Iniciando el envío de recordatorios: ${reminderLabel}...`);
    
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

        for (const [index, row] of rows.entries()) {
            // Check form match (Assuming Apps script maps these correctly)
            const name = row['Nombre'] || row[''] || row['Nombre completo'] || row['Nombre Completo'];
            const rawPhone = row['Teléfono'];
            const attendance = row['Confirmación'];
            const rowNumber = row.rowNumber || row.rownumber || row['rowNumber'] || row['Row Number'] || (index + 2);

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
                const invitationUrl = `${INVITATION_PAGE_URL}id=${encodeURIComponent(rowNumber)}&inv=${urlName}`;
                const message = `🦉 *Recordatorio de Hogwarts*\n\nHola *${name}*!\n\n${reminderText}\n\n📜 Invitación:\n${invitationUrl}`;

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
        console.log(`✅ Envío de recordatorios finalizado: ${reminderLabel}.`);
    } catch (err) {
        console.error('Error procesando los invitados mediante Apps Script:', err);
    }
}

// ============================================
// SCHEDULER
// ============================================
const isEventYear = () => new Date().getFullYear() === EVENT_YEAR;

cron.schedule('0 0 30 5 *', () => {
    if (!isEventYear()) return;

    console.log('⏰ Una semana antes de la fiesta. Ejecutando envío de mensajes...');
    sendReminders('¡Falta una semana!', '1 semana antes');
}, { timezone: TIMEZONE });

cron.schedule('0 0 6 6 *', () => {
    if (!isEventYear()) return;

    console.log('⏰ Es el día de la fiesta. Ejecutando envío de mensajes...');
    sendReminders('¡Es hoy! no te olvides de traer tu boleto', 'día de la fiesta');
}, { timezone: TIMEZONE });

cron.schedule('0 14 7 6 *', () => {
    if (!isEventYear()) return;

    console.log('⏰ Un día después de la fiesta. Ejecutando envío de mensajes...');
    sendReminders('Espero que ayer hayas pasado una noche mágica, no te olvides de mandarme tus fotos para recordarla por siempre', 'día después de la fiesta');
}, { timezone: TIMEZONE });

console.log('Servicio de automatización iniciado. Esperando conexión a WP o tarea programada.');
main();

// Uncomment the following line to test immediately on startup
//setTimeout(sendReminders, 15000); 
