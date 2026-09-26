// SPDX-License-Identifier: MIT
// Copyright 2026 Yabe Kazuhiro

import { buildVerb, type Verb, type VerbSource } from '../logic/forms';
import { PERFECT_MEANING as P, reasons as R } from '../logic/reasons';

// In `passive` and `sentences`, `___` is the blank and `{{...}}` marks a clue word that tells which form to use.
// `obj` fills the shared templates ("We ___ {obj} every day.", "Did you ___ {obj} yesterday?", ...), so it must
// read naturally in all of them; otherwise the verb replaces or skips the templates that do not fit.
// VERBS.md lists every sentence generated from this table; regenerate it with `npm run docs:verbs`.
const SOURCES: VerbSource[] = [
  // ---------- Step 1 ----------
  {
    step: 1, base: 'go', s3: 'goes', past: 'went', pp: 'gone', ing: 'going', ja: '行く', obj: 'to the park',
    sentences: {
      // "I have already gone to the park" suggests the speaker is not here, so use a subject who has left.
      'pp-perfect': { text: 'Ken {{has}} already ___ home.', reason: R.perfect('has') },
    },
  },
  { step: 1, base: 'come', s3: 'comes', past: 'came', pp: 'come', ing: 'coming', ja: '来る', obj: 'home' },
  {
    step: 1, base: 'get', s3: 'gets', past: 'got', pp: 'got', ing: 'getting', ja: '手に入れる・起きる（get up）', obj: 'up at six',
    note: 'アメリカ英語では過去分詞に gotten も使います。',
    sentences: {
      'pp-perfect': { text: 'Ken {{has}} just ___ a letter from Mika.', reason: R.perfect('has') },
      'ing-progressive': { text: 'It {{is}} ___ dark {{now}}.', reason: R.progressive('is') },
    },
  },
  {
    step: 1, base: 'make', s3: 'makes', past: 'made', pp: 'made', ing: 'making', ja: '作る', obj: 'breakfast',
    passive: 'This cake {{was}} ___ {{by}} my mother.',
  },
  {
    step: 1, base: 'take', s3: 'takes', past: 'took', pp: 'taken', ing: 'taking', ja: '（写真を）撮る・持っていく', obj: 'pictures',
    passive: 'This picture {{was}} ___ {{by}} my father.',
  },
  {
    step: 1, base: 'see', s3: 'sees', past: 'saw', pp: 'seen', ing: 'seeing', ja: '見る・見える', obj: 'the stars',
    sentences: { 'ing-progressive': null },
  },
  { step: 1, base: 'have', s3: 'has', past: 'had', pp: 'had', ing: 'having', ja: '持っている・食べる', obj: 'lunch' },
  { step: 1, base: 'do', s3: 'does', past: 'did', pp: 'done', ing: 'doing', ja: 'する', obj: 'homework' },
  { step: 1, base: 'say', s3: 'says', past: 'said', pp: 'said', ing: 'saying', ja: '言う', obj: 'hello' },
  {
    step: 1, base: 'know', s3: 'knows', past: 'knew', pp: 'known', ing: 'knowing', ja: '知っている', obj: 'his name',
    passive: 'This song {{is}} ___ {{to}} everyone.',
    sentences: {
      'base-present': { text: '{{We}} ___ his name.', reason: R.notThirdPerson('We') },
      'base-did-question': { text: '{{Did}} you ___ his name?', reason: R.didQuestion },
      'base-can': null,
      's3-present': { text: '{{Ken}} ___ her name.', reason: R.thirdPersonState('Ken') },
      'past-time': { text: 'I ___ him {{when I was a child}}.', reason: R.pastTime('when I was a child') },
      'pp-perfect': { text: 'I {{have}} ___ Ken {{for three years}}.', reason: R.perfect('have', P.continuation) },
      'ing-progressive': null,
    },
  },
  {
    step: 1, base: 'think', s3: 'thinks', past: 'thought', pp: 'thought', ing: 'thinking', ja: '考える・思う', obj: 'about the future',
    sentences: {
      'pp-perfect': { text: 'I {{have}} ___ about it {{for a long time}}.', reason: R.perfect('have', P.continuation) },
    },
  },
  {
    step: 1, base: 'give', s3: 'gives', past: 'gave', pp: 'given', ing: 'giving', ja: 'あげる', obj: 'flowers to Mika',
    passive: 'This book {{was}} ___ to me {{by}} my aunt.',
    sentences: {
      'base-present': { text: '{{I}} ___ my dog food {{every day}}.', reason: R.notThirdPerson('I') },
      's3-present': { text: '{{Ken}} ___ his dog food {{every day}}.', reason: R.thirdPersonHabit('Ken') },
    },
  },
  {
    step: 1, base: 'tell', s3: 'tells', past: 'told', pp: 'told', ing: 'telling', ja: '伝える・話す', obj: 'the truth',
    sentences: {
      'pp-perfect': { text: 'I {{have}} already ___ him the news.', reason: R.perfect('have') },
    },
  },
  {
    step: 1, base: 'find', s3: 'finds', past: 'found', pp: 'found', ing: 'finding', ja: '見つける', obj: 'the answer',
    passive: 'The key {{was}} ___ under the desk {{by}} Ken.',
    sentences: {
      'base-present': { text: '{{I}} always ___ good books at this library.', reason: R.notThirdPerson('I') },
      's3-present': {
        text: '{{Ken}} {{always}} ___ good books at this library.',
        reason: R.thirdPersonHabit('Ken', 'always'),
      },
      'ing-progressive': null,
    },
  },
  {
    step: 1, base: 'eat', s3: 'eats', past: 'ate', pp: 'eaten', ing: 'eating', ja: '食べる', obj: 'lunch',
    passive: 'Sushi {{is}} ___ all over the world.',
  },
  {
    step: 1, base: 'write', s3: 'writes', past: 'wrote', pp: 'written', ing: 'writing', ja: '書く', obj: 'a letter',
    passive: 'This letter {{was}} ___ {{by}} Ken.',
  },
  {
    step: 1, base: 'read', s3: 'reads', past: 'read', pp: 'read', ing: 'reading', ja: '読む', obj: 'a book',
    passive: 'This book {{is}} ___ {{by}} many people.',
    note: '過去形・過去分詞の read は「レッド」と発音します。',
  },
  { step: 1, base: 'buy', s3: 'buys', past: 'bought', pp: 'bought', ing: 'buying', ja: '買う', obj: 'bread at this store' },
  {
    step: 1, base: 'run', s3: 'runs', past: 'ran', pp: 'run', ing: 'running', ja: '走る', obj: 'in the park',
    sentences: {
      'pp-perfect': { text: 'I {{have}} never ___ a marathon.', reason: R.perfect('have', P.neverExperienced) },
    },
  },
  {
    step: 1, base: 'speak', s3: 'speaks', past: 'spoke', pp: 'spoken', ing: 'speaking', ja: '話す', obj: 'English',
    passive: 'English {{is}} ___ in many countries.',
  },
  {
    step: 1, base: 'play', s3: 'plays', past: 'played', pp: 'played', ing: 'playing', ja: '（スポーツを）する', obj: 'tennis',
    passive: 'Tennis {{is}} ___ in many countries.',
  },
  {
    step: 1, base: 'visit', s3: 'visits', past: 'visited', pp: 'visited', ing: 'visiting', ja: '訪れる', obj: 'Grandma',
    passive: 'Kyoto {{is}} ___ {{by}} many people.',
    sentences: {
      'base-present': { text: '{{We}} ___ Grandma {{every Sunday}}.', reason: R.notThirdPerson('We') },
      's3-present': {
        text: '{{Ken}} ___ Grandma {{every Sunday}}.',
        reason: R.thirdPersonHabit('Ken', 'every Sunday', '毎週くり返すこと'),
      },
    },
  },
  {
    step: 1, base: 'clean', s3: 'cleans', past: 'cleaned', pp: 'cleaned', ing: 'cleaning', ja: 'そうじする', obj: 'the room',
    passive: 'The room {{was}} ___ {{by}} Yuki.',
  },
  { step: 1, base: 'watch', s3: 'watches', past: 'watched', pp: 'watched', ing: 'watching', ja: '見る', obj: 'TV' },
  {
    step: 1, base: 'use', s3: 'uses', past: 'used', pp: 'used', ing: 'using', ja: '使う', obj: 'this computer',
    passive: 'This computer {{is}} ___ {{by}} my brother.',
  },
  {
    step: 1, base: 'study', s3: 'studies', past: 'studied', pp: 'studied', ing: 'studying', ja: '勉強する', obj: 'English',
    passive: 'English {{is}} ___ {{by}} many students.',
  },
  { step: 1, base: 'stop', s3: 'stops', past: 'stopped', pp: 'stopped', ing: 'stopping', ja: '止まる・止める', obj: 'at the red light' },
  {
    step: 1, base: 'live', s3: 'lives', past: 'lived', pp: 'lived', ing: 'living', ja: '住む', obj: 'in Tokyo',
    sentences: {
      'base-present': { text: '{{We}} ___ in Tokyo.', reason: R.notThirdPerson('We') },
      'base-did-question': { text: '{{Did}} you ___ in Osaka last year?', reason: R.didQuestion },
      's3-present': { text: '{{Ken}} ___ in Osaka.', reason: R.thirdPersonState('Ken') },
      'past-time': { text: 'My family ___ in Osaka {{five years ago}}.', reason: R.pastTime('five years ago') },
      'pp-perfect': { text: 'We {{have}} ___ in Tokyo {{for ten years}}.', reason: R.perfect('have', P.continuation) },
    },
  },

  // ---------- Step 2 ----------
  {
    step: 2, base: 'become', s3: 'becomes', past: 'became', pp: 'become', ing: 'becoming', ja: '〜になる', obj: 'a teacher',
    sentences: {
      'base-present': null,
      'base-did-question': { text: '{{Did}} your sister ___ a teacher last year?', reason: R.didQuestion },
      'base-does-question': null,
      's3-present': {
        text: '{{It}} ___ cold here {{in winter}}.',
        reason: R.thirdPersonHabit('It', 'in winter', '毎年くり返すこと'),
      },
      'past-time': { text: 'My brother ___ a teacher {{last year}}.', reason: R.pastTime('last year') },
      'pp-perfect': { text: 'My sister {{has}} just ___ a teacher.', reason: R.perfect('has') },
      'ing-progressive': null,
    },
  },
  {
    step: 2, base: 'leave', s3: 'leaves', past: 'left', pp: 'left', ing: 'leaving', ja: '出発する・去る', obj: 'home at seven',
    sentences: {
      'pp-perfect': { text: 'Ken {{has}} already ___ home.', reason: R.perfect('has') },
      'ing-progressive': { text: 'The train {{is}} ___ {{now}}.', reason: R.progressive('is') },
    },
  },
  {
    step: 2, base: 'feel', s3: 'feels', past: 'felt', pp: 'felt', ing: 'feeling', ja: '感じる', obj: 'happy',
    sentences: {
      'base-can': null,
      'pp-perfect': { text: 'I {{have}} never ___ so happy.', reason: R.perfect('have', P.neverExperienced) },
    },
  },
  { step: 2, base: 'bring', s3: 'brings', past: 'brought', pp: 'brought', ing: 'bringing', ja: '持ってくる', obj: 'lunch to school' },
  {
    step: 2, base: 'begin', s3: 'begins', past: 'began', pp: 'begun', ing: 'beginning', ja: '始まる・始める', obj: 'the meeting',
    sentences: {
      'base-present': { text: '{{Our classes}} ___ at nine.', reason: R.notThirdPerson('Our classes') },
      'base-did-question': { text: '{{Did}} the game ___ at six?', reason: R.didQuestion },
      'base-does-question': { text: '{{Does}} the concert ___ at seven?', reason: R.doesQuestion },
      's3-present': { text: '{{School}} ___ at eight thirty {{every day}}.', reason: R.thirdPersonHabit('School') },
      'past-time': { text: 'It ___ to rain {{an hour ago}}.', reason: R.pastTime('an hour ago') },
      'pp-perfect': { text: 'The movie {{has}} already ___.', reason: R.perfect('has') },
      'ing-progressive': { text: 'It {{is}} ___ to rain {{now}}.', reason: R.progressive('is') },
    },
  },
  {
    step: 2, base: 'meet', s3: 'meets', past: 'met', pp: 'met', ing: 'meeting', ja: '会う', obj: 'Yuki at the station',
    sentences: {
      'pp-perfect': { text: 'I {{have}} ___ him {{before}}.', reason: R.perfect('have', P.experience) },
    },
  },
  {
    step: 2, base: 'hear', s3: 'hears', past: 'heard', pp: 'heard', ing: 'hearing', ja: '聞こえる・聞く', obj: 'the birds',
    sentences: {
      'pp-perfect': { text: 'I {{have}} ___ this song {{before}}.', reason: R.perfect('have', P.experience) },
      'ing-progressive': null,
    },
  },
  {
    step: 2, base: 'sit', s3: 'sits', past: 'sat', pp: 'sat', ing: 'sitting', ja: 'すわる', obj: 'on the bench',
    sentences: {
      'pp-perfect': { text: 'We {{have}} ___ here {{for an hour}}.', reason: R.perfect('have', P.continuation) },
    },
  },
  {
    step: 2, base: 'swim', s3: 'swims', past: 'swam', pp: 'swum', ing: 'swimming', ja: '泳ぐ', obj: 'in the sea',
    sentences: {
      'pp-perfect': { text: 'I {{have}} never ___ in the sea.', reason: R.perfect('have', P.neverExperienced) },
    },
  },
  {
    step: 2, base: 'sing', s3: 'sings', past: 'sang', pp: 'sung', ing: 'singing', ja: '歌う', obj: 'a song',
    passive: 'This song {{is}} ___ {{by}} many people.',
  },
  { step: 2, base: 'drink', s3: 'drinks', past: 'drank', pp: 'drunk', ing: 'drinking', ja: '飲む', obj: 'milk' },
  {
    step: 2, base: 'teach', s3: 'teaches', past: 'taught', pp: 'taught', ing: 'teaching', ja: '教える', obj: 'math',
    passive: 'Math {{is}} ___ {{by}} Mr. Sato.',
    sentences: {
      'base-present': { text: '{{Our teachers}} ___ us English {{every day}}.', reason: R.notThirdPerson('Our teachers') },
      'pp-perfect': {
        text: 'Ms. Brown {{has}} ___ English here {{for ten years}}.',
        reason: R.perfect('has', P.continuation),
      },
    },
  },
  { step: 2, base: 'put', s3: 'puts', past: 'put', pp: 'put', ing: 'putting', ja: '置く', obj: 'the book on the desk' },
  {
    step: 2, base: 'cut', s3: 'cuts', past: 'cut', pp: 'cut', ing: 'cutting', ja: '切る', obj: 'the paper',
    passive: 'The paper {{was}} ___ {{by}} Ken.',
  },
  { step: 2, base: 'help', s3: 'helps', past: 'helped', pp: 'helped', ing: 'helping', ja: '手伝う・助ける', obj: 'our teacher' },
  { step: 2, base: 'walk', s3: 'walks', past: 'walked', pp: 'walked', ing: 'walking', ja: '歩く', obj: 'to school' },
  {
    step: 2, base: 'like', s3: 'likes', past: 'liked', pp: 'liked', ing: 'liking', ja: '好きだ', obj: 'dogs',
    passive: 'This song {{is}} ___ {{by}} many young people.',
    sentences: {
      'base-present': { text: '{{We}} ___ dogs.', reason: R.notThirdPerson('We') },
      'base-did-question': { text: '{{Did}} you ___ the movie?', reason: R.didQuestion },
      'base-can': null,
      's3-present': { text: '{{Mika}} ___ cats.', reason: R.thirdPersonState('Mika') },
      'past-time': { text: 'I ___ carrots {{when I was a child}}.', reason: R.pastTime('when I was a child') },
      'pp-perfect': {
        text: 'I {{have}} ___ music {{since I was a child}}.',
        reason: R.perfect('have', P.continuation),
      },
      'ing-progressive': null,
    },
  },
  {
    step: 2, base: 'try', s3: 'tries', past: 'tried', pp: 'tried', ing: 'trying', ja: 'ためす・やってみる', obj: 'sushi',
    sentences: {
      'base-present': { text: '{{We}} ___ to speak English {{every day}}.', reason: R.notThirdPerson('We') },
      's3-present': { text: '{{Ken}} ___ to speak English {{every day}}.', reason: R.thirdPersonHabit('Ken') },
      'ing-progressive': { text: 'She {{is}} ___ to open the window {{now}}.', reason: R.progressive('is') },
    },
  },
  { step: 2, base: 'carry', s3: 'carries', past: 'carried', pp: 'carried', ing: 'carrying', ja: '運ぶ', obj: 'the box' },
  { step: 2, base: 'wash', s3: 'washes', past: 'washed', pp: 'washed', ing: 'washing', ja: '洗う', obj: 'the dishes' },

  // ---------- Step 3 ----------
  {
    step: 3, base: 'understand', s3: 'understands', past: 'understood', pp: 'understood', ing: 'understanding',
    ja: '理解する', obj: 'this question',
    sentences: {
      'base-present': { text: '{{We}} ___ this question.', reason: R.notThirdPerson('We') },
      'base-did-question': { text: '{{Did}} you ___ his question?', reason: R.didQuestion },
      's3-present': { text: '{{Ken}} ___ Japanese well.', reason: R.thirdPersonState('Ken') },
      'past-time': { text: 'I finally ___ it {{last night}}.', reason: R.pastTime('last night') },
      'pp-perfect': { text: 'I {{have}} already ___ the rule.', reason: R.perfect('have') },
      'ing-progressive': null,
    },
  },
  {
    step: 3, base: 'forget', s3: 'forgets', past: 'forgot', pp: 'forgotten', ing: 'forgetting', ja: '忘れる', obj: 'his name',
    sentences: {
      'base-present': { text: '{{I}} often ___ my homework.', reason: R.notThirdPerson('I') },
      'base-can': { text: 'I {{will}} never ___ this day.', reason: R.modal('will') },
      's3-present': {
        text: '{{Ken}} {{often}} ___ his homework.',
        reason: R.thirdPersonHabit('Ken', 'often', 'よくすること'),
      },
      'ing-progressive': null,
    },
  },
  {
    step: 3, base: 'lose', s3: 'loses', past: 'lost', pp: 'lost', ing: 'losing', ja: 'なくす・負ける', obj: 'the game',
    sentences: {
      'base-present': { text: '{{I}} often ___ my pen.', reason: R.notThirdPerson('I') },
      'base-does-question': null,
      'base-can': null,
      's3-present': { text: '{{Ken}} {{often}} ___ his pen.', reason: R.thirdPersonHabit('Ken', 'often', 'よくすること') },
      'pp-perfect': { text: 'I {{have}} ___ my key.', reason: R.perfect('have') },
    },
  },
  {
    step: 3, base: 'win', s3: 'wins', past: 'won', pp: 'won', ing: 'winning', ja: '勝つ', obj: 'the game',
    sentences: {
      'base-present': { text: '{{We}} often ___ the game.', reason: R.notThirdPerson('We') },
      's3-present': {
        text: '{{Our team}} {{often}} ___ the game.',
        reason: R.thirdPersonHabit('Our team', 'often', 'よくすること'),
      },
    },
  },
  {
    step: 3, base: 'sleep', s3: 'sleeps', past: 'slept', pp: 'slept', ing: 'sleeping', ja: '眠る', obj: 'for eight hours',
    sentences: {
      'pp-perfect': { text: "I {{haven't}} ___ well {{since}} Monday.", reason: R.perfect('have', P.notSince) },
      'ing-progressive': { text: 'The baby {{is}} ___ {{now}}.', reason: R.progressive('is') },
    },
  },
  {
    step: 3, base: 'send', s3: 'sends', past: 'sent', pp: 'sent', ing: 'sending', ja: '送る', obj: 'an e-mail to Yuki',
    passive: 'This letter {{was}} ___ {{by}} my friend in America.',
  },
  {
    step: 3, base: 'spend', s3: 'spends', past: 'spent', pp: 'spent', ing: 'spending', ja: '（時間・お金を）使う', obj: 'an hour on homework',
    sentences: { 'ing-progressive': null },
  },
  {
    step: 3, base: 'build', s3: 'builds', past: 'built', pp: 'built', ing: 'building', ja: '建てる', obj: 'a house',
    passive: 'This castle {{was}} ___ {{in}} 1609.',
    sentences: {
      'base-present': { text: '{{Birds}} ___ nests {{in spring}}.', reason: R.notThirdPerson('Birds') },
      'base-did-question': { text: '{{Did}} your father ___ this house?', reason: R.didQuestion },
      'base-does-question': null,
      's3-present': {
        text: '{{The bird}} ___ a nest {{in spring}}.',
        reason: R.thirdPersonHabit('The bird', 'in spring', '毎年くり返すこと'),
      },
      'past-time': { text: 'My grandfather ___ this house {{forty years ago}}.', reason: R.pastTime('forty years ago') },
      'pp-perfect': { text: 'They {{have}} just ___ a new station.', reason: R.perfect('have') },
      'ing-progressive': { text: 'They {{are}} ___ a new school {{now}}.', reason: R.progressive('are') },
    },
  },
  {
    step: 3, base: 'break', s3: 'breaks', past: 'broke', pp: 'broken', ing: 'breaking', ja: 'こわす・割る', obj: 'the window',
    passive: 'The window {{was}} ___ {{by}} the boy.',
    sentences: {
      'base-present': null,
      'base-does-question': null,
      'base-can': null,
      's3-present': {
        text: '{{Ken}} {{often}} ___ his pencils.',
        reason: R.thirdPersonHabit('Ken', 'often', 'よくすること'),
      },
      'pp-perfect': { text: 'Ken {{has}} ___ his arm.', reason: R.perfect('has') },
      'ing-progressive': null,
    },
  },
  {
    step: 3, base: 'choose', s3: 'chooses', past: 'chose', pp: 'chosen', ing: 'choosing', ja: '選ぶ', obj: 'a present for Mika',
    passive: 'Ken {{was}} ___ {{as}} the captain of the team.',
    sentences: {
      'base-present': { text: '{{I}} always ___ the red one.', reason: R.notThirdPerson('I') },
      'base-does-question': null,
      's3-present': {
        text: '{{Mika}} {{always}} ___ the red one.',
        reason: R.thirdPersonHabit('Mika', 'always'),
      },
    },
  },
  {
    step: 3, base: 'catch', s3: 'catches', past: 'caught', pp: 'caught', ing: 'catching', ja: 'つかまえる・捕る', obj: 'the ball',
    sentences: {
      'pp-perfect': { text: 'My father {{has}} just ___ a big fish.', reason: R.perfect('has') },
    },
  },
  {
    step: 3, base: 'sell', s3: 'sells', past: 'sold', pp: 'sold', ing: 'selling', ja: '売る', obj: 'fruit at the market',
    passive: 'Stamps {{are}} ___ at that store.',
  },
  { step: 3, base: 'fly', s3: 'flies', past: 'flew', pp: 'flown', ing: 'flying', ja: '飛ぶ・（たこを）あげる', obj: 'a kite' },
  {
    step: 3, base: 'wear', s3: 'wears', past: 'wore', pp: 'worn', ing: 'wearing', ja: '着ている・身につけている', obj: 'a cap',
    sentences: {
      'pp-perfect': { text: 'I {{have}} never ___ a kimono.', reason: R.perfect('have', P.neverExperienced) },
    },
  },
  {
    step: 3, base: 'keep', s3: 'keeps', past: 'kept', pp: 'kept', ing: 'keeping', ja: '保つ・飼う', obj: 'the room clean',
    sentences: {
      'pp-perfect': { text: 'She {{has}} ___ a dog {{for five years}}.', reason: R.perfect('has', P.continuation) },
      'ing-progressive': null,
    },
  },
  {
    step: 3, base: 'hold', s3: 'holds', past: 'held', pp: 'held', ing: 'holding', ja: '開く（開催する）・持つ', obj: 'a meeting',
    passive: 'The Olympic Games {{were}} ___ in Tokyo {{in}} 2021.',
    sentences: {
      'base-present': { text: '{{We}} ___ a school festival {{every year}}.', reason: R.notThirdPerson('We') },
      's3-present': {
        text: '{{Our school}} ___ a festival {{every year}}.',
        reason: R.thirdPersonHabit('Our school', 'every year', '毎年くり返すこと'),
      },
    },
  },
  {
    step: 3, base: 'grow', s3: 'grows', past: 'grew', pp: 'grown', ing: 'growing', ja: '育てる・成長する', obj: 'tomatoes',
    passive: 'Rice {{is}} ___ in this area.',
    sentences: {
      'base-present': { text: '{{My parents}} ___ tomatoes {{every summer}}.', reason: R.notThirdPerson('My parents') },
      'base-did-question': { text: '{{Did}} you ___ tomatoes last summer?', reason: R.didQuestion },
      's3-present': {
        text: '{{My grandfather}} ___ rice {{every year}}.',
        reason: R.thirdPersonHabit('My grandfather', 'every year', '毎年くり返すこと'),
      },
      'past-time': { text: 'We ___ tomatoes {{last summer}}.', reason: R.pastTime('last summer') },
      'pp-perfect': { text: 'My brother {{has}} ___ taller than me.', reason: R.perfect('has') },
    },
  },
  {
    step: 3, base: 'show', s3: 'shows', past: 'showed', pp: 'shown', ing: 'showing', ja: '見せる', obj: 'the pictures to Yuki',
    passive: 'This picture {{was}} ___ {{to}} everyone.',
    sentences: {
      'base-present': { text: '{{I}} ___ my notebook to the teacher {{every day}}.', reason: R.notThirdPerson('I') },
      's3-present': {
        text: '{{Ken}} ___ his notebook to the teacher {{every day}}.',
        reason: R.thirdPersonHabit('Ken'),
      },
    },
  },
  { step: 3, base: 'cook', s3: 'cooks', past: 'cooked', pp: 'cooked', ing: 'cooking', ja: '料理する', obj: 'dinner',
    passive: 'Dinner {{was}} ___ {{by}} my father.',
  },
  {
    step: 3, base: 'enjoy', s3: 'enjoys', past: 'enjoyed', pp: 'enjoyed', ing: 'enjoying', ja: '楽しむ', obj: 'music',
    sentences: {
      'base-did-question': { text: '{{Did}} you ___ the party?', reason: R.didQuestion },
      'past-time': { text: 'We ___ the party {{last Sunday}}.', reason: R.pastTime('last Sunday') },
      'pp-perfect': { text: 'We {{have}} just ___ lunch together.', reason: R.perfect('have') },
    },
  },
  {
    step: 3, base: 'cry', s3: 'cries', past: 'cried', pp: 'cried', ing: 'crying', ja: '泣く', obj: 'at night',
    sentences: {
      'base-present': { text: '{{Babies}} often ___ at night.', reason: R.notThirdPerson('Babies') },
      'base-did-question': { text: '{{Did}} you ___ at the end of the movie?', reason: R.didQuestion },
      'base-does-question': null,
      'base-can': null,
      's3-present': {
        text: '{{The baby}} {{often}} ___ at night.',
        reason: R.thirdPersonHabit('The baby', 'often', 'よくすること'),
      },
      'past-time': { text: 'Mika ___ at the end of the movie {{last night}}.', reason: R.pastTime('last night') },
      'pp-perfect': { text: 'I {{have}} never ___ at a movie.', reason: R.perfect('have', P.neverExperienced) },
      'ing-progressive': { text: 'The baby {{is}} ___ {{now}}.', reason: R.progressive('is') },
    },
  },
  {
    step: 3, base: 'call', s3: 'calls', past: 'called', pp: 'called', ing: 'calling', ja: '電話する・呼ぶ', obj: 'Yuki',
    passive: 'This dog {{is}} ___ Pochi.',
  },
];

export const VERBS: readonly Verb[] = SOURCES.map(buildVerb);

export const VERB_BY_BASE: ReadonlyMap<string, Verb> = new Map(VERBS.map((v) => [v.base, v]));
