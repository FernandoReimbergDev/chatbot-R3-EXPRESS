const qrcode = require('qrcode-terminal');
const { Client } = require('whatsapp-web.js');

const client = new Client();

const delay = ms => new Promise(res => setTimeout(res, ms));

// Armazena o estado da conversa dos usuários
const userStates = {};

// Função para resetar o estado do usuário
const resetUserState = (userId) => {
    userStates[userId] = { stage: null, timestamp: Date.now(), completed: false };
};

// Serviço de leitura do QR Code
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

// Mensagem de confirmação de inicialização
client.on('ready', () => {
    console.log('Tudo certo! WhatsApp conectado.');
});

// Inicializa o cliente
client.initialize();

// Lógica de resposta
client.on('message', async msg => {
    const userId = msg.from;

    // Inicializa o estado do usuário se não existir
    if (!userStates[userId]) {
        resetUserState(userId);
    }

    const chat = await msg.getChat();

    // Se o fluxo já foi completado, não reinicia
    if (userStates[userId].completed) {
        await client.sendMessage(
            userId,
            'Você já passou por este fluxo. Caso precise de algo, entre em contato novamente mais tarde.'
        );
        return;
    }

    // Fluxo de conversa
    if (!userStates[userId].stage) {
        // Inicia a conversa apenas se não houver estado ativo
        if (msg.body.match(/(menu|oi|ola|olá|tudo bem|vagas|bom dia|boa tarde|boa noite)/i)) {
            userStates[userId].stage = 'askAboutJobs';
            await delay(3000);
            await chat.sendStateTyping();
            await delay(3000);
            await client.sendMessage(
                userId,
                'Olá - Sou a assistente virtual da empresa R3 Express. Se seu contato for referente a vaga de motoboy, por favor, escolha uma das opções abaixo.\n\n1 - Não\n\n2 - Sim'
            );
        }
    } else if (userStates[userId].stage === 'askAboutJobs') {
        if (msg.body === '1') {
            resetUserState(userId); // Redefine o estado sem completar
            await delay(3000);
            await chat.sendStateTyping();
            await delay(3000);
            await client.sendMessage(
                userId,
                'OK! Estamos te passando para um atendente.'
            );
        } else if (msg.body === '2') {
            userStates[userId].stage = 'jobDetails';
            await delay(3000);
            await chat.sendStateTyping();
            await delay(3000);
            await client.sendMessage(
                userId,
                'Detalhes da Vaga:\nRemuneração: R$ 80 por período, taxa de R$ 8 ao atingir a meta.\nHorários Disponíveis:\nDas 9h às 15h.\nDas 15h às 21h.\nPossibilidade de trabalhar em dois períodos.\nEscala de Trabalho: 6x1, com folga durante a semana.\nPagamento: Realizado semanalmente, sempre na sexta-feira da semana seguinte ao período trabalhado.\nRequisitos: Necessário possuir CNH e baú.\nDeseja continuar? Escolha opções abaixo:\n\n1 - Sim\n\n2 - Não.'
            );
        } else {
            await client.sendMessage(userId, 'Por favor, responda com 1 (Não) ou 2 (Sim).');
        }
    } else if (userStates[userId].stage === 'jobDetails') {
        if (msg.body === '1') {
            userStates[userId].completed = true; // Marca o fluxo como concluído
            await delay(3000);
            await chat.sendStateTyping();
            await delay(3000);
            await client.sendMessage(
                userId,
                'Por favor, informe seu nome completo e a região onde mora para verificarmos as melhores opções de vagas e disponibilidade. Estou transferindo você para uma de nossas atendentes!'
            );
        } else if (msg.body === '2') {
            userStates[userId].completed = true; // Marca o fluxo como concluído
            await delay(3000);
            await chat.sendStateTyping();
            await delay(3000);
            await client.sendMessage(
                userId,
                'Agradecemos por entrar em contato com a R3 Express! Estamos à disposição para ajudá-lo no que precisar.'
            );
        } else {
            await client.sendMessage(userId, 'Por favor, responda com 1 (Sim) ou 2 (Não).');
        }
    }
});
