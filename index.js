require('dotenv').config();
const { Client: WAClient, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const { Client: DiscordClient, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const qrcode = require('qrcode-terminal');

// Configuration
const TARGET_NUMBER = process.env.TARGET_NUMBER; 
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;

// Initialisation de WhatsApp
const waClient = new WAClient({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null
    }
});

// Initialisation du Bot Discord
const discordClient = new DiscordClient({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// --- PARTIE WHATSAPP ---

waClient.on('qr', (qr) => {
    console.log('📱 Veuillez scanner ce QR code avec WhatsApp (Appareils connectés) :');
    qrcode.generate(qr, { small: true });
});

waClient.on('ready', () => {
    console.log('✅ Bot WhatsApp connecté !');
});

// WhatsApp -> Discord (avec médias)
waClient.on('message', async msg => {
    if (msg.from === TARGET_NUMBER) {
        console.log(`[DEBUG] Message reçu de : ${msg.from} (Attendu : ${TARGET_NUMBER})`);
        console.log('💌 Message reçu de WhatsApp. Envoi sur Discord...');
        
        try {
            const channel = await discordClient.channels.fetch(DISCORD_CHANNEL_ID);
            let files = [];
            
            // Gestion des médias
            if (msg.hasMedia) {
                const media = await msg.downloadMedia();
                if (media) {
                    const buffer = Buffer.from(media.data, 'base64');
                    // On essaie de deviner l'extension selon le type MIME de WhatsApp
                    const extension = media.mimetype.split('/')[1].split(';')[0];
                    const filename = media.filename || `media.${extension}`;
                    files.push(new AttachmentBuilder(buffer, { name: filename }));
                }
            }

            const textContent = msg.body ? msg.body : (files.length > 0 ? '' : '*[Message non supporté/Média manquant]*');
            
            await channel.send({ 
                content: `🔔 **Nouveau message de WhatsApp**\n> ${textContent}`, 
                files: files 
            });
        } catch (error) {
            console.error('❌ Erreur lors du transfert vers Discord :', error.message);
        }
    }
});

// --- PARTIE DISCORD ---

discordClient.once('ready', () => {
    console.log(`🤖 Bot Discord connecté en tant que ${discordClient.user.tag}`);
});

// Discord -> WhatsApp
discordClient.on('messageCreate', async message => {
    // Ignorer les messages du bot lui-même et vérifier le bon salon
    if (message.author.bot) return;
    if (message.channelId === DISCORD_CHANNEL_ID) {
        console.log('💬 Message reçu de Discord. Envoi sur WhatsApp...');
        try {
            // Si le message sur Discord a un média attaché, on le transfère aussi vers WhatsApp
            if (message.attachments.size > 0) {
                const attachment = message.attachments.first();
                const media = await MessageMedia.fromUrl(attachment.url);
                await waClient.sendMessage(TARGET_NUMBER, media, { caption: message.content });
            } else if (message.content) {
                // Envoi de texte simple
                await waClient.sendMessage(TARGET_NUMBER, message.content);
            }
        } catch (error) {
            console.error('❌ Erreur lors du transfert vers WhatsApp :', error.message);
        }
    }
});

// Démarrage des clients
console.log('Démarrage des bots...');
discordClient.login(DISCORD_BOT_TOKEN).catch(console.error);
waClient.initialize();
