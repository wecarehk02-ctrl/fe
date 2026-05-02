import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Phone, Check, ShoppingBag, User, CalendarDays, 
  MapPin, Trash2, ChevronRight, ArrowLeft, Receipt, 
  BookOpen, Activity, Leaf, Flame, Snowflake, Wind, 
  ShieldAlert, CheckSquare, Sparkles, Layers, Info, Soup, Apple, HeartPulse, Stethoscope, Lock, Edit3, X, ArrowRight
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, query, where, onSnapshot } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBs-iuaxif5Ruol0o95bvPHG7sAeBPIZCI",
  authDomain: "wecare-db-257a2.firebaseapp.com",
  projectId: "wecare-db-257a2",
  storageBucket: "wecare-db-257a2.firebasestorage.app",
  messagingSenderId: "9382815598",
  appId: "1:9382815598:web:0204da895acae71ba5037f"
};

let db;
try { const app = initializeApp(firebaseConfig); db = getFirestore(app); } catch (e) { console.error("Firebase 初始化失敗", e); }

const TEXTURES = ['正', '碎', '免治', '分糊', '全糊'];
const RICE_TEXTURES = ['正飯', '爛飯', '粥', '無需飯']; 
const MEALS = ['A', 'B', 'C'];
const WHATSAPP_NUM = "85246084299"; 

const HK_HOLIDAYS = [
  '2026-01-01', '2026-02-17', '2026-02-18', '2026-02-19', '2026-04-03', '2026-04-04', '2026-04-06', '2026-05-01', '2026-05-24', '2026-05-25', '2026-06-19', '2026-07-01', '2026-09-26', '2026-10-01', '2026-10-26', '2026-12-25', '2026-12-26'
];

const getLocalDateFormat = (date) => {
  const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, '0'); const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const isUnavailableDate = (date) => { if (date.getDay() === 0) return true; return HK_HOLIDAYS.includes(getLocalDateFormat(date)); };
const getMinDate = () => { const d = new Date(); d.setDate(d.getDate() + 4); return d; };
const generateUpcomingDates = () => {
  const dates = []; let current = getMinDate();
  while (dates.length < 30) { 
    if (!isUnavailableDate(current)) dates.push(new Date(current)); 
    current.setDate(current.getDate() + 1); 
  }
  return dates;
};

const formatDisplayDate = (dateStr) => {
  const d = new Date(dateStr); const days = ['日', '一', '二', '三', '四', '五', '六'];
  return `${d.getMonth() + 1}月${d.getDate()}日 (${days[d.getDay()]})`;
};

const SPECIAL_MEALS = [
  { id: 'low_purine', name: '低嘌呤餐', desc: '適合關注尿酸人士，嚴格控制高嘌呤食材，減輕關節及腎臟負擔。', icon: <Leaf size={24} className="text-emerald-500"/> },
  { id: 'low_keto', name: '低酮餐', desc: '控制碳水化合物及特定營養素，配合專屬健康或體質需求。', icon: <Activity size={24} className="text-sky-500"/> },
  { id: 'low_residue', name: '低渣餐', desc: '減少腸道消化負擔，適合腸胃手術前後或腸道極度敏感人士。', icon: <Stethoscope size={24} className="text-orange-500"/> }
];

