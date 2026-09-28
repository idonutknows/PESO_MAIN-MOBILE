import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications, NotificationItem } from '@/hooks/notifications';
import { API_ENDPOINTS } from '@/constants/api';
import { useNavigation, useRouter } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useLayoutEffect } from 'react';

function getNotifIcon(type: string): string {
  switch (type) {
    case 'interview_scheduled': return '📅';
    case 'interview_updated': return '✏️';
    case 'interview_canceled': return '❌';
    case 'application_status': return '📋';
    default: return '🔔';
  }
}

function getNotifColor(type: string): string {
  switch (type) {
    case 'interview_scheduled': return '#3B82F6';
    case 'interview_updated': return '#F59E0B';
    case 'interview_canceled': return '#EF4444';
    case 'application_status': return '#10B981';
    default: return '#6B7280';
  }
}

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationsScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications(token);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  async function handleMarkAllRead() {
    if (unreadCount === 0) return;
    Alert.alert(
      'Mark All as Read',
      'Mark all notifications as read?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OK', onPress: () => markAllAsRead() },
      ]
    );
  }

  function handleNotifPress(notif: NotificationItem) {
    if (!notif.is_read) {
      markAsRead(notif.id);
    }
    if (notif.type === 'interview_scheduled' || notif.type === 'interview_updated') {
      router.push('/(tabs)/applications');
    } else if (notif.type === 'application_status') {
      router.push('/(tabs)/applications');
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ThemedText style={styles.backBtnText}>{'< Back'}</ThemedText>
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <ThemedText style={styles.headerTitle}>Notifications</ThemedText>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllRead}>
              <ThemedText style={styles.markAllReadText}>Mark all read</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </ThemedView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a7ea4" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyIcon}>🔔</ThemedText>
          <ThemedText style={styles.emptyTitle}>No notifications yet</ThemedText>
          <ThemedText style={styles.emptyText}>
            You'll see interview schedules, application updates, and other important alerts here.
          </ThemedText>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={fetchNotifications} colors={['#0a7ea4']} />
          }
        >
          {unreadCount > 0 && (
            <View style={styles.unreadBanner}>
              <ThemedText style={styles.unreadBannerText}>
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </ThemedText>
            </View>
          )}
          {notifications.map((notif, idx) => (
            <TouchableOpacity
              key={notif.id}
              style={[
                styles.notifCard,
                !notif.is_read && styles.notifCardUnread,
                idx < notifications.length - 1 && styles.notifCardBorder,
              ]}
              onPress={() => handleNotifPress(notif)}
              activeOpacity={0.7}
            >
              <View style={styles.notifLeft}>
                <View style={[styles.notifIconContainer, { backgroundColor: getNotifColor(notif.type) + '15' }]}>
                  <ThemedText style={styles.notifIcon}>{getNotifIcon(notif.type)}</ThemedText>
                </View>
              </View>
              <View style={styles.notifContent}>
                <View style={styles.notifHeader}>
                  <ThemedText style={styles.notifTitle} numberOfLines={1}>
                    {notif.title}
                  </ThemedText>
                  {!notif.is_read && <View style={styles.unreadDot} />}
                </View>
                <ThemedText style={styles.notifMessage} numberOfLines={3}>
                  {notif.message}
                </ThemedText>
                <ThemedText style={styles.notifTime}>{timeAgo(notif.created_at)}</ThemedText>
              </View>
            </TouchableOpacity>
          ))}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#0a7ea4',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: {
    marginBottom: 8,
  },
  backBtnText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '500',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
  },
  markAllReadText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
  },
  unreadBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  unreadBannerText: {
    fontSize: 13,
    color: '#1D4ED8',
    fontWeight: '600',
    textAlign: 'center',
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  notifCardUnread: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  notifCardBorder: {},
  notifLeft: {
    marginRight: 12,
    marginTop: 2,
  },
  notifIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifIcon: {
    fontSize: 18,
  },
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0a7ea4',
    marginLeft: 8,
  },
  notifMessage: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 6,
  },
  notifTime: {
    fontSize: 11,
    color: '#C7C7CC',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 32,
  },
});
