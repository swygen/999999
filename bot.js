const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

const bot = new Telegraf('7550068111:AAERd5m6eOLOOqkrdNkavKL_NxWyS7R6qzg');
const GROUP_ID = -1002367942232; // তোমার গ্রুপ আইডি
let users = {};

// ইউজার লোড/সেভ
function loadUsers() {
  if (fs.existsSync('users.json')) {
    users = JSON.parse(fs.readFileSync('users.json'));
  }
}
function saveUsers() {
  fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
}
loadUsers();

// অনুবাদ
const translations = {
  bn: {
    welcome: "স্বাগতম! রেফার করে ইনকাম করুন!",
    profile: "👤 প্রোফাইল",
    refer: "🤝 রেফার করুন",
    tips: "💡 উপার্জনের টিপস",
    withdraw: "💵 উত্তোলন",
    support: "🛠️ সাপোর্ট",
    language: "🌐 ভাষা"
  },
  en: {
    welcome: "Welcome! Refer and earn!",
    profile: "👤 Profile",
    refer: "🤝 Refer & Earn",
    tips: "💡 Earn Tips",
    withdraw: "💵 Withdraw",
    support: "🛠️ Support",
    language: "🌐 Language"
  },
  hi: {
    welcome: "स्वागत है! रेफर करके कमाएँ!",
    profile: "👤 प्रोफ़ाइल",
    refer: "🤝 रेफर करें",
    tips: "💡 कमाई के सुझाव",
    withdraw: "💵 निकासी",
    support: "🛠️ सहायता",
    language: "🌐 भाषा"
  },
  zh: {
    welcome: "欢迎！推荐赚钱！",
    profile: "👤 个人资料",
    refer: "🤝 推荐赚取",
    tips: "💡 赚钱技巧",
    withdraw: "💵 提现",
    support: "🛠️ 支持",
    language: "🌐 语言"
  },
  ja: {
    welcome: "ようこそ！紹介して稼ぐ！",
    profile: "👤 プロフィール",
    refer: "🤝 紹介",
    tips: "💡 稼ぐヒント",
    withdraw: "💵 出金",
    support: "🛠️ サポート",
    language: "🌐 言語"
  },
  ar: {
    welcome: "مرحبًا! احصل على المال من الإحالات!",
    profile: "👤 الملف الشخصي",
    refer: "🤝 الإحالة",
    tips: "💡 نصائح للربح",
    withdraw: "💵 السحب",
    support: "🛠️ الدعم",
    language: "🌐 اللغة"
  }
};

function mainMenu(userId) {
  const lang = users[userId]?.lang || 'bn';
  const t = translations[lang];

  return Markup.inlineKeyboard([
    [Markup.button.callback(t.profile, 'profile')],
    [Markup.button.callback(t.refer, 'refer')],
    [Markup.button.callback(t.tips, 'tips')],
    [Markup.button.callback(t.withdraw, 'withdraw')],
    [Markup.button.callback(t.support, 'support')],
    [Markup.button.callback(t.language, 'language')]
  ]);
}

// Captcha তৈরি
function generateCaptcha() {
  const a = Math.floor(Math.random() * 10);
  const b = Math.floor(Math.random() * 10);
  return { question: `${a} + ${b}`, answer: (a + b).toString() };
}

bot.start(async (ctx) => {
  const userId = ctx.from.id;
  const captcha = generateCaptcha();

  if (!users[userId]) {
    users[userId] = {
      id: userId,
      lang: 'bn',
      verified: false
    };
    saveUsers();
  }

  users[userId].captcha = captcha.answer;
  saveUsers();

  const joinCheck = await ctx.telegram.getChatMember(GROUP_ID, userId);
  if (joinCheck.status === 'left') {
    return ctx.reply(`🚫 দয়া করে আমাদের গ্রুপে যোগ দিন:\nhttps://t.me/treder_squads`, Markup.inlineKeyboard([
      [Markup.button.url('✅ গ্রুপে যোগ দিন', 'https://t.me/treder_squads')],
      [Markup.button.callback('আমি যোগ দিয়েছি', 'joined')]
    ]));
  }

  ctx.reply(`🧠 Captcha সমাধান করুন: ${captcha.question}`);
});

