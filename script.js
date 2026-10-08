// ローカルストレージのキー
const STORAGE_KEY = 'quit_smoking_data';

// デフォルトデータ構造
let appData = {
    startDate: null,
    prePaperPrice: 0,
    prePaperCount: 0,
    preVapePrice: 0,
    preVapeCount: 0,
    dailyRecords: {}, // {"YYYY-MM-DD": {paper: 0, vape: 0}}
    failHistory: []
};

// カレンダーの状態
let currentDate = new Date();
let selectedDateString = "";

// 初期化
window.onload = () => {
    loadData();
    if (!appData.startDate) {
        // 初回起動時はキャンセルボタンを隠す
        document.getElementById('close-setup-btn').style.display = 'none';
        document.getElementById('setup-modal').classList.remove('hidden');
    } else {
        updateSummary();
        renderCalendar();
    }
};

// データの読み込み
function loadData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        appData = JSON.parse(saved);
    }
}

// データの保存
function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    updateSummary();
    renderCalendar();
}

// ⚙️ 設定ボタンを開く処理
document.getElementById('open-setup-btn').onclick = () => {
    // 既存のデータがあれば入力欄にセットしておく
    if (appData.startDate) {
        document.getElementById('start-date').value = appData.startDate;
        document.getElementById('pre-paper-price').value = appData.prePaperPrice;
        document.getElementById('pre-paper-count').value = appData.prePaperCount;
        document.getElementById('pre-vape-price').value = appData.preVapePrice;
        document.getElementById('pre-vape-count').value = appData.preVapeCount;
        // 既に設定済みなのでキャンセルボタンを表示
        document.getElementById('close-setup-btn').style.display = 'block';
    }
    document.getElementById('setup-modal').classList.remove('hidden');
};

// 設定のキャンセル（閉じる）
document.getElementById('close-setup-btn').onclick = () => {
    document.getElementById('setup-modal').classList.add('hidden');
};

// 初期設定の保存
document.getElementById('save-setup-btn').addEventListener('click', () => {
    appData.startDate = document.getElementById('start-date').value;
    appData.prePaperPrice = Number(document.getElementById('pre-paper-price').value) || 0;
    appData.prePaperCount = Number(document.getElementById('pre-paper-count').value) || 0;
    appData.preVapePrice = Number(document.getElementById('pre-vape-price').value) || 0;
    appData.preVapeCount = Number(document.getElementById('pre-vape-count').value) || 0;
    
    if(!appData.startDate) {
        alert("開始日を入力してください");
        return;
    }
    document.getElementById('setup-modal').classList.add('hidden');
    saveData();
});

// サマリー（日数と金額）の更新
function updateSummary() {
    if (!appData.startDate) return;

    const start = new Date(appData.startDate);
    const today = new Date();
    // 経過日数（当日を1日目とするため +1）
    const diffTime = today - start;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    document.getElementById('days-count').textContent = diffDays > 0 ? diffDays : 0;

    // 本来吸うはずだった金額
    const dailyCost = (appData.prePaperPrice * appData.prePaperCount) + (appData.preVapePrice * appData.preVapeCount);
    const expectedTotalCost = (diffDays > 0 ? diffDays : 0) * dailyCost;

    // 実際に吸ってしまった金額
    let actualSpent = 0;
    for (let date in appData.dailyRecords) {
        const record = appData.dailyRecords[date];
        actualSpent += (record.paper * appData.prePaperPrice) + (record.vape * appData.preVapePrice);
    }

    const savedMoney = expectedTotalCost - actualSpent;
    document.getElementById('saved-money').textContent = `¥${savedMoney.toLocaleString()}`;
}

// カレンダーの描画
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    document.getElementById('current-month-year').textContent = `${year}年 ${month + 1}月`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const calendarBody = document.getElementById('calendar-body');
    calendarBody.innerHTML = '';

    for (let i = 0; i < firstDay; i++) {
        calendarBody.appendChild(document.createElement('div'));
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        
        const dateNum = document.createElement('span');
        dateNum.className = 'date-num';
        dateNum.textContent = day;
        dayDiv.appendChild(dateNum);

        if (appData.dailyRecords[dateString]) {
            const record = appData.dailyRecords[dateString];
            if(record.paper > 0 || record.vape > 0) {
                const badge = document.createElement('div');
                badge.className = 'record-badge';
                badge.textContent = `紙${record.paper}/電${record.vape}`;
                dayDiv.appendChild(badge);
            }
        }

        const addBtn = document.createElement('button');
        addBtn.className = 'add-btn';
        addBtn.textContent = '+';
        addBtn.onclick = () => openRecordModal(dateString);
        dayDiv.appendChild(addBtn);

        calendarBody.appendChild(dayDiv);
    }
}

// 月の切り替え
document.getElementById('prev-month').onclick = () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
};
document.getElementById('next-month').onclick = () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
};

// 記録モーダルを開く
function openRecordModal(dateStr) {
    selectedDateString = dateStr;
    document.getElementById('modal-date-title').textContent = `${dateStr} の記録`;
    
    const record = appData.dailyRecords[dateStr] || { paper: 0, vape: 0 };
    document.getElementById('paper-count').value = record.paper;
    document.getElementById('vape-count').value = record.vape;
    
    document.getElementById('record-modal').classList.remove('hidden');
}

// 記録を保存
document.getElementById('save-record-btn').onclick = () => {
    const paper = Number(document.getElementById('paper-count').value) || 0;
    const vape = Number(document.getElementById('vape-count').value) || 0;
    
    appData.dailyRecords[selectedDateString] = { paper, vape };
    saveData();
    document.getElementById('record-modal').classList.add('hidden');
};

// 記録をキャンセル
document.getElementById('close-modal-btn').onclick = () => {
    document.getElementById('record-modal').classList.add('hidden');
};

// リセット機能
document.getElementById('reset-btn').onclick = () => {
    if(confirm('本当にリセットしますか？これまでの日数は履歴として保存されます。')) {
        const days = document.getElementById('days-count').textContent;
        appData.failHistory.push({
            endDate: new Date().toISOString().split('T')[0],
            achievedDays: Number(days)
        });
        
        appData.startDate = null;
        appData.dailyRecords = {};
        saveData();
        
        document.getElementById('close-setup-btn').style.display = 'none';
        document.getElementById('setup-modal').classList.remove('hidden');
        document.getElementById('days-count').textContent = '0';
        document.getElementById('saved-money').textContent = '¥0';
    }
};