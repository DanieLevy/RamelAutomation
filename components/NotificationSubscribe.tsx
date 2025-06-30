import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import InlineDatePicker from './InlineDatePicker';
import { Bell, Calendar, Clock, Zap, Settings, Check } from 'lucide-react';

interface NotificationSettings {
  maxNotifications: number;
  intervalMinutes: number;
  notifyOnEveryNew: boolean;
  // Smart scheduling settings
  preferredSendTime?: string;
  batchNotifications?: boolean;
  batchIntervalHours?: number;
  enableUrgentMode?: boolean;
  sendOnWeekends?: boolean;
}

interface NotificationSubscribeProps {
  defaultEmail?: string;
  onSubscriptionChange?: () => void;
}

export default function NotificationSubscribe({ 
  defaultEmail,
  onSubscriptionChange 
}: NotificationSubscribeProps) {
  const [email, setEmail] = useState(defaultEmail || '');
  const [searchType, setSearchType] = useState<'date' | 'range'>('date');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('moderate');
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    maxNotifications: 3,
    intervalMinutes: 30,
    notifyOnEveryNew: true,
    // Smart scheduling defaults
    preferredSendTime: '09:00',
    batchNotifications: true,
    batchIntervalHours: 4,
    enableUrgentMode: true,
    sendOnWeekends: false
  });

  useEffect(() => {
    if (defaultEmail) {
      setEmail(defaultEmail);
      validateEmail(defaultEmail);
    }
  }, [defaultEmail]);

  const validateEmail = (email: string) => {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    setIsEmailValid(isValid);
    return isValid;
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    validateEmail(value);
  };

  const presetOptions = [
    {
      id: 'instant',
      name: 'התראה מיידית בלבד',
      description: 'התראה אחת, מיידית',
      icon: Zap,
      settings: { maxNotifications: 1, intervalMinutes: 0, notifyOnEveryNew: true }
    },
    {
      id: 'moderate',
      name: 'התראות מתונות',
      description: '3 התראות, כל 30 דקות',
      icon: Bell,
      settings: { maxNotifications: 3, intervalMinutes: 30, notifyOnEveryNew: true }
    },
    {
      id: 'persistent',
      name: 'התראות מתמידות',
      description: '5 התראות, כל 15 דקות',
      icon: Clock,
      settings: { maxNotifications: 5, intervalMinutes: 15, notifyOnEveryNew: true }
    },
    {
      id: 'custom',
      name: 'הגדרות מותאמות',
      description: 'בחר בעצמך',
      icon: Settings,
      settings: notificationSettings
    }
  ];

  const handlePresetChange = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = presetOptions.find(p => p.id === presetId);
    if (preset && presetId !== 'custom') {
      setNotificationSettings({
        maxNotifications: preset.settings.maxNotifications,
        intervalMinutes: preset.settings.intervalMinutes,
        notifyOnEveryNew: preset.settings.notifyOnEveryNew
      });
    }
  };

  const handleNotifySettingsChange = (key: keyof NotificationSettings, value: any) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleRangeChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage('נא להזין כתובת מייל');
      return;
    }

    if (searchType === 'date' && !selectedDate) {
      setMessage('נא לבחור תאריך');
      return;
    }

    if (searchType === 'range' && (!startDate || !endDate)) {
      setMessage('נא לבחור טווח תאריכים');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const criteria = searchType === 'date' 
        ? { date: selectedDate!.toISOString().split('T')[0] }
        : { 
            start: startDate!.toISOString().split('T')[0], 
            end: endDate!.toISOString().split('T')[0] 
          };

      const response = await fetch('/api/notify-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          criteria,
          searchType,
          notificationSettings: {
            maxNotifications: notificationSettings.maxNotifications,
            intervalMinutes: notificationSettings.intervalMinutes,
            notifyOnEveryNew: notificationSettings.notifyOnEveryNew,
            // Smart scheduling settings
            preferredSendTime: notificationSettings.preferredSendTime,
            batchNotifications: notificationSettings.batchNotifications,
            batchIntervalHours: notificationSettings.batchIntervalHours,
            enableUrgentMode: notificationSettings.enableUrgentMode,
            sendOnWeekends: notificationSettings.sendOnWeekends
          }
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('ההתראה נרשמה בהצלחה! תקבל מייל עם תוצאות בקרוב');
        // Reset form
        setSelectedDate(null);
        setStartDate(null);
        setEndDate(null);
        setSelectedPreset('moderate');
        setNotificationSettings({
          maxNotifications: 3,
          intervalMinutes: 30,
          notifyOnEveryNew: true
        });
        onSubscriptionChange?.();
      } else {
        setMessage(data.error || 'שגיאה בשליחת הבקשה');
      }
    } catch (error) {
      setMessage('שגיאה בחיבור לשרת');
    } finally {
      setLoading(false);
    }
  };

  const getSettingsSummary = () => {
    const preset = presetOptions.find(p => p.id === selectedPreset);
    if (preset && selectedPreset !== 'custom') {
      return preset.description;
    }
    
    const interval = notificationSettings.intervalMinutes === 0 
      ? 'מיידי' 
      : notificationSettings.intervalMinutes < 60 
        ? `כל ${notificationSettings.intervalMinutes} דקות`
        : notificationSettings.intervalMinutes === 60 
          ? 'כל שעה'
          : `כל ${Math.floor(notificationSettings.intervalMinutes / 60)} שעות`;
    
    return `${notificationSettings.maxNotifications} התראות, ${interval}`;
  };

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-6" dir="rtl">
        {/* Email Input - Only show if no defaultEmail */}
        {!defaultEmail && (
          <div className="space-y-2">
            <label htmlFor="email-input" className="block text-sm font-medium text-right">
              כתובת מייל
            </label>
            <div className="relative">
              <input
                id="email-input"
                type="email"
                name="email"
                value={email}
                onChange={e => handleEmailChange(e.target.value)}
                placeholder="example@gmail.com"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 bg-background ${
                  email && !isEmailValid ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'
                }`}
                required
                dir="ltr"
              />
            </div>
            {email && !isEmailValid && (
              <span className="text-xs text-destructive block text-right">
                כתובת מייל לא תקינה
              </span>
            )}
          </div>
        )}

        {/* Search Type Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">בחר סוג חיפוש</h3>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={searchType === 'date' ? 'default' : 'outline'}
              onClick={() => setSearchType('date')}
              className="flex-1 h-12"
            >
              <Calendar className="w-4 h-4 ml-2" />
              יום ספציפי
            </Button>
            <Button
              type="button"
              variant={searchType === 'range' ? 'default' : 'outline'}
              onClick={() => setSearchType('range')}
              className="flex-1 h-12"
            >
              <Calendar className="w-4 h-4 ml-2" />
              טווח ימים
            </Button>
          </div>
        </div>

        {/* Date Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            {searchType === 'date' ? 'בחר תאריך' : 'בחר טווח תאריכים'}
          </h3>
          
          <InlineDatePicker
            mode={searchType === 'date' ? 'single' : 'range'}
            value={selectedDate || undefined}
            onChange={setSelectedDate}
            startDate={startDate || undefined}
            endDate={endDate || undefined}
            onRangeChange={handleRangeChange}
          />
        </div>

        {/* Notification Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">הגדרות התראות</h3>
          
          <div className="space-y-3">
            {presetOptions.map((preset) => {
              const Icon = preset.icon;
              const isSelected = selectedPreset === preset.id;
              
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetChange(preset.id)}
                  className={`w-full p-3 rounded-xl border text-right transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary/5 shadow-sm' 
                      : 'border-border hover:border-border/60 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{preset.name}</div>
                        <div className="text-xs text-muted-foreground">{preset.description}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Settings */}
          {selectedPreset === 'custom' && (
            <div className="p-4 border border-border rounded-xl bg-muted/20 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">מספר התראות</label>
                  <Select 
                    value={notificationSettings.maxNotifications.toString()} 
                    onValueChange={(value) => handleNotifySettingsChange('maxNotifications', parseInt(value))}
                  >
                    <SelectTrigger className="text-right">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6,8,10].map(num => (
                        <SelectItem key={num} value={num.toString()}>{num} התראות</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">תדירות</label>
                  <Select 
                    value={notificationSettings.intervalMinutes.toString()} 
                    onValueChange={(value) => handleNotifySettingsChange('intervalMinutes', parseInt(value))}
                  >
                    <SelectTrigger className="text-right">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">מיידי</SelectItem>
                      <SelectItem value="5">כל 5 דקות</SelectItem>
                      <SelectItem value="15">כל 15 דקות</SelectItem>
                      <SelectItem value="30">כל 30 דקות</SelectItem>
                      <SelectItem value="60">כל שעה</SelectItem>
                      <SelectItem value="360">כל 6 שעות</SelectItem>
                      <SelectItem value="1440">פעם ביום</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={notificationSettings.notifyOnEveryNew}
                  onChange={(e) => handleNotifySettingsChange('notifyOnEveryNew', e.target.checked)}
                  className="rounded"
                />
                התראה על כל תור חדש שמתפנה
              </label>
              
              {/* Smart Scheduling Options */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h4 className="text-sm font-medium">הגדרות חכמות</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">שעת שליחה מועדפת</label>
                    <input
                      type="time"
                      value={notificationSettings.preferredSendTime}
                      onChange={(e) => handleNotifySettingsChange('preferredSendTime', e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border rounded-lg bg-background focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1">איסוף התראות</label>
                    <Select 
                      value={notificationSettings.batchIntervalHours?.toString() || '4'} 
                      onValueChange={(value) => handleNotifySettingsChange('batchIntervalHours', parseInt(value))}
                    >
                      <SelectTrigger className="text-right h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">כל שעה</SelectItem>
                        <SelectItem value="2">כל שעתיים</SelectItem>
                        <SelectItem value="4">כל 4 שעות</SelectItem>
                        <SelectItem value="8">כל 8 שעות</SelectItem>
                        <SelectItem value="12">כל 12 שעות</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={notificationSettings.batchNotifications !== false}
                      onChange={(e) => handleNotifySettingsChange('batchNotifications', e.target.checked)}
                      className="rounded"
                    />
                    אסוף מספר תורים להתראה אחת
                  </label>
                  
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={notificationSettings.enableUrgentMode !== false}
                      onChange={(e) => handleNotifySettingsChange('enableUrgentMode', e.target.checked)}
                      className="rounded"
                    />
                    התראה מיידית על תורים להיום
                  </label>
                  
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={notificationSettings.sendOnWeekends}
                      onChange={(e) => handleNotifySettingsChange('sendOnWeekends', e.target.checked)}
                      className="rounded"
                    />
                    שלח התראות בסופי שבוע
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Settings Summary */}
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="text-sm text-primary font-medium">
              📋 סיכום הגדרות: {getSettingsSummary()}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading || !email.trim() || (searchType === 'date' && !selectedDate) || (searchType === 'range' && (!startDate || !endDate))}
          className="w-full h-12 text-base font-medium"
          size="lg"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>רושם התראה...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 ml-2" />
              <span>רשום התראה</span>
            </div>
          )}
        </Button>

        {message && (
          <div className={`p-3 rounded-lg text-sm text-center ${
            message.includes('בהצלחה') 
              ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-950/20 dark:text-green-300 dark:border-green-800/30' 
              : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/20 dark:text-red-300 dark:border-red-800/30'
          }`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
} 