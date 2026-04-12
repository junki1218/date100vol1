const gameState = {
    currentStage: 1,
    stage1Counts: {},
    totalOrdersProcessed: 0,
    isSkipUnlocked: false
};

function resetGameState() {
    appData.stage1.menus.forEach(m => {
        gameState.stage1Counts[m.id] = 0;
    });
    gameState.totalOrdersProcessed = 0;
}

// HTML用のアイコン生成
function createIconHTML(menu) {
    if (menu.image) {
        return `<img src="${menu.image}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit; pointer-events:none;" alt="${menu.name}">`;
    } else {
        return `<span style="pointer-events:none;">${menu.emoji}</span>`;
    }
}

// Web Speech API
function speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 1.5;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
}

function showMessage(text, doSpeak = true) {
    document.getElementById('message-text').innerText = text;
    if (doSpeak) speak(text);
}

function formatMenuName(id) {
    const menu = appData.stage1.menus.find(m => m.id === id);
    return menu ? menu.name : id;
}

// 初期化コールバック
window.onload = () => {
    initSettingsModal();
    initGraphTabs();
    initResetBtn();
    initSkipButton();
    initToggleButtons();
    
    ChartEngine.setContainer(document.getElementById('graph-render-area'));
    
    startGame();
};

function startGame() {
    resetGameState();
    
    // UI reseting
    document.getElementById('character').innerText = "👩‍🍳";
    const actionBtn = document.getElementById('action-btn');
    actionBtn.innerText = "判定する";
    actionBtn.classList.add('disabled');
    actionBtn.onclick = null;

    // Skip button reset
    gameState.isSkipUnlocked = false;

    // Visibility toggles reset
    document.getElementById('table-body').classList.remove('counts-hidden');
    document.getElementById('graph-render-area').classList.remove('graph-hidden');
    document.getElementById('toggle-counts-btn').innerText = '👁️';
    document.getElementById('toggle-graph-btn').innerText = '👁️';
    
    // グラフの初期化
    const activeTab = document.querySelector('.graph-tab.active');
    const type = activeTab ? activeTab.dataset.type : 'bar';
    ChartEngine.switchType(type, appData.stage1.menus);
    refreshTable();
    
    initStage1();
    setTimeout(() => {
        showMessage("まずは注文をタッチしてね！一気に100個集計するよ！");
    }, 500);
}

function initResetBtn() {
    document.getElementById('reset-btn').onclick = () => {
        generateRandomOrders();
        startGame();
        showMessage("データをリセットしたよ！もう一度はじめよう！", true);
    };
}

function initSkipButton() {
    const skipBtn = document.getElementById('skip-btn');
    const passwordModal = document.getElementById('password-modal');
    const passwordInput = document.getElementById('password-input');
    const unlockBtn = document.getElementById('password-unlock-btn');
    const cancelBtn = document.getElementById('password-cancel-btn');

    const openPasswordModal = () => {
        if (gameState.totalOrdersProcessed < 100) {
            passwordInput.value = '';
            passwordModal.classList.add('active');
        }
    };

    skipBtn.onclick = () => {
        if (gameState.isSkipUnlocked) {
            skip10Orders();
        } else {
            openPasswordModal();
        }
    };

    unlockBtn.onclick = () => {
        if (passwordInput.value === 'kameda1218') {
            gameState.isSkipUnlocked = true;
            passwordModal.classList.remove('active');
            showMessage("ロックが解除されました。「10個スキップ」ボタンが使えます。", true);
        } else {
            alert('パスワードが違います。');
            passwordInput.value = '';
        }
    };

    cancelBtn.onclick = () => {
        passwordModal.classList.remove('active');
    };
}

function initToggleButtons() {
    const toggleCountsBtn = document.getElementById('toggle-counts-btn');
    const toggleGraphBtn = document.getElementById('toggle-graph-btn');
    const tableBody = document.getElementById('table-body');
    const graphRenderArea = document.getElementById('graph-render-area');

    toggleCountsBtn.onclick = () => {
        const isHidden = tableBody.classList.toggle('counts-hidden');
        toggleCountsBtn.innerText = isHidden ? '🙈' : '👁️';
    };

    toggleGraphBtn.onclick = () => {
        const isHidden = graphRenderArea.classList.toggle('graph-hidden');
        toggleGraphBtn.innerText = isHidden ? '🙈' : '👁️';
    };
}

