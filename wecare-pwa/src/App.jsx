import React, { useState, useEffect, useMemo } from 'react';
import { 
  Phone, Check, ShoppingBag, User, CalendarDays, 
  MapPin, Trash2, ChevronRight, ArrowLeft, Receipt, 
  BookOpen, Activity, Leaf, Flame, Snowflake, Wind, 
  ShieldAlert, CheckSquare, Sparkles, Layers, Info, Soup, Apple, HeartPulse, Stethoscope
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';

// ==========================================
// 🚀 Firebase 設定
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

// 🇭🇰 香港公眾假期列表 (格式 YYYY-MM-DD)
const HK_HOLIDAYS = [
  '2026-01-01', '2026-02-17', '2026-02-18', '2026-02-19', '2026-04-03', 
  '2026-04-04', '2026-04-06', '2026-05-01', '2026-05-24', '2026-05-25', 
  '2026-06-19', '2026-07-01', '2026-09-26', '2026-10-01', '2026-10-26', 
  '2026-12-25', '2026-12-26'
];

const formatDate = (date) => date.toISOString().split('T')[0];

const isUnavailableDate = (date) => {
  if (date.getDay() === 0) return true; // 星期日休息
  return HK_HOLIDAYS.includes(formatDate(date)); // 紅日休息
};

// 🔄 改做 D+4
const getMinDate = () => { const d = new Date(); d.setDate(d.getDate() + 4); return d; };

const generateUpcomingDates = () => {
  const dates = []; 
  let current = getMinDate();
  for (let i = 0; i < 14; i++) { 
    if (!isUnavailableDate(current)) dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

const formatDisplayDate = (dateStr) => {
  const d = new Date(dateStr);
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  return `${d.getMonth() + 1}月${d.getDate()}日 (${days[d.getDay()]})`;
};

// ==========================================
// 🥗 特別營養餐常數
// ==========================================
const SPECIAL_MEALS = [
  { id: 'low_purine', name: '低嘌呤餐', desc: '適合關注尿酸人士，嚴格控制高嘌呤食材，減輕關節及腎臟負擔。', icon: <Leaf size={24} className="text-emerald-500"/> },
  { id: 'low_keto', name: '低酮餐', desc: '控制碳水化合物及特定營養素，配合專屬健康或體質需求。', icon: <Activity size={24} className="text-sky-500"/> },
  { id: 'low_residue', name: '低渣餐', desc: '減少腸道消化負擔，適合腸胃手術前後或腸道極度敏感人士。', icon: <Stethoscope size={24} className="text-orange-500"/> }
];

const FALLBACK_MENUS = {
  0: { A: { name: '南瓜蒸排骨', rec: ['A', 'B', 'C'] }, B: { name: '冬菇蒸滑雞', rec: ['A', 'B', 'H'] }, C: { name: '羅漢齋 (素)', rec: ['E', 'F', 'D'] } },
  1: { A: { name: '番茄炒蛋', rec: ['A', 'D', 'H'] }, B: { name: '梅菜扣肉', rec: ['A', 'C'] }, C: { name: '清炒菜心', rec: ['A', 'E', 'F', 'G'] } },
  2: { A: { name: '洋蔥豬扒', rec: ['A', 'C', 'G'] }, B: { name: '肉餅蒸水蛋', rec: ['A', 'B', 'D'] }, C: { name: '南乳齋煲', rec: ['A', 'C', 'E'] } },
  3: { A: { name: '西芹炒雞柳', rec: ['A', 'G', 'H'] }, B: { name: '煎釀三寶', rec: ['A', 'E'] }, C: { name: '蒜蓉西蘭花', rec: ['A', 'D', 'F'] } },
};

const FALLBACK_BLOGS = [
  { id: 1, title: "立秋後必飲！中醫推介潤燥湯水", category: "節氣養生", date: "2023-08-15", summary: "踏入初秋，天氣漸漸乾燥，容易出現乾咳、皮膚痕癢等「秋燥」症狀...", content: "秋季養生首重「滋陰潤燥」。\n\n1. 雪梨雪耳南北杏瘦肉湯：潤肺止咳。\n2. 百合蓮子沙參玉竹湯：寧心安神。\n建議每星期飲用1-2次。" }
];

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
  { id: 1, text: "容易覺得疲倦乏力，稍微活動就容易出汗？" },
  { id: 2, text: "比身邊的人更怕冷，手腳長年冰凍？" },
  { id: 3, text: "覺得手心腳心發熱，經常口乾眼乾？" },
  { id: 12, text: "【健康指標】胃口良好，進食後腹部舒適？", isReverse: true },
  { id: 13, text: "【健康指標】大小便規律，且狀態正常？", isReverse: true }
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

  // --- 點餐狀態 ---
  const [mealType, setMealType] = useState('daily'); 
  const [cart, setCart] = useState({});
  const upcomingDates = useMemo(() => generateUpcomingDates(), []);
  const initialDateStr = upcomingDates.length > 0 ? formatDate(upcomingDates[0]) : '';
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState([initialDateStr]);
  const [dailyForm, setDailyForm] = useState({ meals: {}, soupQty: 0, fruitQty: 0 });
  const [editingMeal, setEditingMeal] = useState(null);

  // --- 結帳狀態 ---
  const [loginPhone, setLoginPhone] = useState('');
  const [tempAddress, setTempAddress] = useState('');
  const [referralCode, setReferralCode] = useState(''); // 🆕 推薦碼

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
    if (mealType === 'daily' && !isBulkMode && selectedDates.length === 1 && selectedDates[0]) {
      const dateStr = selectedDates[0];
      const cartItem = cart[dateStr];
      if (cartItem && !cartItem.isSpecial) {
        setDailyForm(JSON.parse(JSON.stringify(cartItem)));
      } else {
        setDailyForm({ meals: {}, soupQty: 0, fruitQty: 0 });
      }
      setEditingMeal(null);
    }
  }, [selectedDates, cart, isBulkMode, mealType]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const handleDateSelect = (dateObj) => {
    const dStr = formatDate(dateObj);
    if (isBulkMode && mealType === 'daily') {
      setSelectedDates(prev => prev.includes(dStr) ? prev.filter(d => d !== dStr) : [...prev, dStr].sort());
    } else {
      setSelectedDates([dStr]);
    }
  };

  const handleAddToCart = () => {
    if (!selectedDates[0]) return;
    if (Object.keys(dailyForm.meals).length === 0 && dailyForm.soupQty === 0 && dailyForm.fruitQty === 0) {
      return showToast("請最少選擇一款餐點或附加項目");
    }
    for (const [meal, texture] of Object.entries(dailyForm.meals)) {
      if (texture === true) return showToast(`請為 ${meal}餐 選擇質感`);
    }

    const newCart = { ...cart };
    selectedDates.forEach(dStr => { 
      newCart[dStr] = { ...JSON.parse(JSON.stringify(dailyForm)), isSpecial: false }; 
    });
    setCart(newCart);
    
    if (!isBulkMode && selectedDates.length === 1) {
      const currentIndex = upcomingDates.findIndex(d => formatDate(d) === selectedDates[0]);
      if (currentIndex >= 0 && currentIndex < upcomingDates.length - 1) {
        setSelectedDates([formatDate(upcomingDates[currentIndex + 1])]);
      }
      showToast("✅ 日常餐已儲存至購物車");
    } else if (isBulkMode) {
      showToast(`✅ 已成功套用至 ${selectedDates.length} 個日子`);
      setIsBulkMode(false);
      setSelectedDates([selectedDates[selectedDates.length - 1]]); 
    }
  };

  const handleAddSpecialMeal = (specialMeal, duration) => {
    if (duration === 'contact') {
      window.open(`https://wa.me/85212345678?text=你好，我想查詢關於 ${specialMeal.name} 嘅詳情。`, '_blank');
      return;
    }
    const dStr = selectedDates[0];
    if (!dStr) return;

    setCart(prev => ({
      ...prev,
      [dStr]: { 
        isSpecial: true, 
        specialName: specialMeal.name, 
        duration: duration,
        soupQty: 0, fruitQty: 0, meals: {} 
      }
    }));
    showToast(`✅ 已將 ${specialMeal.name} (${duration}日) 加入購物車`);
    setActiveTab('cart');
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
        
        if (details.isSpecial) {
          counts[`特別餐_${details.specialName}_${details.duration}日`] = 1;
        } else {
          Object.entries(details.meals).forEach(([mealCode, texture]) => { 
            counts[`${mealCode}_${texture}`] = 1; 
          });
        }

        const orderData = {
          date: dateStr, 
          customerId: customerInfo.id, 
          counts: counts, 
          soupQty: details.soupQty || 0, 
          fruitQty: details.fruitQty || 0,
          referralCode: referralCode.trim(), // 🆕 寫入推薦碼
          status: '處理中',
          timestamp: new Date().toISOString()
        };

        const orderId = `${dateStr}_${customerInfo.id}`;
        
        await setDoc(doc(db, 'orders', orderId), orderData, { merge: true });
        newOrders.push({ id: orderId, ...orderData });
      }

      setOrderHistory(prev => [...newOrders, ...prev]); 
      setCart({}); 
      setReferralCode('');
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
    if (upcomingDates.length === 0) return <div className="p-10 text-center text-gray-500">未來 14 天沒有可送餐日子</div>;

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
            {mealType === 'daily' && (
              <button onClick={() => { setIsBulkMode(!isBulkMode); if(isBulkMode) setSelectedDates([selectedDates[0]]); }}
                className={`text-sm px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2
                  ${isBulkMode ? 'bg-[#D97706] text-white' : 'bg-[#F3F0EA] text-[#7A6455]'}`}>
                <Layers size={18}/> {isBulkMode ? '完成選日' : '批量選日'}
              </button>
            )}
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

        <div className="flex bg-[#F3F0EA] p-1.5 rounded-2xl mx-5 mt-6 shadow-inner">
           <button onClick={() => { setMealType('daily'); setIsBulkMode(false); setSelectedDates([selectedDates[0]]); }} 
             className={`flex-1 py-3 rounded-xl text-base font-medium transition-all ${mealType==='daily'?'bg-white shadow-sm text-[#D97706]':'text-[#7A6455]'}`}>
             日常餐單
           </button>
           <button onClick={() => { setMealType('special'); setIsBulkMode(false); setSelectedDates([selectedDates[0]]); }} 
             className={`flex-1 py-3 rounded-xl text-base font-medium transition-all ${mealType==='special'?'bg-white shadow-sm text-[#D97706]':'text-[#7A6455]'}`}>
             特別營養餐
           </button>
        </div>

        <div className="p-5 space-y-8 animate-in slide-in-from-bottom-2">
          
          {mealType === 'daily' && (
            <>
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
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shrink-0 ${isSelected ? 'bg-[#D97706] text-white' : 'bg-[#F3F0EA] text-[#7A6455]'}`}>{m}</div>
                          <div className="flex-1 pt-1">
                            <div className={`font-medium text-lg leading-snug ${isSelected ? 'text-[#3F2B1D]' : 'text-[#3F2B1D]'}`}>{menuName}</div>
                            {isSelected && dailyForm.meals[m] !== true && <div className="text-sm text-[#7A6455] mt-1.5">已選質感: <span className="font-semibold text-[#D97706]">{dailyForm.meals[m]}</span></div>}
                            {isSelected && dailyForm.meals[m] === true && <div className="text-sm text-[#EF4444] mt-1.5 font-medium">請在下方選擇質感</div>}
                            {isRecommended && !isSelected && <div className="inline-flex items-center gap-1.5 mt-2 text-xs text-[#D97706] bg-[#FFFBEB] px-3 py-1 rounded-full font-medium"><Sparkles size={14}/> 適合您的體質</div>}
                          </div>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-2 ${isSelected ? 'bg-[#D97706] text-white' : 'border-2 border-[#E5E5E5] text-transparent'}`}><Check size={18} /></div>
                        </div>

                        {isEditing && (
                          <div className="px-5 pb-5 pt-2 bg-[#FAFAF9] border-t border-[#E5E5E5] animate-in slide-in-from-top-2">
                            <div className="text-sm text-[#7A6455] mb-3 font-medium">請選擇質感：</div>
                            <div className="flex flex-wrap gap-2.5">
                              {TEXTURES.map(t => {
                                const isTexSelected = dailyForm.meals[m] === t;
                                return (
                                  <button key={t} onClick={(e) => { e.stopPropagation(); setTextureForMeal(m, t); }} className={`px-5 py-3 rounded-xl text-base font-medium transition-colors border ${isTexSelected ? 'bg-[#3F2B1D] border-[#3F2B1D] text-white' : 'bg-white border-[#E5E5E5] text-[#7A6455] hover:border-[#D97706]'}`}>{t}</button>
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
                    <div className="flex items-center gap-3 text-[#3F2B1D] mb-5"><Soup size={24} className="text-[#D97706]"/><span className="font-medium text-base">滋潤例湯</span></div>
                    <div className="flex items-center gap-4 bg-[#FDFBF7] p-1.5 rounded-xl w-full justify-between border border-[#E5E5E5]">
                      <button onClick={() => setDailyForm(p => ({...p, soupQty: Math.max(0, p.soupQty - 1)}))} className="w-10 h-10 flex items-center justify-center text-[#7A6455] bg-white rounded-lg shadow-sm text-xl font-medium">-</button>
                      <span className="font-semibold text-xl text-[#3F2B1D]">{dailyForm.soupQty}</span>
                      <button onClick={() => setDailyForm(p => ({...p, soupQty: p.soupQty + 1}))} className="w-10 h-10 flex items-center justify-center text-white bg-[#D97706] rounded-lg shadow-sm text-xl font-medium">+</button>
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-[#E5E5E5] flex flex-col shadow-sm">
                    <div className="flex items-center gap-3 text-[#3F2B1D] mb-5"><Apple size={24} className="text-[#EF4444]"/><span className="font-medium text-base">是日生果</span></div>
                    <div className="flex items-center gap-4 bg-[#FDFBF7] p-1.5 rounded-xl w-full justify-between border border-[#E5E5E5]">
                      <button onClick={() => setDailyForm(p => ({...p, fruitQty: Math.max(0, p.fruitQty - 1)}))} className="w-10 h-10 flex items-center justify-center text-[#7A6455] bg-white rounded-lg shadow-sm text-xl font-medium">-</button>
                      <span className="font-semibold text-xl text-[#3F2B1D]">{dailyForm.fruitQty}</span>
                      <button onClick={() => setDailyForm(p => ({...p, fruitQty: p.fruitQty + 1}))} className="w-10 h-10 flex items-center justify-center text-white bg-[#EF4444] rounded-lg shadow-sm text-xl font-medium">+</button>
                    </div>
                  </div>
                </div>
              </section>

              <div className="pt-2 mb-8">
                <button onClick={handleAddToCart}
                  className={`w-full py-4 rounded-2xl font-medium text-lg tracking-wide transition-all flex justify-center items-center gap-2
                    ${(Object.keys(dailyForm.meals).length === 0 && dailyForm.soupQty === 0 && dailyForm.fruitQty === 0) 
                      ? 'bg-[#E5E5E5] text-[#9CA3AF] cursor-not-allowed' : 'bg-[#D97706] text-white shadow-lg active:scale-95'}`}>
                  {isBulkMode ? `套用至 ${selectedDates.length} 個日子` : (cart[selectedDates[0]] && !cart[selectedDates[0]].isSpecial ? '更新餐單' : '確認選餐')}
                </button>
              </div>
            </>
          )}

          {mealType === 'special' && (
            <div className="space-y-6">
              <div className="bg-[#FFFBEB] p-4 rounded-2xl border border-[#FEF3C7] flex items-start gap-3">
                 <Info size={20} className="text-[#D97706] shrink-0 mt-0.5"/>
                 <p className="text-sm text-[#92400E] leading-relaxed">請喺上方日曆選擇**首個送餐日**，系統會自動按您選擇嘅日數安排膳食（逢星期日及紅日休息）。</p>
              </div>

              {SPECIAL_MEALS.map(special => (
                <div key={special.id} className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden shadow-sm">
                  <div className="p-5 border-b border-[#F3F0EA]">
                    <div className="flex items-center gap-3 mb-2">
                       <div className="p-2 bg-[#F9FAF8] rounded-xl">{special.icon}</div>
                       <h3 className="text-xl font-bold text-[#3F2B1D]">{special.name}</h3>
                    </div>
                    <p className="text-sm text-[#7A6455] leading-relaxed">{special.desc}</p>
                  </div>
                  <div className="p-4 bg-[#FAFAF9] grid grid-cols-2 gap-3">
                    <button onClick={() => handleAddSpecialMeal(special, 7)} className="py-3 bg-white border border-[#E5E5E5] rounded-xl text-[#3F2B1D] font-medium text-sm hover:border-[#D97706] transition-colors active:scale-95">7日體驗</button>
                    <button onClick={() => handleAddSpecialMeal(special, 14)} className="py-3 bg-white border border-[#E5E5E5] rounded-xl text-[#3F2B1D] font-medium text-sm hover:border-[#D97706] transition-colors active:scale-95">14日療程</button>
                    <button onClick={() => handleAddSpecialMeal(special, 21)} className="py-3 bg-white border border-[#E5E5E5] rounded-xl text-[#3F2B1D] font-medium text-sm hover:border-[#D97706] transition-colors active:scale-95">21日全效</button>
                    <button onClick={() => handleAddSpecialMeal(special, 'contact')} className="py-3 bg-[#3F2B1D] text-white rounded-xl font-medium text-sm hover:bg-[#291C13] transition-colors active:scale-95 flex justify-center items-center gap-1.5"><Phone size={14}/>聯絡我們</button>
                  </div>
                </div>
              ))}
            </div>
          )}

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
            <p className="text-sm text-[#7A6455] mt-1.5">已選 {cartDates.length} 筆訂單</p>
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
                    <div key={dateStr} className="bg-white p-5 rounded-2xl border border-[#E5E5E5] flex gap-5 items-start shadow-sm relative overflow-hidden">
                      {item.isSpecial && <div className="absolute top-0 left-0 w-1.5 h-full bg-[#D97706]"></div>}
                      <div className="w-16 h-16 bg-[#F3F0EA] text-[#3F2B1D] rounded-xl flex flex-col justify-center items-center shrink-0">
                        <span className="text-[10px] font-medium uppercase tracking-wider">{dateStr.substring(5, 7)}月</span>
                        <span className="text-2xl font-semibold leading-none mt-1">{dateStr.substring(8, 10)}</span>
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        {item.isSpecial ? (
                          <>
                            <div className="font-semibold text-lg text-[#D97706] mb-1">{item.specialName}</div>
                            <div className="text-sm text-[#7A6455]">包含 {item.duration} 個送餐日<br/>(由 {formatDisplayDate(dateStr)} 起計)</div>
                          </>
                        ) : (
                          <>
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
                          </>
                        )}
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
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 mb-4 space-y-6 shadow-sm">
          <div className="flex gap-4 items-start"><MapPin size={24} className="text-[#D97706] shrink-0 mt-0.5" /><div><div className="text-lg font-medium text-[#3F2B1D] mb-1">{customerInfo.name} <span className="text-base text-[#7A6455]">({customerInfo.phone})</span></div><div className="text-base text-[#7A6455] leading-relaxed">{customerInfo.address}</div></div></div>
          <div className="h-px bg-[#E5E5E5] w-full"></div>
          <div className="flex gap-4 items-center"><Receipt size={24} className="text-[#D97706] shrink-0" /><div className="text-lg font-medium text-[#3F2B1D]">您合共預訂了 <span className="font-semibold text-[#D97706]">{cartDates.length}</span> 筆預約</div></div>
        </div>
        
        {/* 🆕 推薦碼輸入格 */}
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 mb-8 shadow-sm">
           <label className="text-sm font-medium text-[#7A6455] mb-2 block">推薦碼 (如有)</label>
           <input type="text" value={referralCode} onChange={e => setReferralCode(e.target.value)} placeholder="輸入推薦碼..." className="w-full bg-[#F9FAF8] border border-[#E5E5E5] px-5 py-4 rounded-xl outline-none focus:border-[#D97706] text-lg font-medium text-[#3F2B1D]" />
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

  const renderBlog = () => { return <div className="pb-24 bg-[#FDFBF7] min-h-screen font-sans"><div className="bg-white px-5 py-6 border-b border-[#E5E5E5] sticky top-0 z-10"><h2 className="text-2xl font-semibold text-[#3F2B1D]">健康資訊</h2></div><div className="p-5">{blogsData.map(post => (<div key={post.id} className="bg-white rounded-2xl border border-[#E5E5E5] mb-5 p-6"><h3 className="text-xl font-medium">{post.title}</h3><p className="mt-2 text-[#7A6455]">{post.summary}</p></div>))}</div></div>; };
  const renderTest = () => { return <div className="pb-24 bg-[#FDFBF7] min-h-screen font-sans"><div className="bg-white px-5 py-6 border-b border-[#E5E5E5] sticky top-0 z-10"><h2 className="text-2xl font-semibold text-[#3F2B1D]">體質自測</h2></div><div className="p-5">系統自測建置中</div></div>; };
  const renderProfile = () => { return <div className="pb-24 bg-[#FDFBF7] min-h-screen font-sans"><div className="bg-white px-5 py-6 border-b border-[#E5E5E5] sticky top-0 z-10"><h2 className="text-2xl font-semibold text-[#3F2B1D]">我的紀錄</h2></div><div className="p-5">{orderHistory.length === 0 ? "未有紀錄" : orderHistory.map(o => <div key={o.id} className="bg-white p-4 mb-3 rounded-xl border">{o.date} 訂單處理中</div>)}</div></div>; };

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
