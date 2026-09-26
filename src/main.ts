// SPDX-License-Identifier: MIT
// Copyright 2026 Yabe Kazuhiro

import '@fontsource/lexend/400.css';
import '@fontsource/lexend/500.css';
import '@fontsource/lexend/700.css';
import '@fontsource/zen-maru-gothic/500.css';
import '@fontsource/zen-maru-gothic/700.css';
import './style.css';

import { registerSW } from 'virtual:pwa-register';
import { updateBadge } from './ui/app';
import { initCard } from './ui/card';
import { byId } from './ui/html';
import { initPractice } from './ui/practice';
import { initTabs } from './ui/tabs';

byId('version').textContent = `動詞のかたち v${__APP_VERSION__}`;
initTabs();
initCard();
initPractice();
updateBadge();

registerSW({ immediate: true });