function skip10Orders() {
    if (gameState.totalOrdersProcessed >= 100) {
        showMessage("もう100個集計済みだよ！", false);
        return;
    }

    const unprocessedCards = document.querySelectorAll('.order-card:not(.processed)');
    const cardsToProcess = Array.from(unprocessedCards).slice(0, 10);

    if (cardsToProcess.length === 0) {
        showMessage("もう数えるカードがないよ。", false);
        return;
    }

    cardsToProcess.forEach((card, index) => {
        // 10個まとめて処理する場合、毎回音声が再生されるとうるさいので、最後の1回だけ再生するか、全く再生しない
        // ここでは、音声は再生しない(false)設定でprocessOrderCardを呼び出す
        processOrderCard(card, false);
    });

    // 処理が終わった後にまとめてメッセージを出す
    setTimeout(() => {
        showMessage(`${cardsToProcess.length}個の注文をまとめて処理しました！`, true);
    }, 650); // processOrderCard内のsetTimeoutより少し長く待つ
}

function initGraphTabs() {
    const tabs = document.querySelectorAll('.graph-tab');
    tabs.forEach(tab => {
        tab.onclick = (e) => {
            if(e.target.classList.contains('active')) return;
            
            tabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            
            const type = e.target.dataset.type;
            ChartEngine.switchType(type, appData.stage1.menus, gameState.stage1Counts);
            
            // 完了後の場合、棒グラフに戻したときのためにクリックイベントを再登録
            if (gameState.totalOrdersProcessed >= 100 && type === 'bar') {
                appData.stage1.menus.forEach(menu => {
                    const wrapper = document.getElementById(`bar-wrapper-${menu.id}`);
                    if(wrapper) {
                        wrapper.classList.add('selectable');
                        wrapper.onclick = () => guessMostPopular(menu.id);
                    }
                });
            }
        }
    });
}

// 設定モーダルの制御
function initSettingsModal() {
    const btn = document.getElementById('settings-btn');
    const modal = document.getElementById('settings-modal');
    const saveBtn = document.getElementById('settings-save-btn');
    const list = document.getElementById('settings-list');
    
    btn.onclick = () => {
        renderSettingsList(list);
        modal.classList.add('active');
    };
    
    saveBtn.onclick = () => {
        modal.classList.remove('active');
        generateRandomOrders();
        startGame();
        showMessage("設定を新しくしてリスタートしたよ！さあタッチしてね！");
    };
}

function renderSettingsList(container) {
    container.innerHTML = '';
    appData.stage1.menus.forEach(menu => {
        const row = document.createElement('div');
        row.className = 'setting-row';
        row.innerHTML = `
            <div class="setting-preview" id="preview-${menu.id}">
                ${createIconHTML(menu)}
            </div>
            <div class="setting-inputs">
                <input type="text" id="name-${menu.id}" value="${menu.name}">
                <input type="file" id="file-${menu.id}" accept="image/*">
            </div>
        `;
        container.appendChild(row);
        
        document.getElementById(`name-${menu.id}`).onchange = (e) => {
            menu.name = e.target.value;
        };
        document.getElementById(`file-${menu.id}`).onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const url = URL.createObjectURL(file);
                menu.image = url;
                document.getElementById(`preview-${menu.id}`).innerHTML = createIconHTML(menu);
            }
        };
    });
}

// ステージ1のカード配置
function initStage1() {
    const orderArea = document.getElementById('order-area');
    orderArea.innerHTML = '';
    
    let shuffledOrders = [...appData.stage1.orders].sort(() => Math.random() - 0.5);
    
    shuffledOrders.forEach((orderId, index) => {
        const menu = appData.stage1.menus.find(m => m.id === orderId);
        const div = document.createElement('div');
        div.className = 'order-card';
        div.innerHTML = createIconHTML(menu);
        div.dataset.id = orderId;
        div.dataset.index = index;
        
        div.addEventListener('click', handleOrderClick);
        orderArea.appendChild(div);
    });
}

