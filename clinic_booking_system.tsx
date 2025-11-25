import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, AlertCircle, CheckCircle, Lock } from 'lucide-react';

export default function ClinicBookingSystem() {
  const [bookings, setBookings] = useState([]);
  const [formData, setFormData] = useState({
    patientName: '',
    phone: '',
    date: '',
    time: ''
  });
  const [currentBooking, setCurrentBooking] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const result = await window.storage.get('clinic_bookings');
      if (result && result.value) {
        setBookings(JSON.parse(result.value));
      }
    } catch (error) {
      console.log('لا توجد حجوزات سابقة');
    } finally {
      setLoading(false);
    }
  };

  const saveBookings = async (updatedBookings) => {
    try {
      await window.storage.set('clinic_bookings', JSON.stringify(updatedBookings));
    } catch (error) {
      console.error('خطأ في حفظ البيانات:', error);
    }
  };

  const isTimeSlotTaken = (date, time) => {
    return bookings.some(booking => 
      booking.date === date && booking.time === time
    );
  };

  const sendWhatsAppMessage = (booking) => {
    const clinicPhone = '201010557102';
    const message = `حجز جديد في العيادة 📋

👤 اسم المريض: ${booking.patientName}
📱 رقم الهاتف: ${booking.phone}
📅 التاريخ: ${booking.date}
⏰ الوقت: ${booking.time}
🔢 رقم الحجز: ${booking.id}

تم الحجز بنجاح ✅`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${clinicPhone}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const handleSubmit = async () => {
    if (!formData.patientName || !formData.phone || !formData.date || !formData.time) {
      setMessage({ type: 'error', text: 'برجاء إكمال جميع البيانات' });
      return;
    }

    if (formData.phone.length < 11) {
      setMessage({ type: 'error', text: 'رقم الهاتف غير صحيح' });
      return;
    }

    if (isTimeSlotTaken(formData.date, formData.time)) {
      setMessage({ 
        type: 'error', 
        text: 'هذا الموعد محجوز بالفعل. برجاء اختيار موعد آخر' 
      });
      return;
    }

    const newBooking = {
      id: Date.now(),
      ...formData,
      createdAt: new Date().toISOString()
    };

    const updatedBookings = [...bookings, newBooking];
    setBookings(updatedBookings);
    await saveBookings(updatedBookings);
    
    setCurrentBooking(newBooking);
    
    setMessage({ 
      type: 'success', 
      text: 'تم الحجز بنجاح! سيتم فتح واتساب لإرسال تفاصيل الحجز' 
    });
    
    setTimeout(() => {
      sendWhatsAppMessage(newBooking);
    }, 1000);
    
    setFormData({
      patientName: '',
      phone: '',
      date: '',
      time: ''
    });
  };

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 20; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 20) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return slots;
  };

  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-xl text-blue-600">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4 md:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-900 mb-2">
                نظام حجز العيادة
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                بياناتك في سرية تامة
              </p>
            </div>
            <Calendar className="w-16 h-16 text-blue-500" />
          </div>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border-2 border-green-300' 
              : 'bg-red-100 text-red-800 border-2 border-red-300'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-6 h-6 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <User className="w-6 h-6 text-blue-500" />
              احجز موعدك
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  اسم المريض
                </label>
                <input
                  type="text"
                  value={formData.patientName}
                  onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition"
                  placeholder="أدخل اسمك الكامل"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  رقم الهاتف
                </label>
                <div className="relative">
                  <Phone className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 pr-10 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition"
                    placeholder="01xxxxxxxxx"
                    maxLength="11"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  التاريخ
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  min={getMinDate()}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  الوقت
                </label>
                <select
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition"
                >
                  <option value="">اختر الوقت</option>
                  {generateTimeSlots().map(time => (
                    <option 
                      key={time} 
                      value={time}
                      disabled={formData.date && isTimeSlotTaken(formData.date, time)}
                    >
                      {time} {formData.date && isTimeSlotTaken(formData.date, time) ? '(محجوز)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-blue-700 transition shadow-lg hover:shadow-xl"
              >
                تأكيد الحجز
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-500" />
              حجزك الحالي
            </h2>
            
            {currentBooking ? (
              <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-5">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-bold text-green-800">تم الحجز بنجاح</span>
                  </div>
                  
                  <div className="border-t-2 border-green-200 pt-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">رقم الحجز:</span>
                      <span className="font-bold text-gray-800">{currentBooking.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">الاسم:</span>
                      <span className="font-bold text-gray-800">{currentBooking.patientName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">الهاتف:</span>
                      <span className="font-bold text-gray-800">{currentBooking.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">التاريخ:</span>
                      <span className="font-bold text-gray-800">{currentBooking.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">الوقت:</span>
                      <span className="font-bold text-gray-800">{currentBooking.time}</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>ملاحظة:</strong> احتفظ برقم الحجز للمراجعة في العيادة
                    </p>
                  </div>

                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <strong>تم إرسال تفاصيل الحجز عبر واتساب إلى العيادة</strong>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">لا يوجد حجز حالي</p>
                <p className="text-gray-400 text-sm mt-2">قم بملء النموذج لحجز موعدك</p>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-bold mb-1">حماية الخصوصية:</p>
                  <p>لا يمكن لأي شخص الاطلاع على بياناتك أو بيانات المرضى الآخرين. كل مريض يرى حجزه فقط.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">مواعيد العمل</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-700">ساعات العمل</p>
                <p className="text-sm text-gray-600">من 9:00 صباحاً إلى 9:00 مساءً</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-700">أيام العمل</p>
                <p className="text-sm text-gray-600">يومياً ما عدا الجمعة</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}