bot.on('text', (ctx) => {
  const userId = ctx.from.id;
  if (!users[userId] || users[userId].verified) return;

  if (ctx.message.text === users[userId].captcha) {
    users[userId].verified = true;
    saveUsers();
    const t = translations[users[userId].lang];
    return ctx.reply(`✅ সঠিক! ${t.welcome}`, mainMenu(userId));
  } else {
    return ctx.reply('❌ ভুল Captcha! আবার চেষ্টা করুন।');
  }
});

// গ্রুপে যোগ দেওয়ার পর যাচাই
bot.action('joined', async (ctx) => {
  const userId = ctx.from.id;
  const joinCheck = await ctx.telegram.getChatMember(GROUP_ID, userId);

  if (joinCheck.status === 'left') {
    return ctx.reply('🚫 আপনি এখনও গ্রুপে যোগ দেননি!');
  }

  const captcha = generateCaptcha();
  users[userId].captcha = captcha.answer;
  saveUsers();
  ctx.reply(`🧠 Captcha সমাধান করুন: ${captcha.question}`);
});

// ভাষা মেনু
bot.action('language', (ctx) => {
  ctx.editMessageText('🌐 একটি ভাষা নির্বাচন করুন:', Markup.inlineKeyboard([
    [Markup.button.callback('বাংলা', 'lang_bn'), Markup.button.callback('English', 'lang_en')],
    [Markup.button.callback('हिंदी', 'lang_hi'), Markup.button.callback('中文', 'lang_zh')],
    [Markup.button.callback('日本語', 'lang_ja'), Markup.button.callback('العربية', 'lang_ar')],
    [Markup.button.callback('🔙 Back', 'back')]
  ]));
});

// ভাষা নির্বাচন
['bn', 'en', 'hi', 'zh', 'ja', 'ar'].forEach(code => {
  bot.action(`lang_${code}`, (ctx) => {
    users[ctx.from.id].lang = code;
    saveUsers();
    ctx.editMessageText(`✅ ভাষা পরিবর্তন হয়েছে`, mainMenu(ctx.from.id));
  });
});

// অন্যান্য অপশন হ্যান্ডলার (ডেমো)
bot.action('profile', (ctx) => {
  const user = users[ctx.from.id];
  const lang = user.lang || 'bn';
  const t = translations[lang];
  ctx.editMessageText(
    `${t.profile}:\n👤 নাম: ${ctx.from.first_name}\n🆔: ${ctx.from.id}\n💰 ব্যালেন্স: ${user.balance || 0} BDT\n📅 যোগদান: ${user.joined || 'N/A'}`,
    mainMenu(ctx.from.id)
  );
});

bot.action('refer', (ctx) => {
  const lang = users[ctx.from.id]?.lang || 'bn';
  const t = translations[lang];
  ctx.editMessageText(
    `${t.refer}:\nhttps://t.me/Refer_Earningbd1_bot?start=${ctx.from.id}`,
    mainMenu(ctx.from.id)
  );
});

