const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

// বট কনফিগারেশন
const BOT_TOKEN = '7550068111:AAERd5m6eOLOOqkrdNkavKL_NxWyS7R6qzg';
const GROUP_USERNAME = '@treder_squads'; // তোমার গ্রুপ ইউজারনেম
const ADMIN_ID = 6243881362;

const bot = new Telegraf(BOT_TOKEN);
const DB_FILE = 'users.json';
let users = {};

function loadUsers() {
  if (fs.existsSync(DB_FILE)) {
    users = JSON.parse(fs.readFileSync(DB_FILE));
  }
}
function saveUsers() {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}
loadUsers();

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

// /start হ্যান্ডলার
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  const userName = ctx.from.first_name;

  try {
    const member = await ctx.telegram.getChatMember(GROUP_USERNAME, userId);
    if (member.status === 'left') {
      return ctx.reply(`❗ দয়া করে প্রথমে গ্রুপে যোগ দিন:\n${GROUP_USERNAME}`);
    }
  } catch (e) {
    return ctx.reply('⚠️ গ্রুপ যাচাই করা যাচ্ছে না। পরে চেষ্টা করুন।');
  }

  if (!users[userId]) {
    users[userId] = {
      id: userId,
      name: userName,
      balance: 0,
      joined: new Date().toLocaleString('bn-BD'),
      referBy: null,
      referredUsers: []
    };

    // রেফারেল সিস্টেম
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

  return ctx.reply(`🎉 স্বাগতম ${userName}!`, mainMenu());
});

// বাটন হ্যান্ডলারগুলো আগের মতো
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
    `🤝 রেফার করুন এবং উপার্জন করুন!\n\nআপনার রেফারেল লিংক:\nt.me/@Refer_Earningbd1_bot?start=${ctx.from.id}\n\nরেফার সংখ্যা: ${user.referredUsers.length}\nউপার্জিত: ${user.referredUsers.length * 50} BDT`,
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
    ctx.editMessageText('✅ আপনার উত্তোলনের অনুরোধ গ্রহণ করা হয়েছে! অ্যাডমিন শীঘ্রই যোগাযোগ করবেন।', mainMenu());
  }
});

bot.action('support', (ctx) => {
  ctx.editMessageText('🛠️ সাপোর্টের জন্য যোগাযোগ করুন: @your_support_username', mainMenu());
});

bot.action('language', (ctx) => {
  ctx.editMessageText('🌐 ভাষা পরিবর্তন শীঘ্রই আসছে!', mainMenu());
});

// অ্যাডমিন: মোট ইউজার সংখ্যা
bot.command('users', (ctx) => {
  if (ctx.from.id === ADMIN_ID) {
    const totalUsers = Object.keys(users).length;
    ctx.reply(`👥 মোট ইউজার: ${totalUsers}`);
  }
});

bot.launch();
console.log('🤖 বট চালু হয়েছে...');
