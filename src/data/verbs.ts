// SPDX-License-Identifier: MIT
// Copyright 2026 Yabe Kazuhiro

import { buildVerb, type Verb, type VerbSource } from '../logic/forms';

// In `passive`, `___` is the blank for the past participle and `{{...}}` marks a clue word.
const SOURCES: VerbSource[] = [
  { base: 'play', s3: 'plays', past: 'played', pp: 'played', ing: 'playing', ja: '（スポーツを）する', obj: 'tennis', passive: 'Tennis {{is}} ___ in many countries.' },
  { base: 'study', s3: 'studies', past: 'studied', pp: 'studied', ing: 'studying', ja: '勉強する', obj: 'English', passive: 'English {{is}} ___ {{by}} many students.' },
  { base: 'watch', s3: 'watches', past: 'watched', pp: 'watched', ing: 'watching', ja: '見る', obj: 'TV' },
  { base: 'try', s3: 'tries', past: 'tried', pp: 'tried', ing: 'trying', ja: 'ためす', obj: 'sushi' },
  { base: 'stop', s3: 'stops', past: 'stopped', pp: 'stopped', ing: 'stopping', ja: '止める', obj: 'the car' },
  { base: 'visit', s3: 'visits', past: 'visited', pp: 'visited', ing: 'visiting', ja: '訪れる', obj: 'Kyoto', passive: 'Kyoto {{is}} ___ {{by}} many people.' },
  { base: 'cook', s3: 'cooks', past: 'cooked', pp: 'cooked', ing: 'cooking', ja: '料理する', obj: 'dinner', passive: 'Dinner {{was}} ___ {{by}} my father.' },
  { base: 'use', s3: 'uses', past: 'used', pp: 'used', ing: 'using', ja: '使う', obj: 'this computer', passive: 'This computer {{is}} ___ {{by}} my brother.' },
  { base: 'clean', s3: 'cleans', past: 'cleaned', pp: 'cleaned', ing: 'cleaning', ja: 'そうじする', obj: 'the room', passive: 'The room {{was}} ___ {{by}} Yuki.' },
  { base: 'carry', s3: 'carries', past: 'carried', pp: 'carried', ing: 'carrying', ja: '運ぶ', obj: 'the box' },
  { base: 'go', s3: 'goes', past: 'went', pp: 'gone', ing: 'going', ja: '行く', obj: 'to the park' },
  { base: 'come', s3: 'comes', past: 'came', pp: 'come', ing: 'coming', ja: '来る', obj: 'home' },
  { base: 'run', s3: 'runs', past: 'ran', pp: 'run', ing: 'running', ja: '走る', obj: 'in the park' },
  { base: 'eat', s3: 'eats', past: 'ate', pp: 'eaten', ing: 'eating', ja: '食べる', obj: 'lunch' },
  { base: 'see', s3: 'sees', past: 'saw', pp: 'seen', ing: 'seeing', ja: '見る・見える', obj: 'the stars', noIng: true },
  { base: 'make', s3: 'makes', past: 'made', pp: 'made', ing: 'making', ja: '作る', obj: 'a cake', passive: 'This cake {{was}} ___ {{by}} my mother.' },
  { base: 'take', s3: 'takes', past: 'took', pp: 'taken', ing: 'taking', ja: '（写真を）撮る', obj: 'pictures', passive: 'This picture {{was}} ___ {{by}} my father.' },
  { base: 'write', s3: 'writes', past: 'wrote', pp: 'written', ing: 'writing', ja: '書く', obj: 'a letter', passive: 'This letter {{was}} ___ {{by}} Ken.' },
  { base: 'read', s3: 'reads', past: 'read', pp: 'read', ing: 'reading', ja: '読む', obj: 'a book', passive: 'This book {{is}} ___ {{by}} many people.', note: '過去形・過去分詞の read は「レッド」と発音します。' },
  { base: 'buy', s3: 'buys', past: 'bought', pp: 'bought', ing: 'buying', ja: '買う', obj: 'a new bag' },
  { base: 'have', s3: 'has', past: 'had', pp: 'had', ing: 'having', ja: '持っている・食べる', obj: 'lunch' },
  { base: 'speak', s3: 'speaks', past: 'spoke', pp: 'spoken', ing: 'speaking', ja: '話す', obj: 'English', passive: 'English {{is}} ___ in many countries.' },
  { base: 'swim', s3: 'swims', past: 'swam', pp: 'swum', ing: 'swimming', ja: '泳ぐ', obj: 'in the sea' },
  { base: 'give', s3: 'gives', past: 'gave', pp: 'given', ing: 'giving', ja: 'あげる', obj: 'flowers to Mika' },
  { base: 'cut', s3: 'cuts', past: 'cut', pp: 'cut', ing: 'cutting', ja: '切る', obj: 'the paper', passive: 'The paper {{was}} ___ {{by}} Ken.' },
  { base: 'put', s3: 'puts', past: 'put', pp: 'put', ing: 'putting', ja: '置く', obj: 'the book on the desk' },
  { base: 'teach', s3: 'teaches', past: 'taught', pp: 'taught', ing: 'teaching', ja: '教える', obj: 'math', passive: 'Math {{is}} ___ {{by}} Mr. Sato.' },
  { base: 'sit', s3: 'sits', past: 'sat', pp: 'sat', ing: 'sitting', ja: 'すわる', obj: 'on the bench' },
  { base: 'sing', s3: 'sings', past: 'sang', pp: 'sung', ing: 'singing', ja: '歌う', obj: 'a song', passive: 'This song {{is}} ___ {{by}} many people.' },
  { base: 'drink', s3: 'drinks', past: 'drank', pp: 'drunk', ing: 'drinking', ja: '飲む', obj: 'milk' },
  { base: 'do', s3: 'does', past: 'did', pp: 'done', ing: 'doing', ja: 'する', obj: 'the dishes' },
];

export const VERBS: readonly Verb[] = SOURCES.map(buildVerb);

export const VERB_BY_BASE: ReadonlyMap<string, Verb> = new Map(VERBS.map((v) => [v.base, v]));
