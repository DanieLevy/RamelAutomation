import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Bell, Settings, Trash2, Edit, Eye, EyeOff, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Subscription {
  id: string;
  email: string;
  status: 'active' | 'paused' | 'expired' | 'max_reached';
  notification_count: number;
  max_notifications: number;
  interval_minutes: number;
  notify_on_every_new: boolean;
  criteria: any;
  created_at: string;
  updated_at: string;
  last_email_sent?: string;
  ignored_appointments?: string[];
}

interface SubscriptionManagerProps {
  userEmail: string;
  onDisconnect: () => void;
}

export default function SubscriptionManager({ userEmail, onDisconnect }: SubscriptionManagerProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetailed, setShowDetailed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const loadSubscriptions = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/user-subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail })
        });
        
        if (response.ok) {
          const data = await response.json();
          setSubscriptions(data.subscriptions || []);
        }
      } catch (error) {
        console.error('Failed to load subscriptions:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSubscriptions();
  }, [userEmail]);

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user-subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.subscriptions || []);
      }
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSubscription = async (id: string, updates: any) => {
    try {
      const response = await fetch('/api/update-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates })
      });
      
      if (response.ok) {
        await loadSubscriptions();
        setEditingId(null);
      }
    } catch (error) {
      console.error('Failed to update subscription:', error);
    }
  };

  const deleteSubscription = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את ההתראה?')) return;
    
    try {
      const response = await fetch('/api/delete-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      
      if (response.ok) {
        await loadSubscriptions();
      }
    } catch (error) {
      console.error('Failed to delete subscription:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'expired': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      case 'max_reached': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'paused': return <AlertCircle className="w-4 h-4" />;
      case 'expired': return <XCircle className="w-4 h-4" />;
      case 'max_reached': return <Bell className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'פעיל';
      case 'paused': return 'מושהה';
      case 'expired': return 'פג תוקף';
      case 'max_reached': return 'הושלם';
      default: return status;
    }
  };

  const formatCriteria = (criteria: any) => {
    if (criteria.date) {
      return `יום ${new Date(criteria.date).toLocaleDateString('he-IL')}`;
    } else if (criteria.start && criteria.end) {
      return `${new Date(criteria.start).toLocaleDateString('he-IL')} - ${new Date(criteria.end).toLocaleDateString('he-IL')}`;
    }
    return 'לא מוגדר';
  };

  const formatInterval = (minutes: number) => {
    if (minutes === 0) return 'מיידי';
    if (minutes < 60) return `כל ${minutes} דקות`;
    if (minutes === 60) return 'כל שעה';
    if (minutes < 1440) return `כל ${Math.floor(minutes / 60)} שעות`;
    return `כל ${Math.floor(minutes / 1440)} ימים`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
          <div className="h-16 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Status Header */}
      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">מחובר כ-{userEmail}</p>
              <p className="text-sm text-green-600 dark:text-green-400">
                {subscriptions.length} התראות רשומות
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetailed(!showDetailed)}
              className="text-green-700 dark:text-green-300"
            >
              {showDetailed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDisconnect}
              className="text-green-700 dark:text-green-300"
            >
              התנתק
            </Button>
          </div>
        </div>
      </div>

      {/* Subscriptions List */}
      {subscriptions.length === 0 ? (
        <div className="text-center py-8">
          <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">אין לך התראות רשומות כרגע</p>
        </div>
      ) : (
        <div className="space-y-3">
          {subscriptions.map((sub) => (
            <div key={sub.id} className="border border-border rounded-xl p-4">
              {/* Subscription Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs px-2 py-1 ${getStatusColor(sub.status)}`}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(sub.status)}
                      {getStatusText(sub.status)}
                    </span>
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {sub.notification_count}/{sub.max_notifications} התראות
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingId(editingId === sub.id ? null : sub.id)}
                    className="h-8 px-2"
                  >
                    <Settings className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSubscription(sub.id)}
                    className="h-8 px-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Subscription Info */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{formatCriteria(sub.criteria)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{formatInterval(sub.interval_minutes)}</span>
                </div>
                
                {sub.last_email_sent && (
                  <div className="text-xs text-muted-foreground">
                    מייל אחרון: {new Date(sub.last_email_sent).toLocaleString('he-IL')}
                  </div>
                )}
              </div>

              {/* Edit Form */}
              {editingId === sub.id && (
                <div className="mt-4 pt-4 border-t border-border space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">מספר התראות</label>
                      <Select 
                        value={sub.max_notifications.toString()} 
                        onValueChange={(value) => updateSubscription(sub.id, { max_notifications: parseInt(value) })}
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
                      <label className="block text-sm font-medium mb-1">תדירות</label>
                      <Select 
                        value={sub.interval_minutes.toString()} 
                        onValueChange={(value) => updateSubscription(sub.id, { interval_minutes: parseInt(value) })}
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
                  
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={sub.notify_on_every_new}
                        onChange={(e) => updateSubscription(sub.id, { notify_on_every_new: e.target.checked })}
                        className="rounded"
                      />
                      התראה על כל תור חדש
                    </label>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateSubscription(sub.id, { status: sub.status === 'active' ? 'paused' : 'active' })}
                    >
                      {sub.status === 'active' ? 'השהה' : 'הפעל'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Detailed View */}
              {showDetailed && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div>נוצר: {new Date(sub.created_at).toLocaleString('he-IL')}</div>
                    <div>עודכן: {new Date(sub.updated_at).toLocaleString('he-IL')}</div>
                    {sub.ignored_appointments && sub.ignored_appointments.length > 0 && (
                      <div>
                        <span>תורים שהתעלמת מהם: </span>
                        <span className="font-mono">{sub.ignored_appointments.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 