bot.action('tips', (ctx) => {
  const lang = users[ctx.from.id]?.lang || 'bn';

  const tipsTexts = {
    bn: `💡 উপার্জনের সেরা ৩টি টিপস:\n\n1️⃣ বেশি বেশি রেফার করুন - প্রতি রেফারে ৫০৳ ইনকাম।\n\n2️⃣ BDT GAME খেলে ইনকাম করুন\n[BDT Game লিংক](https://hgzy.in/#/register?invitationCode=15121841809)\n\n3️⃣ Gmail Account বিক্রি করে ইনকাম করুন\nযোগাযোগ: @Squad_leader_bd`,
    en: `💡 Top 3 Earning Tips:\n\n1️⃣ Refer more friends - Earn 50 BDT per referral.\n\n2️⃣ Earn by playing BDT GAME\n[BDT Game Link](https://hgzy.in/#/register?invitationCode=15121841809)\n\n3️⃣ Earn by selling Gmail accounts\nContact: @Squad_leader_bd`,
    hi: `💡 टॉप 3 कमाई टिप्स:\n\n1️⃣ ज्यादा से ज्यादा रेफर करें - प्रति रेफर 50 BDT कमाएँ।\n\n2️⃣ BDT GAME खेलें और कमाएँ\n[BDT Game लिंक](https://hgzy.in/#/register?invitationCode=15121841809)\n\n3️⃣ Gmail अकाउंट बेचकर कमाएँ\nसंपर्क करें: @Squad_leader_bd`,
    zh: `💡 前三赚钱技巧：\n\n1️⃣ 多多推荐朋友 - 每推荐赚50 BDT。\n\n2️⃣ 玩BDT游戏赚钱\n[BDT游戏链接](https://hgzy.in/#/register?invitationCode=15121841809)\n\n3️⃣ 通过出售Gmail账户赚钱\n联系: @Squad_leader_bd`,
    ja: `💡 トップ3稼ぐ方法：\n\n1️⃣ 多く紹介する - 紹介ごとに50 BDT獲得。\n\n2️⃣ BDTゲームをプレイして稼ぐ\n[BDTゲームリンク](https://hgzy.in/#/register?invitationCode=15121841809)\n\n3️⃣ Gmailアカウントを売って稼ぐ\n連絡先: @Squad_leader_bd`,
    ar: `💡 أفضل 3 نصائح للربح:\n\n1️⃣ قم بالإحالة أكثر - اربح 50 BDT لكل إحالة.\n\n2️⃣ اربح من لعب BDT GAME\n[رابط BDT Game](https://hgzy.in/#/register?invitationCode=15121841809)\n\n3️⃣ اربح من بيع حسابات Gmail\nتواصل مع: @Squad_leader_bd`
  };

  ctx.editMessageText(tipsTexts[lang], {
    parse_mode: 'Markdown',
    ...mainMenu(ctx.from.id)
  });
});

bot.action('withdraw', (ctx) => {
  const user = users[ctx.from.id];
  const lang = user.lang || 'bn';

  const notEnough = {
    bn: '❗ ১০০০ BDT না হলে উত্তোলন করা যাবে না।',
    en: '❗ Minimum 1000 BDT is required to withdraw.',
    hi: '❗ निकासी के लिए न्यूनतम 1000 BDT आवश्यक है।',
    zh: '❗ 提现需至少1000 BDT。',
    ja: '❗ 出金には最低1000 BDTが必要です。',
    ar: '❗ الحد الأدنى للسحب هو 1000 BDT.'
  };

  const sent = {
    bn: '✅ উত্তোলনের অনুরোধ পাঠানো হয়েছে।',
    en: '✅ Withdrawal request sent.',
    hi: '✅ निकासी अनुरोध भेजा गया।',
    zh: '✅ 提现请求已发送。',
    ja: '✅ 出金リクエストが送信されました。',
    ar: '✅ تم إرسال طلب السحب.'
  };

  if ((user.balance || 0) < 1000) {
    ctx.editMessageText(notEnough[lang], mainMenu(ctx.from.id));
  } else {
    ctx.editMessageText(sent[lang], mainMenu(ctx.from.id));
  }
});

bot.action('support', (ctx) => {
  const lang = users[ctx.from.id]?.lang || 'bn';

  const supportMsgs = {
    bn: '🛠️ সাপোর্ট: @Squad_leader_bd',
    en: '🛠️ Support: @Squad_leader_bd',
    hi: '🛠️ सहायता: @Squad_leader_bd',
    zh: '🛠️ 支持: @Squad_leader_bd',
    ja: '🛠️ サポート: @Squad_leader_bd',
    ar: '🛠️ الدعم: @Squad_leader_bd'
  };

  ctx.editMessageText(supportMsgs[lang], mainMenu(ctx.from.id));
});
bot.action('back', (ctx) => ctx.editMessageText(translations[users[ctx.from.id]?.lang || 'bn'].welcome, mainMenu(ctx.from.id)));

bot.launch();
