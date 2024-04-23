import { config } from 'dotenv';
import { Telegraf, Context } from 'telegraf';
import { PrismaClient } from '@prisma/client';
config();
if (!process.env.TOKEN) {
    console.error("A variável de ambiente TOKEN não está definida.");
    process.exit(1);
}
const botTelegram = new Telegraf(process.env.TOKEN);
const prisma = new PrismaClient();
let precisaSolicitarEmail = true;
function dentroDoHorarioComercial(): boolean {
    const agora = new Date();
    const hora = agora.getHours();
    return hora >= 9 && hora < 18;
}
async function processarMensagemTexto(ctx: Context) {
    if (ctx.message && 'text' in ctx.message) {
        const mensagem = ctx.message.text;
        if (!dentroDoHorarioComercial()) {
            if (precisaSolicitarEmail) {
                await ctx.reply('Estamos fora do horário. Nos informe seu e-mail para que possamos entrar em contato.');
                precisaSolicitarEmail = false;
            } else {
                const email = mensagem.trim();
                if (validarFormatoEmail(email)) {
                    try {
                        await prisma.email.create({ data: { email: email } });
                        console.log('EMAIL ARMAZENADO: ', email);
                        await ctx.reply('Seu e-mail foi salvo com sucesso!');
                    } catch (error) {
                        console.error('ERRO AO ARMAZENAR O EMAIL:', error);
                        await ctx.reply('Ocorreu um erro ao salvar seu e-mail');
                    }
                    precisaSolicitarEmail = true; // Reiniciar o ciclo
                } else {
                    await ctx.reply('Informe um e-mail válido!');
                }
            }
        } else {
            await ctx.reply('Buscando uma graduação? conheça a FAESA, acesse em www.faesa.br');
        }
    }
}
botTelegram.on('text', processarMensagemTexto);
function validarFormatoEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
botTelegram.launch().then(() => console.log('>>> BOT INCIANDOOO <<<'));