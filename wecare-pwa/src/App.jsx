import React, { useState, useEffect, useMemo } from 'react';
import { 
  Phone, Check, ShoppingBag, User, CalendarDays, 
  MapPin, Trash2, ChevronRight, ArrowLeft, Receipt, 
  BookOpen, Activity, Leaf, Flame, Snowflake, Wind, 
  ShieldAlert, CheckSquare, Sparkles, Layers, Info, Soup, Apple, HeartPulse
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';

// ==========================================
// 🚀 Firebase 設定 (使用你的環境)
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyBs-iuaxif5Ruol0o95bvPHG7sAeBPIZCI",
  authDomain: "wecare-db-257a2.firebaseapp.com",
  projectId: "wecare-db-257a2",
  storageBucket: "wecare-db-257a2.firebasestorage.app",
  messagingSenderId: "9382815598",
  appId: "1:9382815598:web:0204da895acae71ba5037f"
};

let db;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase 初始化失敗", e);
}

// ==========================================
// ⚙️ 系統常數 & 日期工具
// ==========================================
const TEXTURES = ['正', '碎', '免治', '分糊', '全糊'];
const MEALS = ['A', 'B', 'C'];

const getMinDate = () => { const d = new Date(); d.setDate(d.getDate() + 3); return d; };
const generateUpcomingDates = (days = 30) => {
  const dates = []; let current = getMinDate();
  for (let i = 0; i < days; i++) { dates.push(new Date(current)); current.setDate(current.getDate() + 1); }
  return dates;
};
const formatDate = (date) => date.toISOString().split('T')[0];
const formatDisplayDate = (dateStr) => {
  const d = new Date(dateStr);
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  return `${d.getMonth() + 1}月${d.getDate()}日 (${days[d.getDay()]})`;
};

// ==========================================
// 🥗 模擬數據 (Firebase 失敗時的後備)
// ==========================================
const FALLBACK_MENUS = {
  0: { A: { name: '南瓜蒸排骨', rec: ['A', 'B', 'C'] }, B: { name: '冬菇蒸滑雞', rec: ['A', 'B', 'H'] }, C: { name: '羅漢齋 (素)', rec: ['E', 'F', 'D'] } },
  1: { A: { name: '番茄炒蛋', rec: ['A', 'D', 'H'] }, B: { name: '梅菜扣肉', rec: ['A', 'C'] }, C: { name: '清炒菜心', rec: ['A', 'E', 'F', 'G'] } },
  2: { A: { name: '洋蔥豬扒', rec: ['A', 'C', 'G'] }, B: { name: '肉餅蒸水蛋', rec: ['A', 'B', 'D'] }, C: { name: '南乳齋煲', rec: ['A', 'C', 'E'] } },
  3: { A: { name: '西芹炒雞柳', rec: ['A', 'G', 'H'] }, B: { name: '煎釀三寶', rec: ['A', 'E'] }, C: { name: '蒜蓉西蘭花', rec: ['A', 'D', 'F'] } },
};

const FALLBACK_BLOGS = [
  { id: 1, title: "立秋後必飲！中醫推介潤燥湯水", category: "節氣養生", date: "2023-08-15", summary: "踏入初秋，天氣漸漸乾燥，容易出現乾咳、皮膚痕癢等「秋燥」症狀...", content: "秋季養生首重「滋陰潤燥」。\n\n1. 雪梨雪耳南北杏瘦肉湯：潤肺止咳。\n2. 百合蓮子沙參玉竹湯：寧心安神。\n建議每星期飲用1-2次。" },
  { id: 2, title: "為什麼你總是覺得累？認識「氣虛」", category: "體質百科", date: "2023-07-22", summary: "明明睡滿8小時，但起床依然覺得疲倦？行幾步樓梯就氣喘...", content: "氣虛是指人體元氣不足。\n\n特徵：說話不夠氣、容易出汗。\n調理建議：多吃淮山、紅薯，避免過度勞累。" }
];

// ==========================================
// 🩺 體質資料庫 (15題完整版)
// ==========================================
const CONSTITUTIONS = {
  A: { id: 'A', name: "平和質", tag: "健康寶寶", color: "text-emerald-700", bg: "bg-emerald-50", icon: Leaf },
  B: { id: 'B', name: "氣虛質", tag: "容易疲倦", color: "text-stone-600", bg: "bg-stone-100", icon: Activity },
  C: { id: 'C', name: "陽虛質", tag: "畏寒怕冷", color: "text-sky-700", bg: "bg-sky-50", icon: Snowflake },
  D: { id: 'D', name: "陰虛質", tag: "缺水乾柴", color: "text-orange-700", bg: "bg-orange-50", icon: Flame },
  E: { id: 'E', name: "痰濕質", tag: "易肥體質", color: "text-amber-700", bg: "bg-amber-50", icon: Layers },
  F: { id: 'F', name: "濕熱質", tag: "又油又濕", color: "text-red-700", bg: "bg-red-50", icon: Flame },
  G: { id: 'G', name: "血瘀質", tag: "循環阻塞", color: "text-purple-700", bg: "bg-purple-50", icon: HeartPulse },
  H: { id: 'H', name: "氣鬱質", tag: "情緒鬱悶", color: "text-indigo-700", bg: "bg-indigo-50", icon: Wind },
  I: { id: 'I', name: "特稟質", tag: "過敏體質", color: "text-rose-700", bg: "bg-rose-50", icon: ShieldAlert }
};

