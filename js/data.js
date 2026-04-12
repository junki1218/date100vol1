const appData = {
    stage1: {
        menus: [
            // アクセシビリティに配慮したパステル系の見分けやすい色分け
            { id: "item1", name: "カレー", emoji: "🍛", image: "アイコン/curry.png", color: "#FFB3BA" }, // ピンク
            { id: "item2", name: "ジュース", emoji: "🍹", image: "アイコン/juice.png", color: "#BAFFC9" }, // 薄緑
            { id: "item3", name: "うどん", emoji: "🍜", image: "アイコン/udon.png", color: "#BAE1FF" }, // 薄青
            { id: "item4", name: "バーガー", emoji: "🍔", image: "アイコン/burger.png", color: "#FFFFBA" }, // 薄黄
            { id: "item5", name: "アイス", emoji: "🍦", image: "アイコン/icecream.png", color: "#E8BAFF" }  // 薄紫
        ],
        orders: []
    }
};

// ランダムに100個のデータを作成
function generateRandomOrders() {
    appData.stage1.orders = [];
    const numMenus = appData.stage1.menus.length;
    let weights = Array(numMenus).fill(5); // 最低5個
    let remaining = 100 - (5 * numMenus); // 残り75個
    
    // 残り75個をランダムに振り分け
    for (let i = 0; i < remaining; i++) {
        weights[Math.floor(Math.random() * numMenus)]++;
    }
    
    // ordersに詰め込む
    weights.forEach((w, index) => {
        for(let i = 0; i < w; i++) {
            appData.stage1.orders.push(appData.stage1.menus[index].id);
        }
    });
}

generateRandomOrders();