const CONSTITUTIONS = { A: { id: 'A', name: "平和質", tag: "健康寶寶", color: "text-emerald-700", bg: "bg-emerald-50", icon: Leaf }, B: { id: 'B', name: "氣虛質", tag: "容易疲倦", color: "text-stone-600", bg: "bg-stone-100", icon: Activity }, C: { id: 'C', name: "陽虛質", tag: "畏寒怕冷", color: "text-sky-700", bg: "bg-sky-50", icon: Snowflake }, D: { id: 'D', name: "陰虛質", tag: "缺水乾柴", color: "text-orange-700", bg: "bg-orange-50", icon: Flame }, E: { id: 'E', name: "痰濕質", tag: "易肥體質", color: "text-amber-700", bg: "bg-amber-50", icon: Layers }, F: { id: 'F', name: "濕熱質", tag: "又油又濕", color: "text-red-700", bg: "bg-red-50", icon: Flame }, G: { id: 'G', name: "血瘀質", tag: "循環阻塞", color: "text-purple-700", bg: "bg-purple-50", icon: HeartPulse }, H: { id: 'H', name: "氣鬱質", tag: "情緒鬱悶", color: "text-indigo-700", bg: "bg-indigo-50", icon: Wind }, I: { id: 'I', name: "特稟質", tag: "過敏體質", color: "text-rose-700", bg: "bg-rose-50", icon: ShieldAlert } };
const TEST_QUESTIONS = [ { id: 1, text: "容易覺得疲倦乏力，說話時不夠氣，稍微活動就容易出汗？" }, { id: 2, text: "比身邊的人更怕冷，手腳長年冰凍，偏好熱飲？" }, { id: 3, text: "覺得手心、腳心發熱，面色潮紅，經常口乾眼乾？" }, { id: 4, text: "夜間睡眠質素差、多夢，或容易心煩、盜汗？" }, { id: 5, text: "覺得身體沉重困倦，腹部鬆軟肥胖，喉嚨常有痰？" }, { id: 6, text: "面部容易出油、生暗瘡，常感到口苦或大便黏滯？" }, { id: 7, text: "面色偏向晦暗，皮膚容易撞瘀，或身體有固定刺痛感？" }, { id: 8, text: "生理期常有血塊、經痛？ / (男性) 舌下靜脈青紫脹起？" }, { id: 9, text: "常感到情緒低落、焦慮、無故嘆氣，或覺得胸悶？" }, { id: 10, text: "容易鼻塞、打噴嚏，或皮膚一抓就紅腫痕癢？" }, { id: 11, text: "對特定的食物、藥物或環境因素非常敏感？" }, { id: 12, text: "【健康指標】胃口良好，進食後腹部舒適無脹氣？", isReverse: true }, { id: 13, text: "【健康指標】起床後感到精力充沛，能應付一天工作？", isReverse: true }, { id: 14, text: "【健康指標】季節交替或氣候變化時，適應良好不易生病？", isReverse: true }, { id: 15, text: "【健康指標】大小便規律，且狀態正常？", isReverse: true } ];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [checkoutStep, setCheckoutStep] = useState('cart'); 
  const [customerInfo, setCustomerInfo] = useState(null);
  
  const [testStep, setTestStep] = useState(0); 
  const [testAnswers, setTestAnswers] = useState({});
  const [testResult, setTestResult] = useState(null); 
  
  const [orderHistory, setOrderHistory] = useState([]);
  const [toastMsg, setToastMsg] = useState('');
  
  const [menusData, setMenusData] = useState({});
  const [blogsData, setBlogsData] = useState([]);

  const [mealType, setMealType] = useState('daily'); 
  const [cart, setCart] = useState({});
  const upcomingDates = useMemo(() => generateUpcomingDates(), []);
  const initialDateStr = upcomingDates.length > 0 ? getLocalDateFormat(upcomingDates[0]) : '';
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState([initialDateStr]);
  const [dailyForm, setDailyForm] = useState({ meals: {}, soupQty: 0 }); 
  const [editingMeal, setEditingMeal] = useState(null);
  const [selectingSpecial, setSelectingSpecial] = useState(null); 
  const [specForm, setSpecForm] = useState({ texture: '', rice: '正飯' }); 

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [profileForm, setProfileForm] = useState({ name: '', contactName: '', phone: '', address: '', password: '' });
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [pwdForm, setPwdForm] = useState({ old: '', new: '', confirm: '' });
  const [showPwdChange, setShowPwdChange] = useState(false);

  // 🌟 用嚟控制日曆橫向 Scroll 嘅 Reference
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!db) return;
    const unsubMenus = onSnapshot(collection(db, 'menus'), (snap) => {
      const mObj = {}; snap.docs.forEach(d => { mObj[d.id] = d.data(); });
      setMenusData(mObj);
    });
    const unsubBlogs = onSnapshot(collection(db, 'blogs'), (snap) => {
      setBlogsData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubMenus(); unsubBlogs(); };
  }, []);

  useEffect(() => {
    if (mealType === 'daily' && !isBulkMode && selectedDates.length === 1 && selectedDates[0]) {
      const dateStr = selectedDates[0];
      const cartItem = cart[dateStr];
      if (cartItem && !cartItem.isSpecial) setDailyForm(JSON.parse(JSON.stringify(cartItem)));
      else setDailyForm({ meals: {}, soupQty: 0 }); 
      setEditingMeal(null);
    }
  }, [selectedDates, cart, isBulkMode, mealType]);

  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 2500); };

  const handleDateSelect = (dateObj) => {
    const dStr = getLocalDateFormat(dateObj);
    if (isBulkMode && mealType === 'daily') setSelectedDates(prev => prev.includes(dStr) ? prev.filter(d => d !== dStr) : [...prev, dStr].sort());
    else setSelectedDates([dStr]);
  };

  const handleAddToCart = () => {
    if (!selectedDates[0]) return;
    if (Object.keys(dailyForm.meals).length === 0 && dailyForm.soupQty === 0) return showToast("請最少選擇一款餐點或附加項目");
    
    for (const [meal, data] of Object.entries(dailyForm.meals)) { 
      if (!data.texture) return showToast(`請為 ${meal}餐 選擇質感`); 
      if (!data.rice) return showToast(`請為 ${meal}餐 選擇飯類`); 
    }

    const newCart = { ...cart };
    selectedDates.forEach(dStr => { newCart[dStr] = { ...JSON.parse(JSON.stringify(dailyForm)), isSpecial: false }; });
    setCart(newCart);
    
    if (!isBulkMode && selectedDates.length === 1) {
      const currentIndex = upcomingDates.findIndex(d => getLocalDateFormat(d) === selectedDates[0]);
      if (currentIndex >= 0 && currentIndex < upcomingDates.length - 1) setSelectedDates([getLocalDateFormat(upcomingDates[currentIndex + 1])]);
      showToast("✅ 日常餐已儲存至購物車");
    } else if (isBulkMode) {
      showToast(`✅ 已成功套用至 ${selectedDates.length} 個日子`);
      setIsBulkMode(false); setSelectedDates([selectedDates[selectedDates.length - 1]]); 
    }
  };

  const confirmSpecialMeal = () => {
    if (!specForm.texture) return showToast("請選擇質感");
    const dStr = selectedDates[0];
    if (!dStr) return;
    setCart(prev => ({ ...prev, [dStr]: { isSpecial: true, specialName: selectingSpecial.meal.name, duration: selectingSpecial.duration, texture: specForm.texture, rice: specForm.rice, soupQty: 0, meals: {} } }));
    showToast(`✅ 已將 ${selectingSpecial.meal.name} 加入購物車`);
    setSelectingSpecial(null); setSpecForm({ texture: '', rice: '正飯' }); setActiveTab('cart');
  };
  
  const proceedToCheckout = () => {
    if (Object.keys(cart).length === 0) return showToast("購物車沒有餐點！");
    if (customerInfo) setCheckoutStep(customerInfo.address ? 'confirm' : 'address');
    else setCheckoutStep('login');
  };

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (loginPhone.length < 8) return showToast("請輸入有效的電話號碼");
    if (!loginPassword) return showToast("請輸入密碼");
    try {
      const q = query(collection(db, 'customers'), where("phone", "==", loginPhone));
      const snap = await getDocs(q);
      if (snap.empty) return showToast("找不到此電話號碼，請先註冊");
      
      const custData = snap.docs[0].data();
      const realPassword = custData.password || custData.phone;
      if (loginPassword !== realPassword) return showToast("密碼錯誤");

      setCustomerInfo(custData); setProfileForm(custData);
      setCheckoutStep(custData.address ? 'confirm' : 'address');
      showToast("登入成功！");
    } catch (err) { showToast("登入系統發生錯誤"); }
  };

  const handleRegister = async (e) => {
    e?.preventDefault();
    if (!profileForm.name || !profileForm.phone || !profileForm.password) return showToast("請填寫所有必填資料");
    try {
      const q = query(collection(db, 'customers'), where("phone", "==", profileForm.phone));
      const snap = await getDocs(q);
      if (!snap.empty) return showToast("此電話號碼已經註冊，請直接登入");

      const newId = `U${profileForm.phone}`;
      const newCustomerData = { id: newId, name: profileForm.name, contactName: profileForm.contactName || '', phone: profileForm.phone, password: profileForm.password, address: profileForm.address || '', type: 'B2C 普通個人', createdAt: new Date().toISOString() };
      
      await setDoc(doc(db, 'customers', newId), newCustomerData);
      setCustomerInfo(newCustomerData); setCheckoutStep('confirm'); 
      showToast("註冊成功！");
    } catch (err) { showToast("註冊失敗，請檢查網絡"); }
  };

  const handleSaveProfile = async () => {
    try {
      await setDoc(doc(db, 'customers', customerInfo.id), profileForm, { merge: true });
      setCustomerInfo(prev => ({ ...prev, ...profileForm }));
      showToast("✅ 個人資料已成功更新");
      setShowProfileEdit(false);
      if (checkoutStep === 'address') setCheckoutStep('confirm');
    } catch (err) { showToast("資料更新失敗"); }
  };

  const handleChangePassword = async () => {
    if (pwdForm.new !== pwdForm.confirm) return showToast("兩次輸入的新密碼不一致");
    if (pwdForm.new.length < 6) return showToast("密碼長度最少需要 6 位");
    const realPassword = customerInfo.password || customerInfo.phone;
    if (pwdForm.old !== realPassword) return showToast("舊密碼不正確");

    try {
      await setDoc(doc(db, 'customers', customerInfo.id), { password: pwdForm.new }, { merge: true });
      setCustomerInfo(prev => ({ ...prev, password: pwdForm.new }));
      showToast("✅ 密碼已成功更新");
      setPwdForm({ old: '', new: '', confirm: '' }); setShowPwdChange(false);
    } catch (err) { showToast("密碼更新失敗，請檢查網絡"); }
  };

  const submitFinalOrder = async () => {
    if (!customerInfo || !customerInfo.id) return showToast("請先登入及填寫送餐資料");
    try {
      const newOrders = [];
      for (const [dateStr, details] of Object.entries(cart)) {
        const counts = {};
        if (details.isSpecial) counts[`特別餐_${details.specialName}(${details.duration}日)_${details.texture}_${details.rice}`] = 1;
        else Object.entries(details.meals).forEach(([mealCode, data]) => { counts[`${mealCode}_${data.texture}_${data.rice}`] = 1; });

        const orderData = { date: dateStr, customerId: customerInfo.id, counts: counts, soupQty: details.soupQty || 0, referralCode: referralCode.trim(), status: '處理中', timestamp: new Date().toISOString() };
        const orderId = `${dateStr}_${customerInfo.id}`;
        await setDoc(doc(db, 'orders', orderId), orderData, { merge: true });
        newOrders.push({ id: orderId, ...orderData });
      }
      setOrderHistory(prev => [...newOrders, ...prev]); 
      setCart({}); setReferralCode(''); setCheckoutStep('success');

      const webhookUrl = "YOUR_WEBHOOK_URL_HERE"; 
      if (webhookUrl !== "YOUR_WEBHOOK_URL_HERE") {
        fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customerName: customerInfo.name, contactName: customerInfo.contactName, phone: customerInfo.phone, orderCount: Object.keys(cart).length, totalItems: newOrders.length, time: new Date().toLocaleString() }) }).catch(e => console.log("Webhook 發送失敗", e));
      }
    } catch (error) { showToast("提交訂單失敗，請檢查網絡"); }
  };

  const Toast = () => {
    if (!toastMsg) return null;
    return (
      <div className="fixed top-1/3 left-1/2 transform -translate-x-1/2 z-[100] animate-in zoom-in-95 duration-200">
        <div className="bg-[#3F2B1D] text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 w-max"><Info size={24} className="text-[#D97706] shrink-0"/><span className="text-lg font-medium tracking-wide">{toastMsg}</span></div>
      </div>
    );
  };

  // 🌟 點餐首頁 (已加入 Desktop 左右 Scroll 箭嘴)
  const renderHome = () => {
    if (upcomingDates.length === 0) return <div className="p-10 text-center text-gray-500">未來 30 天沒有可送餐日子</div>;

    const dStr = selectedDates[0];
    const todayMenu = menusData[dStr] || {}; 

    const toggleMeal = (meal) => {
      if (dailyForm.meals[meal]) {
        const newMeals = { ...dailyForm.meals }; delete newMeals[meal]; setDailyForm({ ...dailyForm, meals: newMeals });
        if (editingMeal === meal) setEditingMeal(null);
      } else { 
        setDailyForm({ ...dailyForm, meals: { ...dailyForm.meals, [meal]: { texture: '', rice: '正飯' } } }); 
        setEditingMeal(meal); 
      }
    };
    
    const setTextureForMeal = (meal, texture) => { setDailyForm(p => ({ ...p, meals: { ...p.meals, [meal]: { ...(p.meals[meal] || {}), texture } } })); };
    const setRiceForMeal = (meal, rice) => { setDailyForm(p => ({ ...p, meals: { ...p.meals, [meal]: { ...(p.meals[meal] || {}), rice } } })); };

    // 🌟 控制左右 Scroll 嘅 Function
    const scrollLeft = () => { if(scrollRef.current) scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' }); };
    const scrollRight = () => { if(scrollRef.current) scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' }); };

    return (
      <div className="pb-32 bg-[#FDFBF7] min-h-screen font-sans animate-in fade-in duration-500 relative">
        
        {selectingSpecial && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-end justify-center sm:items-center">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 animate-in slide-in-from-bottom-full sm:zoom-in-95">
               <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-[#3F2B1D]">「{selectingSpecial.meal.name}」選項</h3><button onClick={() => setSelectingSpecial(null)} className="p-2 bg-gray-100 rounded-full text-gray-500"><X size={20}/></button></div>
               
               <div className="text-sm text-[#7A6455] mb-2 font-medium">1. 選擇質感：</div>
               <div className="grid grid-cols-3 gap-2 mb-4">
                  {TEXTURES.map(t => (<button key={t} onClick={() => setSpecForm(p=>({...p, texture: t}))} className={`py-3 border-2 rounded-xl font-medium transition-all ${specForm.texture === t ? 'bg-[#3F2B1D] text-white border-[#3F2B1D]' : 'bg-white border-[#E5E5E5] text-[#3F2B1D]'}`}>{t}</button>))}
               </div>

               <div className="text-sm text-[#7A6455] mb-2 font-medium">2. 選擇飯類：</div>
               <div className="grid grid-cols-4 gap-2 mb-8">
                  {RICE_TEXTURES.map(r => (<button key={r} onClick={() => setSpecForm(p=>({...p, rice: r}))} className={`py-3 border-2 rounded-xl font-medium transition-all text-sm ${specForm.rice === r ? 'bg-[#D97706] text-white border-[#D97706]' : 'bg-white border-[#E5E5E5] text-[#3F2B1D]'}`}>{r}</button>))}
               </div>

               <button onClick={confirmSpecialMeal} className="w-full py-4 bg-[#D97706] text-white text-lg font-medium rounded-xl active:scale-95 shadow-md">確認加入購物車</button>
            </div>
          </div>
        )}

        <div className="bg-white px-5 py-5 border-b border-[#E5E5E5] sticky top-0 z-20 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-2xl font-semibold text-[#3F2B1D] tracking-wide">預訂餐點</h2>
            {mealType === 'daily' && (
              <button onClick={() => { setIsBulkMode(!isBulkMode); if(isBulkMode) setSelectedDates([selectedDates[0]]); }} className={`text-sm px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 ${isBulkMode ? 'bg-[#D97706] text-white' : 'bg-[#F3F0EA] text-[#7A6455]'}`}><Layers size={18}/> {isBulkMode ? '完成選日' : '批量選日'}</button>
            )}
          </div>
          
          {/* 🌟 帶左右箭嘴及自定 Scrollbar 嘅日曆列 */}
          <div className="relative flex items-center -mx-2 px-2">
            <button onClick={scrollLeft} className="p-1.5 bg-white shadow-md rounded-full text-[#7A6455] z-10 absolute left-2 border border-[#E5E5E5] hover:bg-[#F3F0EA] hidden sm:block"><ArrowLeft size={16}/></button>
            
            <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-4 pt-1 snap-x date-scrollbar w-full px-2">
              {upcomingDates.map((date) => {
                const dateStr = getLocalDateFormat(date);
                const isSelected = selectedDates.includes(dateStr);
                const hasCartItem = !!cart[dateStr];
                return (
                  <button type="button" key={dateStr} onClick={() => handleDateSelect(date)} className={`snap-center flex-shrink-0 w-[4.5rem] py-3 rounded-2xl transition-all relative flex flex-col items-center justify-center cursor-pointer ${isSelected ? 'bg-[#3F2B1D] text-white shadow-md' : 'bg-white border border-[#E5E5E5] text-[#7A6455]'} ${hasCartItem && !isSelected ? 'border-[#D97706] bg-[#FFFBEB]' : ''}`}>
                    {hasCartItem && <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#D97706] rounded-full"></div>}
                    <span className="text-[11px] font-medium mb-1">{['日','一','二','三','四','五','六'][date.getDay()]}</span><span className="text-xl font-semibold">{date.getDate()}</span>
                  </button>
                );
              })}
            </div>

            <button onClick={scrollRight} className="p-1.5 bg-white shadow-md rounded-full text-[#7A6455] z-10 absolute right-2 border border-[#E5E5E5] hover:bg-[#F3F0EA] hidden sm:block"><ArrowRight size={16}/></button>
          </div>
        </div>

        <div className="flex bg-[#F3F0EA] p-1.5 rounded-2xl mx-5 mt-6 shadow-inner">
           <button onClick={() => { setMealType('daily'); setIsBulkMode(false); setSelectedDates([selectedDates[0]]); }} className={`flex-1 py-3 rounded-xl text-base font-medium transition-all ${mealType==='daily'?'bg-white shadow-sm text-[#D97706]':'text-[#7A6455]'}`}>日常餐單</button>
           <button onClick={() => { setMealType('special'); setIsBulkMode(false); setSelectedDates([selectedDates[0]]); }} className={`flex-1 py-3 rounded-xl text-base font-medium transition-all ${mealType==='special'?'bg-white shadow-sm text-[#D97706]':'text-[#7A6455]'}`}>特別營養餐</button>
        </div>

        <div className="p-5 space-y-8 animate-in slide-in-from-bottom-2">
          {mealType === 'daily' && (
            <>
              <section>
                <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-medium text-[#3F2B1D]">1. 選擇主餐 <span className="text-sm text-[#9CA3AF] ml-2">可選多款</span></h3></div>
                <div className="space-y-4">
                  {MEALS.map(m => {
                    const mealData = dailyForm.meals[m];
                    const isSelected = !!mealData;
                    const isEditing = editingMeal === m;
                    let menuName = todayMenu[m] || '未有資料，以當日為準'; 

                    return (
                      <div key={m} className={`bg-white rounded-2xl transition-all overflow-hidden border ${isSelected ? 'border-[#D97706] shadow-md' : 'border-[#E5E5E5] shadow-sm'}`}>
                        <div className="p-5 cursor-pointer flex items-start gap-4" onClick={() => toggleMeal(m)}>
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shrink-0 ${isSelected ? 'bg-[#D97706] text-white' : 'bg-[#F3F0EA] text-[#7A6455]'}`}>{m}</div>
                          <div className="flex-1 pt-1">
                            <div className={`font-medium text-lg leading-snug ${isSelected ? 'text-[#3F2B1D]' : 'text-[#3F2B1D]'}`}>{menuName}</div>
                            {isSelected && mealData.texture && <div className="text-sm text-[#7A6455] mt-1.5">組合: <span className="font-semibold text-[#D97706]">{mealData.texture} + {mealData.rice}</span></div>}
                            {isSelected && !mealData.texture && <div className="text-sm text-[#EF4444] mt-1.5 font-medium">請在下方選擇質感</div>}
                          </div>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-2 ${isSelected ? 'bg-[#D97706] text-white' : 'border-2 border-[#E5E5E5] text-transparent'}`}><Check size={18} /></div>
                        </div>

                        {isEditing && (
                          <div className="px-5 pb-5 pt-4 bg-[#FAFAF9] border-t border-[#E5E5E5] animate-in slide-in-from-top-2">
                            <div className="text-sm text-[#7A6455] mb-2 font-medium">請選擇質感：</div>
                            <div className="flex flex-wrap gap-2 mb-5">
                              {TEXTURES.map(t => {
                                const isTexSelected = mealData.texture === t;
                                return <button key={t} type="button" onClick={(e) => { e.stopPropagation(); setTextureForMeal(m, t); }} className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border ${isTexSelected ? 'bg-[#3F2B1D] border-[#3F2B1D] text-white' : 'bg-white border-[#E5E5E5] text-[#7A6455] hover:border-[#D97706]'}`}>{t}</button>;
                              })}
                            </div>
                            <div className="text-sm text-[#7A6455] mb-2 font-medium">請選擇飯類：</div>
                            <div className="flex flex-wrap gap-2">
                              {RICE_TEXTURES.map(r => {
                                const isRiceSelected = mealData.rice === r;
                                return <button key={r} type="button" onClick={(e) => { e.stopPropagation(); setRiceForMeal(m, r); }} className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border ${isRiceSelected ? 'bg-[#D97706] border-[#D97706] text-white' : 'bg-white border-[#E5E5E5] text-[#7A6455] hover:border-[#D97706]'}`}>{r}</button>;
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
                <div className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-sm mb-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 text-[#3F2B1D]">
                      <Soup size={24} className="text-[#D97706]"/>
                      <div className="flex flex-col">
                        <span className="font-medium text-lg">滋潤例湯</span>
                        <span className="text-sm text-[#7A6455] mt-1">{todayMenu.Soup || '是日精選靚湯'}</span>
                      </div>
                    </div>
                    <button type="button" onClick={() => setDailyForm(p => ({...p, soupQty: p.soupQty ? 0 : 1}))}
                      className={`w-14 h-8 rounded-full transition-colors relative ${dailyForm.soupQty ? 'bg-[#D97706]' : 'bg-[#D1D5DB]'}`}>
                      <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all shadow-sm ${dailyForm.soupQty ? 'left-7' : 'left-1'}`}></div>
                    </button>
                  </div>
                </div>
              </section>

              <div className="pt-2 mb-8"><button type="button" onClick={handleAddToCart} className={`w-full py-4 rounded-2xl font-medium text-lg tracking-wide transition-all flex justify-center items-center gap-2 ${(Object.keys(dailyForm.meals).length === 0 && dailyForm.soupQty === 0) ? 'bg-[#E5E5E5] text-[#9CA3AF] cursor-not-allowed' : 'bg-[#D97706] text-white shadow-lg active:scale-95'}`}>{isBulkMode ? `套用至 ${selectedDates.length} 個日子` : (cart[selectedDates[0]] && !cart[selectedDates[0]].isSpecial ? '更新餐單' : '確認選餐')}</button></div>
            </>
          )}

          {mealType === 'special' && (
            <div className="space-y-6">
              <div className="bg-[#FFFBEB] p-4 rounded-2xl border border-[#FEF3C7] flex items-start gap-3"><Info size={20} className="text-[#D97706] shrink-0 mt-0.5"/><p className="text-sm text-[#92400E] leading-relaxed">請喺上方日曆選擇**首個送餐日**，系統會自動按您選擇嘅日數安排膳食。</p></div>
              {SPECIAL_MEALS.map(special => (
                <div key={special.id} className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden shadow-sm">
                  <div className="p-5 border-b border-[#F3F0EA]"><div className="flex items-center gap-3 mb-2"><div className="p-2 bg-[#F9FAF8] rounded-xl">{special.icon}</div><h3 className="text-xl font-bold text-[#3F2B1D]">{special.name}</h3></div><p className="text-sm text-[#7A6455] leading-relaxed">{special.desc}</p></div>
                  <div className="p-4 bg-[#FAFAF9] grid grid-cols-2 gap-3">
                    <button onClick={() => setSelectingSpecial({meal: special, duration: 7})} className="py-3 bg-white border border-[#E5E5E5] rounded-xl text-[#3F2B1D] font-medium text-sm hover:border-[#D97706] transition-colors active:scale-95">7日體驗</button>
                    <button onClick={() => setSelectingSpecial({meal: special, duration: 14})} className="py-3 bg-white border border-[#E5E5E5] rounded-xl text-[#3F2B1D] font-medium text-sm hover:border-[#D97706] transition-colors active:scale-95">14日療程</button>
                    <button onClick={() => setSelectingSpecial({meal: special, duration: 21})} className="py-3 bg-white border border-[#E5E5E5] rounded-xl text-[#3F2B1D] font-medium text-sm hover:border-[#D97706] transition-colors active:scale-95">21日全效</button>
                    <button onClick={() => window.open(`https://wa.me/${WHATSAPP_NUM}?text=你好，我想查詢關於 ${special.name} 嘅詳情。`, '_blank')} className="py-3 bg-[#3F2B1D] text-white rounded-xl font-medium text-sm hover:bg-[#291C13] transition-colors active:scale-95 flex justify-center items-center gap-1.5"><Phone size={14}/>聯絡我們</button>
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
        <h2 className="text-3xl font-semibold text-[#3F2B1D] mb-2">{title}</h2>{subtitle && <p className="text-base text-[#7A6455] mb-8">{subtitle}</p>}{content}
      </div>
    );

    if (checkoutStep === 'cart') {
      return (
        <div className="pb-24 bg-[#FDFBF7] min-h-screen font-sans animate-in fade-in duration-300">
          <div className="bg-white px-5 py-6 border-b border-[#E5E5E5] sticky top-0 z-10 shadow-sm"><h2 className="text-2xl font-semibold text-[#3F2B1D]">購物車</h2><p className="text-sm text-[#7A6455] mt-1.5">已選 {cartDates.length} 筆訂單</p></div>
          <div className="p-5 space-y-4">
            {cartDates.length === 0 ? (
              <div className="text-center py-24"><ShoppingBag size={56} strokeWidth={1.5} className="text-[#D1D5DB] mx-auto mb-5" /><p className="text-[#9CA3AF] text-lg">購物車是空的</p><button onClick={() => setActiveTab('home')} className="mt-8 bg-[#3F2B1D] text-white px-8 py-3.5 rounded-xl font-medium text-lg">去揀餐</button></div>
            ) : (
              <>
                {cartDates.map(dateStr => {
                  const item = cart[dateStr];
                  return (
                    <div key={dateStr} className="bg-white p-5 rounded-2xl border border-[#E5E5E5] flex gap-5 items-start shadow-sm relative overflow-hidden">
                      {item.isSpecial && <div className="absolute top-0 left-0 w-1.5 h-full bg-[#D97706]"></div>}
                      <div className="w-16 h-16 bg-[#F3F0EA] text-[#3F2B1D] rounded-xl flex flex-col justify-center items-center shrink-0"><span className="text-[10px] font-medium uppercase tracking-wider">{dateStr.substring(5, 7)}月</span><span className="text-2xl font-semibold leading-none mt-1">{dateStr.substring(8, 10)}</span></div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        {item.isSpecial ? (
                          <><div className="font-semibold text-lg text-[#D97706] mb-1">{item.specialName}</div><div className="text-sm text-[#7A6455]">送餐日數: {item.duration} 日<br/>組合: {item.texture} + {item.rice}<br/>(由 {formatDisplayDate(dateStr)} 起)</div></>
                        ) : (
                          <>
                            {Object.entries(item.meals).map(([m, data]) => (<div key={m} className="font-medium text-lg text-[#3F2B1D] mb-1.5">{m}餐 <span className="text-sm font-normal text-[#7A6455] border border-[#E5E5E5] rounded-lg px-2 py-0.5 ml-2 bg-[#F9FAF8] align-middle">{data.texture ? `${data.texture} + ${data.rice}` : '未選齊'}</span></div>))}
                            <div className="text-sm text-[#7A6455] mt-3">{item.soupQty > 0 ? <span className="mr-4">🍲 例湯</span> : null}{Object.keys(item.meals).length === 0 && item.soupQty === 0 && '無附加項目'}</div>
                          </>
                        )}
                      </div>
                      <button onClick={() => { const c = {...cart}; delete c[dateStr]; setCart(c); }} className="text-[#D1D5DB] hover:text-[#EF4444] p-2 transition-colors shrink-0"><Trash2 size={20}/></button>
                    </div>
                  );
                })}
                <button onClick={proceedToCheckout} className="w-full bg-[#D97706] text-white font-medium text-xl py-4 rounded-2xl shadow-lg mt-8 active:scale-95 flex justify-center items-center gap-2">去結帳 <ChevronRight size={22}/></button>
              </>
            )}
          </div>
        </div>
      );
    }
    
    if (checkoutStep === 'login') return renderCheckoutContainer(
      isLoginMode ? "登入系統" : "註冊新帳戶", isLoginMode ? "登入以管理訂單及資料" : "填寫資料成為會員", () => setCheckoutStep('cart'), 
      <div className="space-y-6 mt-4">
        {isLoginMode ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div><label className="text-sm font-medium text-[#7A6455] mb-2 block">手提電話號碼</label><input type="tel" value={loginPhone} onChange={e=>setLoginPhone(e.target.value)} placeholder="例如: 98765432" className="w-full bg-white border border-[#E5E5E5] px-5 py-4 rounded-xl outline-none focus:border-[#D97706] text-lg font-medium text-[#3F2B1D]" /></div>
            <div><label className="text-sm font-medium text-[#7A6455] mb-2 block">密碼 (首次登入請輸入電話)</label><input type="password" value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} placeholder="輸入密碼" className="w-full bg-white border border-[#E5E5E5] px-5 py-4 rounded-xl outline-none focus:border-[#D97706] text-lg font-medium text-[#3F2B1D]" /></div>
            <button type="submit" className="w-full bg-[#3F2B1D] text-white font-medium text-xl py-4 rounded-xl mt-4 active:scale-95">登入並繼續</button>
            <button type="button" onClick={() => { setIsLoginMode(false); setProfileForm({name:'', contactName:'', phone:loginPhone, password:'', address:''}); }} className="w-full py-4 text-[#D97706] font-medium text-lg">未有帳號？點此註冊</button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div><label className="text-sm font-medium text-[#7A6455] mb-2 block">客戶名稱 (長者/用膳者) *</label><input type="text" value={profileForm.name} onChange={e=>setProfileForm({...profileForm, name: e.target.value})} placeholder="例如: 陳大文" required className="w-full bg-white border border-[#E5E5E5] px-5 py-3 rounded-xl outline-none focus:border-[#D97706]" /></div>
            <div><label className="text-sm font-medium text-[#7A6455] mb-2 block">聯絡人名稱 (例如: 子女) *</label><input type="text" value={profileForm.contactName} onChange={e=>setProfileForm({...profileForm, contactName: e.target.value})} placeholder="例如: 陳小姐" required className="w-full bg-white border border-[#E5E5E5] px-5 py-3 rounded-xl outline-none focus:border-[#D97706]" /></div>
            <div><label className="text-sm font-medium text-[#7A6455] mb-2 block">手提電話號碼 *</label><input type="tel" value={profileForm.phone} onChange={e=>setProfileForm({...profileForm, phone: e.target.value})} placeholder="例如: 98765432" required className="w-full bg-white border border-[#E5E5E5] px-5 py-3 rounded-xl outline-none focus:border-[#D97706]" /></div>
            <div><label className="text-sm font-medium text-[#7A6455] mb-2 block">設定登入密碼 *</label><input type="password" value={profileForm.password} onChange={e=>setProfileForm({...profileForm, password: e.target.value})} placeholder="最少 6 位" required className="w-full bg-white border border-[#E5E5E5] px-5 py-3 rounded-xl outline-none focus:border-[#D97706]" /></div>
            <button type="submit" className="w-full bg-[#D97706] text-white font-medium text-xl py-4 rounded-xl mt-4 active:scale-95">註冊並繼續</button>
            <button type="button" onClick={() => setIsLoginMode(true)} className="w-full py-4 text-[#9CA3AF] font-medium text-lg">返回登入</button>
          </form>
        )}
      </div>
    );

    if (checkoutStep === 'address') return renderCheckoutContainer("送餐地址", "請提供詳細地址", () => setCheckoutStep('cart'), <><textarea value={profileForm.address || ''} onChange={e=>setProfileForm(p=>({...p, address: e.target.value}))} placeholder="請輸入大廈名稱、座數及樓層..." className="w-full bg-white border border-[#E5E5E5] p-5 rounded-xl outline-none focus:border-[#D97706] min-h-[160px] resize-none text-lg text-[#3F2B1D] leading-relaxed"></textarea><button onClick={handleSaveProfile} className="w-full bg-[#3F2B1D] text-white font-medium text-xl py-4 rounded-xl mt-6 active:scale-95">確定儲存</button></>);
    
    if (checkoutStep === 'confirm') return renderCheckoutContainer(
      "最後確認", "請核對以下資料", () => setCheckoutStep('cart'),
      <>
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 mb-4 space-y-6 shadow-sm"><div className="flex gap-4 items-start"><MapPin size={24} className="text-[#D97706] shrink-0 mt-0.5" /><div><div className="text-lg font-medium text-[#3F2B1D] mb-1">{customerInfo.name} <span className="text-base text-[#7A6455]">({customerInfo.phone})</span></div><div className="text-sm text-[#9CA3AF] mb-1">聯絡人: {customerInfo.contactName || '無'}</div><div className="text-base text-[#7A6455] leading-relaxed">{customerInfo.address}</div></div></div><div className="h-px bg-[#E5E5E5] w-full"></div><div className="flex gap-4 items-center"><Receipt size={24} className="text-[#D97706] shrink-0" /><div className="text-lg font-medium text-[#3F2B1D]">您合共預訂了 <span className="font-semibold text-[#D97706]">{cartDates.length}</span> 筆預約</div></div></div>
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 mb-8 shadow-sm"><label className="text-sm font-medium text-[#7A6455] mb-2 block">推薦碼 (如有)</label><input type="text" value={referralCode} onChange={e => setReferralCode(e.target.value)} placeholder="輸入推薦碼..." className="w-full bg-[#F9FAF8] border border-[#E5E5E5] px-5 py-4 rounded-xl outline-none focus:border-[#D97706] text-lg font-medium text-[#3F2B1D]" /></div>
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

  const renderBlog = () => { return <div className="pb-24 bg-[#FDFBF7] min-h-screen font-sans"><div className="bg-white px-5 py-6 border-b border-[#E5E5E5] sticky top-0 z-10"><h2 className="text-2xl font-semibold text-[#3F2B1D]">健康資訊</h2></div><div className="p-5">{blogsData.length === 0 ? <p className="text-gray-400 text-center mt-10">尚無文章</p> : blogsData.map(post => (<div key={post.id} className="bg-white rounded-2xl border border-[#E5E5E5] mb-5 p-6"><h3 className="text-xl font-medium">{post.title}</h3><p className="mt-2 text-[#7A6455]">{post.summary}</p></div>))}</div></div>; };
  
  const renderTest = () => {
    if (testResult) {
      const info = CONSTITUTIONS[testResult]; const Icon = info.icon;
      return ( <div className="min-h-screen bg-[#FDFBF7] p-5 pt-10 font-sans animate-in fade-in pb-24"><div className="text-center mb-8"><div className="text-sm tracking-widest text-[#9CA3AF] mb-3">分析結果</div><div className={`w-24 h-24 mx-auto rounded-full ${info.bg} ${info.color} flex items-center justify-center mb-5 shadow-sm`}><Icon size={40} strokeWidth={1.5}/></div><h2 className={`text-3xl font-semibold ${info.color} mb-3`}>{info.name}</h2><span className="text-sm bg-white border border-[#E5E5E5] px-4 py-1.5 rounded-full text-[#7A6455] shadow-sm">特徵：{info.tag}</span></div><div className="bg-white rounded-2xl p-6 border border-[#E5E5E5] mb-8 shadow-sm"><div className="flex items-center gap-2.5 mb-3 text-[#3F2B1D]"><CheckSquare size={20} className="text-[#D97706]"/> <span className="font-medium text-lg">系統已記錄您的體質</span></div><p className="text-base text-[#7A6455] leading-relaxed">往後在點餐時，系統會自動在適合您的菜式旁顯示推薦標籤，助您輕鬆選擇養生膳食。</p></div><button onClick={() => setActiveTab('home')} className="w-full bg-[#D97706] text-white font-medium text-lg py-4 rounded-2xl shadow-md mb-4">立即前往選餐</button><button onClick={() => { setTestResult(null); setTestAnswers({}); setTestStep(0); }} className="w-full text-[#9CA3AF] text-base py-3">重新測試</button></div> );
    }
    const currentQ = TEST_QUESTIONS[testStep]; const progress = Math.round(((testStep + 1) / TEST_QUESTIONS.length) * 100);
    const handleAnswer = (score) => {
      setTestAnswers(prev => ({...prev, [currentQ.id]: score}));
      if (testStep < TEST_QUESTIONS.length - 1) setTimeout(() => setTestStep(s => s + 1), 250); 
      else {
        const a = {...testAnswers, [currentQ.id]: score}; const scores = { B: a[1]||0, C: a[2]||0, D: ((a[3]||0)+(a[4]||0))/2, E: a[5]||0, F: a[6]||0, G: ((a[7]||0)+(a[8]||0))/2, H: a[9]||0, I: ((a[10]||0)+(a[11]||0))/2 };
        let maxScore = 0; let res = 'A'; Object.keys(scores).forEach(k => { if(scores[k] > maxScore) { maxScore = scores[k]; res = k; } });
        const healthScore = ((a[12]||0)+(a[13]||0)+(a[14]||0)+(a[15]||0))/4; if (maxScore < 3 && healthScore >= 3) res = 'A'; setTestResult(res); 
      }
    };
    return ( <div className="pb-24 bg-[#FDFBF7] min-h-screen font-sans flex flex-col"><div className="bg-white px-5 py-6 border-b border-[#E5E5E5] sticky top-0 z-10 shadow-sm"><div className="flex justify-between items-center mb-3"><h2 className="text-2xl font-semibold text-[#3F2B1D]">體質自測</h2><span className="text-sm font-medium text-[#D97706]">{testStep + 1} / {TEST_QUESTIONS.length}</span></div><div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden"><div className="bg-[#D97706] h-full transition-all duration-300" style={{width: `${progress}%`}}></div></div></div><div className="flex-1 p-5 flex flex-col justify-center animate-in slide-in-from-right-4 duration-300" key={testStep}><div className="bg-white p-8 rounded-3xl border border-[#E5E5E5] shadow-sm mb-6"><div className={`text-sm font-semibold mb-4 tracking-wider ${currentQ.isReverse ? 'text-[#10B981]' : 'text-[#D97706]'}`}>{currentQ.isReverse ? `健康指標` : `第 ${testStep + 1} 題`}</div><h3 className="text-2xl text-[#3F2B1D] mb-8 leading-snug font-medium">{currentQ.text}</h3><div className="flex flex-col gap-3">{[{val: 1, label: '從不'}, {val: 2, label: '很少'}, {val: 3, label: '有時'}, {val: 4, label: '經常'}, {val: 5, label: '總是'}].map(s => (<button key={s.val} onClick={() => handleAnswer(s.val)} className={`w-full py-4 px-6 rounded-2xl text-lg font-medium transition-all border flex justify-between items-center ${testAnswers[currentQ.id] === s.val ? 'bg-[#3F2B1D] border-[#3F2B1D] text-white shadow-md scale-[1.02]' : 'bg-[#F9FAF8] border-[#E5E5E5] text-[#7A6455] hover:border-[#D97706]'}`}><span>{s.label}</span><span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${testAnswers[currentQ.id] === s.val ? 'bg-white/20' : 'bg-white border'}`}>{s.val}</span></button>))}</div></div><div className="flex justify-between px-2">{testStep > 0 ? (<button onClick={() => setTestStep(s => s - 1)} className="text-[#9CA3AF] font-medium flex items-center gap-1 py-2"><ArrowLeft size={16}/> 上一題</button>) : <div></div>}</div></div></div> );
  };

  const renderProfile = () => {
    return (
      <div className="pb-24 bg-[#FDFBF7] min-h-screen font-sans animate-in fade-in relative">
        {showPwdChange && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-end sm:items-center">
             <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 animate-in slide-in-from-bottom-full sm:zoom-in-95">
                <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-[#3F2B1D] flex items-center gap-2"><Lock size={20}/> 更改密碼</h3><button onClick={() => setShowPwdChange(false)} className="p-2 bg-gray-100 rounded-full text-gray-500"><X size={20}/></button></div>
                <div className="space-y-4 mb-8"><div><label className="text-sm font-medium text-[#7A6455] mb-1.5 block">舊密碼</label><input type="password" value={pwdForm.old} onChange={e=>setPwdForm(p=>({...p, old: e.target.value}))} className="w-full bg-[#F9FAF8] border border-[#E5E5E5] px-4 py-3 rounded-xl outline-none focus:border-[#D97706]" /></div><div><label className="text-sm font-medium text-[#7A6455] mb-1.5 block">新密碼</label><input type="password" value={pwdForm.new} onChange={e=>setPwdForm(p=>({...p, new: e.target.value}))} className="w-full bg-[#F9FAF8] border border-[#E5E5E5] px-4 py-3 rounded-xl outline-none focus:border-[#D97706]" /></div><div><label className="text-sm font-medium text-[#7A6455] mb-1.5 block">確認新密碼</label><input type="password" value={pwdForm.confirm} onChange={e=>setPwdForm(p=>({...p, confirm: e.target.value}))} className="w-full bg-[#F9FAF8] border border-[#E5E5E5] px-4 py-3 rounded-xl outline-none focus:border-[#D97706]" /></div></div>
                <button onClick={handleChangePassword} className="w-full py-4 bg-[#3F2B1D] text-white rounded-xl font-medium text-lg active:scale-95 transition-all">確認更改</button>
             </div>
          </div>
        )}
        
        {showProfileEdit && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-end sm:items-center">
             <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 animate-in slide-in-from-bottom-full sm:zoom-in-95 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-[#3F2B1D] flex items-center gap-2"><Edit3 size={20}/> 修改個人資料</h3><button onClick={() => setShowProfileEdit(false)} className="p-2 bg-gray-100 rounded-full text-gray-500"><X size={20}/></button></div>
                <div className="space-y-4 mb-8">
                  <div><label className="text-sm font-medium text-[#7A6455] mb-1.5 block">客戶名稱 (長者/用膳者)</label><input type="text" value={profileForm.name || ''} onChange={e=>setProfileForm(p=>({...p, name: e.target.value}))} className="w-full bg-[#F9FAF8] border border-[#E5E5E5] px-4 py-3 rounded-xl outline-none focus:border-[#D97706]" /></div>
                  <div><label className="text-sm font-medium text-[#7A6455] mb-1.5 block">聯絡人名稱 (例如: 子女)</label><input type="text" value={profileForm.contactName || ''} onChange={e=>setProfileForm(p=>({...p, contactName: e.target.value}))} className="w-full bg-[#F9FAF8] border border-[#E5E5E5] px-4 py-3 rounded-xl outline-none focus:border-[#D97706]" /></div>
                  <div><label className="text-sm font-medium text-[#7A6455] mb-1.5 block">手提電話 (登入用)</label><input type="tel" value={profileForm.phone || ''} disabled className="w-full bg-gray-100 border border-[#E5E5E5] px-4 py-3 rounded-xl text-gray-500" /></div>
                  <div><label className="text-sm font-medium text-[#7A6455] mb-1.5 block">送餐地址</label><textarea value={profileForm.address || ''} onChange={e=>setProfileForm(p=>({...p, address: e.target.value}))} className="w-full bg-[#F9FAF8] border border-[#E5E5E5] px-4 py-3 rounded-xl outline-none focus:border-[#D97706] min-h-[100px] resize-none"></textarea></div>
                </div>
                <button onClick={handleSaveProfile} className="w-full py-4 bg-[#D97706] text-white rounded-xl font-medium text-lg active:scale-95 transition-all">儲存資料</button>
             </div>
          </div>
        )}

        <div className="bg-white px-5 py-8 border-b border-[#E5E5E5] shadow-sm">
          {customerInfo ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5"><div className="w-16 h-16 bg-[#F3F0EA] text-[#7A6455] rounded-full flex items-center justify-center"><User size={32} strokeWidth={1.5}/></div><div><h2 className="text-2xl font-semibold text-[#3F2B1D]">{customerInfo.name}</h2><div className="text-base text-[#7A6455] mt-1">{customerInfo.phone}</div></div></div>
              <button onClick={() => setShowProfileEdit(true)} className="p-2 bg-gray-50 text-[#D97706] rounded-full"><Edit3 size={20}/></button>
            </div>
          ) : (
            <div><h2 className="text-2xl font-semibold text-[#3F2B1D] mb-2">我的帳戶</h2><p className="text-base text-[#7A6455] mb-6">登入後可以查看訂單及資料</p><button onClick={() => { setActiveTab('cart'); setCheckoutStep('login'); }} className="w-full py-3.5 bg-[#3F2B1D] text-white text-lg font-medium rounded-xl">立即登入</button></div>
          )}
        </div>
        
        {customerInfo && (
          <div className="p-5">
            <h3 className="text-sm font-medium text-[#9CA3AF] tracking-widest uppercase mb-4 mt-2">⚙️ 帳戶設定</h3>
            <div className="bg-white rounded-2xl border border-[#E5E5E5] shadow-sm mb-8 overflow-hidden">
               <div className="p-4 border-b border-[#E5E5E5] flex justify-between items-center bg-[#FAFAF9]"><div><div className="text-xs text-[#9CA3AF] mb-1">聯絡人名稱</div><div className="text-sm font-medium text-[#3F2B1D]">{customerInfo.contactName || '未提供'}</div></div></div>
               <div className="p-4 border-b border-[#E5E5E5] flex justify-between items-center"><div><div className="text-xs text-[#9CA3AF] mb-1">送餐地址</div><div className="text-sm text-[#7A6455]">{customerInfo.address || '未填寫'}</div></div></div>
               <button onClick={() => setShowPwdChange(true)} className="w-full p-4 flex justify-between items-center hover:bg-gray-50 transition-colors text-left"><span className="text-sm font-medium text-[#3F2B1D]">修改登入密碼</span><ChevronRight size={18} className="text-gray-400"/></button>
            </div>

            <h3 className="text-sm font-medium text-[#9CA3AF] tracking-widest uppercase mb-4">📝 您的近期紀錄</h3>
            {orderHistory.length === 0 ? <div className="bg-white p-8 rounded-2xl border border-[#E5E5E5] text-center shadow-sm"><p className="text-lg text-[#9CA3AF]">暫時未有任何紀錄</p></div> : (
              <div className="space-y-4">
                {orderHistory.map(o => (
                  <div key={o.id} className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-sm">
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#F3F0EA]"><span className="text-lg font-medium text-[#3F2B1D]">{formatDisplayDate(o.date)} 送餐</span><span className="text-xs font-medium px-2.5 py-1 bg-[#ECFDF5] text-[#059669] rounded-md">{o.status}</span></div>
                    <div className="text-base text-[#7A6455] space-y-2">
                      {Object.keys(o.counts).map(k => <div key={k}>✅ {k.split('_')[0]}餐 <span className="text-[#9CA3AF] text-sm ml-1">({k.split('_').slice(1).join(' + ')})</span></div>)}
                      {o.soupQty > 0 ? <div>🍲 例湯 x{o.soupQty}</div> : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => { setCustomerInfo(null); setOrderHistory([]); }} className="w-full mt-8 py-3.5 bg-white text-[#EF4444] text-lg font-medium border border-[#FECACA] rounded-xl hover:bg-[#FEF2F2] transition-colors">登出帳戶</button>
          </div>
        )}
      </div>
    );
  };

  const cartItemCount = Object.keys(cart).length;

  return (
    <div className="min-h-screen bg-[#E5E7EB] flex justify-center selection:bg-[#F3F0EA]">
      <style>{`.date-scrollbar::-webkit-scrollbar { height: 4px; } .date-scrollbar::-webkit-scrollbar-track { background: transparent; } .date-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }`}</style>
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
          <button onClick={() => { setActiveTab('home'); setCheckoutStep('cart'); }} className={`flex flex-col items-center justify-end gap-1.5 flex-1 pb-2 transition-colors ${activeTab === 'home' ? 'text-[#D97706]' : 'text-[#9CA3AF]'}`}><CalendarDays size={26} strokeWidth={activeTab === 'home' ? 2.5 : 1.5} /><span className="text-[10px] font-medium">點餐</span></button>
          <button onClick={() => setActiveTab('blog')} className={`flex flex-col items-center justify-end gap-1.5 flex-1 pb-2 transition-colors ${activeTab === 'blog' ? 'text-[#D97706]' : 'text-[#9CA3AF]'}`}><BookOpen size={26} strokeWidth={activeTab === 'blog' ? 2.5 : 1.5} /><span className="text-[10px] font-medium">資訊</span></button>
          <button onClick={() => { setActiveTab('cart'); if(checkoutStep === 'success') setCheckoutStep('cart'); }} className="flex flex-col items-center justify-end gap-1 flex-1 relative pb-2"><div className={`relative w-[3.5rem] h-[3.5rem] rounded-full flex items-center justify-center -mt-7 shadow-sm border ${activeTab === 'cart' ? 'bg-[#D97706] border-[#D97706] text-white' : 'bg-white border-[#E5E5E5] text-[#3F2B1D]'}`}><ShoppingBag size={24} strokeWidth={activeTab === 'cart' ? 2 : 1.5} />{cartItemCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#EF4444] rounded-full text-[10px] flex items-center justify-center text-white font-bold border-2 border-white">{cartItemCount}</span>}</div><span className={`text-[10px] font-medium transition-colors ${activeTab === 'cart' ? 'text-[#D97706]' : 'text-[#9CA3AF]'}`}>購物車</span></button>
          <button onClick={() => setActiveTab('test')} className={`flex flex-col items-center justify-end gap-1.5 flex-1 pb-2 transition-colors ${activeTab === 'test' ? 'text-[#D97706]' : 'text-[#9CA3AF]'}`}><Activity size={26} strokeWidth={activeTab === 'test' ? 2.5 : 1.5} /><span className="text-[10px] font-medium">體質</span></button>
          <button onClick={() => { setActiveTab('profile'); setCheckoutStep('cart'); }} className={`flex flex-col items-center justify-end gap-1.5 flex-1 pb-2 transition-colors ${activeTab === 'profile' ? 'text-[#D97706]' : 'text-[#9CA3AF]'}`}><User size={26} strokeWidth={activeTab === 'profile' ? 2.5 : 1.5} /><span className="text-[10px] font-medium">我的</span></button>
        </div>
      </div>
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } .pb-safe { padding-bottom: env(safe-area-inset-bottom, 1.25rem); }`}</style>
    </div>
  );
}
