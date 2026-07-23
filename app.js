(() => {
  const $ = s => document.querySelector(s);
  const screens = () => Array.from(document.querySelectorAll('.screen'));

  const state = {
    playerName: '玩家',
    cards: [],
    currentCardIndex: 0,
    timingScale: 1,
    testMode: false,
    dragStartX: 0,
    dragCurrentX: 0,
    draggingCard: false,
    scheduled: [],
    monologueTimer: null,
    walkingTimer: null,
    walking: false,
    touchActive: false,
    touchStartY: 0,
    distance: 3200,
    totalDistance: 3200,
    jumpDone: false,
    signDone: false,
    jumpSuccess: null,
    jumpCharging: false,
    jumpStart: 0,
    jumpRaf: 0,
    signProgress: 0,
    signVisited: new Set(),
    signPointerActive: false,
    profileTimer: null,
    profileSequenceStarted: false,
    profileDistance: 180,
    endingCountdown: 3,
    endingCountdownTimer: null,
    endingStarted: false,
    focusLocked: false,
    desktopShown: false,
    handTookOver: false,
    finalTitleShown: false,
  };

  const profiles = [
    { name: '林夏', meta: '26 岁 · 展览策划\n喜欢夜骑、旧唱片和深夜散步', tags: ['# 摄影', '# 夜路', '# 只聊现在'] },
    { name: '周雨', meta: '24 岁 · 纹身师\n总在下雨天约人去没有人的地方', tags: ['# 潮湿空气', '# 城市边缘', '# 见面说'] },
    { name: '许岚', meta: '27 岁 · 花店店员\n最喜欢天黑后还亮着灯的巷子', tags: ['# 鲜花', '# 迷路', '# 等你靠近'] },
    { name: '未知用户', meta: '——\n头像像被整块抹掉了，只剩一个全黑的人形', tags: ['# 已注视', '# 已同步', '# 只能匹配'], creepy: true },
  ];

  const els = {};

  function scaled(ms) {
    return Math.max(16, Math.round(ms * state.timingScale));
  }

  function schedule(fn, delay) {
    const id = setTimeout(() => {
      state.scheduled = state.scheduled.filter(x => x !== id);
      fn();
    }, scaled(delay));
    state.scheduled.push(id);
    return id;
  }

  function clearScheduled() {
    state.scheduled.forEach(clearTimeout);
    state.scheduled = [];
  }

  function stopIntervals() {
    if (state.walkingTimer) clearInterval(state.walkingTimer);
    if (state.profileTimer) clearInterval(state.profileTimer);
    if (state.endingCountdownTimer) clearInterval(state.endingCountdownTimer);
    if (state.jumpRaf) cancelAnimationFrame(state.jumpRaf);
    state.walkingTimer = null;
    state.profileTimer = null;
    state.endingCountdownTimer = null;
    state.jumpRaf = 0;
    state.walking = false;
    state.jumpCharging = false;
  }

  function resetAsync() {
    clearScheduled();
    stopIntervals();
    state.touchActive = false;
    els.thumbOverlay.style.opacity = '0';
    els.thumbOverlay.classList.remove('is-pressing');
    els.arView.classList.remove('is-walking');
  }

  function showScreen(id) {
    screens().forEach(screen => screen.classList.toggle('active', screen.id === id));
  }

  function showMonologue(text, duration = 2200) {
    els.monologueText.textContent = text;
    els.monologue.classList.add('show');
    clearTimeout(state.monologueTimer);
    state.monologueTimer = setTimeout(() => els.monologue.classList.remove('show'), scaled(duration));
  }

  function hideMonologue() {
    clearTimeout(state.monologueTimer);
    els.monologue.classList.remove('show');
  }

  function buildCards() {
    state.cards = profiles.map(item => ({ ...item }));
    state.currentCardIndex = 0;
    renderCurrentCard();
  }

  function currentCard() {
    return state.cards[state.currentCardIndex] || null;
  }

  function renderCurrentCard() {
    const card = currentCard();
    if (!card) return;
    els.profileCard.style.opacity = '1';
    els.profileCard.style.transform = 'translate3d(0,0,0) rotate(0deg)';
    els.profileCard.classList.toggle('creepy', !!card.creepy);
    els.profileCard.classList.toggle('normal', !card.creepy);
    els.creepySilhouette.classList.toggle('hidden', !card.creepy);
    els.cardName.textContent = card.name;
    els.cardMeta.innerHTML = card.meta.replace(/\n/g, '<br>');
    els.cardTags.innerHTML = card.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
    els.deckCounter.textContent = `${Math.min(state.currentCardIndex + 1, state.cards.length)} / ${state.cards.length}`;
  }

  function bounceCard() {
    els.profileCard.style.transition = 'transform .28s cubic-bezier(.2,.85,.2,1.2), opacity .2s ease';
    els.profileCard.style.transform = 'translate3d(0,0,0) rotate(0deg)';
    els.profileCard.style.opacity = '1';
    schedule(() => { els.profileCard.style.transition = ''; }, 320);
  }

  function swipeAway(direction) {
    const x = direction === 'left' ? -420 : 420;
    els.profileCard.style.transform = `translate3d(${x}px,0,0) rotate(${direction === 'left' ? -18 : 18}deg)`;
    els.profileCard.style.opacity = '0';
    schedule(() => {
      state.currentCardIndex += 1;
      renderCurrentCard();
    }, 180);
  }

  function openMatchStage() {
    showScreen('screen-match');
    schedule(() => showScreen('screen-chat'), 680);
  }

  function processCardSwipe(direction) {
    const card = currentCard();
    if (!card) return;
    if (card.creepy && direction === 'left') {
      showMonologue('这个人还怪特别的，不如匹配一下试试...');
      bounceCard();
      return;
    }
    if (card.creepy && direction === 'right') {
      openMatchStage();
      return;
    }
    swipeAway(direction);
  }

  function attachCardGesture() {
    const down = event => {
      if (!currentCard()) return;
      state.draggingCard = true;
      state.dragStartX = event.clientX;
      state.dragCurrentX = 0;
      els.profileCard.setPointerCapture?.(event.pointerId);
    };
    const move = event => {
      if (!state.draggingCard) return;
      state.dragCurrentX = event.clientX - state.dragStartX;
      els.profileCard.style.transform = `translate3d(${state.dragCurrentX}px,0,0) rotate(${state.dragCurrentX / 24}deg)`;
    };
    const up = event => {
      if (!state.draggingCard) return;
      state.draggingCard = false;
      els.profileCard.releasePointerCapture?.(event.pointerId);
      if (Math.abs(state.dragCurrentX) > 90) processCardSwipe(state.dragCurrentX < 0 ? 'left' : 'right');
      else bounceCard();
    };
    els.profileCard.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  function updateDistanceUi() {
    const distance = Math.max(0, Math.round(state.distance));
    els.arDistNum.textContent = String(distance);
    els.bottomDist.textContent = distance >= 1000 ? `${(distance / 1000).toFixed(2)} km` : `${distance} 米`;
    const minutes = Math.max(1, Math.ceil(distance / 84));
    els.bottomTime.textContent = `${minutes} 分钟`;
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    els.arrivalTime.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} 到达`;
    const progress = 1 - state.distance / state.totalDistance;
    els.playerArrow.style.bottom = `${23 + progress * 52}%`;
    els.mapRouteFill.style.height = `${Math.max(0, (state.distance / state.totalDistance) * 100)}%`;
  }

  function resetSignState() {
    state.signProgress = 0;
    state.signVisited = new Set();
    els.wipePercent.textContent = '0%';
    els.signText.classList.remove('revealed');
    els.signDirt.style.opacity = '0.98';
    const rect = els.signMask.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    els.signMask.width = Math.max(1, Math.round(rect.width * dpr));
    els.signMask.height = Math.max(1, Math.round(rect.height * dpr));
    const ctx = els.signMask.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = 'rgba(26,19,11,.98)';
    ctx.fillRect(0, 0, rect.width, rect.height);
  }

  function closeEventLayer() {
    els.eventLayer.classList.remove('show');
    els.jumpEvent.classList.add('hidden');
    els.signEvent.classList.add('hidden');
  }

  function openEventLayer(panel) {
    els.eventLayer.classList.add('show');
    els.jumpEvent.classList.add('hidden');
    els.signEvent.classList.add('hidden');
    panel.classList.remove('hidden');
  }

  function resetMapState() {
    state.distance = 3200;
    state.totalDistance = 3200;
    state.jumpDone = false;
    state.signDone = false;
    state.jumpSuccess = null;
    state.profileSequenceStarted = false;
    state.profileDistance = 180;
    els.profileDistance.textContent = '距离：180 米';
    els.profileSignature.textContent = '签名：我快到了，你也一样。';
    els.profileTags.innerHTML = '<span class="profile-tag"># 不要回头</span><span class="profile-tag"># 已同步</span><span class="profile-tag"># 正在接近</span>';
    els.notifyBanner.classList.remove('show');
    closeEventLayer();
    resetSignState();
    updateDistanceUi();
    els.arStatus.textContent = '同步中';
  }

  function startMapStage() {
    resetAsync();
    resetMapState();
    showScreen('screen-map');
    showMonologue('定位成功。你能感觉到它正在前方等你。', 2400);
  }

  function stopWalking() {
    if (state.walkingTimer) clearInterval(state.walkingTimer);
    state.walkingTimer = null;
    state.walking = false;
    els.arView.classList.remove('is-walking');
  }

  function startWalking() {
    if (state.walking || els.eventLayer.classList.contains('show') || state.profileSequenceStarted) return;
    state.walking = true;
    els.arView.classList.add('is-walking');
    state.walkingTimer = setInterval(() => {
      state.distance = Math.max(0, state.distance - 12);
      updateDistanceUi();
      if (!state.jumpDone && state.distance <= 2400) {
        stopWalking();
        openJumpEvent();
        return;
      }
      if (state.jumpDone && !state.signDone && state.distance <= 900) {
        stopWalking();
        openSignEvent();
      }
    }, scaled(80));
  }

  function updateThumbPosition(x, y) {
    const rect = els.app.getBoundingClientRect();
    els.thumbOverlay.style.left = `${x - rect.left}px`;
    els.thumbOverlay.style.top = `${y - rect.top}px`;
  }

  function attachMapGesture() {
    els.touchZone.addEventListener('pointerdown', event => {
      if (!$('#screen-map').classList.contains('active')) return;
      state.touchActive = true;
      state.touchStartY = event.clientY;
      updateThumbPosition(event.clientX, event.clientY);
      els.thumbOverlay.style.opacity = '1';
      event.preventDefault();
    });
    els.touchZone.addEventListener('pointermove', event => {
      if (!state.touchActive) return;
      updateThumbPosition(event.clientX, event.clientY);
      if (event.clientY < state.touchStartY - 15) {
        els.thumbOverlay.classList.add('is-pressing');
        startWalking();
      } else {
        els.thumbOverlay.classList.remove('is-pressing');
        stopWalking();
      }
      event.preventDefault();
    });
    const end = () => {
      state.touchActive = false;
      els.thumbOverlay.style.opacity = '0';
      els.thumbOverlay.classList.remove('is-pressing');
      stopWalking();
    };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  }

  function openJumpEvent() {
    openEventLayer(els.jumpEvent);
    els.chargeFill.style.width = '0%';
    els.jumpStatus.textContent = '';
    els.arStatus.textContent = '前方障碍';
  }

  function jumpLoop() {
    if (!state.jumpCharging) return;
    const elapsed = performance.now() - state.jumpStart;
    const charge = Math.min(100, (elapsed / scaled(1600)) * 100);
    els.chargeFill.style.width = `${charge}%`;
    state.jumpRaf = requestAnimationFrame(jumpLoop);
  }

  function finishJump() {
    if (!state.jumpCharging) return;
    state.jumpCharging = false;
    cancelAnimationFrame(state.jumpRaf);
    state.jumpRaf = 0;
    const percent = parseFloat(els.chargeFill.style.width) || 0;
    const success = percent >= 44 && percent <= 74;
    state.jumpSuccess = success;
    state.jumpDone = true;
    els.jumpStatus.textContent = success ? '完美跳过水坑！' : '哎呀，踩到水坑里了...';
    showMonologue(success ? '还好，没被拖慢。' : '鞋里一下灌进了冷水。', 1800);
    schedule(() => {
      closeEventLayer();
      els.arStatus.textContent = '继续前进';
    }, 1150);
  }

  function attachJumpEvent() {
    els.jumpButton.addEventListener('pointerdown', event => {
      if (els.jumpEvent.classList.contains('hidden')) return;
      event.preventDefault();
      state.jumpCharging = true;
      state.jumpStart = performance.now();
      els.jumpStatus.textContent = '正在蓄力...';
      els.chargeFill.style.width = '0%';
      jumpLoop();
    });
    const end = event => {
      if (event) event.preventDefault();
      finishJump();
    };
    els.jumpButton.addEventListener('pointerup', end);
    els.jumpButton.addEventListener('pointercancel', end);
    els.jumpButton.addEventListener('pointerleave', () => { if (state.jumpCharging) finishJump(); });
  }

  function setSignProgress(percent) {
    state.signProgress = Math.max(0, Math.min(100, Math.round(percent)));
    els.wipePercent.textContent = `${state.signProgress}%`;
    els.signDirt.style.opacity = String(Math.max(0, 0.98 - state.signProgress / 110));
    if (state.signProgress < 100) {
      els.signText.classList.remove('revealed');
      state.signDone = false;
      return;
    }
    if (state.signDone) return;
    state.signDone = true;
    els.signText.classList.add('revealed');
    if (navigator.vibrate) navigator.vibrate(180);
    showMonologue('这是...这是什么鬼！！！我得离开这里！', 2400);
    schedule(() => {
      closeEventLayer();
      els.arStatus.textContent = '资料异常';
      showNotification();
    }, 1350);
  }

  function paintSign(clientX, clientY, radius = 26) {
    const rect = els.signMask.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const ctx = els.signMask.getContext('2d');
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    const g = ctx.createRadialGradient(x, y, 2, x, y, radius);
    g.addColorStop(0, 'rgba(0,0,0,.95)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    const cellX = rect.width / 15;
    const cellY = rect.height / 15;
    const minX = Math.max(0, Math.floor((x - radius) / cellX));
    const maxX = Math.min(14, Math.floor((x + radius) / cellX));
    const minY = Math.max(0, Math.floor((y - radius) / cellY));
    const maxY = Math.min(14, Math.floor((y + radius) / cellY));
    for (let gx = minX; gx <= maxX; gx += 1) {
      for (let gy = minY; gy <= maxY; gy += 1) {
        state.signVisited.add(`${gx}-${gy}`);
      }
    }
    setSignProgress((state.signVisited.size / 225) * 100);
  }

  function openSignEvent() {
    openEventLayer(els.signEvent);
    resetSignState();
    els.arStatus.textContent = '前方路牌';
  }

  function attachSignEvent() {
    els.signMask.addEventListener('pointerdown', event => {
      if (els.signEvent.classList.contains('hidden')) return;
      state.signPointerActive = true;
      paintSign(event.clientX, event.clientY);
      event.preventDefault();
    });
    els.signMask.addEventListener('pointermove', event => {
      if (!state.signPointerActive || state.signDone) return;
      paintSign(event.clientX, event.clientY, 28);
      event.preventDefault();
    });
    const end = () => { state.signPointerActive = false; };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  }

  function showNotification() {
    els.notifyBanner.classList.add('show');
    els.notifyBanner.onclick = openProfileStage;
    schedule(() => {
      if (!state.profileSequenceStarted) openProfileStage();
    }, 2200);
  }

  function openProfileStage() {
    if (state.profileSequenceStarted) return;
    state.profileSequenceStarted = true;
    els.notifyBanner.classList.remove('show');
    showScreen('screen-profile');
    showMonologue('它的资料正在自己改写，像是在朝你靠近。', 2200);
    state.profileDistance = 180;
    els.profileSignature.textContent = `签名：${state.playerName}，别再往后看了。`;
    state.profileTimer = setInterval(() => {
      state.profileDistance = Math.max(0, state.profileDistance - 6);
      els.profileDistance.textContent = state.profileDistance > 0 ? `距离：${state.profileDistance} 米` : '距离：0 米';
      if (state.profileDistance === 0) {
        clearInterval(state.profileTimer);
        state.profileTimer = null;
        schedule(startEndingSequence, 480);
      }
    }, scaled(100));
  }

  function activateEndingLayer(id) {
    ['ending-permission', 'ending-camera', 'ending-desktop', 'ending-final'].forEach(layerId => {
      document.getElementById(layerId).classList.toggle('active', layerId === id);
    });
    els.endingChat.classList.remove('active');
  }

  function resetEndingUi() {
    state.endingCountdown = 3;
    state.endingStarted = false;
    state.focusLocked = false;
    state.desktopShown = false;
    state.handTookOver = false;
    state.finalTitleShown = false;
    els.permissionCopy.innerHTML = `${state.playerName} 想要访问你的相机，<br>以完成同步。`;
    els.allowBtn.textContent = `允许（${state.endingCountdown}）`;
    els.endingCamera.classList.remove('crt-off');
    els.focusBox.style.opacity = '0';
    els.focusBox.style.transform = 'translate(0,0) scale(1)';
    els.focusBox.style.borderColor = '#f5a623';
    els.cameraText.style.opacity = '0';
    els.wechatNotify.classList.remove('show');
    els.ghostHand.classList.remove('visible', 'clicking');
    els.ghostHand.style.left = '50%';
    els.ghostHand.style.top = '120%';
    els.fakeInput.textContent = '';
    els.fakeSend.style.opacity = '.45';
    els.replyMsg.style.opacity = '0';
    els.finalTitle.classList.remove('show');
    activateEndingLayer('ending-permission');
  }

  function beginFocusLock() {
    activateEndingLayer('ending-camera');
    schedule(() => {
      els.focusBox.style.opacity = '1';
      els.focusBox.style.transform = 'translate(26px,-34px) scale(1.25)';
    }, 280);
    schedule(() => {
      els.focusBox.style.transform = 'translate(-22px,38px) scale(.82)';
    }, 980);
    schedule(() => {
      els.focusBox.style.transform = 'translate(0,0) scale(1)';
      els.focusBox.style.borderColor = '#50e3c2';
      els.cameraText.style.opacity = '1';
      state.focusLocked = true;
    }, 1680);
    schedule(() => {
      els.endingCamera.classList.add('crt-off');
    }, 2640);
    schedule(() => {
      activateEndingLayer('ending-desktop');
      state.desktopShown = true;
      startTakeover();
    }, 3900);
  }

  function proceedEndingPermission() {
    if (state.endingStarted) return;
    state.endingStarted = true;
    if (state.endingCountdownTimer) {
      clearInterval(state.endingCountdownTimer);
      state.endingCountdownTimer = null;
    }
    beginFocusLock();
  }

  function startEndingCountdown() {
    els.allowBtn.textContent = `允许（${state.endingCountdown}）`;
    state.endingCountdownTimer = setInterval(() => {
      state.endingCountdown -= 1;
      if (state.endingCountdown <= 0) {
        clearInterval(state.endingCountdownTimer);
        state.endingCountdownTimer = null;
        proceedEndingPermission();
      } else {
        els.allowBtn.textContent = `允许（${state.endingCountdown}）`;
      }
    }, scaled(1000));
  }

  function startEndingSequence() {
    resetAsync();
    showScreen('screen-ending');
    resetEndingUi();
    startEndingCountdown();
  }

  function startTakeover() {
    schedule(() => { els.wechatNotify.classList.add('show'); }, 480);
    schedule(() => {
      els.ghostHand.classList.add('visible');
      els.ghostHand.style.top = '70px';
      state.handTookOver = true;
    }, 980);
    schedule(() => { els.ghostHand.classList.add('clicking'); }, 1620);
    schedule(() => {
      els.ghostHand.classList.remove('clicking');
      activateEndingLayer('ending-desktop');
      els.endingChat.classList.add('active');
      els.ghostHand.style.top = '92%';
      els.ghostHand.style.left = '28%';
    }, 1880);
    schedule(() => {
      els.ghostHand.classList.add('clicking');
      els.fakeInput.textContent = '快到了，在路上。';
      els.fakeSend.style.opacity = '1';
    }, 2480);
    schedule(() => { els.ghostHand.classList.remove('clicking'); }, 2720);
    schedule(() => {
      els.ghostHand.style.left = '85%';
      els.ghostHand.style.top = '92%';
    }, 3040);
    schedule(() => {
      els.ghostHand.classList.add('clicking');
      els.fakeInput.textContent = '';
      els.replyMsg.style.opacity = '1';
    }, 3660);
    schedule(() => { els.ghostHand.classList.remove('clicking'); }, 3860);
    schedule(() => {
      activateEndingLayer('ending-final');
      els.ghostHand.classList.remove('visible');
    }, 4580);
    schedule(() => {
      els.finalTitle.classList.add('show');
      state.finalTitleShown = true;
    }, 5260);
  }

  function processHandCutout(img) {
    if (!img || img.dataset.cutoutDone === '1') return;
    const apply = () => {
      const canvas = document.createElement('canvas');
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      if (!w || !h) return;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (avg > 170) data[i + 3] = 0;
        else {
          data[i] = 0;
          data[i + 1] = 0;
          data[i + 2] = 0;
          data[i + 3] = 255;
        }
      }
      ctx.putImageData(imageData, 0, 0);
      img.dataset.cutoutDone = '1';
      img.src = canvas.toDataURL('image/png');
    };
    if (img.complete) apply();
    else img.addEventListener('load', apply, { once: true });
  }

  function setupHandCutouts() {
    document.querySelectorAll('.hand-cutout').forEach(processHandCutout);
  }

  function cacheEls() {
    Object.assign(els, {
      app: $('#app'),
      monologue: $('#monologue'), monologueText: $('#monologue-text'),
      profileCard: $('#profile-card'), creepySilhouette: $('#creepy-silhouette'), deckCounter: $('#deck-counter'),
      cardName: $('#card-name'), cardMeta: $('#card-meta'), cardTags: $('#card-tags'),
      addressLink: $('#address-link'),
      arView: $('#ar-view'), arStatus: $('#ar-status'), touchZone: $('#touch-zone'), thumbOverlay: $('#thumb-overlay'),
      arDistNum: $('#ar-dist-num'), bottomDist: $('#bottom-dist'), bottomTime: $('#bottom-time'), arrivalTime: $('#arrival-time'),
      playerArrow: $('#player-arrow'), mapRouteFill: $('#map-route-fill'), notifyBanner: $('#notify-banner'),
      eventLayer: $('#event-layer'), jumpEvent: $('#jump-event'), signEvent: $('#sign-event'),
      jumpButton: $('#jump-button'), chargeFill: $('#charge-fill'), jumpStatus: $('#jump-status'),
      signMask: $('#sign-mask'), signText: $('#sign-hidden-text'), signDirt: $('#sign-dirt'), wipePercent: $('#wipe-percent'),
      profileDistance: $('#profile-distance'), profileSignature: $('#profile-signature'), profileTags: $('#profile-tags'),
      permissionCopy: $('#permission-copy'), allowBtn: $('#allow-btn'), endingCamera: $('#ending-camera'),
      focusBox: $('#focus-box'), cameraText: $('#camera-text'), wechatNotify: $('#wechat-notify'),
      ghostHand: $('#ghost-hand'), endingChat: $('#ending-chat'), fakeInput: $('#fake-input'), fakeSend: $('#fake-send'),
      replyMsg: $('#reply-msg'), finalTitle: $('#final-title'),
      thumbIdle: $('#thumb-idle')
    });
  }

  function bindUi() {
    $('#start-btn').addEventListener('click', () => {
      state.playerName = $('#player-name').value.trim() || '玩家';
      buildCards();
      showScreen('screen-swiper');
      hideMonologue();
    });
    els.addressLink.addEventListener('click', startMapStage);
    $('#profile-enter').addEventListener('click', () => showMonologue('距离还在继续缩短。', 1600));
    els.allowBtn.addEventListener('click', proceedEndingPermission);
    attachCardGesture();
    attachMapGesture();
    attachJumpEvent();
    attachSignEvent();
  }

  function exposeTestApi() {
    window.__gameTestAPI = {
      resetForTest(name = '测试用户') {
        state.playerName = name;
        resetAsync();
        buildCards();
        showScreen('screen-swiper');
        resetMapState();
        resetEndingUi();
      },
      showMonologueForTest(text) { showMonologue(text, 10000); },
      getMonologueText() { return els.monologueText.textContent || ''; },
      getThumbState() {
        return {
          hasAssetThumb: !!els.thumbOverlay.querySelector('img') && !!els.thumbIdle,
          hasNoGuideBubble: !document.getElementById('thumb-text')
        };
      },
      swipeCreepyLeftForTest() {
        state.currentCardIndex = 3;
        renderCurrentCard();
        processCardSwipe('left');
      },
      swipeCreepyRightForTest() {
        state.currentCardIndex = 3;
        renderCurrentCard();
        processCardSwipe('right');
      },
      startMapForTest() { startMapStage(); },
      getMapState() {
        return {
          hasArView: !!els.arView,
          hasMapView: !!document.querySelector('.map-view'),
          hasTouchZone: !!els.touchZone,
          hasThumbOverlay: !!els.thumbOverlay,
        };
      },
      getDistance() { return state.distance; },
      startWalkingForTest() { startWalking(); },
      stopWalkingForTest() { stopWalking(); },
      openSignEventForTest() { showScreen('screen-map'); openSignEvent(); },
      getSignState() {
        return { progress: state.signProgress, textVisible: els.signText.classList.contains('revealed') };
      },
      scrubSignForTest(percent) { showScreen('screen-map'); openSignEvent(); setSignProgress(percent); },
      usesRealCamera() { return false; },
      triggerEndingForTest() { startEndingSequence(); },
      clickAllowForTest() { proceedEndingPermission(); },
      getEndingState() {
        return {
          permissionVisible: document.getElementById('ending-permission').classList.contains('active'),
          allowButtonCount: document.querySelectorAll('#ending-permission .allow-btn').length,
          focusLocked: state.focusLocked,
          desktopShown: state.desktopShown,
          handTookOver: state.handTookOver,
          finalTitleShown: state.finalTitleShown,
        };
      }
    };
  }

  function init() {
    const params = new URLSearchParams(window.location.search);
    state.testMode = params.get('test') === '1';
    state.timingScale = state.testMode ? 0.3 : 1;
    cacheEls();
    buildCards();
    bindUi();
    setupHandCutouts();
    updateDistanceUi();
    exposeTestApi();
  }

  window.addEventListener('load', init, { once: true });
})();