const TEST_QUESTIONS = [
  { id: 1, text: "容易覺得疲倦乏力，說話時不夠氣，稍微活動就容易出汗？" },
  { id: 2, text: "比身邊的人更怕冷，手腳長年冰凍，偏好熱飲？" },
  { id: 3, text: "覺得手心、腳心發熱，面色潮紅，經常口乾眼乾？" },
  { id: 4, text: "夜間睡眠質素差、多夢，或容易心煩、盜汗？" },
  { id: 5, text: "覺得身體沉重困倦，腹部鬆軟肥胖，喉嚨常有痰？" },
  { id: 6, text: "面部容易出油、生暗瘡，常感到口苦或大便黏滯？" },
  { id: 7, text: "面色偏向晦暗，皮膚容易撞瘀，或身體有固定刺痛感？" },
  { id: 8, text: "生理期常有血塊、經痛？ / (男性) 舌下靜脈青紫脹起？" },
  { id: 9, text: "常感到情緒低落、焦慮、無故嘆氣，或覺得胸悶？" },
  { id: 10, text: "容易鼻塞、打噴嚏，或皮膚一抓就紅腫痕癢？" },
  { id: 11, text: "對特定的食物、藥物或環境因素非常敏感？" },
  { id: 12, text: "【健康指標】胃口良好，進食後腹部舒適無脹氣？", isReverse: true },
  { id: 13, text: "【健康指標】起床後感到精力充沛，能應付一天工作？", isReverse: true },
  { id: 14, text: "【健康指標】季節交替或氣候變化時，適應良好不易生病？", isReverse: true },
  { id: 15, text: "【健康指標】大小便規律，且狀態正常？", isReverse: true }
];