function refreshTable() {
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = '';
    
    appData.stage1.menus.forEach(menu => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="table-icon">${createIconHTML(menu)}</div>
                ${menu.name}
            </td>
            <td id="count-${menu.id}">0</td>
        `;
        tableBody.appendChild(tr);
    });
}

function handleOrderClick(e) {
    processOrderCard(e.currentTarget);
}

function processOrderCard(card, doSpeak = true) {
    if (!card || card.classList.contains('processed')) return;
    
    const orderId = card.dataset.id;
    card.classList.add('fly-away');
    card.classList.add('processed');
    
    if(doSpeak) speak(formatMenuName(orderId));
    updateData(orderId);
    
    setTimeout(() => {
        card.style.display = 'none';
        checkStage1Completion();
    }, 600); 
}

function updateData(orderId) {
    gameState.stage1Counts[orderId]++;
    gameState.totalOrdersProcessed++;
    
    const countEl = document.getElementById(`count-${orderId}`);
    if (countEl) countEl.innerText = gameState.stage1Counts[orderId];
    
    ChartEngine.update(gameState.stage1Counts, appData.stage1.menus);
}

function checkStage1Completion() {
    if (gameState.totalOrdersProcessed >= 100) {
        showMessage("100個集計できたね！いろんなグラフを切り替えて、「一番高いグラフ」をタッチしてね！");
        
        const actionBtn = document.getElementById('action-btn');
        actionBtn.classList.remove('disabled');
        actionBtn.onclick = () => showFinalQuestion();
        
        // 現在が棒グラフなら選択可能にする
        if (ChartEngine.currentType === 'bar') {
            appData.stage1.menus.forEach(menu => {
                const wrapper = document.getElementById(`bar-wrapper-${menu.id}`);
                if(wrapper) {
                    wrapper.classList.add('selectable');
                    wrapper.style.cursor = 'pointer';
                    wrapper.onclick = () => guessMostPopular(menu.id);
                }
            });
        }
    }
}

function showFinalQuestion() {
    showMessage("一番人気だと思うものを、表の行をつたって選んでみてね！");
    // 全グラフ共通で確実に回答できるように、表の行をクリック可能にする
    appData.stage1.menus.forEach(menu => {
        const tdCount = document.getElementById(`count-${menu.id}`);
        if(tdCount) {
            const tr = tdCount.parentElement;
            tr.style.cursor = 'pointer';
            tr.style.backgroundColor = '#fff3cd';
            tr.onclick = () => guessMostPopular(menu.id);
        }
    });
}

function guessMostPopular(clickedId) {
    let maxId = "";
    let maxVal = -1;
    for (let [id, val] of Object.entries(gameState.stage1Counts)) {
        if (val > maxVal) {
            maxVal = val;
            maxId = id;
        }
    }
    
    if (gameState.stage1Counts[clickedId] === maxVal) {
        const menuName = formatMenuName(clickedId);
        showMessage(`大正解！${menuName}が${maxVal}人で一番人気だね！いろんなグラフで見てみると見え方が変わるね！`);
        document.getElementById('action-btn').innerText = "次へ";
        document.getElementById('action-btn').onclick = goToStage2;
        
        document.getElementById('character').classList.add('happy');
        setTimeout(() => document.getElementById('character').classList.remove('happy'), 2000);
        
        document.getElementById('character').innerText = ""; // Clear for image if any text remains
        document.getElementById('character').innerHTML = `<img src="アイコン/chef.png" style="width:100%; height:100%; object-fit:contain;" alt="シェフ">`;
    } else {
        showMessage("うーん、違うみたい。一番数が多いのはどれかな？");
    }
}

function goToStage2() {
    showMessage("Stage 2 の準備中です！");
}
