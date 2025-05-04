const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

// বটের টোকেন এবং অ্যাডমিন আইডি
const BOT_TOKEN = '7550068111:AAERd5m6eOLOOqkrdNkavKL_NxWyS7R6qzg'; // ← আপনার বট টোকেন এখানে বসান
const ADMIN_ID = 6243881362; // ← আপনার টেলিগ্রাম আইডি এখানে বসান
const GROUP_USERNAME = '@treder_squads'; // ← আপনার গ্রুপ ইউজারনেম

const bot = new Telegraf(BOT_TOKEN);

// ইউজার ডেটা সংরক্ষণের জন্য JSON ফাইল
const DB_FILE = 'users.json';
let users = {};

// ডেটা লোড এবং সংরক্ষণ ফাংশন
function loadUsers() {
    if (fs.existsSync(DB_FILE)) {
        users = JSON.parse(fs.readFileSync(DB_FILE));
    }
}

function saveUsers() {
    fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}

loadUsers();

// ক্যাপচা জেনারেটর
function generateCaptcha() {
    const a = Math.floor(Math.random() * 10);
    const b = Math.floor(Math.random() * 10);
    return {
        question: `🤖 ক্যাপচা যাচাইকরণ: ${a} + ${b} = ?`,
        answer: (a + b).toString()
    };
}

// মেইন মেনু
function mainMenu() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('👤 প্রোফাইল', 'profile')],
        [Markup.button.callback('🤝 রেফার করুন', 'refer')],
        [Markup.button.callback('👥 দলীয় সদস্য', 'team')],
        [Markup.button.callback('💡 উপার্জনের টিপস', 'tips')],
        [Markup.button.callback('💵 টাকা উত্তোলন', 'withdraw')],
        [Markup.button.callback('🛠️ সাপোর্ট', 'support')],
        [Markup.button.callback('🌐 ভাষা পরিবর্তন', 'language')]
    ]);
}

// /start কমান্ড হ্যান্ডলার
bot.start(async (ctx) => {
    const userId = ctx.from.id;
    const userName = ctx.from.first_name;

    if (!users[userId]) {
        users[userId] = {
            id: userId,
            name: userName,
            balance: 0,
            joined: new Date().toLocaleString('bn-BD'),
            referBy: null,
            referredUsers: [],
            verified: false
        };

        // রেফারেল চেক
        const args = ctx.message.text.split(' ');
        if (args[1]) {
            const refBy = parseInt(args[1]);
            if (refBy !== userId && users[refBy]) {
                users[userId].referBy = refBy;
                users[refBy].referredUsers.push(userId);
                users[refBy].balance += 50;
            }
        }

        saveUsers();
    }

    // ক্যাপচা যাচাইকরণ
    const captcha = generateCaptcha();
    users[userId].captchaAnswer = captcha.answer;
    saveUsers();

    await ctx.reply(captcha.question);
});

// ক্যাপচা উত্তর যাচাইকরণ
bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const user = users[userId];

    if (!user || user.verified) return;

    if (ctx.message.text.trim() === user.captchaAnswer) {
        try {
            const member = await ctx.telegram.getChatMember(GROUP_USERNAME, userId);
            if (member.status === 'left') {
                return ctx.reply(`✅ দয়া করে প্রথমে গ্রুপে যোগ দিন: ${GROUP_USERNAME}`);
            }
        } catch (error) {
            return ctx.reply('⚠️ গ্রুপ যাচাইকরণে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।');
        }

        user.verified = true;
        delete user.captchaAnswer;
        saveUsers();

        return ctx.reply('🎉 আপনি সফলভাবে যাচাইকৃত হয়েছেন!', mainMenu());
    } else {
        return ctx.reply('❌ ভুল উত্তর! দয়া করে সঠিক উত্তর দিন।');
    }
});

// ইনলাইন বাটন হ্যান্ডলার
bot.action('profile', (ctx) => {
    const user = users[ctx.from.id];
    ctx.editMessageText(
        `👤 নাম: ${user.name}\n🆔 আইডি: ${user.id}\n💰 ব্যালেন্স: ${user.balance} BDT\n📅 যোগদান: ${user.joined}`,
        mainMenu()
    );
});

bot.action('refer', (ctx) => {
    const user = users[ctx.from.id];
    ctx.editMessageText(
        `🤝 রেফার করুন এবং উপার্জন করুন!\n\nআপনার রেফারেল লিংক:\nt.me/YOUR_BOT_USERNAME?start=${ctx.from.id}\n\nরেফার সংখ্যা: ${user.referredUsers.length}\nউপার্জিত: ${user.referredUsers.length * 50} BDT`,
        mainMenu()
    );
});

bot.action('team', (ctx) => {
    const user = users[ctx.from.id];
    const teamList = user.referredUsers.map(uid => {
        const refUser = users[uid];
        return `- ${refUser.name} (${uid})`;
    }).join('\n') || 'কোনও সদস্য নেই।';

    ctx.editMessageText(`👥 আপনার দলীয় সদস্য:\n${teamList}`, mainMenu());
});

bot.action('tips', (ctx) => {
    ctx.editMessageText(
        `💡 উপার্জনের টিপস:\n\n- ফ্রিল্যান্সিং শুরু করুন\n- ইউটিউব চ্যানেল খুলুন\n- অ্যাফিলিয়েট মার্কেটিং করুন\n- Fiverr বা Upwork ব্যবহার করুন`,
        mainMenu()
    );
});

bot.action('withdraw', (ctx) => {
    const user = users[ctx.from.id];
    if (user.balance < 1000) {
        ctx.editMessageText('💸 টাকা উত্তোলনের জন্য অন্তত ১০০০ BDT প্রয়োজন।', mainMenu());
    } else {
        ctx.editMessageText('✅ আপনার উত্তোলনের অনুরোধ গ্রহণ করা হয়েছে! অ্যাডমিন শীঘ্রই আপনার সাথে যোগাযোগ করবেন।', mainMenu());
    }
});

bot.action('support', (ctx) => {
    ctx.editMessageText('🛠️ সাপোর্টের জন্য যোগাযোগ করুন: @your_support_username', mainMenu());
});

bot.action('language', (ctx) => {
    ctx.editMessageText('🌐 ভাষা পরিবর্তন ফিচার শীঘ্রই আসছে!', mainMenu());
});

// অ্যাডমিন কমান্ড: মোট ইউজার সংখ্যা
bot.command('users', (ctx) => {
    if (ctx.from.id === ADMIN_ID) {
        const totalUsers = Object.keys(users).length;
        ctx.reply(`👥 মোট ইউজার: ${totalUsers}`);
    }
});

// বট চালু করা
bot.launch();
console.log('🤖 EarnBDT Bot চালু হয়েছে...');