// ==========================================
// 📱 主程式
// ==========================================
export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [checkoutStep, setCheckoutStep] = useState('cart'); 
  const [customerInfo, setCustomerInfo] = useState(null);
  
  const [testAnswers, setTestAnswers] = useState({});
  const [testResult, setTestResult] = useState(null); 
  
  const [orderHistory, setOrderHistory] = useState([]);
  const [expandedBlog, setExpandedBlog] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const [menusData, setMenusData] = useState({});
  const [blogsData, setBlogsData] = useState([]);

  const [cart, setCart] = useState({});
  const upcomingDates = useMemo(() => generateUpcomingDates(30), []);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState([formatDate(upcomingDates[0])]);
  const [dailyForm, setDailyForm] = useState({ meals: {}, soupQty: 0, fruitQty: 0 });
  const [editingMeal, setEditingMeal] = useState(null);

  const [loginPhone, setLoginPhone] = useState('');
  const [tempAddress, setTempAddress] = useState('');

  useEffect(() => {
    const fetchFirebaseData = async () => {
      try {
        if (!db) throw new Error("DB未初始化");
        const menusSnap = await getDocs(collection(db, 'menus'));
        const mObj = {}; menusSnap.forEach(d => { mObj[d.id] = d.data(); });
        const blogsSnap = await getDocs(collection(db, 'blogs'));
        const bArr = blogsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        setMenusData(Object.keys(mObj).length > 0 ? mObj : null); 
        setBlogsData(bArr.length > 0 ? bArr : FALLBACK_BLOGS);
      } catch (error) {
        setMenusData(null);
        setBlogsData(FALLBACK_BLOGS);
      }
    };
    fetchFirebaseData();
  }, []);

  useEffect(() => {
    if (!isBulkMode && selectedDates.length === 1) {
      const dateStr = selectedDates[0];
      if (cart[dateStr]) setDailyForm(JSON.parse(JSON.stringify(cart[dateStr])));
      else setDailyForm({ meals: {}, soupQty: 0, fruitQty: 0 });
      setEditingMeal(null);
    }
  }, [selectedDates, cart, isBulkMode]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const handleDateSelect = (dateObj) => {
    const dStr = formatDate(dateObj);
    if (isBulkMode) setSelectedDates(prev => prev.includes(dStr) ? prev.filter(d => d !== dStr) : [...prev, dStr].sort());
    else setSelectedDates([dStr]);
  };

  const handleAddToCart = () => {
    if (Object.keys(dailyForm.meals).length === 0 && dailyForm.soupQty === 0 && dailyForm.fruitQty === 0) {
      return showToast("請最少選擇一款餐點或附加項目");
    }
    for (const [meal, texture] of Object.entries(dailyForm.meals)) {
      if (texture === true) return showToast(`請為 ${meal}餐 選擇質感`);
    }

    const newCart = { ...cart };
    selectedDates.forEach(dStr => { newCart[dStr] = JSON.parse(JSON.stringify(dailyForm)); });
    setCart(newCart);
    
    if (!isBulkMode && selectedDates.length === 1) {
      const currentIndex = upcomingDates.findIndex(d => formatDate(d) === selectedDates[0]);
      if (currentIndex >= 0 && currentIndex < upcomingDates.length - 1) setSelectedDates([formatDate(upcomingDates[currentIndex + 1])]);
      showToast("✅ 已儲存至購物車");
    } else if (isBulkMode) {
      showToast(`✅ 已成功套用至 ${selectedDates.length} 個日子`);
      setIsBulkMode(false);
      setSelectedDates([selectedDates[selectedDates.length - 1]]); 
    }
  };
  
  const proceedToCheckout = () => {
    if (Object.keys(cart).length === 0) return showToast("購物車沒有餐點！");
    if (customerInfo) setCheckoutStep(customerInfo.address ? 'confirm' : 'address');
    else setCheckoutStep('login');
  };

  const handleDemoLogin = (e) => {
    e?.preventDefault();
    if (loginPhone.length >= 8) {
      setCustomerInfo({ id: `U${loginPhone}`, name: '陳大文', phone: loginPhone, address: '九龍觀塘巧明街 1 號大廈' }); 
      setTempAddress('九龍觀塘巧明街 1 號大廈'); 
      setCheckoutStep('confirm');
    } else showToast("請輸入有效的電話號碼");
  };

  const submitFinalOrder = async () => {
    if (!customerInfo || !customerInfo.id) return showToast("請先登入及填寫送餐資料");

    try {
      const newOrders = [];
      
      for (const [dateStr, details] of Object.entries(cart)) {
        const counts = {};
        Object.entries(details.meals).forEach(([mealCode, texture]) => { 
          counts[`${mealCode}_${texture}`] = 1; 
        });

        const orderData = {
          date: dateStr, 
          customerId: customerInfo.id, 
          counts: counts, 
          soupQty: details.soupQty || 0, 
          fruitQty: details.fruitQty || 0,
          status: '處理中',
          timestamp: new Date().toISOString()
        };

        const orderId = `${dateStr}_${customerInfo.id}`;
        
        await setDoc(doc(db, 'orders', orderId), orderData, { merge: true });
        newOrders.push({ id: orderId, ...orderData });
      }

      setOrderHistory(prev => [...newOrders, ...prev]); 
      setCart({}); 
      setCheckoutStep('success');
    } catch (error) {
      console.error("提交訂單失敗:", error);
      showToast("提交訂單失敗，請檢查網絡");
    }
  };

  const Toast = () => {
    if (!toastMsg) return null;
    return (
      <div className="fixed top-1/3 left-1/2 transform -translate-x-1/2 z-[100] animate-in zoom-in-95 duration-200">
        <div className="bg-[#3F2B1D] text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 w-max">
          <Info size={24} className="text-[#D97706] shrink-0"/>
          <span className="text-lg font-medium tracking-wide">{toastMsg}</span>
        </div>
      </div>
    );
  };

  const renderHome = () => {
    const dStr = selectedDates[0];
    const primaryDateObj = new Date(dStr);
    
    let todayMenu = { A: '暫無資料', B: '暫無資料', C: '暫無資料' };
    if (menusData && menusData[dStr]) todayMenu = menusData[dStr];
    else todayMenu = FALLBACK_MENUS[primaryDateObj.getDay() % 4];

    const toggleMeal = (meal) => {
      if (dailyForm.meals[meal]) {
        const newMeals = { ...dailyForm.meals }; delete newMeals[meal]; setDailyForm({ ...dailyForm, meals: newMeals });
        if (editingMeal === meal) setEditingMeal(null);
      } else { 
        setDailyForm({ ...dailyForm, meals: { ...dailyForm.meals, [meal]: true } }); 
        setEditingMeal(meal);
      }
    };

    const setTextureForMeal = (meal, texture) => { 
      setDailyForm({ ...dailyForm, meals: { ...dailyForm.meals, [meal]: texture } }); 
      setEditingMeal(null);
    };

    return (
      <div className="pb-32 bg-[#FDFBF7] min-h-screen font-sans animate-in fade-in duration-500">
        <div className="bg-white px-5 py-5 border-b border-[#E5E5E5] sticky top-0 z-20 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-2xl font-semibold text-[#3F2B1D] tracking-wide">預訂餐點</h2>
            <button onClick={() => { setIsBulkMode(!isBulkMode); if(isBulkMode) setSelectedDates([selectedDates[0]]); }}
              className={`text-sm px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2
                ${isBulkMode ? 'bg-[#D97706] text-white' : 'bg-[#F3F0EA] text-[#7A6455]'}`}>
              <Layers size={18}/> {isBulkMode ? '完成選日' : '批量選日'}
            </button>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x no-scrollbar">
            {upcomingDates.map((date) => {
              const dateStr = formatDate(date);
              const isSelected = selectedDates.includes(dateStr);
              const hasCartItem = !!cart[dateStr];
              
              return (
                <button key={dateStr} onClick={() => handleDateSelect(date)}
                  className={`snap-center flex-shrink-0 w-[4.5rem] py-3 rounded-2xl transition-all relative flex flex-col items-center justify-center
                    ${isSelected ? 'bg-[#3F2B1D] text-white shadow-md' : 'bg-white border border-[#E5E5E5] text-[#7A6455]'}
                    ${hasCartItem && !isSelected ? 'border-[#D97706] bg-[#FFFBEB]' : ''}
                  `}>
                  {hasCartItem && <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#D97706] rounded-full"></div>}
                  <span className="text-[11px] font-medium mb-1">{['日','一','二','三','四','五','六'][date.getDay()]}</span>
                  <span className="text-xl font-semibold">{date.getDate()}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-5 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-[#3F2B1D]">1. 選擇主餐 <span className="text-sm text-[#9CA3AF] ml-2">可選多款</span></h3>
            </div>
            
            <div className="space-y-4">
              {MEALS.map(m => {
                const isSelected = !!dailyForm.meals[m];
                const isEditing = editingMeal === m;
                const rawMenuData = todayMenu[m];
                let menuName = typeof rawMenuData === 'string' ? rawMenuData : (rawMenuData?.name || '是日無菜單');
                let menuRec = typeof rawMenuData === 'object' && rawMenuData.rec ? rawMenuData.rec : [];
                const isRecommended = testResult && menuRec.includes(testResult);

                return (
                  <div key={m} className={`bg-white rounded-2xl transition-all overflow-hidden border ${isSelected ? 'border-[#D97706] shadow-md' : 'border-[#E5E5E5] shadow-sm'}`}>
                    <div className="p-5 cursor-pointer flex items-start gap-4" onClick={() => toggleMeal(m)}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shrink-0
                        ${isSelected ? 'bg-[#D97706] text-white' : 'bg-[#F3F0EA] text-[#7A6455]'}`}>{m}</div>
                      <div className="flex-1 pt-1">
                        <div className={`font-medium text-lg leading-snug ${isSelected ? 'text-[#3F2B1D]' : 'text-[#3F2B1D]'}`}>{menuName}</div>
                        {isSelected && dailyForm.meals[m] !== true && (
                          <div className="text-sm text-[#7A6455] mt-1.5">已選質感: <span className="font-semibold text-[#D97706]">{dailyForm.meals[m]}</span></div>
                        )}
                        {isSelected && dailyForm.meals[m] === true && (
                          <div className="text-sm text-[#EF4444] mt-1.5 font-medium">請在下方選擇質感</div>
                        )}
                        {isRecommended && !isSelected && (
                          <div className="inline-flex items-center gap-1.5 mt-2 text-xs text-[#D97706] bg-[#FFFBEB] px-3 py-1 rounded-full font-medium">
                            <Sparkles size={14}/> 適合您的體質
                          </div>
                        )}
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-2
                        ${isSelected ? 'bg-[#D97706] text-white' : 'border-2 border-[#E5E5E5] text-transparent'}`}><Check size={18} /></div>
                    </div>

                    {isEditing && (
                      <div className="px-5 pb-5 pt-2 bg-[#FAFAF9] border-t border-[#E5E5E5] animate-in slide-in-from-top-2">
                        <div className="text-sm text-[#7A6455] mb-3 font-medium">請選擇質感：</div>
                        <div className="flex flex-wrap gap-2.5">
                          {TEXTURES.map(t => {
                            const isTexSelected = dailyForm.meals[m] === t;
                            return (
                              <button key={t} onClick={(e) => { e.stopPropagation(); setTextureForMeal(m, t); }}
                                className={`px-5 py-3 rounded-xl text-base font-medium transition-colors border
                                  ${isTexSelected ? 'bg-[#3F2B1D] border-[#3F2B1D] text-white' : 'bg-white border-[#E5E5E5] text-[#7A6455] hover:border-[#D97706]'}`}>
                                {t}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="text-lg font-medium text-[#3F2B1D] mb-4">2. 附加項目 <span className="text-sm text-[#9CA3AF] ml-2">自由選擇</span></h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-[#E5E5E5] flex flex-col shadow-sm">
                <div className="flex items-center gap-3 text-[#3F2B1D] mb-5">
                  <Soup size={24} className="text-[#D97706]"/>
                  <span className="font-medium text-base">滋潤例湯</span>
                </div>
                <div className="flex items-center gap-4 bg-[#FDFBF7] p-1.5 rounded-xl w-full justify-between border border-[#E5E5E5]">
                  <button onClick={() => setDailyForm(p => ({...p, soupQty: Math.max(0, p.soupQty - 1)}))} className="w-10 h-10 flex items-center justify-center text-[#7A6455] bg-white rounded-lg shadow-sm text-xl font-medium">-</button>
                  <span className="font-semibold text-xl text-[#3F2B1D]">{dailyForm.soupQty}</span>
                  <button onClick={() => setDailyForm(p => ({...p, soupQty: p.soupQty + 1}))} className="w-10 h-10 flex items-center justify-center text-white bg-[#D97706] rounded-lg shadow-sm text-xl font-medium">+</button>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-[#E5E5E5] flex flex-col shadow-sm">
                <div className="flex items-center gap-3 text-[#3F2B1D] mb-5">
                  <Apple size={24} className="text-[#EF4444]"/>
                  <span className="font-medium text-base">是日生果</span>
                </div>
                <div className="flex items-center gap-4 bg-[#FDFBF7] p-1.5 rounded-xl w-full justify-between border border-[#E5E5E5]">
                  <button onClick={() => setDailyForm(p => ({...p, fruitQty: Math.max(0, p.fruitQty - 1)}))} className="w-10 h-10 flex items-center justify-center text-[#7A6455] bg-white rounded-lg shadow-sm text-xl font-medium">-</button>
                  <span className="font-semibold text-xl text-[#3F2B1D]">{dailyForm.fruitQty}</span>
                  <button onClick={() => setDailyForm(p => ({...p, fruitQty: p.fruitQty + 1}))} className="w-10 h-10 flex items-center justify-center text-white bg-[#EF4444] rounded-lg shadow-sm text-xl font-medium">+</button>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="px-5 mt-2 mb-8">
           <button 
              onClick={handleAddToCart}
              className={`w-full py-4 rounded-2xl font-medium text-lg tracking-wide transition-all flex justify-center items-center gap-2
                ${(Object.keys(dailyForm.meals).length === 0 && dailyForm.soupQty === 0 && dailyForm.fruitQty === 0) 
                  ? 'bg-[#E5E5E5] text-[#9CA3AF] cursor-not-allowed' 
                  : 'bg-[#D97706] text-white shadow-lg active:scale-95'}`}
            >
              {isBulkMode ? `套用至 ${selectedDates.length} 個日子` : (cart[selectedDates[0]] ? '更新餐單' : '確認選餐')}
            </button>
        </div>
      </div>
    );
  };

  const renderBlog = () => {
    return (
      <div className="pb-24 bg-[#FDFBF7] min-h-screen font-sans animate-in fade-in duration-300">
        <div className="bg-white px-5 py-6 border-b border-[#E5E5E5] sticky top-0 z-10 shadow-sm">
          <h2 className="text-2xl font-semibold text-[#3F2B1D]">健康資訊</h2>
          <p className="text-sm text-[#7A6455] mt-1.5">中醫養生與飲食推介</p>
        </div>
        <div className="p-5 space-y-6">
          {blogsData.map(post => (
            <div key={post.id} className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden shadow-sm">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-medium text-[#D97706] bg-[#FFFBEB] px-3 py-1.5 rounded-lg">{post.category}</span>
                  <span className="text-xs text-[#9CA3AF]">{post.date}</span>
                </div>
                <h3 className="text-xl font-medium text-[#3F2B1D] leading-snug mb-3">{post.title}</h3>
                {expandedBlog === post.id ? (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <p className="text-base text-[#5E6857] whitespace-pre-line leading-relaxed mt-4 pt-5 border-t border-[#F3F0EA]">
                      {post.content}
                    </p>
                    <button onClick={() => setExpandedBlog(null)} className="mt-6 w-full py-3.5 bg-[#F9FAF8] text-[#7A6455] text-base font-medium rounded-xl border border-[#E5E5E5] hover:bg-[#F3F0EA]">收起文章</button>
                  </div>
                ) : (
                  <div>
                    <p className="text-base text-[#7A6455] line-clamp-2 leading-relaxed">{post.summary}</p>
                    <button onClick={() => setExpandedBlog(post.id)} className="mt-4 text-[#D97706] text-base font-medium flex items-center gap-1">繼續閱讀 <ChevronRight size={18}/></button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTest = () => {
    const submitTest = () => {
      if (Object.keys(testAnswers).length < 15) return showToast("請回答所有15條問題以獲取準確結果");
      
      const a = testAnswers;
      const scores = { 
        B: a[1]||0, C: a[2]||0, D: ((a[3]||0)+(a[4]||0))/2, 
        E: a[5]||0, F: a[6]||0, G: ((a[7]||0)+(a[8]||0))/2, 
        H: a[9]||0, I: ((a[10]||0)+(a[11]||0))/2 
      };
      
      let maxScore = 0; let res = 'A';
      Object.keys(scores).forEach(k => { if(scores[k] > maxScore) { maxScore = scores[k]; res = k; } });
      
      const healthScore = ((a[12]||0)+(a[13]||0)+(a[14]||0)+(a[15]||0))/4;
      if (maxScore < 3 && healthScore >= 3) res = 'A'; 
      
      setTestResult(res); 
      window.scrollTo(0,0);
    };

    if (testResult) {
      const info = CONSTITUTIONS[testResult];
      const Icon = info.icon;
      return (
        <div className="min-h-screen bg-[#FDFBF7] p-5 pt-10 font-sans animate-in fade-in pb-24">
          <div className="text-center mb-8">
             <div className="text-sm tracking-widest text-[#9CA3AF] mb-3">分析結果</div>
             <div className={`w-24 h-24 mx-auto rounded-full ${info.bg} ${info.color} flex items-center justify-center mb-5 shadow-sm`}>
                <Icon size={40} strokeWidth={1.5}/>
             </div>
             <h2 className={`text-3xl font-semibold ${info.color} mb-3`}>{info.name}</h2>
             <span className="text-sm bg-white border border-[#E5E5E5] px-4 py-1.5 rounded-full text-[#7A6455] shadow-sm">特徵：{info.tag}</span>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-[#E5E5E5] mb-8 shadow-sm">
            <div className="flex items-center gap-2.5 mb-3 text-[#3F2B1D]"><CheckSquare size={20} className="text-[#D97706]"/> <span className="font-medium text-lg">系統已記錄您的體質</span></div>
            <p className="text-base text-[#7A6455] leading-relaxed">往後在點餐時，系統會自動在適合您的菜式旁顯示推薦標籤，助您輕鬆選擇養生膳食。</p>
          </div>
          <button onClick={() => setActiveTab('home')} className="w-full bg-[#D97706] text-white font-medium text-lg py-4 rounded-2xl shadow-md mb-4">立即前往選餐</button>
          <button onClick={() => { setTestResult(null); setTestAnswers({}); }} className="w-full text-[#9CA3AF] text-base py-3">重新測試</button>
        </div>
      );
    }

    return (
      <div className="pb-24 bg-[#FDFBF7] min-h-screen font-sans">
        <div className="bg-white px-5 py-6 border-b border-[#E5E5E5] sticky top-0 z-10 shadow-sm">
          <h2 className="text-2xl font-semibold text-[#3F2B1D]">體質自測</h2>
          <p className="text-sm text-[#7A6455] mt-1.5">根據「最近三個月」的情況作答</p>
        </div>
        <div className="p-5 space-y-6">
          {TEST_QUESTIONS.map((q, idx) => (
            <div key={q.id} className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm">
              <div className={`text-xs font-medium mb-2 ${q.isReverse ? 'text-[#10B981]' : 'text-[#D97706]'}`}>
                {q.isReverse ? `問題 ${idx+1} (健康指標)` : `問題 ${idx+1}`}
              </div>
              <h3 className="text-lg text-[#3F2B1D] mb-5 leading-relaxed font-medium">{q.text}</h3>
              <div className="flex justify-between gap-2.5">
                {[1,2,3,4,5].map(s => (
                  <button key={s} onClick={() => setTestAnswers(p=>({...p, [q.id]: s}))}
                    className={`flex-1 py-3 rounded-xl text-lg font-medium transition-all border 
                      ${testAnswers[q.id] === s ? 'bg-[#3F2B1D] border-[#3F2B1D] text-white shadow-md' : 'bg-[#F9FAF8] border-[#E5E5E5] text-[#9CA3AF]'}`}>
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-[#9CA3AF] mt-3 px-1"><span>從不 (1)</span><span>總是 (5)</span></div>
            </div>
          ))}
          <button onClick={submitTest} className="w-full bg-[#D97706] text-white font-medium text-xl py-4 rounded-2xl mt-6 shadow-md">提交分析</button>
        </div>
      </div>
    );
  };

  const renderCartAndCheckout = () => {
    const cartDates = Object.keys(cart).sort();
    
    const renderCheckoutContainer = (title, subtitle, onBack, content) => (
      <div className="min-h-screen bg-[#FDFBF7] p-5 pt-8 font-sans animate-in slide-in-from-right-4 duration-300">
        {onBack && <button onClick={onBack} className="mb-6 text-[#7A6455] flex items-center gap-2 text-base font-medium"><ArrowLeft size={18}/> 返回</button>}
        <h2 className="text-3xl font-semibold text-[#3F2B1D] mb-2">{title}</h2>
        {subtitle && <p className="text-base text-[#7A6455] mb-8">{subtitle}</p>}
        {content}
      </div>
    );

    if (checkoutStep === 'cart') {
      return (
        <div className="pb-24 bg-[#FDFBF7] min-h-screen font-sans animate-in fade-in duration-300">
          <div className="bg-white px-5 py-6 border-b border-[#E5E5E5] sticky top-0 z-10 shadow-sm">
            <h2 className="text-2xl font-semibold text-[#3F2B1D]">購物車</h2>
            <p className="text-sm text-[#7A6455] mt-1.5">已選 {cartDates.length} 個日子</p>
          </div>
          <div className="p-5 space-y-4">
            {cartDates.length === 0 ? (
              <div className="text-center py-24">
                <ShoppingBag size={56} strokeWidth={1.5} className="text-[#D1D5DB] mx-auto mb-5" />
                <p className="text-[#9CA3AF] text-lg">購物車是空的</p>
                <button onClick={() => setActiveTab('home')} className="mt-8 bg-[#3F2B1D] text-white px-8 py-3.5 rounded-xl font-medium text-lg">去揀餐</button>
              </div>
            ) : (
              <>
                {cartDates.map(dateStr => {
                  const item = cart[dateStr];
                  return (
                    <div key={dateStr} className="bg-white p-5 rounded-2xl border border-[#E5E5E5] flex gap-5 items-start shadow-sm">
                      <div className="w-16 h-16 bg-[#F3F0EA] text-[#3F2B1D] rounded-xl flex flex-col justify-center items-center shrink-0">
                        <span className="text-[10px] font-medium uppercase tracking-wider">{dateStr.substring(5, 7)}月</span>
                        <span className="text-2xl font-semibold leading-none mt-1">{dateStr.substring(8, 10)}</span>
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        {Object.entries(item.meals).map(([m, t]) => (
                           <div key={m} className="font-medium text-lg text-[#3F2B1D] mb-1.5">
                             {m}餐 <span className="text-sm font-normal text-[#7A6455] border border-[#E5E5E5] rounded-lg px-2 py-0.5 ml-2 bg-[#F9FAF8] align-middle">{t === true ? '未選質感' : t}</span>
                           </div>
                        ))}
                        <div className="text-sm text-[#7A6455] mt-3">
                          {item.soupQty > 0 ? <span className="mr-4">🍲 例湯 x{item.soupQty}</span> : null}
                          {item.fruitQty > 0 ? <span>🍎 生果 x{item.fruitQty}</span> : null}
                          {Object.keys(item.meals).length === 0 && item.soupQty === 0 && item.fruitQty === 0 && '無附加項目'}
                        </div>
                      </div>
                      <button onClick={() => { const c = {...cart}; delete c[dateStr]; setCart(c); }} className="text-[#D1D5DB] hover:text-[#EF4444] p-2 transition-colors shrink-0"><Trash2 size={20}/></button>
                    </div>
                  );
                })}
                <button onClick={proceedToCheckout} className="w-full bg-[#D97706] text-white font-medium text-xl py-4 rounded-2xl shadow-lg mt-8 active:scale-95 flex justify-center items-center gap-2">
                  去結帳 <ChevronRight size={22}/>
                </button>
              </>
            )}
          </div>
        </div>
      );
    }
    
    if (checkoutStep === 'login') return renderCheckoutContainer(
      "登入系統", "請輸入電話以完成登記", () => setCheckoutStep('cart'),
      <form onSubmit={handleDemoLogin} className="space-y-6 mt-4">
        <div><label className="text-sm font-medium text-[#7A6455] mb-2 block">手提電話號碼</label><input type="tel" value={loginPhone} onChange={e=>setLoginPhone(e.target.value)} placeholder="例如: 98765432" className="w-full bg-white border border-[#E5E5E5] px-5 py-4 rounded-xl outline-none focus:border-[#D97706] text-lg font-medium text-[#3F2B1D]" /></div>
        <div><label className="text-sm font-medium text-[#7A6455] mb-2 block">驗證碼 (Demo 免填)</label><input type="number" placeholder="六位數字" className="w-full bg-[#F3F4F6] border border-[#E5E7EB] px-5 py-4 rounded-xl outline-none text-lg font-medium tracking-widest text-[#9CA3AF]" disabled /></div>
        <button type="submit" className="w-full bg-[#3F2B1D] text-white font-medium text-xl py-4 rounded-xl mt-6 active:scale-95">登入並繼續</button>
      </form>
    );

    if (checkoutStep === 'address') return renderCheckoutContainer(
      "送餐地址", "首次使用請提供詳細地址", () => setCheckoutStep('cart'),
      <><textarea value={tempAddress} onChange={e=>setTempAddress(e.target.value)} placeholder="請輸入大廈名稱、座數及樓層..." className="w-full bg-white border border-[#E5E5E5] p-5 rounded-xl outline-none focus:border-[#D97706] min-h-[160px] resize-none text-lg text-[#3F2B1D] leading-relaxed"></textarea><button onClick={() => { if(!tempAddress) return showToast("請輸入地址！"); setCustomerInfo(p=>({...p, address: tempAddress})); setCheckoutStep('confirm'); }} className="w-full bg-[#3F2B1D] text-white font-medium text-xl py-4 rounded-xl mt-6 active:scale-95">確定儲存</button></>
    );

    if (checkoutStep === 'confirm') return renderCheckoutContainer(
      "最後確認", "請核對以下資料", () => setCheckoutStep('cart'),
      <>
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 mb-8 space-y-6 shadow-sm">
          <div className="flex gap-4 items-start"><MapPin size={24} className="text-[#D97706] shrink-0 mt-0.5" /><div><div className="text-lg font-medium text-[#3F2B1D] mb-1">{customerInfo.name} <span className="text-base text-[#7A6455]">({customerInfo.phone})</span></div><div className="text-base text-[#7A6455] leading-relaxed">{customerInfo.address}</div></div></div>
          <div className="h-px bg-[#E5E5E5] w-full"></div>
          <div className="flex gap-4 items-center"><Receipt size={24} className="text-[#D97706] shrink-0" /><div className="text-lg font-medium text-[#3F2B1D]">您合共預訂了 <span className="font-semibold text-[#D97706]">{cartDates.length}</span> 日的餐點</div></div>
        </div>
        <button onClick={submitFinalOrder} className="w-full bg-[#D97706] text-white font-medium text-xl py-4 rounded-2xl active:scale-95 shadow-md">確認送出訂單</button>
      </>
    );

    if (checkoutStep === 'success') return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center p-6 text-center animate-in zoom-in-95 duration-500 font-sans">
        <div className="w-24 h-24 bg-[#D1FAE5] text-[#059669] rounded-full flex items-center justify-center mb-8"><Check size={48} strokeWidth={2} /></div>
        <h3 className="text-3xl font-semibold text-[#3F2B1D] mb-4">訂單成功送出</h3>
        <p className="text-lg text-[#7A6455] mb-12 leading-relaxed">廚房已經收到您的點餐指示啦！<br/>多謝您使用 WeCare。</p>
        <button onClick={() => { setActiveTab('profile'); setCheckoutStep('cart'); }} className="w-full max-w-xs border border-[#E5E5E5] text-[#3F2B1D] bg-white font-medium text-lg py-4 rounded-xl active:bg-[#F3F0EA] transition-colors shadow-sm">查看我的紀錄</button>
      </div>
    );
  };

  const renderProfile = () => {
    return (
      <div className="pb-24 bg-[#FDFBF7] min-h-screen font-sans animate-in fade-in">
        <div className="bg-white px-5 py-8 border-b border-[#E5E5E5] shadow-sm">
          {customerInfo ? (
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-[#F3F0EA] text-[#7A6455] rounded-full flex items-center justify-center"><User size={32} strokeWidth={1.5}/></div>
              <div><h2 className="text-2xl font-semibold text-[#3F2B1D]">{customerInfo.name}</h2><div className="text-base text-[#7A6455] mt-1">{customerInfo.phone}</div></div>
            </div>
          ) : (
            <div><h2 className="text-2xl font-semibold text-[#3F2B1D] mb-2">我的帳戶</h2><p className="text-base text-[#7A6455] mb-6">登入後可以查看訂單及資料</p><button onClick={() => { setActiveTab('cart'); setCheckoutStep('login'); }} className="w-full py-3.5 bg-[#3F2B1D] text-white text-lg font-medium rounded-xl">立即登入</button></div>
          )}
        </div>
        
        {customerInfo && (
          <div className="p-5">
            <h3 className="text-sm font-medium text-[#9CA3AF] tracking-widest uppercase mb-4 mt-2">📝 您的近期紀錄</h3>
            {orderHistory.length === 0 ? <div className="bg-white p-8 rounded-2xl border border-[#E5E5E5] text-center shadow-sm"><p className="text-lg text-[#9CA3AF]">暫時未有任何紀錄</p></div> : (
              <div className="space-y-4">
                {orderHistory.map(o => (
                  <div key={o.id} className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-sm">
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#F3F0EA]">
                       <span className="text-lg font-medium text-[#3F2B1D]">{formatDisplayDate(o.date)} 送餐</span>
                       <span className="text-xs font-medium px-2.5 py-1 bg-[#ECFDF5] text-[#059669] rounded-md">{o.status}</span>
                    </div>
                    <div className="text-base text-[#7A6455] space-y-2">
                      {Object.keys(o.counts).map(k => <div key={k}>✅ {k.split('_')[0]}餐 <span className="text-[#9CA3AF] text-sm ml-1">(質感: {k.split('_')[1]})</span></div>)}
                      {o.soupQty > 0 ? <div>🍲 例湯 x{o.soupQty}</div> : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => { setCustomerInfo(null); setOrderHistory([]); }} className="w-full mt-8 py-3.5 bg-white text-[#EF4444] text-lg font-medium border border-[#FECACA] rounded-xl hover:bg-[#FEF2F2]">登出帳戶</button>
          </div>
        )}
      </div>
    );
  };

  const cartItemCount = Object.keys(cart).length;

  return (
    <div className="min-h-screen bg-[#E5E7EB] flex justify-center selection:bg-[#F3F0EA]">
      <div className="w-full max-w-md bg-white min-h-screen relative flex flex-col overflow-hidden shadow-2xl">
        <Toast />
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {activeTab === 'home' && renderHome()}
          {activeTab === 'blog' && renderBlog()}
          {activeTab === 'test' && renderTest()}
          {activeTab === 'cart' && renderCartAndCheckout()}
          {activeTab === 'profile' && renderProfile()}
        </div>

        <div className="absolute bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-[#E5E5E5] px-1 pt-2 pb-safe flex justify-between items-end z-50">
          <button onClick={() => { setActiveTab('home'); setCheckoutStep('cart'); }} className={`flex flex-col items-center justify-end gap-1.5 flex-1 pb-2 transition-colors ${activeTab === 'home' ? 'text-[#D97706]' : 'text-[#9CA3AF]'}`}>
            <CalendarDays size={26} strokeWidth={activeTab === 'home' ? 2.5 : 1.5} />
            <span className="text-[10px] font-medium">點餐</span>
          </button>
          
          <button onClick={() => setActiveTab('blog')} className={`flex flex-col items-center justify-end gap-1.5 flex-1 pb-2 transition-colors ${activeTab === 'blog' ? 'text-[#D97706]' : 'text-[#9CA3AF]'}`}>
            <BookOpen size={26} strokeWidth={activeTab === 'blog' ? 2.5 : 1.5} />
            <span className="text-[10px] font-medium">資訊</span>
          </button>
          
          <button onClick={() => { setActiveTab('cart'); if(checkoutStep === 'success') setCheckoutStep('cart'); }} className="flex flex-col items-center justify-end gap-1 flex-1 relative pb-2">
            <div className={`relative w-[3.5rem] h-[3.5rem] rounded-full flex items-center justify-center -mt-7 shadow-sm border ${activeTab === 'cart' ? 'bg-[#D97706] border-[#D97706] text-white' : 'bg-white border-[#E5E5E5] text-[#3F2B1D]'}`}>
              <ShoppingBag size={24} strokeWidth={activeTab === 'cart' ? 2 : 1.5} />
              {cartItemCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#EF4444] rounded-full text-[10px] flex items-center justify-center text-white font-bold border-2 border-white">{cartItemCount}</span>}
            </div>
            <span className={`text-[10px] font-medium transition-colors ${activeTab === 'cart' ? 'text-[#D97706]' : 'text-[#9CA3AF]'}`}>購物車</span>
          </button>

          <button onClick={() => setActiveTab('test')} className={`flex flex-col items-center justify-end gap-1.5 flex-1 pb-2 transition-colors ${activeTab === 'test' ? 'text-[#D97706]' : 'text-[#9CA3AF]'}`}>
            <Activity size={26} strokeWidth={activeTab === 'test' ? 2.5 : 1.5} />
            <span className="text-[10px] font-medium">體質</span>
          </button>

          <button onClick={() => { setActiveTab('profile'); setCheckoutStep('cart'); }} className={`flex flex-col items-center justify-end gap-1.5 flex-1 pb-2 transition-colors ${activeTab === 'profile' ? 'text-[#D97706]' : 'text-[#9CA3AF]'}`}>
            <User size={26} strokeWidth={activeTab === 'profile' ? 2.5 : 1.5} />
            <span className="text-[10px] font-medium">我的</span>
          </button>
        </div>
      </div>
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } .pb-safe { padding-bottom: env(safe-area-inset-bottom, 1.25rem); }`}</style>
    </div>
  );
}
